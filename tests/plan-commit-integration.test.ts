import {test,expect} from 'bun:test';
import {decide} from '../scripts/brain-full-v3/policy';
import {solved,apply} from '../src/lib/cube';
import type {Run,JevResponse} from '../src/lib/types';
const response=(choices:Record<string,string>):JevResponse=>({model:'jev-1.13.0',answers:Object.fromEntries(Object.entries(choices).map(([k,choice])=>[k,{type:'choice' as const,choice,confidence:1,probabilities:{[choice]:1}}])),usage:{input_tokens:0,output_tokens:0}});
for(const commitment of ['resume','reconsider'])test(`pending plan requires explicit ${commitment} model decision`,async()=>{
 const requests:any[]=[];
 const run={state:await apply(await solved(),'R'),stage:'daisy',target:'DR',history:['U']} as Run;
 const pending={target:'DR',front:'F',routine:'lift-bottom',preparation:'clear',setup:'U'};
 const result=await decide(run,async request=>{
  requests.push(request);const q=request.questions;
  if(q.goal)return response({goal:'daisy'});
  if(q.gatherTarget)return response({gatherTarget:'DR',transferTarget:'none'});
  if(q.situation)return response({situation:'middle',reference:'F'});
  if(q.plan)return response({plan:commitment});
  if(q.routine)return response({routine:'cross-lift-right'});
  if(q.decision)return response({decision:'execute'});
  throw new Error('Unexpected request');
 },[],null,pending);
 expect(requests.filter(r=>r.questions.plan)).toHaveLength(1);
 expect(requests.filter(r=>r.questions.routine)).toHaveLength(commitment==='resume'?0:1);
 expect(result.alg).toBe(commitment==='resume'?'F2':"R U R'");
 // Even a deliberately incorrect resume is followed; code cannot repair tactics.
 expect(result.skill).toBe(commitment==='resume'?'lift-bottom':'cross-lift-right');
});
