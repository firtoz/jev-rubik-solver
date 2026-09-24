import {test,expect} from 'bun:test';
import {solved,apply,facts} from '../src/lib/cube';
import {decide,actions} from '../scripts/diagonal-corners-v1/policy';
test('wrong model-selected diagonal action is not corrected from solved observations',async()=>{
 const base=await solved();let calls=0;
 const choice=await decide(base,'words',[],async r=>{
  calls++;expect(r.questions.intention.criteria.diagonal).toContain('pairCount=0');
  const answers=Object.fromEntries(Object.entries({intention:'diagonal',reference:'R',destination:'F'}).map(([k,v])=>[k,{type:'choice' as const,choice:v,probabilities:{[v]:1},confidence:1}]));
  return {model:'jev-1.13.0',answers,usage:{input_tokens:0,output_tokens:0}};
 });
 expect(calls).toBe(1);expect(choice).toBe('diagonal@R');
 const f=facts(await apply(base,actions[choice]));expect(f.cornersPlaced).toBe(false);expect(f.middle&&f.topOriented&&f.topCross).toBe(true);
});
