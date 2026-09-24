import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {Database} from 'bun:sqlite';
import {decide,routines} from './policy';
import {apply,hash,facts} from '../../src/lib/cube';
import {validateResponse} from '../../src/server/jev';
const dir='experiments/f2l-efficiency-v1';const db=new Database('.data/lab.sqlite',{readonly:true});const reports=[];
for(const phase of ['development','validation']){
 if(!existsSync(`${dir}/${phase}-results.json`))continue;
 const data=JSON.parse(readFileSync(`${dir}/${phase}-results.json`,'utf8')),start=JSON.parse(readFileSync(`${dir}/${phase}-started.json`,'utf8'));
 if(data.rows.some((r:any)=>r.status==='running'))throw Error('Wait for completion');
 for(const p of ['scripts/f2l-efficiency-v1/policy.ts','experiments/f2l-efficiency-v1/catalog.json','src/lib/cube.ts'])if(readFileSync(p,'utf8')!==start.sources[p])throw Error('Frozen policy source changed');
 for(const row of data.rows){if(row.status==='error')throw Error('Resolve transport/error accounting before scoring');let i=0;
  const selected=await decide(row.before,row.variant,async request=>{const e=row.exchanges[i++];if(!e||JSON.stringify(request)!==JSON.stringify(e.request))throw Error('Request drift');const wire=db.query("SELECT payload FROM events WHERE run_id=? AND kind='request' AND json_extract(payload,'$.id')=?").get(row.runId,e.id) as any;if(JSON.stringify(JSON.parse(wire.payload).request)!==JSON.stringify(request))throw Error('Wire mismatch');validateResponse(e.nativeResponse,request);return e.response;});
  if(i!==row.exchanges.length||selected!==row.choice)throw Error('Response replay mismatch');const alg=routines.find(r=>r.id===selected)?.alg??'';const after=await apply(row.before,alg);
  if(hash(after)!==hash(row.after)||facts(after).middle!==row.passed||alg!==row.alg)throw Error('Outcome mismatch');
 }
 const variants=[...new Set(data.rows.map((r:any)=>r.variant))];reports.push({phase,usage:data.usage,scores:variants.map(v=>{const rows=data.rows.filter((r:any)=>r.variant===v);return {variant:v,passed:rows.filter((r:any)=>r.passed).length,n:rows.length,requests:rows.reduce((n:number,r:any)=>n+r.exchanges.length,0),inputTokens:rows.reduce((n:number,r:any)=>n+r.exchanges.reduce((m:number,e:any)=>m+e.response.usage.input_tokens,0),0),failures:rows.filter((r:any)=>!r.passed).map((r:any)=>({id:r.id,choice:r.choice,group:r.exchanges[0]?.response.answers.group?.choice}))};})});
}
const total=(db.query('SELECT SUM(amount) amount FROM ledger').get() as any).amount;db.close();writeFileSync(`${dir}/verification.json`,JSON.stringify({reports,projectCommitment:total},null,2));console.log(JSON.stringify({reports,projectCommitment:total},null,2));
