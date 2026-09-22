import {test,expect} from 'bun:test';
import {readFileSync} from 'node:fs';
import {request,labels} from '../scripts/goal-readable/policy';
import {apply,solved,hash} from '../src/lib/cube';
import {label} from '../scripts/goal-contract/fixtures';
import type {Run} from '../src/lib/types';
test('readable comparison preserves facts, memory and questions on distinct reconstructed cases',async()=>{
 const cases=JSON.parse(readFileSync('experiments/goal-readable-v1/fixtures.json','utf8'));
 const states=new Set<string>(),inputs=new Set<string>();
 for(const c of cases){
  const state=await apply(await solved(),c.scramble);expect(state).toEqual(c.state);expect(label(state)).toBe(c.expected);states.add(hash(state));
  const run={state,stage:c.memory.previousGoal,history:c.memory.recentActions,scramble:'DO_NOT_SEND'} as Run;
  const fields=request(run,'fields'),sentences=request(run,'sentences');
  expect(sentences.questions).toEqual(fields.questions);expect(sentences.model).toBe(fields.model);
  const f=fields.state as any,text=sentences.state as string;
  inputs.add(JSON.stringify(fields));
  expect(text).toContain(`There are ${f.completed.daisy} yellow-up`);
  for(const key of Object.keys(labels))expect(text).toContain(`(completed.${key}) is ${f.completed[key]?'complete':'not complete'}.`);
  expect(text).toContain(`${f.completed.solvedPieces} edges and corners`);
  expect(text).toContain(`${f.uncollectedYellowEdges} yellow edges are neither`);
  expect(text).toContain(`(previousGoal) is ${JSON.stringify(f.previousGoal)}`);
  expect(text).toContain(`(recentActions), are ${JSON.stringify(f.recentActions)}`);
  expect(JSON.stringify(fields)).not.toContain('DO_NOT_SEND');expect(text).not.toContain('DO_NOT_SEND');
  expect(fields.state).not.toHaveProperty('expected');
 }
 expect(states.size).toBe(64);expect(inputs.size).toBe(63); // Two distinct cube states collapse to the same measured input.
 for(const phase of ['batch-a','batch-b'])for(const goal of Object.keys(request({state:cases[0].state,history:[]} as unknown as Run,'fields').questions.goal.criteria))expect(cases.filter((c:any)=>c.phase===phase&&c.expected===goal).length).toBe(4);
});
