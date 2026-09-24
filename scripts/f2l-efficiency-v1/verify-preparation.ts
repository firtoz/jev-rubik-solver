import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {Database} from 'bun:sqlite';
import {decide as baseline,type Ask} from './controller';
import {decide as compact} from './controller-v2';
import {decide as semantic} from './controller-v3';
import {validateResponse} from '../../src/server/jev';
const db=new Database('.data/lab.sqlite',{readonly:true});const reports=[];
for(const round of ['preparation','preparation-round2'])for(const phase of ['development','validation']){
 const dir=`experiments/f2l-efficiency-v1/${round}`;if(!existsSync(`${dir}/${phase}-results.json`))continue;
 const d=JSON.parse(readFileSync(`${dir}/${phase}-results.json`,'utf8')),f=JSON.parse(readFileSync(`${dir}/${phase}-fixtures.json`,'utf8'));
 if(d.rows.some((r:any)=>r.status==='running'))throw Error('Wait for terminal results');
 for(const row of d.rows){if(!row.exchange)throw Error('Transport outcome needs audit');const fixture=f.find((f:any)=>f.id===row.id);let observed=false;const stop=new Error('stop');
  const ask:Ask=async r=>{if(r.questions.preparation){observed=true;if(JSON.stringify(r)!==JSON.stringify(row.exchange.request))throw Error('Request mismatch');throw stop;}const [k,v]=r.questions.target?['target','FR']:['front','F'];return {model:'jev-1.13.0',usage:{input_tokens:0,output_tokens:0},answers:{[k]:{type:'choice',choice:v,confidence:1,probabilities:{[v]:1}}}};};
  try{await (row.variant==='baseline'?baseline:round==='preparation'?compact:semantic)(fixture.state,ask);}catch(e){if(e!==stop)throw e;}
  if(!observed)throw Error('Missing request');validateResponse(row.exchange.nativeResponse,row.exchange.request);
  const wire=db.query("SELECT payload FROM events WHERE run_id=? AND kind='request' AND json_extract(payload,'$.id')=?").get(row.runId,row.exchange.id) as any;if(JSON.stringify(JSON.parse(wire.payload).request)!==JSON.stringify(row.exchange.request))throw Error('Wire mismatch');
  if(row.choice!==row.exchange.response.answers.preparation.choice||row.expected!==fixture.expected||row.passed!==(row.choice===fixture.expected))throw Error('Score mismatch');
 }
 reports.push({round,phase,usage:d.usage,scores:[...new Set(d.rows.map((r:any)=>r.variant))].map(variant=>({variant,passed:d.rows.filter((r:any)=>r.variant===variant&&r.passed).length,n:d.rows.filter((r:any)=>r.variant===variant).length,failures:d.rows.filter((r:any)=>r.variant===variant&&!r.passed).map((r:any)=>({id:r.id,expected:r.expected,choice:r.choice}))}))});
}
db.close();writeFileSync('experiments/f2l-efficiency-v1/preparation-verification.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));
