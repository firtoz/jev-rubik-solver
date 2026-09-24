import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {Database} from 'bun:sqlite';
import {request} from './policy-v2';
import {apply,pieces,solved} from '../../src/lib/cube';
import {validateResponse} from '../../src/server/jev';
import reference from '../brain-early-v3/routine-reference.json';
const dir='experiments/daisy-efficiency-v1/revision',db=new Database('.data/lab.sqlite',{readonly:true}),reports=[];
const fixtures=JSON.parse(readFileSync('experiments/daisy-efficiency-v1/fixtures.json','utf8')),base=await solved();
for(const r of reference){
 const changed=pieces(await apply(base,r.sequence)).filter(p=>p.kind==='edge'&&p.piece.includes('D')&&!p.solved).map(p=>p.piece).sort();
 if(JSON.stringify(changed)!==JSON.stringify([...r.affectedBottomSlots].sort()))throw Error('Static bottom effects wrong '+r.id);
}
for(const phase of ['development','validation']){
 if(!existsSync(`${dir}/${phase}-results.json`))continue;
 const load=(s:string)=>JSON.parse(readFileSync(`${dir}/${phase}-${s}.json`,'utf8')),data=load('results'),snapshot=load('started');
 for(const [p,s] of Object.entries(snapshot.sources))if(readFileSync(p,'utf8')!==s)throw Error('Source drift '+p);
 if(data.rows.length!==15*snapshot.variants.length||data.rows.some((r:any)=>r.status!=='complete'))throw Error('Incomplete records');
 for(const row of data.rows){
  const f=fixtures.find((f:any)=>f.id===row.id),req=request(f.request,row.variant),x=row.exchange;
  if(JSON.stringify(req)!==JSON.stringify(x.request)||JSON.stringify(validateResponse(x.nativeResponse,req))!==JSON.stringify(x.response))throw Error('Exchange drift');
  const wire=db.query("SELECT payload FROM events WHERE run_id=? AND kind='request' AND json_extract(payload,'$.id')=?").get(row.runId,x.id) as any;
  if(JSON.stringify(JSON.parse(wire.payload).request)!==JSON.stringify(req))throw Error('Wire drift');
  const st=f.request.state;
  const eligible=reference.filter(r=>r.position===st.target.position&&r.yellowDirection===st.target.yellowDirection&&!st.previouslyRejectedByModel.includes(r.id)&&r.affectedBottomSlots.every(p=>!st.protectedBottomSlots.includes(p)));
  const lifts=eligible.filter(r=>!['stage-bottom-edge','lower-top-edge'].includes(r.id)),pool=lifts.length?lifts:eligible,min=pool.length?Math.min(...pool.map(r=>r.sequence.split(' ').length)):0;
  const expected=pool.length?pool.filter(r=>r.sequence.split(' ').length===min).map(r=>r.id):['reconsider'];
  const choice=x.response.answers.routine.choice;
  if(JSON.stringify(expected)!==JSON.stringify(f.acceptable)||choice!==row.choice||expected.includes(choice)!==row.passed)throw Error('Score drift');
 }
 reports.push({phase,usage:data.usage,scores:snapshot.variants.map((variant:string)=>({variant,n:15,passed:data.rows.filter((r:any)=>r.variant===variant&&r.passed).length,failures:data.rows.filter((r:any)=>r.variant===variant&&!r.passed).map((r:any)=>({id:r.id,choice:r.choice,acceptable:r.acceptable}))}))});
}
db.close();writeFileSync(dir+'/verification.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));
