import {writeFileSync} from 'node:fs';
import {solved,apply,inverse,mapAlg,pieces,facts} from '../../src/lib/cube';
const base=await solved(),rows=[];
const references=[{id:'line',alg:"F R U R' U' F'"},{id:'elbow',alg:"F U R U' R' F'"},{id:'dot',alg:"F R U R' U' F' B U L U' L' B'"}];
for(const r of references)for(const front of (r.id==='dot'?['F']:['F','R','B','L'])){
 const alg=mapAlg(r.alg,front),state=await apply(base,inverse(alg));
 if(!facts(state).middle)throw Error('Lower layers changed');
 const pattern=Object.fromEntries(pieces(state).filter(p=>p.kind==='edge'&&p.position.includes('U')).map(p=>[p.position,p.stickers.white]));
 rows.push({id:r.id+'@'+front,stage:'edges',front,alg,turns:alg.split(' ').length,pattern});
}
writeFileSync('experiments/top-cross-efficiency-v1/catalog.json',JSON.stringify({source:'Existing documented orient-edges and orient-elbow routines; dot combines their fixed F then B reference sequences.',rows},null,2));
console.log(rows);
