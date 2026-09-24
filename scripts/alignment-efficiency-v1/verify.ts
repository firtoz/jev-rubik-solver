import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {Database} from 'bun:sqlite';
import {request} from './policy';
import {solved,apply,pieces} from '../../src/lib/cube';
import {validateResponse} from '../../src/server/jev';
const dir='experiments/alignment-efficiency-v1',db=new Database('.data/lab.sqlite',{readonly:true}),reports=[],base=await solved();
for(const phase of ['development','validation']){
 if(!existsSync(`${dir}/${phase}-results.json`))continue;
 const load=(s:string)=>JSON.parse(readFileSync(`${dir}/${phase}-${s}.json`,'utf8')),data=load('results'),fixtures=load('fixtures'),snapshot=load('started');
 for(const [p,s] of Object.entries(snapshot.sources))if(readFileSync(p,'utf8')!==s)throw Error('Source drift '+p);
 if(data.rows.length!==fixtures.length*snapshot.variants.length||data.rows.some((r:any)=>r.status!=='complete'))throw Error('Incomplete records');
 for(const row of data.rows){
  const f=fixtures.find((f:any)=>f.id===row.id),req=request(f.source,f.destination,row.variant),x=row.exchange;
  if(JSON.stringify(req)!==JSON.stringify(x.request)||JSON.stringify(validateResponse(x.nativeResponse,req))!==JSON.stringify(x.response))throw Error('Exchange drift');
  const wire=db.query("SELECT payload FROM events WHERE run_id=? AND kind='request' AND json_extract(payload,'$.id')=?").get(row.runId,x.id) as any;
  if(JSON.stringify(JSON.parse(wire.payload).request)!==JSON.stringify(req))throw Error('Wire drift');
  const choice=x.response.answers.turn.choice,alg=choice==='reconsider'?'':choice;
  const passed=pieces(await apply(base,alg)).find(p=>p.piece===f.source)!.position===f.destination;
  if(passed!==row.passed||choice!==row.choice||row.expected!==f.expected)throw Error('Score drift');
 }
 reports.push({phase,usage:data.usage,scores:snapshot.variants.map((variant:string)=>({variant,n:fixtures.length,passed:data.rows.filter((r:any)=>r.variant===variant&&r.passed).length,failures:data.rows.filter((r:any)=>r.variant===variant&&!r.passed).map((r:any)=>({id:r.id,choice:r.choice,expected:r.expected}))}))});
}
db.close();writeFileSync(`${dir}/verification.json`,JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));
