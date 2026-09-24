import {decide as original,fullGoalRequest,type Ask} from '../brain-teaching-full-v1/policy';
import {decide as corners,actions} from './corner-policy-v4';
import type {Run} from '../../src/lib/types';
import type {PendingPlan} from '../plan-memory/policy';
export async function decide(run:Run,ask:Ask,experience:unknown[]=[],excludedTarget:string|null=null,pendingPlan:PendingPlan|null=null){
 const request=fullGoalRequest(run),response=await ask(request);
 if(response.answers.goal.choice==='top-corners'){
  const action=await corners(run.state,'explicit',run.history.slice(-2),ask);
  return {goal:'top-corners',target:'whole',front:action.split('@')[1]??'F',skill:action,alg:actions[action],intent:action==='done'?'done':action.startsWith('T@')?'permute':'align'};
 }
 let first=true;
 return original(run,async r=>{if(first){first=false;if(JSON.stringify(r)!==JSON.stringify(request))throw Error('Goal request mismatch');return response;}return ask(r);},experience,excludedTarget,pendingPlan);
}
