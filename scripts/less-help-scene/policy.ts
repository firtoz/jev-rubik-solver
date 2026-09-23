import {decide as local,type Ask} from '../less-help-roles/policy';
import {pieces,colors} from '../../src/lib/cube';
import type {CubeData,JevRequest} from '../../src/lib/types';
export {actions} from '../less-help-roles/policy';
export function scene(state:CubeData){return pieces(state).filter(p=>p.kind==='edge'&&!p.piece.includes('D')).map(p=>({id:p.piece,position:p.position,stickers:p.stickers,solved:p.solved})).sort((a,b)=>a.id.localeCompare(b.id));}
export function targetRequest(state:CubeData,previousTarget:string|null=null,recentActions:string[]=[]):JevRequest{
 return {model:'jev-1.13.0',state:{centers:colors,edges:scene(state),previousTarget,recentActions},questions:{target:{type:'choice',instructions:'Choose a middle-layer edge to work on, aiming to finish all four while preserving the solved bottom layer. Choose an unfinished edge while any remain. Prefer continuing the previous target until it is solved, so that preparation leads to insertion. If all four are solved, any target is acceptable for verification. IDs name permanent homes; position gives current location. Current upper edges are included because insertion exchanges an upper and middle edge.',criteria:Object.fromEntries(['FR','FL','BR','BL'].map(id=>[id,`Work on edge ${id}.`]))}}};
}
export async function decide(state:CubeData,ask:Ask,previousTarget:string|null=null,recentActions:string[]=[]){const target=(await ask(targetRequest(state,previousTarget,recentActions))).target;return {target,...await local(state,target,'effects',ask)};}
