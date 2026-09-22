import type {JevRequest} from '../../src/lib/types';
export type PendingPlan={target:string;front:string;routine:string;preparation:string;setup:string};
export function withPlanMemory(original:JevRequest,target:string,front:string,pending:PendingPlan|null,variant:'baseline'|'structured'|'narrative'):JevRequest{
 const request=structuredClone(original);
 request.state={...request.state as object,currentTarget:target,currentReference:front};
 if(variant==='baseline')return request;
 request.state={...request.state as object,pendingPlan:variant==='structured'?pending:pending?`Recorded previous decision: target ${pending.target}, reference front ${pending.front}, routine ${pending.routine}. Preparation choice was ${pending.preparation}; executed setup was ${pending.setup}.`:null};
 request.questions.routine.instructions={teaching:request.questions.routine.instructions,continuity:'The pending plan is your earlier choice, not a command from code. After clearing a landing for a routine, prefer to complete that same routine if its starting conditions still match this target and reference, it preserves protected bottom edges, and it has not been rejected in this cycle. Do not switch merely because a lift normally has priority over staging. If the target/reference changed or the previous plan no longer fits, choose another routine. A later precondition question still checks landing occupancy before execution.'};
 return request;
}
