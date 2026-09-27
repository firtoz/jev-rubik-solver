import { choose } from './recognition';
import { prepare } from './preparation';
import { request as alignmentRequest } from './alignment';
import { decide as extraction } from './extraction';
import { routines as extractions } from './extraction-reference';
import { pieces, colors, mapAlg } from '../../lib/cube';
import { routines } from './reference';
import type { CubeData, JevRequest, JevResponse } from '../../lib/types';
export type Ask = (r: JevRequest) => Promise<JevResponse>;
const sides = ['F', 'R', 'B', 'L'];
const corners: Record<string, string> = { FR: 'DRF', BR: 'DBR', BL: 'DLB', FL: 'DFL' };
const cornerSlots = ['UFR', 'URB', 'UBL', 'ULF', 'DRF', 'DBR', 'DLB', 'DFL'];
const edgeSlots = ['UF', 'UR', 'UB', 'UL', 'DF', 'DR', 'DB', 'DL', 'FR', 'BR', 'BL', 'FL'];
export function view(state: CubeData, target: string, front: string) {
  const all = pieces(state),
    c = all.find((p) => p.piece === corners[target])!,
    e = all.find((p) => p.piece === target)!;
  const local = (f: string) => {
    const i = sides.indexOf(f);
    return i < 0 ? f : sides[(i - sides.indexOf(front) + 4) % 4];
  };
  const position = (p: string, slots: string[]) =>
    slots.find((s) => [...s].sort().join('') === [...p].map(local).sort().join(''))!;
  const dir = (p: typeof c, color: string) =>
    p.stickers[color] ? local(p.stickers[color]) : 'absent';
  const right = sides[(sides.indexOf(front) + 1) % 4];
  return {
    corner: {
      position: position(c.position, cornerSlots),
      downColorDirection: dir(c, 'yellow'),
      frontColorDirection: dir(c, colors[front]),
      rightColorDirection: dir(c, colors[right]),
    },
    edge: {
      position: position(e.position, edgeSlots),
      frontColorDirection: dir(e, colors[front]),
      rightColorDirection: dir(e, colors[right]),
    },
  };
}
export async function decide(
  state: CubeData,
  ask: Ask,
  previousTarget: string | null = null,
  recentActions: string[] = [],
) {
  const all = pieces(state);
  const pairs = Object.entries(corners).map(([id, corner]) => ({
    id,
    corner: all.find((p) => p.piece === corner),
    edge: all.find((p) => p.piece === id),
  }));
  const targetAnswer = await ask({
    model: 'jev-1.13.0',
    state: { pairs, previousTarget, recentActions: recentActions.slice(-2) },
    questions: {
      target: {
        type: 'choice',
        instructions:
          'Choose an unfinished corner/edge pair to solve together, preserving the cross and completed pairs. Continue previousTarget until both pieces are solved. Otherwise prefer pieces already in the upper layer. Each ID is a home slot, not a current location. Choose done only when every listed corner and edge is solved.',
        criteria: {
          ...Object.fromEntries(
            Object.keys(corners).map((k) => [
              k,
              `Work on pair ${k}, if its corner or edge is not solved.`,
            ]),
          ),
          done: 'All four pairs have both corner.solved=true and edge.solved=true.',
        },
      },
    },
  });
  const target = targetAnswer.answers.target.choice;
  if (target === 'done') return { target, alg: '', action: 'done' };
  const selected = pairs.find((p) => p.id === target)!;
  const ref = await ask({
    model: 'jev-1.13.0',
    state: { homeSlot: target, corner: selected.corner, edge: selected.edge },
    questions: {
      front: {
        type: 'choice',
        instructions:
          'Choose a notation reference that puts this pair HOME at local front-right. This changes notation only, not the cube. Use homeSlot, not its current position.',
        criteria: {
          F: 'Home FR becomes local front-right.',
          R: 'Home BR becomes local front-right.',
          B: 'Home BL becomes local front-right.',
          L: 'Home FL becomes local front-right.',
        },
      },
    },
  });
  const front = ref.answers.front.choice,
    pair = view(state, target, front);
  const prep = await prepare(pair, ask);
  const preparation = prep.answers.preparation.choice;
  if (preparation === 'routine') {
    const a = await choose(pair, ask);
    const action = a.answers.routine.choice;
    return {
      target,
      front,
      preparation,
      action,
      alg: mapAlg(routines.find((r) => r.id === action)?.alg ?? '', front),
    };
  }
  if (preparation === 'align-corner' || preparation === 'align-edge') {
    const source = preparation === 'align-corner' ? pair.corner.position : pair.edge.position,
      destination = preparation === 'align-corner' ? 'UFR' : 'UF';
    const a = await ask(alignmentRequest(source, destination));
    const action = a.answers.turn.choice;
    return { target, front, preparation, action, alg: action === 'reconsider' ? '' : action };
  }
  if (preparation === 'extract-corner' || preparation === 'extract-edge') {
    const action = await extraction(
      pair.corner.position,
      pair.edge.position,
      preparation === 'extract-corner' ? 'corner' : 'edge',
      ask,
    );
    const routine = extractions.find((r) => r.id === action);
    return {
      target,
      front,
      preparation,
      action: 'extract@' + action,
      alg: mapAlg(routine?.alg ?? '', front),
    };
  }

  return { target, front, preparation, action: 'reconsider', alg: '' };
}
