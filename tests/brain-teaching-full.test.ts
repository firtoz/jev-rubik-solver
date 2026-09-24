import {test,expect} from 'bun:test';
import {readFileSync} from 'node:fs';
import {decide} from '../scripts/brain-teaching-full-v1/policy';
import {decide as original} from '../scripts/brain-full-v3/policy';
import {solved} from '../src/lib/cube';
import type {Run,JevRequest,JevResponse} from '../src/lib/types';
function response(request:JevRequest,picks:Record<string,string>):JevResponse{return {model:'jev-1.13.0',answers:Object.fromEntries(Object.entries(request.questions).map(([k,q])=>[k,{type:'choice',choice:picks[k],confidence:1,probabilities:Object.fromEntries(Object.keys(q.criteria).map(v=>[v,Number(v===picks[k])]))}])),usage:{input_tokens:0,output_tokens:0}};}
test('JEV middle goal and deliberately wrong tactics are followed on a solved cube',async()=>{
 const run={state:await solved(),stage:'',target:null,history:[]} as unknown as Run;
 const calls:JevRequest[]=[];
 const r=await decide(run,async q=>{calls.push(q);return response(q,Object.fromEntries(Object.keys(q.questions).map(k=>[k,k==='goal'?'middle-layer':k==='target'?'FR':k.startsWith('match_')?'different':k==='intention'?'extract':'middle-left@B'])));});
 expect(r.goal).toBe('middle-layer');expect(r.skill).toBe('middle-left@B');expect(calls.filter(q=>q.questions.goal)).toHaveLength(1);
 expect((calls.find(q=>q.questions.intention)!.state as any).sideStickers.every((s:any)=>s.comparison==='different')).toBe(true);
});
test('non-middle request sequence and outputs match the original recorded policy exactly',async()=>{
 const row=JSON.parse(readFileSync('experiments/brain-full-v3-final/random-1.json','utf8'));
 const run={state:row.before,stage:'',target:null,history:[]} as unknown as Run;
 const step=row.steps.find((s:any)=>s.decision&&!s.recovery);
 for(const policy of [original,decide]){let i=0;const result=await policy({...run,state:step.before},async req=>{const e=step.exchanges[i++];expect(req).toEqual(e.request);return e.response;});expect(result).toEqual(step.decision);expect(i).toBe(step.exchanges.length);}
});
