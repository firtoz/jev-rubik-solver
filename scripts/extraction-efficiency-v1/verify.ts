import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {Database} from 'bun:sqlite';
import {request,routines} from './policy';
import {apply,pieces,facts} from '../../src/lib/cube';
import {validateResponse} from '../../src/server/jev';
const dir='experiments/extraction-efficiency-v1',db=new Database('.data/lab.sqlite',{readonly:true}),reports=[];
const fixtures=JSON.parse(readFileSync(dir+'/fixtures.json','utf8'));
for(const phase of ['development','validation']){
 if(!existsSync(`${dir}/${phase}-results.json`))continue;
 const load=(s:string)=>JSON.parse(readFileSync(`${dir}/${phase}-${s}.json`,'utf8')),data=load('results'),snapshot=load('started');
 for(const [p,s] of Object.entries(snapshot.sources))if(readFileSync(p.endsWith('/screen.ts')?'experiments/extraction-efficiency-v1/development-runner.ts.txt':p,'utf8')!==s)throw Error('Source drift '+p);
 if(data.rows.length!==15*snapshot.variants.length||data.rows.some((r:any)=>r.status!=='complete'))throw Error('Incomplete records');
 for(const row of data.rows){
  const f=fixtures.find((f:any)=>f.id===row.id),req=request(f.cornerPosition,f.edgePosition,f.extract,row.variant),x=row.exchange;
  if(JSON.stringify(req)!==JSON.stringify(x.request)||JSON.stringify(validateResponse(x.nativeResponse,req))!==JSON.stringify(x.response))throw Error('Exchange drift');
  const wire=db.query("SELECT payload FROM events WHERE run_id=? AND kind='request' AND json_extract(payload,'$.id')=?").get(row.runId,x.id) as any;
  if(JSON.stringify(JSON.parse(wire.payload).request)!==JSON.stringify(req))throw Error('Wire drift');
  const choice=x.response.answers.extraction.choice,routine=routines.find(r=>r.id===choice),after=await apply(f.state,routine?.alg??''),before=pieces(f.state),ps=pieces(after);
  const cp=ps.find(p=>p.piece==='DRF')!.position,ep=ps.find(p=>p.piece==='FR')!.position;
  const preserved=[['DRF','FR'],['DBR','BR'],['DLB','BL'],['DFL','FL']].filter(pair=>pair.every(id=>before.find(p=>p.piece===id)!.solved)).every(pair=>pair.every(id=>ps.find(p=>p.piece===id)!.solved));
  const passed=!!routine&&facts(after).cross&&(cp.includes('U')||cp==='DRF')&&(ep.includes('U')||ep==='FR')&&preserved;
  if(passed!==row.passed||choice!==row.choice||JSON.stringify(row.acceptable)!==JSON.stringify(f.acceptable))throw Error('Score drift');
 }
 reports.push({phase,usage:data.usage,scores:snapshot.variants.map((variant:string)=>({variant,n:15,passed:data.rows.filter((r:any)=>r.variant===variant&&r.passed).length,failures:data.rows.filter((r:any)=>r.variant===variant&&!r.passed).map((r:any)=>({id:r.id,choice:r.choice,acceptable:r.acceptable}))}))});
}
db.close();writeFileSync(dir+'/verification.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));
