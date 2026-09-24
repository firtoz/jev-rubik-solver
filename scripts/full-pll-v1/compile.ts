import {writeFileSync} from 'node:fs';
import {references,source,outerTurns} from './reference';
import {apply,solved,hash,facts,pieces,mapAlg,inverse,isSolved} from '../../src/lib/cube';
const base=await solved(),rows:any[]=[];
for(const r of references){
 const alg=outerTurns(r.notation);
 if(hash(await apply(base,alg))!==hash(await apply(base,r.notation)))throw Error('Notation conversion '+r.id);
 for(const front of ['F','R','B','L'])for(const setup of ['', 'U',"U'",'U2']){
  const fixed=[setup,mapAlg(alg,front)].filter(Boolean).join(' '),before=await apply(base,inverse(fixed));
  const f=facts(before);if(!f.middle||!f.topCross||!f.topOriented)throw Error('PLL preservation '+r.id);
  if(!isSolved(await apply(before,fixed)))throw Error('Inverse fixture '+r.id);
  const pattern=Object.fromEntries(pieces(before).filter(p=>p.position.includes('U')&&(p.kind==='corner'||p.kind==='edge')).map(p=>[p.position,p.destination]));
  rows.push({id:`${r.id}@${front}:${setup||'none'}`,case:r.id,front,setup,alg:fixed,turns:fixed.split(' ').length,pattern});
 }
}
for(const alg of ['', 'U', "U'",'U2']){
 const before=await apply(base,inverse(alg));
 const pattern=Object.fromEntries(pieces(before).filter(p=>p.position.includes('U')&&(p.kind==='corner'||p.kind==='edge')).map(p=>[p.position,p.destination]));
 rows.push({id:'AUF:'+ (alg||'none'),case:'AUF',front:'F',setup:alg,alg,turns:alg?1:0,pattern});
}
const unique=new Set(rows.map(r=>JSON.stringify(r.pattern)));
if(unique.size!==288)throw Error('Expected all 288 legal oriented top permutations');
// Static illustration deduplication only. No shortest-routine ranking.
const illustrations=rows.filter((r,i)=>rows.findIndex(s=>JSON.stringify(s.pattern)===JSON.stringify(r.pattern))===i);
writeFileSync('experiments/full-pll-v1/catalog.json',JSON.stringify({source,rows,illustrations},null,2));
console.log({routines:rows.length,patterns:unique.size,baseTurns:references.map(r=>({case:r.id,turns:outerTurns(r.notation).split(' ').length}))});
