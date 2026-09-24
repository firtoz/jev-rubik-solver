import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {destinationRequest,turnRequest} from './policy';
import {availabilityRequest,preparationRequest} from './sequential';
import {solved,apply,pieces,mapAlg} from '../../src/lib/cube';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {db,saveRun,getRun} from '../../src/server/store';
const dir='experiments/protected-landing-v1/sequential-validation',split='protected-landing-sequential-validation-v1';
mkdirSync(dir,{recursive:true});
const phase=process.argv[2]??'development';if(!['development','validation'].includes(phase))throw Error('Bad phase');
const variants=['sequential'] as const;
const gate=JSON.parse(readFileSync('experiments/protected-landing-v1/sequential/verification.json','utf8'));if(gate.scores[0].passed!==20)throw Error('Development gate');
writeFileSync(`${dir}/${phase}-started.json`,JSON.stringify({phase,variants,at:new Date().toISOString(),limits:{calls:100,dollars:.015,concurrency:2},budget:budget(),sources:Object.fromEntries(['scripts/protected-landing-v1/policy.ts','scripts/protected-landing-v1/screen-validation.ts','scripts/protected-landing-v1/sequential.ts','scripts/protected-landing-v1/fixtures.ts','experiments/protected-landing-v1/validation-fixtures.json','src/lib/cube.ts'].map(p=>[p,readFileSync(p,'utf8')]))},null,2),{flag:'wx'});
const fixtures=JSON.parse(readFileSync('experiments/protected-landing-v1/validation-fixtures.json','utf8'));
const usage=()=>db.query("SELECT COUNT(*) requests,COALESCE(SUM(amount),0) cost FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split')=?").get(split) as {requests:number;cost:number};
const rows:any[]=[],jobs=variants.flatMap(variant=>fixtures.map((f:any)=>({variant,f})));let cursor=0;
const persist=()=>writeFileSync(`${dir}/${phase}-results.json`,JSON.stringify({phase,rows,usage:usage()},null,2));
async function job({variant,f}:typeof jobs[number]){
 const run=await createRun('','skills',split),row:any={id:f.id,variant,expected:f.expected,runId:run.id,status:'running'};rows.push(row);persist();
 try{
 const call=async(req:any)=>{
  for(let retry=0;retry<3;retry++){
   const u=usage();if(u.requests>=100||u.cost+.002688>.015||budget().reservedAndSpent+.002688>9)throw Error('Budget cap');
   try{return await evaluate(run.id,req,AbortSignal.timeout(30000),{maxAttempts:1});}
   catch(e){row.transportErrors??=[];row.transportErrors.push(String(e));persist();if(retry===2||!/(HTTP (429|5\d\d)|network)/i.test(String(e)))throw e;await new Promise(r=>setTimeout(r,1000*2**retry));}
  }throw Error('Transport exhausted');
 };
 row.availability=await call(availabilityRequest(f.state));
 row.exchange=await call(preparationRequest(f.state,row.availability.response.answers.availability.choice));
 row.choice=row.exchange.response.answers.decision.choice;row.passed=f.expected===row.choice;row.status='complete';
 if(row.choice==='reorient'){
  row.destination=await call(destinationRequest(f.state));
  const dest=row.destination.response.answers.destination.choice;
  row.turn=await call(turnRequest(f.state.target.position,dest));
  const after=await apply(f.before,mapAlg(row.turn.response.answers.setup.choice,f.front));
  const protectedIds=pieces(f.before).filter(p=>p.kind==='edge'&&p.piece.includes('D')&&p.solved).map(p=>p.piece);
  
  const ring=['F','R','B','L'],local=(x:string)=>ring.includes(x)?ring[(ring.indexOf(x)-ring.indexOf(f.front)+4)%4]:x;
  const target=pieces(f.before).find(p=>p.kind==='edge'&&[...p.position].map(local).sort().join('')===[...f.state.target.position].sort().join(''));
  const moved=pieces(after).find(p=>p.piece===target?.piece&&p.kind==='edge');
  const actual=moved?[...moved.position].map(local).join(''):null;
  row.safeReorientation=f.state.target.layer==='top'&&actual===dest&&dest!==f.state.target.position&&!f.state.protectedBottomSlots.includes(dest.replace('U','D'))&&pieces(after).every(p=>!protectedIds.includes(p.piece)||p.solved);
  row.passed&&=row.safeReorientation;
 }

 }catch(e){row.status='error';row.error=String(e);row.passed=false;}
 saveRun({...getRun(run.id),status:'stopped',reason:'Isolated protected landing evaluation'});persist();
}
await Promise.all(Array.from({length:2},async()=>{while(cursor<jobs.length)await job(jobs[cursor++]);}));
console.log({usage:usage(),scores:variants.map(v=>({variant:v,n:rows.filter(r=>r.variant===v).length,passed:rows.filter(r=>r.variant===v&&r.passed).length,tokens:rows.filter(r=>r.variant===v).reduce((n,r)=>n+(r.exchange?.response.usage.input_tokens??0),0)}))});
