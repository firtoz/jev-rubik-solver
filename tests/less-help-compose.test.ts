import {test,expect} from 'bun:test';
import {solved,apply,pieces} from '../src/lib/cube';
import {actions,request} from '../scripts/less-help-compose/policy';
test('generic insertion descriptions agree with mechanics in all four frames',async()=>{
 const start=await solved(),ring=['F','R','B','L'];
 for(const [id,alg] of Object.entries(actions)){if(!id.includes('@'))continue;
 const [routine,front]=id.split('@'),side=ring[(ring.indexOf(front)+(routine==='middle-right'?1:3))%4];
 const before=pieces(start),after=pieces(await apply(start,alg)),source=before.find(p=>p.position==='U'+front)!,moved=after.find(p=>p.piece===source.piece)!;
 expect([...moved.position].sort().join('')).toBe([front,side].sort().join(''));
 const sideColor=Object.entries(source.stickers).find(([,face])=>face===front)![0];expect(moved.stickers[sideColor]).toBe(front);expect(moved.stickers.white).toBe(side);
 const occupant=before.find(p=>[...p.position].sort().join('')===[front,side].sort().join(''))!;expect(after.find(p=>p.piece===occupant.piece)!.position.includes('U')).toBe(true);
 for(const p of before.filter(p=>p.position.includes('D')||p.kind==='edge'&&!p.position.includes('U')&&p.piece!==occupant.piece))expect(after.find(q=>q.piece===p.piece)).toEqual(p);
 }
});
test('relation answers pass unchanged and target observations contain no verdict',async()=>{
 const s=await solved();const r=request(s,'FR','action',{match0:'different',intention:'extract'});
 expect((r.state as any).earlierModelAnswers).toEqual({match0:'different',intention:'extract'});
 expect((r.state as any).target).not.toHaveProperty('solved');
});
