import {pieces,colors,mapAlg} from '../../src/lib/cube';
import {actions} from '../less-help-v2/policy';
import type {CubeData,JevRequest} from '../../src/lib/types';
export {actions};
const ring=['F','R','B','L'];
const labels:Record<string,string>={U:'up',D:'down',F:'front',R:'right',B:'back',L:'left'};
export function observation(state:CubeData,target:string){
 const p=pieces(state).find(p=>p.piece===target)!;
 return {centers:colors,target:{position:p.position,currentLayer:p.position.includes('U')?'upper':'middle',stickers:Object.entries(p.stickers).map(([color,face])=>({color,face,direction:labels[face],centerColor:colors[face]}))}};
}
// Universal routine effects, instantiated at each reference front independently of state.
export const actionReference=Object.fromEntries(Object.entries(actions).map(([id,sequence])=>{
 if(id==='leave')return [id,'Do nothing; all pieces stay in place.'];
 if(id==='U')return [id,'Move upper edges front to left, left to back, back to right, right to front. Middle/bottom unchanged.'];
 if(id==="U'")return [id,'Move upper edges front to right, right to back, back to left, left to front. Middle/bottom unchanged.'];
 if(id==='U2')return [id,'Move upper edges to the opposite side: front/back swap; left/right swap. Middle/bottom unchanged.'];
 const [routine,front]=id.split('@'),n=ring.indexOf(front),side=ring[(n+(routine==='middle-right'?1:3))%4];
 return [id,`Routine ${sequence}. Takes the upper edge beside ${front} into the middle slot between ${front} and ${side}. Its ${front}-facing sticker ends facing ${front}; its up-facing sticker ends facing ${side}. Ejects the previous middle-slot occupant into the upper layer. Restores the bottom layer and other middle slots.`];
}));
const goal='Make this selected edge match both adjacent centers in the middle layer, preserving the solved bottom layer. Choose the next useful action; preparation is allowed. The target may currently be upper or middle. An already correct edge needs no action.';
const intentCriteria={done:'Leave this edge where it is',align:'Reposition this upper edge around the upper layer',insert:'Move this upper edge into its middle home',extract:'Bring this middle edge into the upper layer'};
export function request(state:CubeData,target:string,kind:'relations'|'intention'|'action',answers?:any):JevRequest{
 const obs=observation(state,target);
 if(kind==='relations')return {model:'jev-1.13.0',state:obs,questions:Object.fromEntries(obs.target.stickers.map((s,i)=>['match'+i,{type:'choice',instructions:`Compare target.stickers[${i}].color with target.stickers[${i}].centerColor. Are these the same color? Read only this pair.`,criteria:{same:'These two colors match',different:'These two colors differ'}}]))};
 return {model:'jev-1.13.0',state:{...obs,goal,...(answers?{earlierModelAnswers:answers}:{})},questions:{[kind]:{type:'choice',instructions:kind==='intention'?'Choose the immediate intention using current sticker relationships and the general routine effects. A sticker facing up is compared to the up center, not a side center. The side-facing sticker determines upper-layer alignment. Routine effects are reference material, not recommendations.':'Choose one action that advances the goal, using the observed sticker colors and the generic effects. Follow the earlier intention if supplied. Think in the fixed frame. A setup may reposition an edge before insertion; no need to finish in this action.',criteria:kind==='intention'?intentCriteria:actionReference,...(kind==='intention'?{instructions:{question:'Choose the immediate intention using current sticker relationships and these general effects. For an upper edge, alignment concerns its SIDE sticker, not its up sticker.',routineEffects:actionReference}}:{})}}};
}
