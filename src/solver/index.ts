import { decide } from './policy';
import { facts, hash, inverse } from '../lib/cube';
import type { CubeData, JevRequest, JevResponse, Run } from '../lib/types';
import type { PendingPlan } from './memory';

export const POLICY_VERSION = 'grouped-menu-v1';
export type Action = Awaited<ReturnType<typeof decide>> & { recovery?: string };
export type Round = { before: CubeData; after: CubeData; action: Action; recovery?: string };
export type Context = { pendingPlan: PendingPlan | null; rounds: Round[] };
export type Ask = (request: JevRequest) => Promise<JevResponse>;

// Both the manual workbench and autonomous runner use this exact decision chain.
export async function decideRound(run: Run, ask: Ask, context: Context): Promise<Action> {
  const history = context.rounds;
  const same = history.filter((r) => hash(r.before) === hash(run.state));
  const lastRecovery = history.map((r) => !!r.recovery).lastIndexOf(true);
  let recovery: string | undefined,
    excluded: string | null = null;
  if (same.length >= 2 && history.length - (lastRecovery < 0 ? -10 : lastRecovery) >= 3) {
    const response = await ask({
      model: 'jev-1.13.0',
      state: {
        completed: facts(run.state),
        previousGoal: run.stage,
        previousTarget: run.target,
        recentActions: run.history.slice(-6),
        visitsToThisState: same.length,
        lastActionWasUndo: history.at(-1)?.recovery === 'undo',
      },
      questions: {
        recovery: {
          type: 'choice',
          instructions:
            'This exact state has recurred. Choose how to recover. Continue can select another approach; retarget asks for another piece; undo reverses the last complete action. Avoid undoing an undo repeatedly.',
          criteria: {
            continue: 'Continue choosing from current observations',
            retarget: 'Choose a different target',
            undo: 'Reverse the previous action',
          },
        },
      },
    });
    recovery = response.answers.recovery.choice;
    if (recovery === 'undo')
      return {
        goal: run.stage,
        target: run.target || 'whole',
        front: 'F',
        skill: 'undo',
        alg: inverse(run.history.at(-1)!),
        intent: 'undo',
        recovery,
      } as Action;
    if (recovery === 'retarget') excluded = run.target;
  }
  const decision = await decide(
    run,
    ask,
    same.slice(-3).map((r) => ({
      action: r.action.alg,
      target: r.action.target,
      factsBefore: facts(r.before),
      factsAfter: facts(r.after),
    })),
    excluded,
    context.pendingPlan,
  );
  return { ...decision, ...(recovery ? { recovery } : {}) };
}

export function remember(action: Action): PendingPlan | null {
  const early = 'early' in action ? action.early : undefined;
  return early?.preparation === 'clear'
    ? {
        target: action.target!,
        front: action.front!,
        routine: early.plannedRoutine!,
        preparation: 'clear',
        setup: action.alg,
      }
    : null;
}
