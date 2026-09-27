import { request as lastLayerRequest, routines } from './orientation';
import { decide as original, fullGoalRequest, type Ask } from './early-stages';
import { decide as pll } from './pll';
import { decide as f2l } from './f2l/controller';
import type { Run, JevRequest } from '../lib/types';
import type { PendingPlan } from './memory';
export function goalRequest(run: Run): JevRequest {
  return fullGoalRequest(run);
}
export async function decide(
  run: Run,
  ask: Ask,
  experience: unknown[] = [],
  excludedTarget: string | null = null,
  pendingPlan: PendingPlan | null = null,
) {
  const request = goalRequest(run),
    response = await ask(request),
    goal = response.answers.goal.choice;
  if (goal === 'f2l') {
    const d = await f2l(
      run.state,
      async (r) => {
        if (excludedTarget && r.questions.target) {
          r = structuredClone(r);
          r.state = { ...(r.state as object), excludedTarget };
          r.questions.target.instructions = {
            teaching: r.questions.target.instructions,
            recovery:
              'JEV previously chose to change target. Choose an unfinished pair other than excludedTarget.',
          };
        }
        return ask(r);
      },
      run.stage === 'f2l' ? run.target : null,
      run.history.slice(-2),
    );
    return {
      goal,
      target: d.target,
      front: d.front ?? '',
      skill: d.action,
      alg: d.alg,
      intent: d.preparation ?? d.action,
      f2l: d,
    };
  }
  if (goal === 'top-orientation') {
    const stage = goal === 'top-orientation' ? 'orientation' : 'edges';
    const answer = await ask(lastLayerRequest(run.state, stage, 'structured'));
    const action = answer.answers.routine.choice,
      routine = routines.find((r) => r.id === action);
    return {
      goal,
      target: 'whole',
      front: routine?.front ?? 'F',
      skill: action,
      alg: routine?.alg ?? '',
      intent: stage,
    };
  }
  if (goal === 'pll') {
    const d = await pll(run.state, 'structured', ask);
    return {
      goal,
      target: 'whole',
      front: 'F',
      skill: d.routine,
      alg: d.alg,
      intent: 'permutation',
      pll: d,
    };
  }

  let first = true;
  return original(
    run,
    async (r) => {
      if (first) {
        first = false;
        if (JSON.stringify(r) !== JSON.stringify(fullGoalRequest(run)))
          throw Error('Goal request drift');
        return response;
      }
      return ask(r);
    },
    experience,
    excludedTarget,
    pendingPlan,
  );
}
