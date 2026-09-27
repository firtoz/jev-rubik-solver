import { facts, pieces } from '../lib/cube';
import type { Run, JevRequest } from '../lib/types';
export const goalDefinitions = {
  daisy:
    'Gather yellow edges as top petals. Choose when cross=false and uncollectedYellowEdges>0. Preserve solved bottom edges and existing petals.',
  cross:
    'Transfer yellow-up petals to their bottom homes. Choose when cross=false and uncollectedYellowEdges=0. This controller only transfers petals; it cannot extract or gather missing petals.',
  'top-cross': 'Orient white top edges. Choose when middle=true and topCross=false.',
  'top-orientation':
    'Orient white top corners. Choose when middle=true, topCross=true and topOriented=false.',
  pll: 'Place the oriented top corners and edges together. Choose when completed.middle=true, completed.topCross=true, completed.topOriented=true and completed.solved=false.',
  f2l: 'Solve the four yellow-corner/middle-edge pairs together. Choose when completed.cross=true and completed.middle=false. Preserve the completed cross and already solved pairs.',
};
export function fullGoalRequest(run: Run): JevRequest {
  const completed = facts(run.state);
  const uncollectedYellowEdges = pieces(run.state).filter(
    (p) => p.kind === 'edge' && 'yellow' in p.stickers && p.stickers.yellow !== 'U' && !p.solved,
  ).length;
  const state = {
    completed,
    uncollectedYellowEdges,
    previousGoal: run.history.length ? run.stage : null,
    recentActions: run.history.slice(-2),
  };
  return {
    model: 'jev-1.13.0',
    state,
    questions: {
      goal: {
        type: 'choice',
        instructions:
          'Choose the goal whose prerequisites match the current measurements. Apply the fixed definitions in the options. uncollectedYellowEdges counts yellow edges that are neither yellow-up petals nor solved bottom edges. PreviousGoal is memory, not an instruction; choose using present conditions. Completion flags describe structures, not recommendations. The program stops separately when all pieces are solved.',
        criteria: goalDefinitions,
      },
    },
  };
}
