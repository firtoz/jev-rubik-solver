import { colors, names, pieces } from '../../lib/cube';
import { skills } from '../../lib/skills';
import type { CubeData, JevRequest } from '../../lib/types';
export const liftRequirements: Record<string, string[]> = {
  'lift-bottom': ['UF'],
  'lift-middle-right': ['UR'],
  'lift-middle-left': ['UL'],
  'stage-bottom-edge': ['UF'],
  'flip-top-edge': ['UR'],
  'flip-top-edge-left': ['UL'],
};
// The routine and reference are supplied by earlier JEV choices. This function never selects them.
export function preconditionObservation(
  state: CubeData,
  targetId: string,
  front: string,
  routine: string,
) {
  const ring = ['F', 'R', 'B', 'L'];
  if (!ring.includes(front)) throw new Error('Invalid reference');
  const local = (f: string) =>
    ring.includes(f) ? ring[(ring.indexOf(f) - ring.indexOf(front) + 4) % 4] : f;
  const p = pieces(state).find((p) => p.kind === 'edge' && p.piece === targetId);
  if (!p) throw new Error('Unknown target');
  const position = names.EDGES.find(
    (s) => [...s].sort().join('') === [...p.position].map(local).sort().join(''),
  )!;
  const stickers = Object.fromEntries(Object.entries(p.stickers).map(([c, f]) => [c, local(f)]));
  const centers = Object.fromEntries(Object.entries(colors).map(([f, c]) => [local(f), c]));
  const side = Object.entries(stickers).find(([c]) => c !== 'yellow');
  if (!side) throw new Error('Expected yellow edge');
  const slots = Object.fromEntries(
    ['UF', 'UR', 'UB', 'UL'].map((slot) => {
      const edge = pieces(state).find(
        (e) =>
          e.kind === 'edge' &&
          [...e.position].map(local).sort().join('') === [...slot].sort().join(''),
      )!;
      return [slot, edge.stickers.yellow === 'U'];
    }),
  );
  return {
    target: {
      position,
      layer: position.includes('U') ? 'top' : position.includes('D') ? 'bottom' : 'middle',
      yellowDirection: stickers.yellow,
      sideColor: side[0],
      sideDirection: side[1],
      adjacentCenter: centers[side[1]],
      sideMatchesCenter: side[0] === centers[side[1]],
    },
    centers,
    yellowUpPetals: slots,
    selectedRoutine: {
      id: routine,
      sequence: skills.find((s) => s.id === routine)?.alg,
      requiredFreeSlots: liftRequirements[routine] ?? [],
    },
    frame: `Local reference front=${front}; U and D stay fixed. Occupied means a yellow-up petal, not just any edge.`,
  };
}
export type PreconditionObservation = ReturnType<typeof preconditionObservation>;
export function preconditionRequest(observation: PreconditionObservation): JevRequest {
  return {
    model: 'jev-1.13.0',
    state: observation,
    questions: {
      decision: {
        type: 'choice',
        instructions:
          'The target is a yellow-up petal. Before transferring it with the selected half-turn, its side sticker must match the adjacent side center. If sideMatchesCenter is true choose insert. Otherwise choose align. Decide the next intention only; do not select a turn.',
        criteria: {
          insert: 'Execute the selected transfer',
          align: 'Align the target before transfer',
        },
      },
    },
  };
}
