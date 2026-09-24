import {pieces,names} from '../../src/lib/cube';
import type {CubeData,JevRequest} from '../../src/lib/types';
import type {PreconditionObservation} from '../../src/server/action-preconditions';
export function observe(state:CubeData,front:string,landing:PreconditionObservation){
 const ring=['F','R','B','L'];if(!ring.includes(front))throw Error('Invalid reference');
 const local=(f:string)=>ring.includes(f)?ring[(ring.indexOf(f)-ring.indexOf(front)+4)%4]:f;
 const protectedBottomSlots=pieces(state).filter(p=>p.kind==='edge'&&p.piece.includes('D')&&p.solved).map(p=>names.EDGES.find(s=>[...s].sort().join('')===[...p.position].map(local).sort().join(''))!);
 return {...landing,protectedBottomSlots};
}
export type Observation=ReturnType<typeof observe>;
export function request(state:Observation,variant:'rules'|'effects'):JevRequest{
 return {model:'jev-1.13.0',state,questions:{decision:{type:'choice',instructions:variant==='rules'
 ? 'Assess the selected routine, without changing it. Only requiredFreeSlots matter for landing. If all are free, execute. If blocked and target is bottom or middle, clear with a U setup. If blocked and target is top, lowering uses local F and disturbs local DF. Lower only if DF is not protected; otherwise reorient the top target first. Reorientation is a separate U setup followed by fresh observation, not execution of the old plan.'
 : 'Choose the next preparation while preserving yellow-up petals and protected bottom edges. The selected routine requires its listed landing slots to be free. A U setup moves top pieces together and leaves bottom pieces alone. Lowering a top-front edge with F also moves the bottom-front edge. When lowering would disturb a protected edge, reposition the top target before reconsidering the routine. Do not execute a routine with occupied required landing slots.',criteria:{execute:'Run the selected routine with its landing space available.',clear:'Move upper petals to clear space for a bottom or middle target.',lower:'Lower the top-front target with F before making space.',reorient:'Move the top target with a U setup, then observe and choose again.'}}}};
}
export function destinationRequest(state:Observation):JevRequest{
 return {model:'jev-1.13.0',state:{target:state.target,protectedBottomSlots:state.protectedBottomSlots},questions:{destination:{type:'choice',instructions:'Choose a different upper position above an unprotected bottom edge. The next cycle will observe the target there and select a fresh reference and routine. U rotations preserve all bottom edges. Pairings are UF above DF, UR above DR, UB above DB, UL above DL. Choose none only if no different safe position exists.',criteria:{UF:'Top front',UR:'Top right',UB:'Top back',UL:'Top left',none:'No other unprotected bottom position'}}}};
}
export function turnRequest(currentPosition:string,destination:string):JevRequest{
 return {model:'jev-1.13.0',state:{currentPosition,destination},questions:{setup:{type:'choice',instructions:'Choose the U turn carrying the target from currentPosition to destination. Use the fixed position cycles.',criteria:{U:'UF to UL, UL to UB, UB to UR, UR to UF',"U'":'UF to UR, UR to UB, UB to UL, UL to UF',U2:'UF to UB, UB to UF, UR to UL, UL to UR'}}}};
}
