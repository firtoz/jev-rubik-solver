import {readFileSync,writeFileSync} from 'node:fs';
import {Database} from 'bun:sqlite';
import {apply,pieces,mapAlg} from '../../src/lib/cube';
import {validateResponse} from '../../src/server/jev';
import {destinationRequest,turnRequest,observe} from './policy';
import {readinessRequest,preparationRequest} from './sequential-v2';
const dir='experiments/protected-landing-v1/fresh-v2',start=JSON.parse(readFileSync(`${dir}/development-started.json`,'utf8')),data=JSON.parse(readFileSync(`${dir}/development-results.json`,'utf8')),fixtures=JSON.parse(readFileSync('experiments/protected-landing-v1/fresh-v2-fixtures.json','utf8'));
for(const [p,s] of Object.entries(start.sources))if(readFileSync(p,'utf8')!==s)throw Error('Source changed '+p);
if(data.rows.length!==fixtures.length||data.rows.some((r:any)=>r.status==='running'))throw Error('Incomplete');
const db=new Database('.data/lab.sqlite',{readonly:true});
for(const row of data.rows){const f=fixtures.find((f:any)=>f.id===row.id);if(row.status!=='complete')throw Error('Incomplete response');
 const check=(e:any,r:any)=>{if(JSON.stringify(r)!==JSON.stringify(e.request))throw Error('Request drift');validateResponse(e.nativeResponse,e.request);const wire=db.query("SELECT payload FROM events WHERE run_id=? AND kind='request' AND json_extract(payload,'$.id')=?").get(row.runId,e.id) as any;if(!wire||JSON.stringify(JSON.parse(wire.payload).request)!==JSON.stringify(r))throw Error('Wire mismatch');};
 check(row.readiness,readinessRequest(f.state));if(row.exchange){if(row.readiness.response.answers.readiness.choice!=='prepare')throw Error('Unexpected preparation');check(row.exchange,preparationRequest(f.state));}else if(row.readiness.response.answers.readiness.choice!=='execute')throw Error('Missing preparation');
 if(row.destination){check(row.destination,destinationRequest(f.state));check(row.turn,turnRequest(f.state.target.position,row.destination.response.answers.destination.choice));}
 if(row.choice!==(row.exchange?.response.answers.decision.choice??row.readiness.response.answers.readiness.choice)||row.passed!==Boolean(row.choice===f.expected&&(row.choice!=='reorient'||row.safeReorientation)))throw Error('Score mismatch');
}
// Independently audit the actual selected target, including incorrect reorientation of non-top pieces.
for(const row of data.rows){
 const f=fixtures.find((f:any)=>f.id===row.id);
 row.auditedSafeReorientation=false;
 if(row.turn){
  const ring=['F','R','B','L'],local=(x:string)=>ring.includes(x)?ring[(ring.indexOf(x)-ring.indexOf(f.front)+4)%4]:x;
  const loc=(s:string)=>[...s].map(local).sort().join('');
  const target=pieces(f.before).find(p=>p.kind==='edge'&&loc(p.position)===[...f.state.target.position].sort().join(''))!;
  const after=await apply(f.before,mapAlg(row.turn.response.answers.setup.choice,f.front));
  const moved=pieces(after).find(p=>p.kind==='edge'&&p.piece===target.piece)!;
  const dest=row.destination.response.answers.destination.choice;
  const protectedIds=pieces(f.before).filter(p=>p.kind==='edge'&&p.piece.includes('D')&&p.solved).map(p=>p.piece);
  row.auditedSafeReorientation=f.state.target.layer==='top'&&loc(moved.position)===[...dest].sort().join('')&&dest!==f.state.target.position&&!f.state.protectedBottomSlots.includes(dest.replace('U','D'))&&pieces(after).every(p=>!protectedIds.includes(p.piece)||p.solved);
 }
 row.safeAlternative=row.expected==='lower'&&row.choice==='reorient'&&row.auditedSafeReorientation;
}
const summary={scores:['sequential'].map(v=>({variant:v,passed:data.rows.filter((r:any)=>r.variant===v&&r.passed).length,total:fixtures.length,safeAlternatives:data.rows.filter((r:any)=>r.variant===v&&r.safeAlternative).length,failures:data.rows.filter((r:any)=>r.variant===v&&!r.passed).map((r:any)=>({id:r.id,expected:r.expected,choice:r.choice,safeReorientation:r.safeReorientation}))})),usage:data.usage,projectCommitment:(db.query('SELECT SUM(amount) total FROM ledger').get() as any).total};
writeFileSync(`${dir}/verification.json`,JSON.stringify(summary,null,2));console.log(summary);db.close();
