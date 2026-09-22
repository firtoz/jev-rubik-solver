import {test,expect} from 'bun:test';
import {readFileSync} from 'node:fs';
import {decide,planRequest,focusRequest} from '../scripts/brain-early-v2/policy';
import {solved,apply,pieces} from '../src/lib/cube';
const fixtures=JSON.parse(readFileSync('experiments/brain-early-v2/development-fixtures.json','utf8'));
test('uncollected is an observation, not a code-selected goal',async()=>{
 const state=await apply(await solved(),'R');
 const req=planRequest(state,{target:null,recentActions:[]});
 const uncollected=pieces(state).filter(p=>p.kind==='edge'&&p.stickers.yellow&&p.stickers.yellow!=='U'&&!p.solved).length;
 expect((req.state as any).uncollectedYellowEdges).toBe(uncollected);
 expect(uncollected).toBeGreaterThan(0);
 let calls=0;const result=await decide(state,async()=>{calls++;return {goal:'first-layer',gatherTarget:'none',transferTarget:'none'}});
 expect(result.plan.goal).toBe('first-layer');expect(calls).toBe(1);expect(result.alg).toBe('');
});
test('situation request contains current coordinates and no piece identity',()=>{
 const c=fixtures[4],p=pieces(c.state).find(p=>p.kind==='edge'&&p.piece==='DF')!;
 expect(focusRequest(c.state,'DF').state).toEqual({currentPosition:p.position,yellowDirection:p.stickers.yellow});
});
test('routine reconsideration happens only after an explicit model recovery choice',async()=>{
 const c=fixtures[8];const replies=[{goal:'daisy',gatherTarget:'DB',transferTarget:'DF'},{situation:'bottomSide',reference:'R'},{routine:'cross-flip-bottom'},{decision:'clear'},{setup:'reconsider'},{recovery:'another'},{routine:'stage-bottom-edge'},{decision:'clear'},{freeSlot:'UR'},{setup:'U'}];
 const requests:any[]=[];
 const result=await decide(c.state,async req=>{requests.push(req);return replies[requests.length-1] as any;});
 expect(result.recovery).toEqual([{recovery:'another'}]);expect(result.plannedRoutine).toBe('stage-bottom-edge');expect(result.alg).toBe('U');
 expect((requests[6].state as any).previouslyRejectedByModel).toEqual(['cross-flip-bottom']);
 expect(JSON.stringify(requests)).not.toMatch(/"expected"|"scramble"|"candidateOutcomes"/);
});
