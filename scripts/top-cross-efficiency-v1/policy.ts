import catalog from '../../experiments/top-cross-efficiency-v1/catalog.json';
import {pieces} from '../../src/lib/cube';
import type {CubeData,JevRequest} from '../../src/lib/types';
export type Stage='edges';
export type Variant='structured'|'sentences';
export const routines=catalog.rows;
export function observation(state:CubeData){return Object.fromEntries(pieces(state).filter(p=>p.kind==='edge'&&p.position.includes('U')).map(p=>[p.position,p.stickers.white]));}
export function request(state:CubeData,_stage:Stage,variant:Variant):JevRequest{
 const pattern=observation(state),describe=(p:Record<string,string|undefined>)=>Object.entries(p).map(([slot,value])=>`At ${slot}, white faces ${value}.`).join(' ');
 return {model:'jev-1.13.0',state:variant==='structured'?{pattern}:{observation:describe(pattern)},questions:{routine:{type:'choice',instructions:'Orient the four white upper edges. Choose the learned reference matching all four sticker directions. Coordinates are the fixed frame. Match the complete illustration; do not predict candidate outcomes. Each routine preserves the lower two layers. A dot routine performs the two taught sequences as one fixed routine.',criteria:{...Object.fromEntries(routines.map(r=>[r.id,`${describe(r.pattern)} Execute ${r.alg} (${r.turns} face turns), reference front ${r.front}.`])),done:'All four white stickers face U.',reconsider:'No reference matches all four observations.'}}}};
}
