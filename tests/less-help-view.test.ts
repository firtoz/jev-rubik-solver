import {test,expect} from 'bun:test';
import {solved,apply,pieces} from '../src/lib/cube';
import {view,decide} from '../scripts/less-help-view/policy';
test('reference views preserve sticker colors and adjacent center relationships',async()=>{
 const state=await apply(await solved(),"R U R' U'");
 for(const p of pieces(state).filter(p=>p.kind==='edge'))for(const front of ['F','R','B','L']){
  const v=view(state,p.piece,front);expect(v.position.length).toBe(2);expect(v.stickers.map(s=>s.color).sort()).toEqual(Object.keys(p.stickers).sort());
  for(const s of v.stickers)expect(s.adjacentCenter).toBe(v.centers[s.facing]);
 }
});
test('wrong frame and operation choices are executed without repair',async()=>{
 const choices=['FR','B','right'];const r=await decide(await solved(),'relations',async req=>({[Object.keys(req.questions)[0]]:choices.shift()!}));expect(r.action).toBe('middle-right@B');
});
