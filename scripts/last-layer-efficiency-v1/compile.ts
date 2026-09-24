import {writeFileSync} from 'node:fs';
import {references,outerTurns,source} from './reference';
import {solved,apply,inverse,hash,facts,pieces,mapAlg} from '../../src/lib/cube';
const base=await solved();const rows=[];
for(const r of references){const alg=outerTurns(r.notation);if(hash(await apply(base,r.notation))!==hash(await apply(base,alg)))throw Error('Notation conversion mismatch '+r.id);
 for(const front of ['F','R','B','L']){
  const fixed=mapAlg(alg,front),start=await apply(base,inverse(fixed));const f=facts(start);
  if(!f.middle||!f.topCross||(r.stage==='edges'&&(!f.topOriented||!f.cornersPlaced)))throw Error('Preservation '+r.id);
  rows.push({id:r.id+'@'+front,stage:r.stage,front,alg:fixed,turns:fixed.split(' ').length,pattern:r.stage==='orientation'?Object.fromEntries(pieces(start).filter(p=>p.kind==='corner'&&p.position.includes('U')).map(p=>[p.position,p.stickers.white])):Object.fromEntries(pieces(start).filter(p=>p.kind==='edge'&&p.position.includes('U')).map(p=>[p.position,p.destination]))});
 }
}
writeFileSync('experiments/last-layer-efficiency-v1/catalog.json',JSON.stringify({source,rows},null,2));console.log({routines:rows.length,orientationPatterns:new Set(rows.filter(r=>r.stage==='orientation').map(r=>JSON.stringify(r.pattern))).size,edgePatterns:new Set(rows.filter(r=>r.stage==='edges').map(r=>JSON.stringify(r.pattern))).size,turns:references.map(r=>({id:r.id,turns:outerTurns(r.notation).split(' ').length}))});
