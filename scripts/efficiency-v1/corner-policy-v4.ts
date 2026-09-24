import {decide as base,actions} from './corner-policy-v3';
import type {CubeData,JevRequest,JevResponse} from '../../src/lib/types';
export {actions};
export type Variant='explicit'|'isolated';
export async function decide(state:CubeData,variant:Variant,history:string[],ask:(r:JevRequest)=>Promise<JevResponse>){
 return base(state,'words',history,async(original)=>{
  const r=structuredClone(original);
  if(!r.questions.intention)return ask(r);
  r.questions.intention.instructions='pairCount is the number of sides whose two upper-corner stickers have the same color. Use pairCount to choose the operation family. With pairCount=0 or 1 choose permute. With pairCount=4 compare each pair color to its own center: all match means done, otherwise align.';
  r.questions.intention.criteria={permute:'pairCount=0 or pairCount=1.',align:'pairCount=4, and at least one pair color differs from its own center.',done:'pairCount=4, and each pair color equals its own center.'};
  if(variant==='explicit')return ask(r);
  const first=await ask({...r,questions:{intention:r.questions.intention}});
  if(first.answers.intention.choice==='done')return first;
  const key=first.answers.intention.choice==='permute'?'reference':'destination';
  const second=await ask({...r,questions:{[key]:r.questions[key]}});
  return {...first,answers:{...first.answers,...second.answers}};
 });
}
