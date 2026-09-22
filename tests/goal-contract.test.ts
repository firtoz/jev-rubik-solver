import {test,expect} from 'bun:test';
import {fixtures,label} from '../scripts/goal-contract/fixtures';
import {fullGoalRequest,goalDefinitions} from '../scripts/goal-contract/policy';
import {apply,solved} from '../src/lib/cube';
import type {Run} from '../src/lib/types';
test('balanced labels include every goal and validation excludes development',async()=>{
 const dev=await fixtures(),validation=await fixtures(dev.map(c=>c.stateHash),99);
 for(const goal of Object.keys(goalDefinitions))expect(dev.filter(c=>c.expected===goal)).toHaveLength(4);
 expect(validation.some(v=>dev.some(d=>v.stateHash===d.stateHash))).toBe(false);
 for(const c of [...dev,...validation])expect(label(await apply(await solved(),c.scramble))).toBe(c.expected);
});
test('goal teaching has a single cross meaning and no chosen answer',async()=>{
 const request=fullGoalRequest({state:await apply(await solved(),'R'),stage:'cross',history:['U'],scramble:'NEVER SEND'} as Run);
 expect(Object.keys(request.questions.goal.criteria)).toHaveLength(8);
 expect(JSON.stringify(request)).not.toContain('direct yellow-edge insertion');
 expect(JSON.stringify(request)).not.toContain('NEVER SEND');
 expect(request.state).not.toHaveProperty('expected');
 expect(request.state).not.toHaveProperty('recommendedGoal');
});
