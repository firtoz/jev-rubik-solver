import {test,expect} from 'bun:test';
import {solved,apply} from '../src/lib/cube';
import {decide,fullGoalRequest} from '../scripts/brain-full-v1/policy';
import type {Run,JevResponse} from '../src/lib/types';
const response=(choices:Record<string,string>):JevResponse=>({model:'jev-1.13.0',answers:Object.fromEntries(Object.entries(choices).map(([k,choice])=>[k,{type:'choice' as const,choice,confidence:1,probabilities:{[choice]:1}}])),usage:{input_tokens:0,output_tokens:0}});
test('full brain follows even an incorrect model goal and never sends scramble',async()=>{
 const run={state:await apply(await solved(),'R'),stage:'daisy',history:[],target:null,scramble:'SECRET_SCRAMBLE'} as unknown as Run;
 const requests:any[]=[];
 const result=await decide(run,async request=>{requests.push(request);return requests.length===1?response({goal:'cross'}):response({gatherTarget:'DR',transferTarget:'none'});});
 expect(result.goal).toBe('cross');expect(result.alg).toBe('');expect(requests).toHaveLength(2);
 expect(requests[1].questions.goal).toBeUndefined();expect(JSON.stringify(requests)).not.toContain('SECRET_SCRAMBLE');
 expect(Object.keys(fullGoalRequest(run).questions.goal.criteria)).toHaveLength(8);
});
