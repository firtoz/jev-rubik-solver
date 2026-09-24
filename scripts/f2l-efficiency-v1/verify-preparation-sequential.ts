import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {Database} from 'bun:sqlite';
import {prepare} from './preparation-sequential';
import {view} from './controller';
import {validateResponse} from '../../src/server/jev';
const db=new Database('.data/lab.sqlite',{readonly:true});
const dir='experiments/f2l-efficiency-v1/preparation-sequential',reports=[];
for(const phase of ['development','validation']){
 if(!existsSync(`${dir}/${phase}-results.json`))continue;
 const load=(suffix:string)=>JSON.parse(readFileSync(`${dir}/${phase}-${suffix}.json`,'utf8'));
 const d=load('results'),fixtures=load('fixtures'),snapshot=load('started');
 for(const name of ['controller','preparation-sequential']){
  if(snapshot.sources[name]!==readFileSync(`scripts/f2l-efficiency-v1/${name}.ts`,'utf8'))throw Error('Source changed');
 }
 for(const row of d.rows){
  if(row.status!=='complete')throw Error('Incomplete/transport outcome needs review');
  const f=fixtures.find((f:any)=>f.id===row.id);let cursor=0;
  const result=await prepare(view(f.state,'FR','F'),async request=>{
   const x=row.exchanges[cursor++];
   if(!x||JSON.stringify(request)!==JSON.stringify(x.request))throw Error('Request replay mismatch');
   const native=validateResponse(x.nativeResponse,x.request);
   if(JSON.stringify(native)!==JSON.stringify(x.response))throw Error('Native response mismatch');
   const wire=db.query("SELECT payload FROM events WHERE run_id=? AND kind='request' AND json_extract(payload,'$.id')=?").get(row.runId,x.id) as any;
   if(JSON.stringify(JSON.parse(wire.payload).request)!==JSON.stringify(request))throw Error('Wire mismatch');
   return x.response;
  });
  const pair=view(f.state,'FR','F'),c=pair.corner.position,e=pair.edge.position;
  // Independent evaluator decision table, never imported by live policy.
  const expected=['DBR','DLB','DFL'].includes(c)?'extract-corner':['BR','BL','FL'].includes(e)?'extract-edge':['URB','UBL','ULF'].includes(c)?'align-corner':c==='DRF'&&['UR','UB','UL'].includes(e)?'align-edge':'routine';
  if(cursor!==row.exchanges.length||row.expected!==expected||row.choice!==result.answers.preparation.choice||row.passed!==(row.choice===expected))throw Error('Score mismatch');
 }
 reports.push({phase,n:d.rows.length,passed:d.rows.filter((r:any)=>r.passed).length,usage:d.usage,failures:d.rows.filter((r:any)=>!r.passed).map((r:any)=>({id:r.id,expected:r.expected,choice:r.choice})),requests:d.rows.reduce((n:number,r:any)=>n+r.exchanges.length,0)});
}
db.close();writeFileSync(`${dir}/verification.json`,JSON.stringify(reports,null,2));console.log(reports);
