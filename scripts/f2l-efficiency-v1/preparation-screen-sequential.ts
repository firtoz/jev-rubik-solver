// Isolated request test: target and frame are supplied by the fixture, not model-scored.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {solved,pieces} from '../../src/lib/cube';
import {view} from './controller';
import {prepare} from './preparation-sequential';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {db,saveRun,getRun} from '../../src/server/store';
import type {JevRequest,JevResponse,CubeData} from '../../src/lib/types';
const phase=process.argv[2]??'development';if(!['development','validation'].includes(phase))throw Error('Bad phase');
const dir='experiments/f2l-efficiency-v1/preparation-sequential',split='f2l-preparation-sequential';mkdirSync(dir,{recursive:true});
const variants=['sequential'];
writeFileSync(`${dir}/${phase}-started.json`,JSON.stringify({at:new Date().toISOString(),sources:Object.fromEntries(['controller','preparation-sequential','preparation-screen-sequential'].map(n=>[n,readFileSync(`scripts/f2l-efficiency-v1/${n}.ts`,'utf8')])),limits:{calls:260,dollars:.03,concurrency:2},budgetBefore:budget()},null,2),{flag:'wx'});
const fixtures:{id:string;state:CubeData;expected:string}[]=[];const base=await solved();
for(let c=0;c<8;c++)for(const e of [0,1,2,3,8,9,10,11]){
 const index=c*8+[0,1,2,3,8,9,10,11].indexOf(e);if((index%2===0)!==(phase==='development'))continue;
 const s=structuredClone(base);[s.CORNERS.pieces[c],s.CORNERS.pieces[4]]=[s.CORNERS.pieces[4],s.CORNERS.pieces[c]];[s.EDGES.pieces[e],s.EDGES.pieces[8]]=[s.EDGES.pieces[8],s.EDGES.pieces[e]];
 if((c!==4)!==(e!==8)){const others=[0,1,2,3].filter(i=>i!==e);[s.EDGES.pieces[others[0]],s.EDGES.pieces[others[1]]]=[s.EDGES.pieces[others[1]],s.EDGES.pieces[others[0]]];}
 const cp=pieces(s).find(p=>p.piece==='DRF')!.position,ep=pieces(s).find(p=>p.piece==='FR')!.position;
 const expected=!cp.includes('U')&&cp!=='DRF'?'extract-corner':!ep.includes('U')&&ep!=='FR'?'extract-edge':cp.includes('U')&&cp!=='UFR'?'align-corner':cp==='DRF'&&ep.includes('U')&&ep!=='UF'?'align-edge':'routine';
 fixtures.push({id:`position-${index}`,state:s,expected});
}
writeFileSync(`${dir}/${phase}-fixtures.json`,JSON.stringify(fixtures,null,2));
const usage=()=>db.query("SELECT COUNT(*) requests,COALESCE(SUM(amount),0) cost FROM ledger l JOIN runs r ON l.run_id=r.id WHERE json_extract(r.json,'$.split')=?").get(split) as {requests:number;cost:number};
const rows:any[]=[];const persist=()=>writeFileSync(`${dir}/${phase}-results.json`,JSON.stringify({phase,rows,usage:usage()},null,2));
const jobs=variants.flatMap(variant=>fixtures.map(f=>({variant,f})));let cursor=0;
async function job({variant,f}:typeof jobs[number]){
 const run=await createRun('','skills',split);saveRun({...run,state:f.state});const row:any={id:f.id,variant,runId:run.id,expected:f.expected,status:'running'};rows.push(row);persist();
 try{
 row.exchanges=[];
 const response=await prepare(view(f.state,'FR','F'),async request=>{
  for(let retry=0;retry<3;retry++){
   const u=usage();if(u.requests>=260||u.cost+.002688>.03||budget().reservedAndSpent+.002688>9)throw Error('Budget cap');
   try{const exchange=await evaluate(run.id,request,AbortSignal.timeout(30000),{maxAttempts:1});row.exchanges.push(exchange);persist();return exchange.response;}
   catch(e){if(retry===2||!/(HTTP (429|5\d\d)|network)/i.test(String(e)))throw e;row.transportErrors??=[];row.transportErrors.push(String(e));await new Promise(r=>setTimeout(r,1000*2**retry));}
  }throw Error('Transport unresolved');
 });
 row.choice=response.answers.preparation.choice;row.passed=row.choice===f.expected;row.status='complete';
 }catch(e){row.status='error';row.error=String(e);row.passed=false;}
 saveRun({...getRun(run.id),status:'stopped',reason:'Preparation component test'});persist();
}
await Promise.all(Array.from({length:2},async()=>{while(cursor<jobs.length)await job(jobs[cursor++]);}));console.log({usage:usage(),scores:variants.map(v=>({variant:v,passed:rows.filter(r=>r.variant===v&&r.passed).length,n:rows.filter(r=>r.variant===v).length}))});
