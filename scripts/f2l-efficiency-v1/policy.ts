import catalog from '../../experiments/f2l-efficiency-v1/catalog.json';
import {pieces} from '../../src/lib/cube';
import type {CubeData,JevRequest,JevResponse} from '../../src/lib/types';
export type Variant='flat'|'grouped';
export function pairView(state:CubeData){const ps=pieces(state);const c=ps.find(p=>p.piece==='DRF')!,e=ps.find(p=>p.piece==='FR')!;return {
 corner:{position:c.position,downColorDirection:c.stickers.yellow,frontColorDirection:c.stickers.green,rightColorDirection:c.stickers.red},
 edge:{position:e.position,frontColorDirection:e.stickers.green,rightColorDirection:e.stickers.red}
};}
export const routines=catalog.rows.map(r=>{const c=r.pattern.find(p=>p.kind==='corner')!,e=r.pattern.find(p=>p.kind==='edge')!;return {...r,group:`${c.position}-${c.stickers.yellow}`,description:`Corner position ${c.position}; down-color sticker faces ${c.stickers.yellow}, front-color sticker ${c.stickers.green}, right-color sticker ${c.stickers.red}. Edge position ${e.position}; front-color sticker faces ${e.stickers.green}, right-color sticker ${e.stickers.red}. Execute ${r.alg} (${r.turns} turns).`};});
const groups=[...new Set(routines.map(r=>r.group))];
export async function decide(state:CubeData,variant:Variant,ask:(r:JevRequest)=>Promise<JevResponse>){
 const view=pairView(state);let selected=routines;
 if(variant==='grouped'){
  const answer=await ask({model:'jev-1.13.0',state:{corner:view.corner},questions:{group:{type:'choice',instructions:'Recognise the corner part of this learned F2L case. Match CURRENT corner.position and downColorDirection to a reference group. Down-color means the sticker color that belongs on D, even when it currently points elsewhere.',criteria:Object.fromEntries(groups.map(g=>{const [p,d]=g.split('-');return [g,`corner.position=${p} AND corner.downColorDirection=${d}.`];}))}}});
  // A JEV-selected reference group controls the menu. No code case matching.
  selected=routines.filter(r=>r.group===answer.answers.group.choice);
 }
 const a=await ask({model:'jev-1.13.0',state:{...view,frame:'Local front F, right R, down D. Target pair belongs at DRF corner and FR edge.'},questions:{routine:{type:'choice',instructions:'Choose a learned F2L routine whose reference illustration matches BOTH observed pieces: their current positions and sticker directions. Read current position, not the destination slot. These routines solve this corner and edge together, preserving the cross and other three pairs. Do not simulate candidate outcomes. If no reference matches choose reconsider.',criteria:{...Object.fromEntries(selected.map(r=>[r.id,r.description])),reconsider:'No listed illustration matches both pieces.'}}}});
 return a.answers.routine.choice;
}
