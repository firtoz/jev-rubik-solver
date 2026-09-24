import {readFileSync,writeFileSync} from 'node:fs';
import type {CubeData} from '../../src/lib/types';
import {apply,solved,inverse,facts} from '../../src/lib/cube';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {db,saveRun,getRun} from '../../src/server/store';
import {request as buildRequest,routines,type Variant,type Stage} from './policy';
const dir='experiments/last-layer-efficiency-v1',split='last-layer-recognition-v1';
const phase=process.argv[2]??'development';if(!['development','validation'].includes(phase))throw Error('Bad phase');
const variants:Variant[]=phase==='development'?['structured','sentences']:[process.argv[3] as Variant];if(variants.some(v=>!['structured','sentences'].includes(v)))throw Error('Choose candidate');
const usage=()=>db.query("SELECT COUNT(*) requests,COALESCE(SUM(amount),0) cost FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split')=?").get(split) as {requests:number;cost:number};
writeFileSync(`${dir}/${phase}-started.json`,JSON.stringify({at:new Date().toISOString(),variants,budgetBefore:budget(),limits:{calls:250,dollars:.04,concurrency:2,retries:3},sources:Object.fromEntries(['scripts/last-layer-efficiency-v1/policy.ts','scripts/last-layer-efficiency-v1/screen.ts','experiments/last-layer-efficiency-v1/catalog.json','src/lib/cube.ts'].map(p=>[p,readFileSync(p,'utf8')]))},null,2),{flag:'wx'});
const base=await solved();const all:{id:string;stage:Stage;state:CubeData}[]=[];
for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++){
 const state=structuredClone(base);state.CORNERS.orientation.splice(0,4,a,b,c,(6-a-b-c)%3);
 all.push({id:'orientation-'+all.length,stage:'orientation',state});
}
const perms=(a:number[]):number[][]=>a.length?a.flatMap((x,i)=>perms(a.filter((_,j)=>i!==j)).map(p=>[x,...p])):[[]];
for(const p of perms([0,1,2,3])){
 if(p.reduce((n,x,i)=>n+p.slice(i+1).filter(y=>x>y).length,0)%2)continue;
 const state=structuredClone(base);state.EDGES.pieces.splice(0,4,...p);
 all.push({id:'edges-'+p.join(''),stage:'edges',state});
}
const fixtures=all.filter((_,i)=>(i%2===1)===(phase==='development'));
writeFileSync(`${dir}/${phase}-fixtures.json`,JSON.stringify(fixtures,null,2));
const rows:any[]=[];const persist=()=>writeFileSync(`${dir}/${phase}-results.json`,JSON.stringify({phase,usage:usage(),rows},null,2));
const jobs=variants.flatMap(variant=>fixtures.map(fixture=>({variant,fixture})));let cursor=0;
async function attempt({variant,fixture}:typeof jobs[number]){
 const run=await createRun('','skills',split);run.state=fixture.state;run.status='ready';saveRun(run);
 const row:any={id:fixture.id,variant,runId:run.id,before:fixture.state,exchanges:[],status:'running'};rows.push(row);persist();const start=Date.now();
 try{const response=await (async()=>{ const request=buildRequest(fixture.state,fixture.stage,variant);
  for(let retry=0;retry<3;retry++){
   const u=usage();if(u.requests>=250||u.cost+.002688>.04||budget().reservedAndSpent+.002688>9)throw Error('Budget cap');
   try{const e=await evaluate(run.id,structuredClone(request),AbortSignal.timeout(30000),{maxAttempts:1});row.exchanges.push(e);persist();return e.response;}
   catch(e){row.transportErrors??=[];row.transportErrors.push(String(e));persist();if(retry===2||!/(HTTP (429|5\d\d)|network)/i.test(String(e)))throw e;await new Promise(r=>setTimeout(r,1000*2**retry));}
  }throw Error('Transport exhausted');
 })();const choice=response.answers.routine.choice;row.choice=choice;row.stage=fixture.stage;const routine=routines.find(r=>r.id===choice);row.alg=routine?.alg??'';row.after=await apply(fixture.state,row.alg);row.turns=row.alg.split(/\s+/).filter(Boolean).length;const f=facts(row.after);row.passed=fixture.stage==='orientation'?f.middle&&f.topCross&&f.topOriented:f.solved;row.status='complete';
 }catch(e){row.status='error';row.error=String(e);row.passed=false;}
 row.elapsedMs=Date.now()-start;saveRun({...getRun(run.id),state:row.after??fixture.state,turns:row.turns??0,status:'stopped',reason:`Last-layer recognition ${phase}`});persist();console.log(variant,fixture.id,row.passed,row.choice);
}
await Promise.all(Array.from({length:2},async()=>{while(cursor<jobs.length)await attempt(jobs[cursor++]);}));
console.log(JSON.stringify({usage:usage(),scores:variants.map(v=>({variant:v,passed:rows.filter(r=>r.variant===v&&r.passed).length,n:rows.filter(r=>r.variant===v).length}))}));
