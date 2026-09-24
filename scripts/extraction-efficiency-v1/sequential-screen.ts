import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {decide} from './sequential';
import {solved,apply,pieces} from '../../src/lib/cube';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {db,saveRun,getRun} from '../../src/server/store';
const dir='experiments/extraction-efficiency-v1/sequential',split='extraction-sequential-v1';
mkdirSync(dir,{recursive:true});
const phase=process.argv[2]??'development';if(!['development','validation'].includes(phase))throw Error('Bad phase');
const variants=['sequential'];
writeFileSync(`${dir}/${phase}-started.json`,JSON.stringify({phase,variants,at:new Date().toISOString(),limits:{calls:80,dollars:.01,concurrency:2},budget:budget(),sources:Object.fromEntries(['scripts/extraction-efficiency-v1/policy.ts','scripts/extraction-efficiency-v1/sequential-screen.ts','scripts/extraction-efficiency-v1/sequential.ts','experiments/extraction-efficiency-v1/catalog.json','src/lib/cube.ts'].map(p=>[p,readFileSync(p,'utf8')]))},null,2),{flag:'wx'});
const fixtures=JSON.parse(readFileSync('experiments/extraction-efficiency-v1/fixtures.json','utf8')).filter((f:any)=>f.phase===phase);
const usage=()=>db.query("SELECT COUNT(*) requests,COALESCE(SUM(amount),0) cost FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split')=?").get(split) as {requests:number;cost:number};
const rows:any[]=[],jobs=variants.flatMap(variant=>fixtures.map((f:any)=>({variant,f})));let cursor=0;
const persist=()=>writeFileSync(`${dir}/${phase}-results.json`,JSON.stringify({phase,rows,usage:usage()},null,2));
async function job({variant,f}:typeof jobs[number]){
 const run=await createRun('','skills',split),row:any={id:f.id,variant,acceptable:f.acceptable,runId:run.id,status:'running'};rows.push(row);persist();
 try{
 row.exchanges=[];row.choice=await decide(f.cornerPosition,f.edgePosition,f.extract,async request=>{
 for(let retry=0;retry<3;retry++){
  const u=usage();if(u.requests>=80||u.cost+.002688>.01||budget().reservedAndSpent+.002688>9)throw Error('Budget cap');
  try{const x=await evaluate(run.id,request,AbortSignal.timeout(30000),{maxAttempts:1});row.exchanges.push(x);persist();return x.response;}
  catch(e){if(retry===2||!/(HTTP (429|5\d\d)|network)/i.test(String(e)))throw e;row.transportErrors??=[];row.transportErrors.push(String(e));await new Promise(r=>setTimeout(r,1000*2**retry));}
 }
 throw Error('Transport exhausted');});row.passed=f.acceptable.includes(row.choice);row.status='complete';
 }catch(e){row.status='error';row.error=String(e);row.passed=false;}
 saveRun({...getRun(run.id),status:'stopped',reason:'Isolated alignment evaluation'});persist();
}
await Promise.all(Array.from({length:2},async()=>{while(cursor<jobs.length)await job(jobs[cursor++]);}));
console.log({usage:usage(),scores:variants.map(v=>({variant:v,n:rows.filter(r=>r.variant===v).length,passed:rows.filter(r=>r.variant===v&&r.passed).length,tokens:rows.filter(r=>r.variant===v).reduce((n,r)=>n+r.exchanges.reduce((n:number,x:any)=>n+x.response.usage.input_tokens,0),0)}))});
