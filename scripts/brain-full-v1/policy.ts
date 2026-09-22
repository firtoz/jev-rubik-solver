import {goalRequest} from '../../src/server/goal-policy';
import {measuredSkillDecision} from '../../src/server/measured-policy';
import {pieces} from '../../src/lib/cube';
import type {Run,JevRequest,JevResponse} from '../../src/lib/types';
import {decide as earlyDecision} from '../brain-early-v3/policy';
export type Ask=(request:JevRequest)=>Promise<JevResponse>;
export function fullGoalRequest(run:Run){
 const request=goalRequest('jev-1.13.0',run.state,run.history.length?run.stage:null,run.history);
 const uncollectedYellowEdges=pieces(run.state).filter(p=>p.kind==='edge'&&'yellow'in p.stickers&&p.stickers.yellow!=='U'&&!p.solved).length;
 request.state={...request.state as object,uncollectedYellowEdges};
 request.questions.goal.instructions={...request.questions.goal.instructions as object,earlyTeaching:'When the yellow cross is incomplete, use daisy if uncollectedYellowEdges is greater than zero. Otherwise use cross to transfer remaining petals. Once the cross is complete, follow the remaining beginner progression. Counts describe present pieces; decide the goal yourself.'};
 return request;
}
export async function decide(run:Run,ask:Ask,experience:unknown[]=[],excludedTarget:string|null=null){
 const goalResponse=await ask(fullGoalRequest(run));
 const goal=goalResponse.answers.goal.choice;
 const current={...run,stage:goal,target:goal===run.stage?run.target:null};
 if(goal==='daisy'||goal==='cross'){
  let first=true;
  const result=await earlyDecision(run.state,async request=>{
   if(first){
    first=false;
    // The goal is the previous JEV answer. Conditional target questions are independent.
    const {goal:unused,...questions}=structuredClone(request.questions);
    if(excludedTarget)for(const question of Object.values(questions))question.instructions={teaching:question.instructions,recovery:'The previous model recovery chose retarget. Choose an eligible target other than excludedTarget.'};
    const answer=await ask({...request,questions,state:{...request.state as object,selectedGoal:goal,excludedTarget}});
    return {goal,...Object.fromEntries(Object.entries(answer.answers).map(([k,a])=>[k,a.choice]))};
   }
   const answer=await ask(request);
   return Object.fromEntries(Object.entries(answer.answers).map(([k,a])=>[k,a.choice]));
  },{target:current.target,recentActions:run.history.slice(-2)});
  return {goal,target:result.target,front:result.front,skill:result.routine,alg:result.alg,intent:result.preparation,early:result};
 }
 const result=await measuredSkillDecision(current,'jev-1.13.0',ask,experience,excludedTarget);
 return {goal,...result};
}
