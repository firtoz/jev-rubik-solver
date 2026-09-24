import type {JevRequest} from '../../src/lib/types';
import type {Observation} from './policy';
export function availabilityRequest(state:Observation):JevRequest{
 return {model:'jev-1.13.0',state:{requiredFreeSlots:state.selectedRoutine.requiredFreeSlots,yellowUpPetals:state.yellowUpPetals},questions:{availability:{type:'choice',instructions:'A true flag means a yellow-up petal occupies that slot. Inspect every slot listed in requiredFreeSlots. Are they all free? Ignore slots not listed.',criteria:{free:'Every required slot has false occupancy.',blocked:'At least one required slot has true occupancy.'}}}};
}
export function preparationRequest(state:Observation,availability:string):JevRequest{
 return {model:'jev-1.13.0',state:{availability,target:state.target,protectedBottomSlots:state.protectedBottomSlots},questions:{decision:{type:'choice',instructions:'Use the previous model availability answer unchanged. Free means execute. For blocked: bottom or middle targets stay in place while U clears landing space. A top-front target would move with U, so first lower it with F unless the bottom-front edge is protected. F disturbs DF; if DF is protected, reorient the top target with U and observe again before choosing a fresh plan.',criteria:{execute:'Availability is free: execute the selected routine.',clear:'Blocked bottom or middle target: clear landing space.',lower:'Blocked top target with DF unprotected: lower using F.',reorient:'Blocked top target with DF protected: choose a new upper position.'}}}};
}
