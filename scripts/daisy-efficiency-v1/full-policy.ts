import {decide as original} from '../extraction-efficiency-v1/full-policy';
import type {Ask} from '../brain-teaching-full-v1/policy';
import {request as costs} from './policy-v2';
import type {Run} from '../../src/lib/types';
import type {PendingPlan} from '../plan-memory/policy';
export async function decide(run:Run,ask:Ask,experience:unknown[]=[],excludedTarget:string|null=null,pendingPlan:PendingPlan|null=null){
 return original(run,r=>{
  const s=r.state as any;
  // Request-family routing only, not a cube-state action decision.
  return ask(r.questions.routine&&s?.target&&Array.isArray(s.protectedBottomSlots)?costs(r):r);
 },experience,excludedTarget,pendingPlan);
}
