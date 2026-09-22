import {withTransportRetry} from './transport';
import type {PendingPlan} from '../plan-memory/policy';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {randomScrambleForEvent} from 'cubing/scramble';
import {apply,hash,inverse,isSolved,facts} from '../../src/lib/cube';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {db,event,getRun,saveRun} from '../../src/server/store';
import {decide} from './policy';
const dir='experiments/brain-full-v3',split='brain-full-v3';
const gate=JSON.parse(readFileSync('experiments/plan-memory-v1/commit-validation-results.json','utf8'));
if(gate.rows.length!==24||gate.rows.some((r:any)=>!r.correct))throw new Error('Plan commitment validation gate');
mkdirSync(dir,{recursive:true});
// Freeze every local import in the policy dependency closure, without the runner or evaluator.
const frozen:Record<string,string>={};
function capture(file:string){if(frozen[file])return;const text=readFileSync(file,'utf8');frozen[file]=text;for(const match of text.matchAll(/from\s+['"]([^'"]+)['"]/g)){if(!match[1].startsWith('.'))continue;const p=new URL(match[1],new URL(file,'file://'+process.cwd()+'/')).pathname.slice(process.cwd().length+1);capture(p.endsWith('.json')?p:p+'.ts');}}
capture('scripts/brain-full-v3/policy.ts');
capture('scripts/brain-full-v3/transport.ts');
const digest=createHash('sha256').update(JSON.stringify(frozen)).digest('hex');
writeFileSync(`${dir}/started.json`,JSON.stringify({at:new Date().toISOString(),digest,limits:{requestsPerAttempt:500,turns:1000,ms:600000,studyRequests:1000,studyDollars:0.12,retries:1,retryConditions:[429,529,'request timeout/network failure before overall deadline']},scope:'Four development starts: known loop cube, short scramble, two fresh random states. Explicit JEV plan commitment and bounded transport retry. Original failure is not replaced.'},null,2),{flag:'wx'});
writeFileSync(`${dir}/sources.json`,JSON.stringify(frozen,null,2));
writeFileSync(`${dir}/runner-source.ts`,readFileSync(import.meta.path));
const prior=JSON.parse(readFileSync('experiments/brain-full-v2-transport-validation/fixtures.json','utf8'));
const fixtures=[{id:'known-loop',scramble:prior.find((f:any)=>f.id==='random-10').scramble},{id:'short-1',scramble:'R U F'}];
for(let i=0;i<2;i++)fixtures.push({id:`random-${i+1}`,scramble:(await randomScrambleForEvent('333')).toString()});
writeFileSync(`${dir}/fixtures.json`,JSON.stringify(fixtures,null,2));
const rows:any[]=[];
function usage(){return db.query("SELECT COUNT(*) requests,COALESCE(SUM(amount),0) cost FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split')=?").get(split) as {requests:number;cost:number};}
const persist=()=>writeFileSync(`${dir}/results.json`,JSON.stringify({rows,usage:usage()},null,2));
for(const fixture of fixtures){
 const run=await createRun(fixture.scramble,'skills',split);run.version=split;run.stage='';saveRun(run);
 const row:any={id:fixture.id,runId:run.id,before:run.state,steps:[],status:'running'};rows.push(row);persist();
 const started=Date.now();let lastRecovery=-10;let pendingPlan:PendingPlan|null=null;
 try{while(!isSolved(run.state)){
  const step:any={before:run.state,pendingPlan,exchanges:[]};row.steps.push(step);
  const ask=async(request:any)=>withTransportRetry(async()=>{
   const u=usage(),b=budget(),reservation=0.002688;
   if(u.requests>=1000||u.cost+reservation>0.12||b.reservedAndSpent+reservation>b.cap)throw new Error('Study/project cap');
   if(getRun(run.id).requests>=500||Date.now()-started>=600000)throw new Error('Attempt cap');
   const decision=await evaluate(run.id,request,AbortSignal.timeout(Math.max(1,Math.min(30000,600000-(Date.now()-started)))),{maxAttempts:1});step.exchanges.push(decision);persist();return decision.response;
  },started+600000,error=>{(step.transportRetries??=[]).push({error,at:new Date().toISOString()});event(run.id,'transport-retry',{error});persist();});
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
  run.activeMs=Date.now()-started;saveRun(run);persist();
 }
 if(isSolved(run.state))row.status='solved';
 }catch(e){row.error=String(e);row.status=String(e).includes('cap')?'capped':'error';}
 row.after=run.state;row.turns=run.turns;row.elapsedMs=Date.now()-started;
 const saved=getRun(run.id);saved.state=run.state;saved.history=run.history;saved.stage=run.stage;saved.target=run.target;saved.turns=run.turns;saved.activeMs=row.elapsedMs;saved.status=row.status==='solved'?'solved':'stopped';saved.reason='Brain full development: '+row.status;saveRun(saved);persist();
 console.log(fixture.id,row.status,'requests',saved.requests,'turns',run.turns);
 if(row.error?.includes('Study/project cap'))break;
}
console.log(JSON.stringify({usage:usage(),results:rows.map(r=>({id:r.id,status:r.status}))}));
