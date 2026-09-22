import {expect,test} from 'bun:test';
import fresh from '../public/recordings/brain-v3-fresh-flow.json';
import {pieceChanges} from '../src/lib/piece-changes';
import {apply,solved} from '../src/lib/cube';

test('Ua-perm follows the three physical edges into their homes',()=>{
 const r=fresh.steps.at(-1)!;
 const changes=pieceChanges(r.before,r.after);
 expect(changes).toHaveLength(3);
 for(const p of changes){expect(p.from.piece).toBe(p.to.piece);expect(p.to.solved).toBe(true);expect(p.from.solved).toBe(false);expect(p.from.position).not.toBe(p.to.position);}
});
test('all recorded changes have stable identity and detect sticker reorientation',()=>{
 for(const r of fresh.steps){
  const changes=pieceChanges(r.before,r.after,r.decision.target);
  for(const {from,to} of changes){expect(from.piece).toBe(to.piece);expect(from.position!==to.position||JSON.stringify(from.stickers)!==JSON.stringify(to.stickers)).toBe(true);}
  if(changes.some(p=>p.from.piece===r.decision.target))expect(changes[0].from.piece).toBe(r.decision.target);
 }
});
test('no-op is empty and a turn from solved records disruptions',async()=>{
 const s=await solved();expect(pieceChanges(s,s)).toEqual([]);
 const changes=pieceChanges(s,await apply(s,'U'));
 expect(changes).toHaveLength(8);
 expect(changes.every(p=>p.status==='Displaced from solved')).toBe(true);
});
