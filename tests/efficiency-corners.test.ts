import {test,expect} from 'bun:test';
import type {CubeData} from '../src/lib/types';
import fixtures from '../experiments/efficiency-v1/corner-fixtures.json';
import {apply,facts} from '../src/lib/cube';
import {actions,observe,request} from '../scripts/efficiency-v1/corner-policy';
const ring=['F','R','B','L'];
test('generic matching-pair teaching completes all 24 corner permutations within labelled ceiling',async()=>{
 for(const f of fixtures){let state:CubeData=f.state;let used=0;
  for(let k=0;k<4&&!facts(state).cornersPlaced;k++){
   const o=observe(state),pairs=ring.filter(x=>o.sides[x].cornerStickers[0].color===o.sides[x].cornerStickers[1].color);
   let alg:string;
   if(pairs.length===4){
    // Evaluator only: test that exactly one alignment reaches the labelled goal.
    const align=[];for(const a of ['U',"U'",'U2'])if(facts(await apply(state,a)).cornersPlaced)align.push(a);
    expect(align.length).toBe(1);alg=align[0];
   }else alg=actions['T@'+(pairs.length?ring[(ring.indexOf(pairs[0])+1)%4]:'F')];
   used+=alg.split(' ').length;state=await apply(state,alg);
   expect(facts(state).middle&&facts(state).topCross&&facts(state).topOriented).toBe(true);
  }
  expect(facts(state).cornersPlaced).toBe(true);expect(used).toBeLessThanOrEqual(f.labels.turnCeiling);
 }
});
test('request has raw sticker samples but no fixture labels, matching flags or suggested actions',()=>{
 for(const f of fixtures)for(const variant of ['structured','player','effects'] as const){const r=request(f.state,variant,[]);expect(Object.keys(r.state as object)).toEqual(['observation','recentActions']);expect(Object.keys(r.questions.action.criteria)).toEqual(Object.keys(actions));}
});
test('recognition mistakes pass to action request unchanged',async()=>{
 const {decide}=await import('../scripts/efficiency-v1/corner-policy-v2');let calls=0;
 await decide(fixtures[0].state,'recognition',[],async(r)=>{
  calls++;
  if(calls===1)return {model:'jev-1.13.0',usage:{input_tokens:0,output_tokens:0},answers:Object.fromEntries(['F','R','B','L'].map(f=>['pair_'+f,{type:'choice' as const,choice:'mixed',probabilities:{mixed:1},confidence:1}]))};
  expect((r.state as any).pairCount).toBe(0);expect(Object.values((r.state as any).pairColors)).toEqual(['mixed','mixed','mixed','mixed']);
  return {model:'jev-1.13.0',usage:{input_tokens:0,output_tokens:0},answers:{action:{type:'choice',choice:'T@F',probabilities:{'T@F':1},confidence:1}}};
 });expect(calls).toBe(2);
});
test('full wrapper preserves a recorded non-corner decision and follows a wrong corner decision',async()=>{
 const {decide}=await import('../scripts/efficiency-v1/full-policy');
 const {fullGoalRequest}=await import('../scripts/brain-teaching-full-v1/policy');
 const record=await Bun.file('experiments/brain-teaching-confirmation-v1-http-resume/random-70.json').json();
 const step=record.steps[0];const run:any={state:step.before,stage:'',target:null,history:[]};let index=0;
 const d=await decide(run,async request=>{const e=step.exchanges[index++];expect(request).toEqual(e.request);return e.response;});
 expect(index).toBe(step.exchanges.length);expect(d.alg).toBe(step.alg);
 let n=0;const bad=await decide({...run,state:fixtures[0].state},async r=>{
  n++;const choices=n===1?{goal:'top-corners'}:{intention:'permute',reference:'F',destination:'F'};
  return {model:'jev-1.13.0',usage:{input_tokens:0,output_tokens:0},answers:Object.fromEntries(Object.entries(choices).map(([k,v])=>[k,{type:'choice' as const,choice:v!,probabilities:{[v!]:1},confidence:1}]))};
 });expect(bad.alg).toBe(actions['T@F']);expect(n).toBe(2);
});
