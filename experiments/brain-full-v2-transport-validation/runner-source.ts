import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {randomScrambleForEvent} from 'cubing/scramble';
import {apply,hash,inverse,isSolved,facts,solved} from '../../src/lib/cube';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {db,event,getRun,saveRun} from '../../src/server/store';
import {decide} from './policy';
const dir='experiments/brain-full-v2-transport-validation',split='brain-full-v2-transport-validation';
const prior=JSON.parse(readFileSync('experiments/brain-full-v2-validation/results.json','utf8'));
const priorAudit=JSON.parse(readFileSync('experiments/brain-full-v2-validation/verification.json','utf8'));
if(!priorAudit.allAttemptsPresent||prior.rows.length!==10||prior.rows.some((r:any)=>r.status!=='solved'&&r.error!=='Error: JEV HTTP 529'))throw new Error('Review completed validation failures first');
const development=JSON.parse(readFileSync('experiments/brain-full-v2/results.json','utf8'));
if(development.rows.length!==4||development.rows.some((r:any)=>r.status!=='solved'))throw new Error('Development gate requires all four solved');
mkdirSync(dir,{recursive:true});
// Freeze every local import in the policy dependency closure, without the runner or evaluator.
const frozen:Record<string,string>={};
function capture(file:string){if(frozen[file])return;const text=readFileSync(file,'utf8');frozen[file]=text;for(const match of text.matchAll(/from\s+['"]([^'"]+)['"]/g)){if(!match[1].startsWith('.'))continue;const p=new URL(match[1],new URL(file,'file://'+process.cwd()+'/')).pathname.slice(process.cwd().length+1);capture(p.endsWith('.json')?p:p+'.ts');}}
capture('scripts/brain-full-v2/policy.ts');
const digest=createHash('sha256').update(JSON.stringify(frozen)).digest('hex');
if(digest!==JSON.parse(readFileSync('experiments/brain-full-v2/started.json','utf8')).digest)throw new Error('Development policy changed');
writeFileSync(`${dir}/started.json`,JSON.stringify({at:new Date().toISOString(),digest,limits:{requestsPerAttempt:500,turns:1000,ms:600000,studyRequests:2500,studyDollars:0.20,retries:1,retryStatuses:[429,529]},scope:'Ten fresh random-state attempts, unchanged decision policy, at most one identical-request transport retry for 429/529. Prior failure remains preserved. Not final acceptance.'},null,2),{flag:'wx'});
writeFileSync(`${dir}/sources.json`,JSON.stringify(frozen,null,2));
writeFileSync(`${dir}/runner-source.ts`,readFileSync(import.meta.path));
const fixtures:{id:string;scramble:string}[]=[];
const seen=new Set([...development.rows,...JSON.parse(readFileSync('experiments/brain-full-v1/results.json','utf8')).rows].map((r:any)=>hash(r.before)));
for(const r of prior.rows)seen.add(hash(r.before));
const base=await solved();
while(fixtures.length<10){const scramble=(await randomScrambleForEvent('333')).toString(),stateHash=hash(await apply(base,scramble));if(seen.has(stateHash))continue;seen.add(stateHash);fixtures.push({id:`random-${fixtures.length+1}`,scramble});}
writeFileSync(`${dir}/fixtures.json`,JSON.stringify(fixtures,null,2));
const rows:any[]=[];
function usage(){return db.query("SELECT COUNT(*) requests,COALESCE(SUM(amount),0) cost FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split')=?").get(split) as {requests:number;cost:number};}
const persist=()=>writeFileSync(`${dir}/results.json`,JSON.stringify({rows,usage:usage()},null,2));
for(const fixture of fixtures){
 const run=await createRun(fixture.scramble,'skills',split);run.version=split;run.stage='';saveRun(run);
 const row:any={id:fixture.id,runId:run.id,before:run.state,steps:[],status:'running'};rows.push(row);persist();
 const started=Date.now();let lastRecovery=-10;
 try{while(!isSolved(run.state)){
  const step:any={before:run.state,exchanges:[]};row.steps.push(step);
  const ask=async(request:any)=>{
   const u=usage(),b=budget(),reservation=0.002688;
   const maxAttempts=Math.min(2,2500-u.requests,500-getRun(run.id).requests);
   if(u.requests>=2500||u.cost+maxAttempts*reservation>0.20||b.reservedAndSpent+maxAttempts*reservation>b.cap)throw new Error('Study/project cap');
   if(getRun(run.id).requests>=500||Date.now()-started>=600000)throw new Error('Attempt cap');
   const decision=await evaluate(run.id,request,AbortSignal.timeout(Math.max(1,Math.min(30000,600000-(Date.now()-started)))),{maxAttempts});step.exchanges.push(decision);persist();return decision.response;
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
   const result=await decide(run,ask,same.slice(-3).map((s:any)=>({action:s.alg,target:s.decision?.target,factsBefore:facts(s.before),factsAfter:facts(s.after)})),excluded);
   step.decision=result;run.stage=result.goal;run.target=result.target;alg=result.alg;
  }
  if(!alg){row.status='abstained';break;}
  const turns=alg.split(/\s+/).filter(Boolean).length;
  if(run.turns+turns>1000||Date.now()-started>=600000)throw new Error('Attempt cap');
  run.state=await apply(run.state,alg);run.turns+=turns;run.history.push(alg);step.alg=alg;step.after=run.state;
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
