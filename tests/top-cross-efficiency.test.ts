import {test,expect} from 'bun:test';
import {solved,apply,facts} from '../src/lib/cube';
import {request,routines,observation} from '../scripts/top-cross-efficiency-v1/policy';
test('fixed reference menu covers all legal edge orientations with lower layers preserved',async()=>{
 const base=await solved();
 for(let mask=0;mask<16;mask++){
  const bits=[0,1,2,3].map(i=>(mask>>i)&1);if(bits.reduce((a,b)=>a+b,0)%2)continue;
  const state=structuredClone(base);state.EDGES.orientation.splice(0,4,...bits);
  state.EDGES.pieces.splice(0,4,1,2,3,0);state.CORNERS.pieces.splice(0,4,1,0,2,3);
  const matching=routines.filter(r=>JSON.stringify(r.pattern)===JSON.stringify(observation(state)));
  if(mask===0){expect(facts(state).topCross).toBe(true);continue;}
  expect(matching.length).toBeGreaterThan(0);
  for(const r of matching){const after=facts(await apply(state,r.alg));expect(after.middle&&after.topCross).toBe(true);expect(r.turns).toBe(mask===15?12:6);}
  expect(Object.keys(request(state,'edges','structured').questions.routine.criteria)).toHaveLength(11);
 }
});
test('full policy executes the model-selected reference even on an incompatible state',async()=>{
 const {decide}=await import('../scripts/top-cross-efficiency-v1/full-policy');
 const state=await solved(),run={state,stage:'',target:null,history:[]} as any;
 const calls:any[]=[];
 const result=await decide(run,async r=>{
  calls.push(r);const key=r.questions.goal?'goal':'routine',choice=key==='goal'?'top-cross':'line@F';
  return {model:'jev-1.13.0',usage:{input_tokens:0,output_tokens:0},answers:{[key]:{type:'choice',choice,confidence:1,probabilities:{[choice]:1}}}};
 });
 expect(calls.length).toBe(2);
 expect(result.alg).toBe("F R U R' U' F'");
 expect(facts(await apply(state,result.alg)).topCross).toBe(false);
});
