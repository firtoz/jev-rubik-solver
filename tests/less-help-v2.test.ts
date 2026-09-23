import {test,expect} from 'bun:test';
import fixtures from '../experiments/less-help-v2/fixtures.json';
import {request,actions,variants} from '../scripts/less-help-v2/policy';
import {apply,solved,hash,facts,pieces} from '../src/lib/cube';
test('less-help fixtures are unique legal states with verified acceptable actions',async()=>{
 expect(new Set(fixtures.map(c=>hash(c.state))).size).toBe(40);expect(new Set(fixtures.map(c=>JSON.stringify(request(c.state,c.target,'explicit').state))).size).toBe(40);
 for(const split of ['development','validation'])for(const family of ['done','flipped','trapped','align','insert'])expect(fixtures.filter(c=>c.split===split&&c.family===family)).toHaveLength(({done:2,flipped:2,trapped:4,align:8,insert:4} as Record<string,number>)[family]);
 for(const c of fixtures){
  expect(hash(await apply(await solved(),c.scramble))).toBe(hash(c.state));expect(facts(c.state).firstLayer).toBe(true);
  for(const id of c.accepted){const after=await apply(c.state,actions[id]);expect(facts(after).firstLayer).toBe(true);const p=pieces(after).find(p=>p.piece===c.target)!;if(c.expected==='insert'||c.expected==='done')expect(p.solved).toBe(true);if(c.expected==='extract')expect(p.position.includes('U')).toBe(true);}
 }
});
test('same observations and action menus, no labels or scramble, uncorrected handoff',()=>{
 for(const c of fixtures){const requests=variants.map(v=>request(c.state,c.target,v,'done'));
  for(const r of requests){expect(r.state).toEqual(requests[0].state);expect(r.questions.action.criteria).toEqual(requests[0].questions.action.criteria);expect((r.state as any).previousIntention).toBe('done');expect(r.state).not.toHaveProperty('scramble');expect(r.state).not.toHaveProperty('expected');expect(r.state).not.toHaveProperty('accepted');expect(r.state).not.toHaveProperty('solved');}
 }
});
