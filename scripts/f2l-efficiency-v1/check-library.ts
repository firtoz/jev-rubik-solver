import {writeFileSync} from 'node:fs';
import {solved,apply,inverse,pieces,facts} from '../../src/lib/cube';
import {library,source} from './library';
const base=await solved(),rows=[];
for(const r of library){const start=await apply(base,inverse(r.alg));const ps=pieces(start);
 const changed=ps.filter(p=>!p.solved&&!p.piece.includes('U'));
 const allowed=changed.every(p=>['DRF','FR'].includes(p.piece));
 const valid=facts(start).cross&&allowed;
 rows.push({...r,valid,changed:changed.map(p=>p.piece),pattern:ps.filter(p=>['DRF','FR'].includes(p.piece)),turns:r.alg.split(' ').length});}
writeFileSync('experiments/f2l-efficiency-v1/library-check.json',JSON.stringify({source,rows},null,2));console.log(JSON.stringify({count:rows.length,valid:rows.filter(r=>r.valid).length,invalid:rows.filter(r=>!r.valid).map(r=>({id:r.id,alg:r.alg,changed:r.changed}))},null,2));
