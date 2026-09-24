import {readFileSync,writeFileSync} from 'node:fs';
import {Database} from 'bun:sqlite';
import {apply,solved,hash,facts,pieces} from '../../src/lib/cube';
import {decide} from './preparation-sequential';
import {validateResponse} from '../../src/server/jev';
const phase=process.argv[2]??'development',dir=`experiments/f2l-efficiency-v1/integration-sequential-${phase}`;
const data=JSON.parse(readFileSync(`${dir}/results.json`,'utf8')),start=JSON.parse(readFileSync(`${dir}/started.json`,'utf8')),fixtures=JSON.parse(readFileSync(`${dir}/fixtures.json`,'utf8'));
if(data.rows.length!==6||data.rows.some((r:any)=>r.status==='running'))throw Error('Need six terminal attempts');
for(const [p,s] of Object.entries(start.sources))if(readFileSync(p,'utf8')!==s)throw Error('Source changed: '+p);
const db=new Database('.data/lab.sqlite',{readonly:true}),checked=[];
for(const row of data.rows){const f=fixtures.find((f:any)=>f.id===row.id);let state=await apply(await solved(),f.generation.join(' '));if(hash(state)!==hash(row.before)||hash(state)!==hash(f.state))throw Error('Wrong fixture');let target:string|null=null,total=0,regressions=0;const history:string[]=[];
 for(const step of row.steps){if(hash(step.before)!==hash(state))throw Error('Discontinuous state');let i=0;
  if(!step.decision){if(step.exchanges.length)throw Error('Partial transport prefix needs separate audit');continue;}
  const d=await decide(state,async request=>{const e=step.exchanges[i++];if(!e||JSON.stringify(request)!==JSON.stringify(e.request))throw Error('Request drift');validateResponse(e.nativeResponse,request);const wire=db.query("SELECT payload FROM events WHERE run_id=? AND kind='request' AND json_extract(payload,'$.id')=?").get(row.runId,e.id) as any;if(JSON.stringify(JSON.parse(wire.payload).request)!==JSON.stringify(request))throw Error('Wire drift');return e.response;},target,history);
  if(i!==step.exchanges.length||JSON.stringify(d)!==JSON.stringify(step.decision))throw Error('Decision drift');target=d.target;
  if(step.after){if(d.alg!==step.alg)throw Error('Wrong action');const prev=pieces(state).filter(p=>!p.piece.includes('U')&&p.solved).map(p=>p.piece);state=await apply(state,d.alg);regressions+=pieces(state).filter(p=>prev.includes(p.piece)&&!p.solved).length;if(hash(state)!==hash(step.after))throw Error('Wrong resulting state');total+=d.alg.split(/\s+/).length;history.push(d.alg);if(!facts(state).cross)throw Error('Cross broken');}
 }
 if(hash(state)!==hash(row.after)||total!==row.turns||total>60||(row.status==='solved')!==facts(state).middle)throw Error('Wrong final outcome');
 const ledger=db.query('SELECT COUNT(*) n,SUM(amount) cost FROM ledger WHERE run_id=?').get(row.runId) as any;if(ledger.n>120)throw Error('Request ceiling');checked.push({id:row.id,status:row.status,turns:total,requests:ledger.n,cost:ledger.cost,elapsedMs:row.elapsedMs,solvedPieceRegressions:regressions,actions:history.length});
}
const commitment=(db.query('SELECT SUM(amount) amount FROM ledger').get() as any).amount;db.close();if(commitment>9||data.usage.cost>.06)throw Error('Budget ceiling');const result={phase,verified:checked.length,solved:checked.filter(r=>r.status==='solved').length,projectCommitment:commitment,usage:data.usage,rows:checked};writeFileSync(`${dir}/verification.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
