import {test,expect} from 'bun:test';
import {prepare} from '../scripts/f2l-efficiency-v1/preparation-sequential';
import type {JevResponse} from '../src/lib/types';
const pair={corner:{position:'DBR',downColorDirection:'D',frontColorDirection:'B',rightColorDirection:'R'},edge:{position:'BL',frontColorDirection:'B',rightColorDirection:'L'}};
const response=(choice:string):JevResponse=>({model:'jev-1.13.0',answers:{preparation:{type:'choice',choice,probabilities:{[choice]:1},confidence:1}},usage:{input_tokens:0,output_tokens:0}});
test('incorrect continue answers propagate without code repair',async()=>{
 const requests:any[]=[];const answers=['continue','continue','continue','routine'];
 const result=await prepare(pair,async r=>{requests.push(r);return response(answers.shift()!);});
 expect(requests).toHaveLength(4);
 expect(result.answers.preparation.choice).toBe('routine');
 expect(requests[1].state.precedingDecisions).toEqual(['continue']);
});
test('model extraction and abstention stop dependent questions',async()=>{
 for(const choice of ['extract-corner','reconsider']){
  let calls=0;const native=response(choice);
  expect(await prepare(pair,async()=>{calls++;return native;})).toBe(native);
  expect(calls).toBe(1);
 }
});
