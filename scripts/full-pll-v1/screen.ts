import {readFileSync,writeFileSync} from 'node:fs';
import {decide,type Variant} from './policy';
import {apply,isSolved} from '../../src/lib/cube';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {db,saveRun,getRun} from '../../src/server/store';
const dir='experiments/full-pll-v1',split='full-pll-v1';
const phase=process.argv[2]??'development';if(!['development','validation'].includes(phase))throw Error('Bad phase');
const variants:Variant[]=phase==='development'?['structured','player']:[process.argv[3] as Variant];
if(variants.some(v=>!['structured','player'].includes(v)))throw Error('Bad variant');
if(phase==='validation'){const gate=JSON.parse(readFileSync(`${dir}/development-verification.json`,'utf8'));if(!gate.scores.some((s:any)=>s.variant===variants[0]&&s.passed===24))throw Error('Development gate');}
writeFileSync(`${dir}/${phase}-started.json`,JSON.stringify({phase,variants,at:new Date().toISOString(),limits:{calls:180,dollars:.025,concurrency:2},budget:budget(),sources:Object.fromEntries(['scripts/full-pll-v1/policy.ts','scripts/full-pll-v1/screen.ts','scripts/full-pll-v1/reference.ts','experiments/full-pll-v1/catalog.json','experiments/full-pll-v1/fixtures.json','src/lib/cube.ts'].map(p=>[p,readFileSync(p,'utf8')]))},null,2),{flag:'wx'});
const fixtures=JSON.parse(readFileSync(dir+'/fixtures.json','utf8')).filter((f:any)=>f.phase===phase);
const usage=()=>db.query("SELECT COUNT(*) requests,COALESCE(SUM(amount),0) cost FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split')=?").get(split) as {requests:number;cost:number};
const rows:any[]=[],jobs=variants.flatMap(variant=>fixtures.map((f:any)=>({variant,f})));let cursor=0;
const persist=()=>writeFileSync(`${dir}/${phase}-results.json`,JSON.stringify({phase,rows,usage:usage()},null,2));
async function job({variant,f}:typeof jobs[number]){
 const run=await createRun('','skills',split),row:any={id:f.id,variant,runId:run.id,status:'running',exchanges:[]};rows.push(row);persist();const start=Date.now();
 try{
 row.decision=await decide(f.before,variant,async request=>{
  for(let retry=0;retry<3;retry++){
   const u=usage();if(u.requests>=180||u.cost+.002688>.025||budget().reservedAndSpent+.002688>9)throw Error('Budget cap');
   try{const e=await evaluate(run.id,request,AbortSignal.timeout(30000),{maxAttempts:1});row.exchanges.push(e);persist();return e.response;}
   catch(e){row.transportErrors??=[];row.transportErrors.push(String(e));persist();if(retry===2||!/(HTTP (429|5\d\d)|network)/i.test(String(e)))throw e;await new Promise(r=>setTimeout(r,1000*2**retry));}
  }throw Error('Transport exhausted');
 });
 row.after=await apply(f.before,row.decision.alg);row.passed=isSolved(row.after);row.status='complete';
 }catch(e){row.status='error';row.error=String(e);row.passed=false;}
 row.elapsedMs=Date.now()-start;saveRun({...getRun(run.id),status:'stopped',reason:'Isolated full PLL evaluation'});persist();
}
await Promise.all(Array.from({length:2},async()=>{while(cursor<jobs.length)await job(jobs[cursor++]);}));
console.log({usage:usage(),scores:variants.map(v=>({variant:v,n:rows.filter(r=>r.variant===v).length,passed:rows.filter(r=>r.variant===v&&r.passed).length}))});
