import {decide as middleDecision,actions as middleActions} from '../teaching-study-v2/policy';
import {planCommitRequest} from '../plan-memory/check';
import type {PendingPlan} from '../plan-memory/policy';
import {goalRequest} from '../../src/server/goal-policy';
import {measuredSkillDecision} from '../../src/server/measured-policy';
import {pieces} from '../../src/lib/cube';
import type {Run,JevRequest,JevResponse} from '../../src/lib/types';
import {decide as earlyDecision} from '../brain-early-v3/policy';
export type Ask=(request:JevRequest)=>Promise<JevResponse>;
export {fullGoalRequest} from '../goal-contract/policy';
import {fullGoalRequest} from '../goal-contract/policy';
export async function decide(run:Run,ask:Ask,experience:unknown[]=[],excludedTarget:string|null=null,pendingPlan:PendingPlan|null=null){
 const goalResponse=await ask(fullGoalRequest(run));
 const goal=goalResponse.answers.goal.choice;
 const current={...run,stage:goal,target:goal===run.stage?run.target:null};
 if(goal==='daisy'||goal==='cross'){
  let first=true,planChecked=false,selectedTarget='',selectedFront='';
  const result=await earlyDecision(run.state,async request=>{
   if(first){
    first=false;
    // The goal is the previous JEV answer. Conditional target questions are independent.
    const {goal:unused,...questions}=structuredClone(request.questions);
    if(excludedTarget)for(const question of Object.values(questions))question.instructions={teaching:question.instructions,recovery:'The previous model recovery chose retarget. Choose an eligible target other than excludedTarget.'};
    const answer=await ask({...request,questions,state:{...request.state as object,selectedGoal:goal,excludedTarget}});
    selectedTarget=answer.answers[goal==='daisy'?'gatherTarget':'transferTarget'].choice;
    return {goal,...Object.fromEntries(Object.entries(answer.answers).map(([k,a])=>[k,a.choice]))};
   }
   if(request.questions.routine&&pendingPlan&&!planChecked){
    planChecked=true;
    const state=request.state as any;
    const commitment=await ask(planCommitRequest({target:selectedTarget,front:selectedFront,position:state.target.position,yellowDirection:state.target.yellowDirection,protectedBottomSlots:state.protectedBottomSlots},pendingPlan));
    // This maps a new explicit model commitment to its own previous routine choice.
    // It is an internal choice value, never a fabricated provider response.
    if(commitment.answers.plan.choice==='resume')return {routine:pendingPlan.routine};
   }
   const answer=await ask(request);
   if(answer.answers.reference)selectedFront=answer.answers.reference.choice;
   return Object.fromEntries(Object.entries(answer.answers).map(([k,a])=>[k,a.choice]));
  },{target:current.target,recentActions:run.history.slice(-2)});
  return {goal,target:result.target,front:result.front,skill:result.routine,alg:result.alg,intent:result.preparation,early:result};
 }
 if(goal==='middle-layer'){
  const result=await middleDecision(run.state,'examples',async request=>{
   if(request.questions.target&&excludedTarget){
    request=structuredClone(request);
    request.state={...request.state as object,excludedTarget};
    request.questions.target.instructions={teaching:request.questions.target.instructions,recovery:'JEV previously chose retarget. Choose an unfinished target other than excludedTarget.'};
   }
   const response=await ask(request);
   return Object.fromEntries(Object.entries(response.answers).map(([k,a])=>[k,a.choice]));
  },current.target,run.history.slice(-2));
  return {goal,target:result.target,front:result.front??'',skill:result.action,alg:middleActions[result.action],intent:result.intention,middle:result};
 }
 const result=await measuredSkillDecision(current,'jev-1.13.0',ask,experience,excludedTarget);
 return {goal,...result};
}
