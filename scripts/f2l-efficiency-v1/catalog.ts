// Compile a static muscle-memory reference OFFLINE. No live cube enters this file.
import {writeFileSync} from 'node:fs';
import {solved,apply,inverse,pieces,facts} from '../../src/lib/cube';
import {library,source} from './library';
const base=await solved();const rows:any[]=[];
const profile=(s:any)=>pieces(s).filter(p=>['DRF','FR'].includes(p.piece)).map(p=>({kind:p.kind,position:p.position,stickers:p.stickers}));
const key=(s:any)=>JSON.stringify(profile(s));
for(const r of library){const start=await apply(base,inverse(r.alg));
 // Canonical illustrations: corner above home, or if corner at home then edge at UF.
 // Prepending the inverse illustration rotation keeps the original routine's effect.
 for(const setup of ['', 'U',"U'",'U2']){
  const s=await apply(start,setup);const pair=profile(s),c=pair.find(p=>p.kind==='corner')!,e=pair.find(p=>p.kind==='edge')!;
  if(c.position.includes('U')?c.position!=='UFR':(e.position.includes('U')&&e.position!=='UF'))continue;
  if(rows.some(x=>x.key===key(s)))break;
  const alg=[inverse(setup),r.alg].filter(Boolean).join(' ');
  const after=await apply(s,alg);if(!facts(after).middle)throw Error('Canonical routine does not solve pair');
  rows.push({id:`pair-${String(rows.length+1).padStart(2,'0')}`,sourceRoutine:r.id,key:key(s),alg,turns:alg.split(' ').length,pattern:pair});break;
 }
}
// Enumerate legal target profiles without a solver: counterpart orientations compensate
// in unprotected upper pieces, permutations have matching parity.
const expected=new Set<string>();
for(const cp of [0,4])for(let co=0;co<3;co++)for(const ep of [0,1,2,3,8])for(let eo=0;eo<2;eo++){
 if(cp===4&&ep!==0&&ep!==8)continue;
 const s=structuredClone(base);[s.CORNERS.pieces[cp],s.CORNERS.pieces[4]]=[s.CORNERS.pieces[4],s.CORNERS.pieces[cp]];
 s.CORNERS.orientation[cp]=co;s.CORNERS.orientation[1]=(3-co)%3;
 [s.EDGES.pieces[ep],s.EDGES.pieces[8]]=[s.EDGES.pieces[8],s.EDGES.pieces[ep]];s.EDGES.orientation[ep]=eo;s.EDGES.orientation[2]=eo;
 if((cp!==4)!==(ep!==8))[s.EDGES.pieces[1],s.EDGES.pieces[3]]=[s.EDGES.pieces[3],s.EDGES.pieces[1]];
 // Set contains only profiles; all sources selected above are physical legal states.
 const pair=pieces(s).filter(p=>['DRF','FR'].includes(p.piece));if(pair.every(p=>p.solved))continue;expected.add(key(s));
}
const missing=[...expected].filter(k=>!rows.some(r=>r.key===k));
writeFileSync('experiments/f2l-efficiency-v1/catalog.json',JSON.stringify({source,rows,coverage:{expected:expected.size,present:rows.length,missing}},null,2));console.log({expected:expected.size,present:rows.length,missing:missing.length,turns:rows.map(r=>r.turns)});
