import {test,expect} from 'bun:test';
import {apply,solved,pieces,mapAlg,names,colors} from '../src/lib/cube';
import {skills} from '../src/lib/skills';
test('cross lift macros orient the selected sticker up and preserve the other bottom edges in every frame',async()=>{
 const cases=[['cross-lift-right','FR'],['cross-lift-left','FL'],['cross-flip-top-right','UF'],['cross-flip-top-left','UF'],['cross-flip-bottom','DF']];
 for(const front of ['F','R','B','L'])for(const [id,slot] of cases){
  const mapped=[...slot].map(f=>mapAlg(f,front));const piece=names.EDGES.find(n=>[...n].every(f=>mapped.includes(f)))!;
  const ps=pieces(await apply(await solved(),mapAlg(skills.find(s=>s.id===id)!.alg,front)));
  expect(ps.find(p=>p.piece===piece)!.stickers[colors[front]]).toBe('U');
  for(const p of ps.filter(p=>p.kind==='edge'&&p.piece.includes('D')&&(id!=='cross-flip-bottom'||p.piece!==piece)))expect(p.solved).toBe(true);
 }
});
