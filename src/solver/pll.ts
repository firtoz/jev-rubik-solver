import catalog from './references/pll.json';
import { pieces } from '../lib/cube';
import type { CubeData, JevRequest, JevResponse } from '../lib/types';
export const routines = catalog.illustrations;
const cornerSlots = ['UFR', 'URB', 'UBL', 'ULF'],
  edgeSlots = ['UF', 'UR', 'UB', 'UL'];
const signature = (pattern: Record<string, string>, slots: string[]) =>
  slots.map((p) => `${p}:${pattern[p]}`).join(', ');
export const groups = [...new Set(routines.map((r) => signature(r.pattern, cornerSlots)))];
export function observation(state: CubeData) {
  const ps = pieces(state);
  return {
    corners: Object.fromEntries(
      cornerSlots.map((p) => [
        p,
        ps.find((x) => x.kind === 'corner' && x.position === p)!.destination,
      ]),
    ),
    edges: Object.fromEntries(
      edgeSlots.map((p) => [p, ps.find((x) => x.kind === 'edge' && x.position === p)!.destination]),
    ),
  };
}
export type Variant = 'structured' | 'player';
export function groupRequest(state: CubeData, variant: Variant): JevRequest {
  const o = observation(state);
  return {
    model: 'jev-1.13.0',
    state:
      variant === 'structured'
        ? { corners: o.corners }
        : {
            corners: cornerSlots.map((p) => `At ${p} is the corner whose home is ${o.corners[p]}.`),
          },
    questions: {
      group: {
        type: 'choice',
        instructions:
          'The top stickers are oriented. Recognise the arrangement of the four top corners by matching current position to the piece home. These are observations of where pieces are now, not a suggested move. Choose the matching learned corner pattern. Edge recognition follows separately.',
        criteria: Object.fromEntries(groups.map((g, i) => [`corners-${i + 1}`, g])),
      },
    },
  };
}
export function routineRequest(
  state: CubeData,
  selectedGroup: string,
  variant: Variant,
): JevRequest {
  const o = observation(state),
    index = Number(selectedGroup.replace('corners-', '')) - 1;
  // Static reference subset follows JEV's group, never code recognition of the current cube.
  const selected = routines.filter((r) => signature(r.pattern, cornerSlots) === groups[index]);
  return {
    model: 'jev-1.13.0',
    state: {
      previousCornerGroup: selectedGroup,
      edges:
        variant === 'structured'
          ? o.edges
          : edgeSlots.map((p) => `At ${p} is the edge whose home is ${o.edges[p]}.`),
    },
    questions: {
      routine: {
        type: 'choice',
        instructions:
          'Choose the learned PLL routine whose illustrated edge arrangement matches these four observed edges. The previous corner group selected this reference family. Compare current position to piece home. Each option includes its fixed reference orientation and optional upper setup. No simulation is needed. Choose reconsider if no edge illustration matches.',
        criteria: {
          ...Object.fromEntries(
            selected.map((r) => [
              r.id,
              `${signature(r.pattern, edgeSlots)}. ${r.case} with reference front ${r.front}, initial setup ${r.setup || 'none'}; fixed moves ${r.alg || 'none'}.`,
            ]),
          ),
          reconsider: 'No reference matches these observed edges.',
        },
      },
    },
  };
}
export async function decide(
  state: CubeData,
  variant: Variant,
  ask: (r: JevRequest) => Promise<JevResponse>,
) {
  const group = (await ask(groupRequest(state, variant))).answers.group.choice;
  const routine = (await ask(routineRequest(state, group, variant))).answers.routine.choice;
  return { group, routine, alg: routines.find((r) => r.id === routine)?.alg ?? '' };
}
