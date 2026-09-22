import {fullGoalRequest} from '../goal-contract/policy';
import type {Run,JevRequest} from '../../src/lib/types';
export const labels:Record<string,string>={cross:'The yellow bottom cross',firstLayer:'The bottom layer',middle:'The middle layer',topCross:'The white top cross',topOriented:'The white top face orientation',cornersPlaced:'The placement of all corners',solved:'The whole cube'};
export function readableState(state:any):string{
 const c=state.completed;
 return [
  `There are ${c.daisy} yellow-up edge petals around the top center (completed.daisy).`,
  ...Object.entries(labels).map(([key,label])=>`${label} (completed.${key}) is ${c[key]?'complete':'not complete'}.`),
  `${c.solvedPieces} edges and corners are in their home slots with correct orientation (completed.solvedPieces).`,
  `${state.uncollectedYellowEdges} yellow edges are neither yellow-up petals nor solved bottom edges (uncollectedYellowEdges).`,
  `The previous goal (previousGoal) is ${JSON.stringify(state.previousGoal)}.`,
  `The most recent actions, in order (recentActions), are ${JSON.stringify(state.recentActions)}.`,
 ].join('\n');
}
export function request(run:Run,variant:'fields'|'sentences'):JevRequest{
 const original=fullGoalRequest(run);
 return variant==='fields'?original:{...original,state:readableState(original.state)};
}
