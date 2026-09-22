import {test,expect} from 'bun:test';
import {readFileSync} from 'node:fs';
import {withPlanMemory} from '../scripts/plan-memory/policy';
import {apply,mapAlg,hash} from '../src/lib/cube';
import reference from '../scripts/brain-early-v3/routine-reference.json';
const read=(p:string)=>JSON.parse(readFileSync(`experiments/plan-memory-v1/${p}-fixtures.json`,'utf8'));
test('memory variants keep menu and observation unchanged; labels never enter requests',()=>{
 for(const c of [...read('development'),...read('validation')])for(const variant of ['baseline','structured','narrative'] as const){
  const request=withPlanMemory(c.request,c.target,c.front,c.pending,variant);
  expect(request.questions.routine.criteria).toEqual(c.request.questions.routine.criteria);
  expect((request.state as any).target).toEqual(c.request.state.target);
  expect(request.state).not.toHaveProperty('expected');expect(request.state).not.toHaveProperty('accepted');
 }
});
test('held-out physical states exclude development and labelled routines change the cube',async()=>{
 const dev=read('development'),validation=read('validation');
 expect(validation.every((c:any)=>!dev.some((d:any)=>d.stateHash===c.stateHash))).toBe(true);
 for(const c of [...dev,...validation])for(const id of c.accepted){const routine=reference.find(r=>r.id===id)!;expect(hash(await apply(c.state,mapAlg(routine.sequence,c.front)))).not.toBe(c.stateHash);}
});
