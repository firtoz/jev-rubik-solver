import {readFileSync,writeFileSync} from 'node:fs';
import {request,type Variant} from './policy';
import {solved,apply,pieces} from '../../src/lib/cube';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {db,saveRun,getRun} from '../../src/server/store';
const dir='experiments/alignment-efficiency-v1',split='alignment-efficiency-v1';
const phase=process.argv[2]??'development';if(!['development','validation'].includes(phase))throw Error('Bad phase');
const variants:Variant[]=phase==='development'?['baseline','relations','words']:[process.argv[3] as Variant];
if(variants.some(v=>!['baseline','relations','words'].includes(v)))throw Error('Bad variant');
writeFileSync(`${dir}/${phase}-started.json`,JSON.stringify({phase,variants,at:new Date().toISOString(),limits:{calls:80,dollars:.01,concurrency:2},budget:budget(),sources:Object.fromEntries(['scripts/alignment-efficiency-v1/policy.ts','scripts/alignment-efficiency-v1/screen.ts','src/lib/cube.ts'].map(p=>[p,readFileSync(p,'utf8')]))},null,2),{flag:'wx'});
const base=await solved(),fixtures:{id:string;source:string;destination:string;expected:string}[]=[];
for(const slots of [['UF','UR','UB','UL'],['UFR','URB','UBL','ULF']])for(const source of slots)for(const destination of slots){
 if((destination===slots[0])!==(phase==='development'))continue;
 const expected=[];
 for(const alg of ['U',"U'",'U2',''])if(pieces(await apply(base,alg)).find(p=>p.piece===source)!.position===destination)expected.push(alg||'reconsider');
 if(expected.length!==1)throw Error('Mechanics label ambiguous');
 fixtures.push({id:source+'-'+destination,source,destination,expected:expected[0]});
}
writeFileSync(`${dir}/${phase}-fixtures.json`,JSON.stringify(fixtures,null,2));
const usage=()=>db.query("SELECT COUNT(*) requests,COALESCE(SUM(amount),0) cost FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split')=?").get(split) as {requests:number;cost:number};
const rows:any[]=[],jobs=variants.flatMap(variant=>fixtures.map(f=>({variant,f})));let cursor=0;
const persist=()=>writeFileSync(`${dir}/${phase}-results.json`,JSON.stringify({phase,rows,usage:usage()},null,2));
async function job({variant,f}:typeof jobs[number]){
 const run=await createRun('','skills',split),row:any={id:f.id,variant,expected:f.expected,runId:run.id,status:'running'};rows.push(row);persist();
 try{
 for(let retry=0;retry<3;retry++){
  const u=usage();if(u.requests>=80||u.cost+.002688>.01||budget().reservedAndSpent+.002688>9)throw Error('Budget cap');
  try{row.exchange=await evaluate(run.id,request(f.source,f.destination,variant),AbortSignal.timeout(30000),{maxAttempts:1});break;}
  catch(e){if(retry===2||!/(HTTP (429|5\d\d)|network)/i.test(String(e)))throw e;row.transportErrors??=[];row.transportErrors.push(String(e));await new Promise(r=>setTimeout(r,1000*2**retry));}
 }
 row.choice=row.exchange.response.answers.turn.choice;row.passed=row.choice===f.expected;row.status='complete';
 }catch(e){row.status='error';row.error=String(e);row.passed=false;}
 saveRun({...getRun(run.id),status:'stopped',reason:'Isolated alignment evaluation'});persist();
}
await Promise.all(Array.from({length:2},async()=>{while(cursor<jobs.length)await job(jobs[cursor++]);}));
console.log({usage:usage(),scores:variants.map(v=>({variant:v,n:rows.filter(r=>r.variant===v).length,passed:rows.filter(r=>r.variant===v&&r.passed).length,tokens:rows.filter(r=>r.variant===v).reduce((n,r)=>n+(r.exchange?.response.usage.input_tokens??0),0)}))});
