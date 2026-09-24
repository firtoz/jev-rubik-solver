import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {randomScrambleForEvent} from 'cubing/scramble';
import {apply,hash,inverse,isSolved,facts,solved} from '../../src/lib/cube';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {db,getRun,saveRun,event} from '../../src/server/store';
import {decide as baseline} from '../brain-teaching-full-v1/policy';
import {decide as candidate} from './full-policy';
import type {PendingPlan} from '../plan-memory/policy';
const dir='experiments/daisy-efficiency-v1/full-integration',split='daisy-full-v1';
const gate=JSON.parse(readFileSync('experiments/daisy-efficiency-v1/stage-validation/verification.json','utf8'));
if(gate.partial||gate.checked!==3||gate.rows.some((r:any)=>r.status!=='solved'||r.bottomRegressions))throw Error('Fresh cross-stage gate not passed');
const frozen:Record<string,string>={};
function capture(file:string){if(frozen[file])return;const t=readFileSync(file,'utf8');frozen[file]=t;for(const m of t.matchAll(/from\s+['"]([^'"]+)['"]/g)){if(!m[1].startsWith('.'))continue;const p=new URL(m[1],new URL(file,'file://'+process.cwd()+'/')).pathname.slice(process.cwd().length+1);capture(p.endsWith('.json')?p:p+'.ts');}}
capture('scripts/daisy-efficiency-v1/full-policy.ts');capture('scripts/daisy-efficiency-v1/full-integration.ts');
mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/started.json`,JSON.stringify({at:new Date().toISOString(),budget:budget(),limits:{studyDollars:.08,requests:500,turns:100,ms:600000,concurrency:2,retries:3},sources:frozen},null,2),{flag:'wx'});
const fixtures=JSON.parse(readFileSync('experiments/diagonal-corners-v1/fresh-development/fixtures.json','utf8'));writeFileSync(`${dir}/fixtures.json`,JSON.stringify(fixtures,null,2));
const usage=()=>db.query("SELECT COUNT(*) requests,COALESCE(SUM(amount),0) cost FROM ledger l JOIN runs r ON l.run_id=r.id WHERE json_extract(r.json,'$.split')=?").get(split) as {requests:number;cost:number};
const rows:any[]=[];const persist=()=>writeFileSync(`${dir}/results.json`,JSON.stringify({usage:usage(),rows},null,2));
async function attempt(f:any,variant:'baseline'|'candidate'){
 const run=await createRun(f.scramble,'skills',split);run.stage='';saveRun(run);
 const row:any={id:f.id,variant,runId:run.id,before:run.state,steps:[],status:'running'};rows.push(row);persist();
 const start=Date.now();let pending:PendingPlan|null=null,lastRecovery=-10;
 try{while(!isSolved(run.state)){
  if(run.turns>=100||Date.now()-start>=600000)throw Error('Attempt cap');
  const step:any={before:run.state,pendingPlan:pending,exchanges:[]};row.steps.push(step);
  const ask=async(request:any)=>{
   for(let retry=0;retry<3;retry++){
    if(usage().cost+.002688>.08||budget().reservedAndSpent+.002688>9)throw Error('Budget cap');
    if(getRun(run.id).requests>=500||Date.now()-start>=600000)throw Error('Attempt cap');
    try{const e=await evaluate(run.id,structuredClone(request),AbortSignal.timeout(Math.max(1,600000-(Date.now()-start))),{maxAttempts:1});step.exchanges.push(e);persist();return e.response;}
    catch(e){step.transportErrors??=[];step.transportErrors.push(String(e));persist();if(retry===2||!/(HTTP (429|5\d\d)|network)/i.test(String(e)))throw e;await new Promise(r=>setTimeout(r,1000*2**retry));}
   }throw Error('Transport exhausted');
  };
  const history=row.steps.slice(0,-1).filter((s:any)=>s.after),same=history.filter((s:any)=>hash(s.before)===hash(run.state));let excluded:string|null=null,alg='';
  if(same.length>=2&&history.length-lastRecovery>=3){
   const response=await ask({model:'jev-1.13.0',state:{completed:facts(run.state),previousGoal:run.stage,previousTarget:run.target,recentActions:run.history.slice(-6),visitsToThisState:same.length,lastActionWasUndo:history.at(-1)?.recovery==='undo'},questions:{recovery:{type:'choice',instructions:'This exact state has recurred. Choose how to recover. Continue can select another approach; retarget asks for another piece; undo reverses the last complete action. Avoid undoing an undo repeatedly.',criteria:{continue:'Continue choosing from current observations',retarget:'Choose a different target',undo:'Reverse the previous action'}}}});
   step.recovery=response.answers.recovery.choice;lastRecovery=history.length;if(step.recovery==='undo')alg=inverse(run.history.at(-1)!);if(step.recovery==='retarget')excluded=run.target;
  }
  if(!alg){const d:any=await (variant==='baseline'?baseline:candidate)(run,ask,same.slice(-3).map((s:any)=>({action:s.alg,target:s.decision?.target,factsBefore:facts(s.before),factsAfter:facts(s.after)})),excluded,pending);step.decision=d;run.stage=d.goal;run.target=d.target;alg=d.alg;}
  if(!alg){row.status='abstained';break;}
  const count=alg.split(/\s+/).filter(Boolean).length;step.selectedAlg=alg;
  if(run.turns+count>100||Date.now()-start>=600000)throw Error('Attempt cap');
  run.state=await apply(run.state,alg);run.turns+=count;run.history.push(alg);step.alg=alg;step.after=run.state;
  pending=step.decision?.early?.preparation==='clear'?{target:step.decision.target,front:step.decision.front,routine:step.decision.early.plannedRoutine,preparation:'clear',setup:alg}:null;
  event(run.id,'efficiency-action',step);saveRun({...getRun(run.id),state:run.state,stage:run.stage,target:run.target,history:run.history,turns:run.turns});persist();
 }if(isSolved(run.state))row.status='solved';
 }catch(e){row.error=String(e);row.status=String(e).includes('cap')?'capped':'transport-or-error';}
 row.after=run.state;row.turns=run.turns;row.elapsedMs=Date.now()-start;row.finalFacts=facts(run.state);saveRun({...getRun(run.id),status:row.status==='solved'?'solved':'stopped',reason:`Efficiency pair ${variant}: ${row.status}`});persist();console.log(row.id,variant,row.status,row.turns,run.stage);
}
// Reuse the four development starts; prior baseline records remain unchanged. No cached model answers.
let cursor=0;await Promise.all(Array.from({length:2},async()=>{while(cursor<fixtures.length)await attempt(fixtures[cursor++],'candidate');}));
console.log(JSON.stringify({usage:usage(),results:rows.map(({steps,...r})=>r)}));
