import type {JevRequest} from '../../src/lib/types';
import type {Observation} from './policy';
export function readinessRequest(state:Observation):JevRequest{
 return {model:'jev-1.13.0',state:{requiredFreeSlots:state.selectedRoutine.requiredFreeSlots,yellowUpPetals:state.yellowUpPetals},questions:{readiness:{type:'choice',instructions:'The routine has already been selected. A true flag means a yellow-up petal occupies that slot. Inspect every slot listed in requiredFreeSlots, ignoring other slots. Choose whether to execute the routine now or prepare landing space first.',criteria:{execute:'Every required slot has false occupancy: execute this routine.',prepare:'At least one required slot has true occupancy: prepare first.'}}}};
}
export function preparationRequest(state:Observation):JevRequest{
 return {model:'jev-1.13.0',state:{target:state.target,protectedBottomSlots:state.protectedBottomSlots},questions:{decision:{type:'choice',instructions:'You chose to prepare landing space. For a bottom or middle target, clear with U while the target stays in place. For a top-front target, first lower it using F if the bottom-front edge is unprotected. F disturbs DF. If DF is protected, reorient the top target with U, then observe and choose a fresh plan.',criteria:{clear:'Bottom or middle target: clear landing space.',lower:'Top target with DF unprotected: lower using F.',reorient:'Top target with DF protected: choose a new upper position.'}}}};
}
