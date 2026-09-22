import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {randomScrambleForEvent} from 'cubing/scramble';
import {apply,hash,inverse,isSolved,facts,solved} from '../../src/lib/cube';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {db,event,getRun,saveRun} from '../../src/server/store';
import {decide} from './policy';
const dir='experiments/brain-full-v2-final',split='brain-full-v2-final';
const validation=JSON.parse(readFileSync('experiments/brain-full-v2-transport-validation/verification.json','utf8'));
if(validation.partial||validation.verified!==10||validation.solved!==10||!validation.allAttemptsPresent)throw new Error('Final gate requires ten independently verified validation solves');
const development=JSON.parse(readFileSync('experiments/brain-full-v2/results.json','utf8'));
if(development.rows.length!==4||development.rows.some((r:any)=>r.status!=='solved'))throw new Error('Development gate requires all four solved');
mkdirSync(dir,{recursive:true});
// Freeze every local import in the policy dependency closure, without the runner or evaluator.
const frozen:Record<string,string>={};
function capture(file:string){if(frozen[file])return;const text=readFileSync(file,'utf8');frozen[file]=text;for(const match of text.matchAll(/from\s+['"]([^'"]+)['"]/g)){if(!match[1].startsWith('.'))continue;const p=new URL(match[1],new URL(file,'file://'+process.cwd()+'/')).pathname.slice(process.cwd().length+1);capture(p.endsWith('.json')?p:p+'.ts');}}
capture('scripts/brain-full-v2/policy.ts');
const digest=createHash('sha256').update(JSON.stringify(frozen)).digest('hex');
if(digest!==JSON.parse(readFileSync('experiments/brain-full-v2/started.json','utf8')).digest)throw new Error('Development policy changed');
writeFileSync(`${dir}/started.json`,JSON.stringify({at:new Date().toISOString(),digest,pricing:{verified:'2026-09-22',url:'https://docs.typesafe.ai/models',inputUSDPerMillion:0.042},limits:{requestsPerAttempt:500,turns:1000,ms:600000,studyRequests:50000,studyDollars:3,retries:1,retryStatuses:[429,529],concurrency:4},scope:'Final held-out evaluation: 100 fresh random-state cubes, unchanged policy, all failures count. Acceptance requires at least 95 independently verified autonomous solves. No tuning on this set. At most one identical-body retry for 429/529, counted in all limits.'},null,2),{flag:'wx'});
writeFileSync(`${dir}/sources.json`,JSON.stringify(frozen,null,2));
writeFileSync(`${dir}/runner-source.ts`,readFileSync(import.meta.path));
writeFileSync(`${dir}/transport-sources.json`,JSON.stringify(Object.fromEntries(['src/server/jev.ts','src/server/store.ts','src/lib/budget.ts'].map(p=>[p,readFileSync(p,'utf8')])),null,2));
const fixtures:{id:string;scramble:string}[]=[];
const seen=new Set([...development.rows,...JSON.parse(readFileSync('experiments/brain-full-v1/results.json','utf8')).rows].map((r:any)=>hash(r.before)));
for(const r of JSON.parse(readFileSync('experiments/brain-full-v2-validation/results.json','utf8')).rows)seen.add(hash(r.before));
for await(const file of new Bun.Glob('**/*fixtures*.json').scan('experiments')){const data=JSON.parse(readFileSync('experiments/'+file,'utf8'));if(Array.isArray(data))for(const c of data){if(c.stateHash)seen.add(c.stateHash);if(c.state)seen.add(hash(c.state));}}
for(const r of JSON.parse(readFileSync('experiments/brain-full-v2-transport-validation/results.json','utf8')).rows)seen.add(hash(r.before));
const base=await solved();
while(fixtures.length<100){const scramble=(await randomScrambleForEvent('333')).toString(),stateHash=hash(await apply(base,scramble));if(seen.has(stateHash))continue;seen.add(stateHash);fixtures.push({id:`random-${fixtures.length+1}`,scramble});}
writeFileSync(`${dir}/fixtures.json`,JSON.stringify(fixtures,null,2));
const rows:any[]=[];
function usage(){return db.query("SELECT COUNT(*) requests,COALESCE(SUM(amount),0) cost FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split')=?").get(split) as {requests:number;cost:number};}
const persist=(row:any)=>{if(row.status!=='running')writeFileSync(`${dir}/${row.id}.json`,JSON.stringify(row,null,2));writeFileSync(`${dir}/results.json`,JSON.stringify({rows:rows.map(({steps,...r})=>({...r,record:r.id+'.json',actionCount:r.actionCount??steps?.filter((s:any)=>s.after).length})),usage:usage(),expected:100},null,2));};
async function attempt(fixture:{id:string;scramble:string}){
 const run=await createRun(fixture.scramble,'skills',split);run.version=split;run.stage='';saveRun(run);
 const row:any={id:fixture.id,runId:run.id,before:run.state,steps:[],status:'running'};rows.push(row);persist(row);
 const started=Date.now();let lastRecovery=-10;
 try{while(!isSolved(run.state)){
  const step:any={before:run.state,exchanges:[]};row.steps.push(step);
  const ask=async(request:any)=>{
   const u=usage(),b=budget(),reservation=0.002688;
   const maxAttempts=Math.min(2,500-getRun(run.id).requests);
   if(u.requests>=50000||u.cost+8*reservation>3||b.reservedAndSpent+8*reservation>b.cap)throw new Error('Study/project cap');
   if(getRun(run.id).requests>=500||Date.now()-started>=600000)throw new Error('Attempt cap');
   const decision=await evaluate(run.id,request,AbortSignal.timeout(Math.max(1,Math.min(30000,600000-(Date.now()-started)))),{maxAttempts});step.exchanges.push(decision);persist(row);return decision.response;
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
  run.activeMs=Date.now()-started;saveRun(run);persist(row);
 }
 if(isSolved(run.state))row.status='solved';
 }catch(e){row.error=String(e);row.status=String(e).includes('cap')?'capped':'error';}
 row.after=run.state;row.turns=run.turns;row.elapsedMs=Date.now()-started;
 const saved=getRun(run.id);saved.state=run.state;saved.history=run.history;saved.stage=run.stage;saved.target=run.target;saved.turns=run.turns;saved.activeMs=row.elapsedMs;saved.status=row.status==='solved'?'solved':'stopped';saved.reason='Brain full final: '+row.status;saveRun(saved);persist(row);
 console.log(fixture.id,row.status,'requests',saved.requests,'turns',run.turns);
 row.actionCount=row.steps.filter((s:any)=>s.after).length;row.steps=[];
}
let index=0;
await Promise.all(Array.from({length:4},async()=>{while(index<fixtures.length)await attempt(fixtures[index++]);}));
console.log(JSON.stringify({usage:usage(),results:rows.map(r=>({id:r.id,status:r.status}))}));
