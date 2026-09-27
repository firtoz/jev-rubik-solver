import { pieces, names } from '../../lib/cube';
import type { CubeData, JevRequest } from '../../lib/types';
import type { PreconditionObservation } from './preconditions';
export function observe(state: CubeData, front: string, landing: PreconditionObservation) {
  const ring = ['F', 'R', 'B', 'L'];
  if (!ring.includes(front)) throw Error('Invalid reference');
  const local = (f: string) =>
    ring.includes(f) ? ring[(ring.indexOf(f) - ring.indexOf(front) + 4) % 4] : f;
  const protectedBottomSlots = pieces(state)
    .filter((p) => p.kind === 'edge' && p.piece.includes('D') && p.solved)
    .map((p) =>
      names.EDGES.find(
        (s) => [...s].sort().join('') === [...p.position].map(local).sort().join(''),
      )!,
    );
  return { ...landing, protectedBottomSlots };
}
export type Observation = ReturnType<typeof observe>;
export function destinationRequest(state: Observation): JevRequest {
  return {
    model: 'jev-1.13.0',
    state: { target: state.target, protectedBottomSlots: state.protectedBottomSlots },
    questions: {
      destination: {
        type: 'choice',
        instructions:
          'Choose a different upper position above an unprotected bottom edge. The next cycle will observe the target there and select a fresh reference and routine. U rotations preserve all bottom edges. Pairings are UF above DF, UR above DR, UB above DB, UL above DL. Choose none only if no different safe position exists.',
        criteria: {
          UF: 'Top front',
          UR: 'Top right',
          UB: 'Top back',
          UL: 'Top left',
          none: 'No other unprotected bottom position',
        },
      },
    },
  };
}
export function turnRequest(currentPosition: string, destination: string): JevRequest {
  return {
    model: 'jev-1.13.0',
    state: { currentPosition, destination },
    questions: {
      setup: {
        type: 'choice',
        instructions:
          'Choose the U turn carrying the target from currentPosition to destination. Use the fixed position cycles.',
        criteria: {
          U: 'UF to UL, UL to UB, UB to UR, UR to UF',
          "U'": 'UF to UR, UR to UB, UB to UL, UL to UF',
          U2: 'UF to UB, UB to UF, UR to UL, UL to UR',
        },
      },
    },
  };
}
