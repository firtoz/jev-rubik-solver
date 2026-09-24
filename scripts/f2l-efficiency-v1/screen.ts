import {readFileSync,writeFileSync} from 'node:fs';
import type {CubeData} from '../../src/lib/types';
import {apply,solved,inverse,facts} from '../../src/lib/cube';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {db,saveRun,getRun} from '../../src/server/store';
import {decide,routines,type Variant} from './policy';
const dir='experiments/f2l-efficiency-v1',split='f2l-recognition-v1';
const phase=process.argv[2]??'development';if(!['development','validation'].includes(phase))throw Error('Bad phase');
const variants:Variant[]=phase==='development'?['flat','grouped']:[process.argv[3] as Variant];if(variants.some(v=>!['flat','grouped'].includes(v)))throw Error('Choose candidate');
const usage=()=>db.query("SELECT COUNT(*) requests,COALESCE(SUM(amount),0) cost FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split')=?").get(split) as {requests:number;cost:number};
writeFileSync(`${dir}/${phase}-started.json`,JSON.stringify({at:new Date().toISOString(),variants,budgetBefore:budget(),limits:{calls:250,dollars:.04,concurrency:2,retries:3},sources:Object.fromEntries(['scripts/f2l-efficiency-v1/policy.ts','scripts/f2l-efficiency-v1/screen.ts','experiments/f2l-efficiency-v1/catalog.json','src/lib/cube.ts'].map(p=>[p,readFileSync(p,'utf8')]))},null,2),{flag:'wx'});
const base=await solved();const fixtures:{id:string;state:CubeData}[]=[];for(const [i,r] of routines.entries())if((i%2===1)===(phase==='development'))fixtures.push({id:r.id,state:await apply(base,inverse(r.alg))});writeFileSync(`${dir}/${phase}-fixtures.json`,JSON.stringify(fixtures,null,2));
const rows:any[]=[];const persist=()=>writeFileSync(`${dir}/${phase}-results.json`,JSON.stringify({phase,usage:usage(),rows},null,2));
const jobs=variants.flatMap(variant=>fixtures.map(fixture=>({variant,fixture})));let cursor=0;
async function attempt({variant,fixture}:typeof jobs[number]){
 const run=await createRun('','skills',split);run.state=fixture.state;run.status='ready';saveRun(run);
 const row:any={id:fixture.id,variant,runId:run.id,before:fixture.state,exchanges:[],status:'running'};rows.push(row);persist();const start=Date.now();
 try{const choice=await decide(fixture.state,variant,async request=>{
  for(let retry=0;retry<3;retry++){
   const u=usage();if(u.requests>=250||u.cost+.002688>.04||budget().reservedAndSpent+.002688>9)throw Error('Budget cap');
   try{const e=await evaluate(run.id,structuredClone(request),AbortSignal.timeout(30000),{maxAttempts:1});row.exchanges.push(e);persist();return e.response;}
   catch(e){row.transportErrors??=[];row.transportErrors.push(String(e));persist();if(retry===2||!/(HTTP (429|5\d\d)|network)/i.test(String(e)))throw e;await new Promise(r=>setTimeout(r,1000*2**retry));}
  }throw Error('Transport exhausted');
 });row.choice=choice;const routine=routines.find(r=>r.id===choice);row.alg=routine?.alg??'';row.after=await apply(fixture.state,row.alg);row.turns=row.alg.split(/\s+/).filter(Boolean).length;row.passed=facts(row.after).middle;row.status='complete';
 }catch(e){row.status='error';row.error=String(e);row.passed=false;}
 row.elapsedMs=Date.now()-start;saveRun({...getRun(run.id),state:row.after??fixture.state,turns:row.turns??0,status:'stopped',reason:`F2L recognition ${phase}`});persist();console.log(variant,fixture.id,row.passed,row.choice);
}
await Promise.all(Array.from({length:2},async()=>{while(cursor<jobs.length)await attempt(jobs[cursor++]);}));
console.log(JSON.stringify({usage:usage(),scores:variants.map(v=>({variant:v,passed:rows.filter(r=>r.variant===v&&r.passed).length,n:rows.filter(r=>r.variant===v).length}))}));
