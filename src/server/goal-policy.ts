import { colors, facts, goals, pieces } from '../lib/cube';
import type { CubeData, JevRequest } from '../lib/types';

// This reference is identical for every position. The model applies it; code does
// not choose, filter, rank, or simulate candidate goals.
export const STRATEGY_VERSION = 'goal-reference-v2';
export const strategyReference = {
  objective:
    'Solve every piece with its stickers matching the fixed centers. Yellow D first, white U last.',
  progression:
    'A beginner route is daisy → yellow cross → yellow corners → middle edges → white cross → white corner orientation → corner placement → edge placement. Skip goals already achieved. Inspect prerequisites as well as the desired pattern: a white cross alone does not mean the lower layers are solved.',
  daisy:
    'A daisy is a temporary scaffold: four yellow-up edges around the white U center. Build it when starting the yellow edges. Once complete, transfer its petals to the yellow D cross. During transfer the daisy shrinks intentionally: continue cross rather than rebuilding petals. If a yellow cross already exists, do not dismantle it to make a daisy.',
  preservation:
    'Protect completed lower layers. A setup or partial operation can temporarily disturb a pattern; use previousGoal and recentActions to maintain a coherent plan. Change goal when its purpose is achieved or you decide the strategy needs repair. The previous goal is your earlier decision, not a command from code.',
  definitions:
    'completed.topOriented describes white CORNERS only. completed.cornersPlaced checks corner locations, not sticker orientation. These facts are not recommended next actions. Choose orientation before permutation when needed. Finish by aligning the top with its side centers.',
};

export function goalObservation(state: CubeData, previousGoal: string | null, history: string[]) {
  const all = pieces(state);
  return {
    frame: {
      centers: colors,
      note: 'Fixed logical directions; camera position does not affect them. Face stickers are indexed by cube positions.',
    },
    faces: Object.fromEntries(
      Object.entries(colors).map(([face, center]) => [
        face,
        {
          center,
          stickers: Object.fromEntries(
            all
              .filter((p) => p.position.includes(face))
              .map((p) => [
                p.position,
                Object.entries(p.stickers).find(([, direction]) => direction === face)![0],
              ]),
          ),
        },
      ]),
    ),
    completed: facts(state),
    layerMeasurements: {
      yellowCrossEdgesCorrect: all.filter(
        (p) => p.kind === 'edge' && p.destination.includes('D') && p.solved,
      ).length,
      yellowCornersCorrect: all.filter(
        (p) => p.kind === 'corner' && p.destination.includes('D') && p.solved,
      ).length,
      middleEdgesCorrect: all.filter(
        (p) => p.kind === 'edge' && !/[UD]/.test(p.destination) && p.solved,
      ).length,
      whiteEdgesFacingUp: all.filter((p) => p.kind === 'edge' && p.stickers.white === 'U').length,
      whiteCornersFacingUp: all.filter((p) => p.kind === 'corner' && p.stickers.white === 'U')
        .length,
      topCornersAtHome: all.filter(
        (p) => p.kind === 'corner' && p.destination.includes('U') && p.position === p.destination,
      ).length,
      note: 'Each count is out of four. firstLayer=true means ALL yellow edges AND yellow corners are already solved. middle=true means both lower layers are solved.',
    },
    yellowEdges: all
      .filter((p) => p.kind === 'edge' && 'yellow' in p.stickers)
      .map((p) => ({
        position: p.position,
        yellowDirection: p.stickers.yellow,
        destination: p.destination,
        solved: p.solved,
      })),
    previousGoal,
    recentActions: history.slice(-6),
  };
}

export function goalRequest(
  model: string,
  state: CubeData,
  previousGoal: string | null,
  history: string[],
): JevRequest {
  return {
    model,
    state: goalObservation(state, previousGoal, history),
    questions: {
      goal: {
        type: 'choice',
        instructions: {
          task: 'Choose the next goal yourself from the observed cube. Use the strategy reference and recent work to decide whether to continue or change goal. All goals are offered; none has been selected or recommended by the program. Do not choose a completed goal merely because its pattern looks familiar.',
          referenceVersion: STRATEGY_VERSION,
          strategyReference,
        },
        criteria: {
          daisy:
            goals.daisy +
            ' Use as the starting scaffold when the yellow cross is incomplete; not after a completed daisy is being transferred down.',
          cross:
            goals.cross +
            ' Use to transfer a complete daisy, continue its partial transfer, or pursue direct yellow-edge insertion. Skip when completed.cross=true.',
          'first-layer':
            goals['first-layer'] +
            ' Yellow cross must exist and yellow corners must still need work. Skip when completed.firstLayer=true.',
          'middle-layer':
            goals['middle-layer'] +
            ' Choose when yellow bottom edges AND corners are solved but middle edges are not: firstLayer=true, middle=false.',
          'top-cross':
            goals['top-cross'] +
            ' Both lower layers must be solved; white top edges still need orientation.',
          'top-orientation':
            goals['top-orientation'] +
            ' Both lower layers and white top edges must be solved/oriented; white corners still need orientation.',
          'top-corners':
            goals['top-corners'] +
            ' Both lower layers and the white face must be complete; top corners still need placement or alignment.',
          'top-edges':
            goals['top-edges'] +
            ' Lower layers and white orientation must be complete; finish edge permutation after corner placement, or final U alignment.',
        },
      },
    },
  };
}
