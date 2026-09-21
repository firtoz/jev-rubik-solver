import {test,expect} from 'bun:test';
import {decideCrossIntention} from '../src/server/cross-intention';
test('cross phase routing follows the model response rather than sticker predicates',async()=>{
 const seen:string[]=[];
 const answer=await decideCrossIntention('jev-1.13.0',{solved:false,position:'UF',destination:'DF',stickers:{yellow:'R'}},async req=>{
  const key=Object.keys(req.questions)[0];seen.push(key);const choice=key==='phase'?'transfer':'insert';return{model:req.model,usage:{input_tokens:0,output_tokens:0},answers:{[key]:{type:'choice',choice,confidence:1,probabilities:Object.fromEntries(Object.keys(req.questions[key].criteria).map(k=>[k,k===choice?1:0]))}}};
 });
 expect(seen).toEqual(['phase','alignment']);expect(answer.choice).toBe('insert');
});
