import {readFileSync,writeFileSync} from 'node:fs';
import {Database} from 'bun:sqlite';
import {decide,observation,groups} from './policy';
import {apply,isSolved,hash} from '../../src/lib/cube';
import {validateResponse} from '../../src/server/jev';
const dir='experiments/full-pll-v1',phase=process.argv[2]??'development';
const start=JSON.parse(readFileSync(`${dir}/${phase}-started.json`,'utf8')),data=JSON.parse(readFileSync(`${dir}/${phase}-results.json`,'utf8')),fixtures=JSON.parse(readFileSync(`${dir}/fixtures.json`,'utf8')).filter((f:any)=>f.phase===phase);
for(const [p,s] of Object.entries(start.sources))if(readFileSync(p,'utf8')!==s)throw Error('Source changed '+p);
if(data.rows.length!==24*start.variants.length||data.rows.some((r:any)=>r.status==='running'))throw Error('Incomplete');
const db=new Database('.data/lab.sqlite',{readonly:true});
for(const row of data.rows){const f=fixtures.find((f:any)=>f.id===row.id);if(row.status!=='complete')continue;let index=0;
 const d=await decide(f.before,row.variant,async request=>{const e=row.exchanges[index++];if(JSON.stringify(request)!==JSON.stringify(e.request))throw Error('Request drift');validateResponse(e.nativeResponse,request);const wire=db.query("SELECT payload FROM events WHERE run_id=? AND kind='request' AND json_extract(payload,'$.id')=?").get(row.runId,e.id) as any;if(!wire||JSON.stringify(JSON.parse(wire.payload).request)!==JSON.stringify(request))throw Error('Wire mismatch');return e.response;});
 if(index!==row.exchanges.length||JSON.stringify(d)!==JSON.stringify(row.decision))throw Error('Decision drift');
 const after=await apply(f.before,d.alg);if(hash(after)!==hash(row.after)||isSolved(after)!==row.passed||row.passed!==f.acceptable.includes(d.routine))throw Error('Outcome mismatch');
 const observed=observation(f.before),signature=['UFR','URB','UBL','ULF'].map(p=>`${p}:${observed.corners[p]}`).join(', ');
 row.correctGroup=groups[Number(d.group.replace('corners-',''))-1]===signature;
}
const summary={scores:start.variants.map((v:string)=>({variant:v,total:24,passed:data.rows.filter((r:any)=>r.variant===v&&r.passed).length,correctGroups:data.rows.filter((r:any)=>r.variant===v&&r.correctGroup).length,tokens:data.rows.filter((r:any)=>r.variant===v).reduce((n:number,r:any)=>n+r.exchanges.reduce((m:number,e:any)=>m+(e.response.usage?.input_tokens??0),0),0),failures:data.rows.filter((r:any)=>r.variant===v&&!r.passed).map((r:any)=>({id:r.id,status:r.status,decision:r.decision,correctGroup:r.correctGroup}))})),usage:data.usage,projectCommitment:(db.query('SELECT SUM(amount) total FROM ledger').get() as any).total};
writeFileSync(`${dir}/${phase}-verification.json`,JSON.stringify(summary,null,2));console.log(summary);db.close();
