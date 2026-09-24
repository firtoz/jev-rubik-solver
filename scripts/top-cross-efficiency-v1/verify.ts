import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {Database} from 'bun:sqlite';
import {apply,hash,facts} from '../../src/lib/cube';
import {request,routines} from './policy';
import {validateResponse} from '../../src/server/jev';
const dir='experiments/top-cross-efficiency-v1',reports=[];
const db=new Database('.data/lab.sqlite',{readonly:true});
for(const phase of ['development','validation']){
 if(!existsSync(`${dir}/${phase}-results.json`))continue;
 const load=(s:string)=>JSON.parse(readFileSync(`${dir}/${phase}-${s}.json`,'utf8'));
 const d=load('results'),fixtures=load('fixtures'),start=load('started');
 for(const [p,s] of Object.entries(start.sources))if(readFileSync(p,'utf8')!==s)throw Error('Source changed '+p);
 if(d.rows.length!==fixtures.length*start.variants.length||d.rows.some((r:any)=>r.status!=='complete'))throw Error('Incomplete outcomes');
 for(const r of d.rows){
  const f=fixtures.find((f:any)=>f.id===r.id),req=request(f.state,f.stage,r.variant),x=r.exchanges[0];
  if(r.exchanges.length!==1||JSON.stringify(req)!==JSON.stringify(x.request)||hash(r.before)!==hash(f.state))throw Error('Input mismatch');
  if(JSON.stringify(validateResponse(x.nativeResponse,req))!==JSON.stringify(x.response))throw Error('Native mismatch');
  const wire=db.query("SELECT payload FROM events WHERE run_id=? AND kind='request' AND json_extract(payload,'$.id')=?").get(r.runId,x.id) as any;
  if(JSON.stringify(JSON.parse(wire.payload).request)!==JSON.stringify(req))throw Error('Wire mismatch');
  const choice=x.response.answers.routine.choice,alg=routines.find(a=>a.id===choice)?.alg??'';
  const after=await apply(f.state,alg),ff=facts(after),passed=ff.middle&&ff.topCross;
  if(r.choice!==choice||r.alg!==alg||hash(after)!==hash(r.after)||r.passed!==passed)throw Error('Outcome mismatch');
 }
 reports.push({phase,usage:d.usage,scores:start.variants.map((variant:string)=>({variant,passed:d.rows.filter((r:any)=>r.variant===variant&&r.passed).length,n:fixtures.length,tokens:d.rows.filter((r:any)=>r.variant===variant).reduce((n:number,r:any)=>n+r.exchanges[0].response.usage.input_tokens,0),failures:d.rows.filter((r:any)=>r.variant===variant&&!r.passed).map((r:any)=>({id:r.id,choice:r.choice}))}))});
}
db.close();writeFileSync(`${dir}/verification.json`,JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));
