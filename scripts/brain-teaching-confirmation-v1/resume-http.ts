import type {PendingPlan} from '../plan-memory/policy';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {apply,hash,inverse,isSolved,facts} from '../../src/lib/cube';
import {evaluate,budget} from '../../src/server/jev';
import {db,event,getRun,saveRun} from '../../src/server/store';
import {decide} from '../brain-teaching-full-v1/policy';
const sourceDir='experiments/brain-teaching-confirmation-v1';
const dir='experiments/brain-teaching-confirmation-v1-http-resume';
const split='brain-teaching-confirmation-v1',dollarCap=1.25;
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const originalResults=read(`${sourceDir}/results.json`);
if(originalResults.rows.length!==100||originalResults.rows.some((r:any)=>r.status==='running'))throw Error('Original batch must finish first');
for(const [path,source] of Object.entries(read(`${sourceDir}/sources.json`)))if(readFileSync(path,'utf8')!==source)throw Error('Frozen source changed: '+path);
mkdirSync(dir,{recursive:true});
writeFileSync(`${dir}/resume-started.json`,JSON.stringify({at:new Date().toISOString(),authorization:'User authorized HTTP retries; solver failures remain failures. Same study and project spending caps.',maxTransportAttempts:3,backoffMs:[15000,30000],concurrency:1,elapsedPolicy:'Original attempt time plus resumed active time, including retry backoff. Offline interruption excluded.',budgetBefore:budget()},null,2),{flag:'wx'});
writeFileSync(`${dir}/resume-source.ts`,readFileSync(import.meta.path));
for(const file of ['fixtures.json','sources.json','started.json','freshness-verification.json'])writeFileSync(`${dir}/${file}`,readFileSync(`${sourceDir}/${file}`));
const fixtures=read(`${sourceDir}/fixtures.json`);
const rows:any[]=[];
function usage(){return db.query("SELECT COUNT(*) requests,COALESCE(SUM(amount),0) cost FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split')=?").get(split) as {requests:number;cost:number};}
const persist=(row:any)=>{writeFileSync(`${dir}/${row.id}.json`,JSON.stringify(row,null,2));writeFileSync(`${dir}/results.json`,JSON.stringify({rows:rows.map(({steps,...r})=>({...r,record:r.id+'.json',actionCount:r.actionCount??steps.filter((s:any)=>s.after).length})),usage:usage(),expected:100},null,2));};
async function attempt(fixture:{id:string;scramble:string}){
 const original=read(`${sourceDir}/${fixture.id}.json`);
 const row:any=structuredClone(original);row.status='running';delete row.error;
 const run=getRun(row.runId);run.state=row.after;run.history=row.steps.filter((s:any)=>s.after).map((s:any)=>s.alg);run.turns=row.turns;
 const completed=row.steps.filter((s:any)=>s.after);
 let pendingPlan:PendingPlan|null=completed.at(-1)?.nextPendingPlan??null;
 let lastRecovery=-10;completed.forEach((s:any,i:number)=>{if(s.recovery)lastRecovery=i;});
 const interrupted=row.steps.at(-1)?.after?null:row.steps.pop();
 let resumeStep=interrupted;
 const priorElapsed=row.elapsedMs;const started=Date.now()-priorElapsed;
 rows.push(row);persist(row);
 try{while(!isSolved(run.state)){
  const step:any=resumeStep??{before:run.state,pendingPlan,exchanges:[]};resumeStep=null;row.steps.push(step);
  let cached=0;const existing=step.exchanges.length;
  const ask=async(request:any)=>{
   if(cached<existing){const exchange=step.exchanges[cached++];if(JSON.stringify(request)!==JSON.stringify(exchange.request))throw Error('Resume request mismatch');return exchange.response;}
   for(let retry=0;;retry++){
   const u=usage(),b=budget(),reservation=0.002688;
   if(u.cost+reservation>dollarCap||b.reservedAndSpent+reservation>Math.min(b.cap,9))throw new Error('Study/project cap');
   if(getRun(run.id).requests>=500||Date.now()-started>=600000)throw new Error('Attempt cap');
   try{const decision=await evaluate(run.id,structuredClone(request),AbortSignal.timeout(Math.max(1,Math.min(30000,600000-(Date.now()-started)))),{maxAttempts:1});step.exchanges.push(decision);persist(row);return decision.response;
   }catch(error){
    if(!/JEV HTTP (429|5\d\d)/.test(String(error))||retry>=2)throw error;
    const delay=15000*2**retry;
    if(Date.now()-started+delay>=600000)throw Error('Attempt cap');
    event(run.id,'confirmation-http-retry',{error:String(error),delayMs:delay,retry:retry+1});
    await new Promise(resolve=>setTimeout(resolve,delay));
   }
   }
  };
  const history=row.steps.slice(0,-1).filter((s:any)=>s.after);
  const same=history.filter((s:any)=>hash(s.before)===hash(run.state));
  let excluded:string|null=null,alg='';
  if(same.length>=2&&history.length-lastRecovery>=3){
   const response=await ask({model:'jev-1.13.0',state:{completed:facts(run.state),previousGoal:run.stage,previousTarget:run.target,recentActions:run.history.slice(-6),visitsToThisState:same.length,lastActionWasUndo:history.at(-1)?.recovery==='undo'},questions:{recovery:{type:'choice',instructions:'This exact state has recurred. Choose how to recover. Continue can select another approach; retarget asks for another piece; undo reverses the last complete action. Avoid undoing an undo repeatedly.',criteria:{continue:'Continue choosing from current observations',retarget:'Choose a different target',undo:'Reverse the previous action'}}}});
   step.recovery=response.answers.recovery.choice;lastRecovery=history.length;
   if(step.recovery==='undo')alg=inverse(run.history.at(-1)!);
   if(step.recovery==='retarget')excluded=run.target;
  }
  if(!alg){
   const result=await decide(run,ask,same.slice(-3).map((s:any)=>({action:s.alg,target:s.decision?.target,factsBefore:facts(s.before),factsAfter:facts(s.after)})),excluded,pendingPlan);
   step.decision=result;run.stage=result.goal;run.target=result.target;alg=result.alg;
  }
  if(!alg){row.status='abstained';break;}
  const turns=alg.split(/\s+/).filter(Boolean).length;
  if(run.turns+turns>1000||Date.now()-started>=600000)throw new Error('Attempt cap');
  run.state=await apply(run.state,alg);run.turns+=turns;run.history.push(alg);step.alg=alg;step.after=run.state;
  pendingPlan=step.decision?.early?.preparation==='clear'?{target:step.decision.target,front:step.decision.front,routine:step.decision.early.plannedRoutine,preparation:'clear',setup:alg}:null;
  step.nextPendingPlan=pendingPlan;
  event(run.id,'brain-full-action',step);
  Object.assign(run,((saved)=>({requests:saved.requests,tokens:saved.tokens,cost:saved.cost}))(getRun(run.id)));
  run.activeMs=Date.now()-started;saveRun(run);persist(row);
 }
 if(isSolved(run.state))row.status='solved';
 }catch(e){row.error=String(e);row.status=String(e).includes('cap')?'capped':'error';}
 row.after=run.state;row.turns=run.turns;row.elapsedMs=Date.now()-started;
 const saved=getRun(run.id);saved.state=run.state;saved.history=run.history;saved.stage=run.stage;saved.target=run.target;saved.turns=run.turns;saved.activeMs=row.elapsedMs;saved.status=row.status==='solved'?'solved':'stopped';saved.reason='Frozen confirmation: '+row.status;saveRun(saved);persist(row);
 console.log(fixture.id,row.status,'requests',saved.requests,'turns',run.turns);
 row.actionCount=row.steps.filter((s:any)=>s.after).length;row.steps=[];
}
for(const fixture of fixtures){
 const original=read(`${sourceDir}/${fixture.id}.json`);
 if(original.status==='error'&&/JEV HTTP (429|5\d\d)/.test(original.error))await attempt(fixture);
 else{rows.push(original);persist(original);original.actionCount=original.steps.filter((s:any)=>s.after).length;original.steps=[];}
}
console.log(JSON.stringify({usage:usage(),statuses:rows.map(r=>({id:r.id,status:r.status}))}));
