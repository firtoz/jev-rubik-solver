import {decide as local,type Ask} from '../less-help-roles/policy';
import {targetRequest,scene,actions} from '../less-help-scene/policy';
import type {CubeData} from '../../src/lib/types';
export {scene,actions};
export const variants=['effects','examples','guidance'] as const;
export type Variant=typeof variants[number];
export const examples=[
 'An upper edge has a blue side sticker beside the blue center and orange upward. Choose insert, not align: the side color is already aligned; white on the up center is irrelevant.',
 'An upper edge has a blue side sticker beside the red center and orange upward. Choose align, not insert: moving around U can put blue beside blue before insertion.',
 'A middle edge has green on F and red on R, whose centers are green and red. Choose done: both stickers already match.',
 'A middle edge has red on F and green on R, whose centers are green and red. Choose extract: being in its home slot does not make the flipped edge solved.',
 'A middle edge between F and R belongs between B and L. Choose extract using the occupied F/R slot, not the destination slot.',
 'With local front B, the right neighbor is L and the left neighbor is R. An aligned blue side sticker and orange up sticker need the right insertion; red upward would need the left insertion.'
];
const guide={done:'currentLayer=middle and EVERY sideFacingSticker has modelReportedMatch=same.',extract:'currentLayer=middle and at least one sideFacingSticker has modelReportedMatch=different.',align:'currentLayer=upper and its sole sideFacingSticker has modelReportedMatch=different.',insert:'currentLayer=upper and its sole sideFacingSticker has modelReportedMatch=same. upwardSticker does not need to match the up center.'};
export async function decide(state:CubeData,variant:Variant,ask:Ask,previousTarget:string|null=null,recentActions:string[]=[]){
 const target=(await ask(targetRequest(state,previousTarget,recentActions))).target;
 const result=await local(state,target,'effects',request=>{
  const r=structuredClone(request);
  if(variant!=='effects'&&(r.questions.intention||r.questions.action)){
   const key=r.questions.intention?'intention':'action';
   if(variant==='examples')r.questions[key].instructions={task:r.questions[key].instructions,workedExamples:examples};
   else if(key==='intention'){
    r.questions.intention.instructions='Classify only the selected target using its currentLayer and sideFacingStickers modelReportedMatch values. Apply the conditions in criteria exactly. The upward sticker is not a side-facing sticker.';
    r.questions.intention.criteria=guide;
   }else r.questions.action.instructions={task:r.questions.action.instructions,applicability:'For insertion, its front-facing sticker must match the front center and its up-facing sticker must match the destination side center. For extraction, use the CURRENT occupied middle slot, not the target home. In the fixed ring F,R,B,L, the next side is local right and the previous side is local left. Match these directions to the generic effects in options.'};
  }
  return ask(r);
 });
 return {target,...result};
}
