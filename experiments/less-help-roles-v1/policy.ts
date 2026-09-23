import {observation,actions,actionReference} from '../less-help-compose/policy';
import type {CubeData,JevRequest} from '../../src/lib/types';
export {actions};
export type Ask=(request:JevRequest)=>Promise<Record<string,string>>;
const goal='Make the selected edge match both adjacent side centers, preserving the bottom layer. Its present position is not necessarily its home. Choose only the next action; preparation is allowed.';
const criteria={done:'Keep this correctly placed and oriented edge unchanged.',align:'Reposition an upper edge around the top before insertion.',insert:'Place the upper edge into its home using an insertion routine.',extract:'Eject the middle-slot occupant to work on it in the upper layer.'};
const teaching='An insertion moves an upper edge beside the local front into a neighboring middle slot. Its side-facing sticker stays on the front face; its up-facing sticker goes to the neighboring side face. The previous middle-slot occupant is ejected to the upper layer. Other middle slots and the bottom layer finish unchanged. Upper turns move only the upper layer. An upper edge is aligned for insertion when its SIDE sticker matches its adjacent SIDE center; the UP sticker is not compared to the up center for this purpose. A middle edge belongs where BOTH stickers match their adjacent centers.';
const choice=(state:unknown,id:string,instructions:any,criteria:Record<string,string>):JevRequest=>({model:'jev-1.13.0',state,questions:{[id]:{type:'choice',instructions,criteria}}});
export async function decide(state:CubeData,target:string,variant:'roles'|'effects',ask:Ask){
 const obs=observation(state,target);
 const relations=await ask({model:'jev-1.13.0',state:{},questions:Object.fromEntries(obs.target.stickers.map(s=>['match_'+s.face,{type:'choice',instructions:{stickerColor:s.color,adjacentCenterColor:s.centerColor,question:'Are stickerColor and adjacentCenterColor the same color?'},criteria:{same:'The colors match.',different:'The colors differ.'}}]))});
 const targetView={position:obs.target.position,currentLayer:obs.target.currentLayer,sideFacingStickers:obs.target.stickers.filter(s=>s.face!=='U').map(s=>({...s,modelReportedMatch:relations['match_'+s.face]})),upwardSticker:obs.target.stickers.find(s=>s.face==='U')?.color??null};
 const effectCriteria={done:'No movement. Keep the current position and sticker directions.',align:'Upper rotation. Move the edge around the upper layer; its side-facing sticker stays side-facing, and its upward sticker stays upward.',insert:'Insertion routine. Move the upper edge into an adjacent middle slot; its side sticker remains on that same side face and its upward sticker turns onto the adjacent side face.',extract:'Ejection routine. Bring the occupant of a middle slot into the upper layer; it can then be repositioned and inserted.'};
 const intention=(await ask(choice({centers:obs.centers,target:targetView,goal},'intention',variant==='roles'?teaching:'Choose the next operation family whose physical effect helps the target match BOTH side centers. Avoid unnecessary movement of an edge that already matches both centers. No need to finish in one step.',variant==='roles'?criteria:effectCriteria))).intention;

 // Route only on JEV's own intention, never the mechanical state.
 if(intention==='done')return {intention,action:'leave'};
 if(intention==='align'){
  const sides=Object.fromEntries(Object.entries(obs.centers).filter(([f])=>!['U','D'].includes(f)));
  const destination=(await ask(choice({centers:sides,sideFacingSticker:targetView.sideFacingStickers[0]},'destination','Find the center whose color equals sideFacingSticker.color. Return that center face, not the current sticker face.',{F:'Front center',R:'Right center',B:'Back center',L:'Left center'}))).destination;
  const side=obs.target.stickers.find(s=>s.face!=='U')!;
  const names:Record<string,string>={F:'front',R:'right',B:'back',L:'left',U:'up',D:'down'};
  const turn=(await ask(choice({currentSide:names[side.face],requiredSide:names[destination]},'turn','Move the selected upper edge from currentSide to requiredSide. Choose a turn from the general cycle reference.',{U:actionReference.U,"U'":actionReference["U'"],U2:actionReference.U2,leave:'No rotation; same side.'}))).turn;
  return {intention,destination,action:turn};
 }
 if(intention==='insert'){
  const front=(await ask(choice({target:targetView,centers:obs.centers},'front','Choose a local front for the insertion. The routine begins with the selected upper edge beside its local front, and preserves the side sticker on that face.',{F:'Front face becomes local front',R:'Right face becomes local front',B:'Back face becomes local front',L:'Left face becomes local front'}))).front;
  const options=Object.fromEntries(Object.entries(actionReference).filter(([id])=>id.endsWith('@'+front)));
  const action=(await ask(choice({target:targetView,centers:obs.centers,chosenFront:front,goal},'action','Choose the insertion whose general effect places both target stickers against matching centers.',options))).action;
  return {intention,front,action};
 }
 const action=(await ask(choice({target:targetView,centers:obs.centers,goal},'action','Choose a routine that ejects this target from its CURRENT middle slot into the upper layer, preserving the bottom layer. Use the general ejection effects.',Object.fromEntries(Object.entries(actionReference).filter(([id])=>id.includes('@')))))).action;
 return {intention,action};
}
