import {decide as local,type Ask} from '../less-help-roles/policy';
import {targetRequest,scene,actions} from '../less-help-scene/policy';
import type {CubeData} from '../../src/lib/types';
export {scene,actions};
export const variants=['effects','examples','guidance'] as const;
export type Variant=typeof variants[number];
const effects={
 done:'Leave a correctly placed middle edge unchanged.',
 align:'Rotate an upper edge around U. This changes which side center is beside its side sticker, but does not insert the edge.',
 insert:'Move an upper edge into the middle layer. Its side sticker stays on its current side face, and its upward sticker moves onto a neighboring side face.',
 extract:'Bring a middle edge into the upper layer so it can be prepared and inserted again.'
};
const examples=[
 'Upper layer, side sticker red beside red center: insert. Turning U would undo the prepared alignment.',
 'Upper layer, side sticker red beside blue center: align. The side sticker needs a matching center before insertion.',
 'Middle layer, both side stickers match their centers: done.',
 'Middle layer, either side sticker differs from its center: extract.'
];
const applicability={
 done:'Use when the edge is in the middle layer and both side stickers match their centers.',
 align:'Use when the edge is in the upper layer and its side sticker differs from its adjacent side center.',
 insert:'Use when the edge is in the upper layer and its side sticker matches its adjacent side center. Preparation is already complete.',
 extract:'Use when the edge is in the middle layer and at least one side sticker differs from its adjacent side center.'
};
export async function decide(state:CubeData,variant:Variant,ask:Ask,previousTarget:string|null=null,recentActions:string[]=[]){
 const target=(await ask(targetRequest(state,previousTarget,recentActions))).target;
 const result=await local(state,target,'effects',request=>{
  const r=structuredClone(request);
  if(r.questions.intention){
   const t=(r.state as any).target;
   // Copy factual geometry and JEV relations only. No applicability computed here.
   r.state={currentLayer:t.currentLayer,sideStickers:t.sideFacingStickers.map((s:any)=>({color:s.color,adjacentCenter:s.centerColor,comparison:s.modelReportedMatch}))};
   r.questions.intention.instructions={task:'Choose the next operation for this edge to finish in the middle layer with both stickers matching their side centers. Use its present layer and side stickers. An upward sticker is not compared with the up center. Select an operation that makes progress; preparation already completed need not be repeated.',...(variant==='examples'?{workedExamples:examples}:{})};
   r.questions.intention.criteria=variant==='guidance'?Object.fromEntries(Object.entries(effects).map(([k,v])=>[k,v+' '+applicability[k as keyof typeof applicability]])):effects;
  }
  return ask(r);
 });
 return {target,...result};
}
