import catalog from './references/orientation.json';
import { pieces } from '../lib/cube';
import type { CubeData, JevRequest } from '../lib/types';
export type Stage = 'orientation' | 'edges';
export type Variant = 'structured' | 'sentences';
export const routines = catalog.rows;
export function observation(state: CubeData, stage: Stage) {
  return Object.fromEntries(
    pieces(state)
      .filter(
        (p) => p.position.includes('U') && p.kind === (stage === 'orientation' ? 'corner' : 'edge'),
      )
      .map((p) => [p.position, stage === 'orientation' ? p.stickers.white : p.destination]),
  );
}
export function request(state: CubeData, stage: Stage, variant: Variant): JevRequest {
  const pattern = observation(state, stage),
    describe = (p: Record<string, string | undefined>) =>
      Object.entries(p)
        .map(([slot, value]) =>
          stage === 'orientation'
            ? `At ${slot}, white faces ${value}.`
            : `The edge at ${slot} belongs at ${value}.`,
        )
        .join(' ');
  return {
    model: 'jev-1.13.0',
    state: variant === 'structured' ? { pattern } : { observation: describe(pattern) },
    questions: {
      routine: {
        type: 'choice',
        instructions:
          stage === 'orientation'
            ? 'Choose the learned orientation routine whose reference matches all four white sticker directions. Coordinates are the fixed cube frame. Each option already names its reference front and fixed turns. Lower layers and white-up edges finish unchanged. Do not use other corner colors or destinations.'
            : 'Choose the learned edge permutation whose reference matches all four current-position/destination pairs. Coordinates are the fixed cube frame. Match current positions, not just which pieces participate. All corners and lower layers finish unchanged.',
        criteria: {
          ...Object.fromEntries(
            routines
              .filter((r) => r.stage === stage)
              .map((r) => [
                r.id,
                `${describe(r.pattern)} Execute ${r.alg} (${r.turns} face turns), reference front ${r.front}.`,
              ]),
          ),
          done:
            stage === 'orientation'
              ? 'Every white sticker already faces U.'
              : 'Every edge is already at its own destination.',
          reconsider: 'None of the reference patterns matches all four observations.',
        },
      },
    },
  };
}
