import type {JevRequest} from '../../src/lib/types';
import type {PendingPlan} from './policy';
import reference from '../brain-early-v3/routine-reference.json';
export function planCommitRequest(current:{target:string;front:string;position:string;yellowDirection:string;protectedBottomSlots:string[]},pending:PendingPlan):JevRequest{
 const routine=reference.find(r=>r.id===pending.routine);if(!routine)throw new Error('Unknown remembered routine');
 return {model:'jev-1.13.0',state:{current,pending:{target:pending.target,front:pending.front,routine:pending.routine,startingPosition:routine.position,yellowDirection:routine.yellowDirection,affectedBottomSlots:routine.affectedBottomSlots}},questions:{plan:{type:'choice',instructions:'Decide whether to resume the remembered routine. Compare current against pending. Resume requires ALL: same target; same front; current.position equals pending.startingPosition; same yellowDirection; no pending.affectedBottomSlots occurs in current.protectedBottomSlots. Ignore routine names when checking these requirements. Resume explicitly selects that previous routine; a later question checks landing occupancy. Otherwise reconsider and choose a new routine.',criteria:{resume:'Every starting and preservation requirement matches; choose the remembered routine again.',reconsider:'At least one requirement fails; discard the remembered routine.'}}}};
}
