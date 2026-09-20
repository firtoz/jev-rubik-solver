import { apply, solved, pieces, hash, mapAlg } from '../../src/lib/cube';
import { skillDecision } from '../../src/server/skill-policy';
import type { JevRequest, Run } from '../../src/lib/types';

// Offline request-level scoring only; never imported by the solving policy.
// Development mixes 15 one-turn states, the observed sideways-edge failure,
// and four fixed-seed 5/10-turn scrambles. Validation uses a different seed.
function randomScrambles(seed: number, lengths: number[]) {
  let x = seed;
  const next = () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
  return lengths.map((length) => {
    const moves: string[] = [];
    while (moves.length < length) {
      const face = 'UDFBRL'[Math.floor(next() * 6)];
      if (moves.at(-1)?.[0] === face) continue;
      moves.push(face + ['', "'", '2'][Math.floor(next() * 3)]);
    }
    return moves.join(' ');
  });
}
const development = [
  ...['F', 'R', 'B', 'L', 'D'].flatMap((f) => [f, f + "'", f + '2']),
  "R U F' U'",
  ...randomScrambles(482153, [5, 5, 10, 10]),
];
const validation = randomScrambles(
  917357,
  Array.from({ length: 20 }, (_, i) => (i < 10 ? 5 : 10)),
);
export type Fixture = {
  id: string;
  split: 'development' | 'validation';
  run: Run;
  request: JevRequest;
  accepted: Record<string, string[]>;
  evidence: unknown;
};
export async function fixtures(): Promise<Fixture[]> {
  const result: Fixture[] = [];
  for (const split of ['development', 'validation'] as const) {
    for (const [index, scramble] of (split === 'development'
      ? development
      : validation
    ).entries()) {
      const state = await apply(await solved(), scramble);
      const edges = pieces(state).filter((p) => p.kind === 'edge' && p.destination.includes('D'));
      const accepted: Record<string, string[]> = {};
      for (const p of edges) {
        const label = p.solved
          ? 'done'
          : p.position.includes('U') && p.stickers.yellow === 'U'
            ? p.position === 'U' + p.destination.slice(1)
              ? 'insert'
              : 'align'
            : 'extract';
        accepted['intent_' + p.piece] = [label];
        // Independently verify alignment/insertion labels through authoritative
        // transformations offline. No move simulation enters the live request.
        if (label === 'insert' || label === 'align') {
          const setups = label === 'insert' ? [''] : ['U', "U'", 'U2'];
          let verified = false;
          for (const setup of setups) {
            const after = await apply(state, [setup, p.destination[1] + '2'].join(' ').trim());
            if (pieces(after).find((q) => q.piece === p.piece)!.solved) verified = true;
          }
          if (!verified) throw new Error('Invalid alignment/insertion label');
        }
      }
      accepted.target = edges.filter((p) => !p.solved).map((p) => p.piece);
      if (!accepted.target.length)
        throw new Error('Cross already complete; this request is inapplicable');
      const run: Run = {
        id: '',
        createdAt: '',
        policy: 'skills',
        scramble,
        state,
        status: 'stopped',
        revision: 0,
        stage: 'cross',
        target: null,
        history: [],
        requests: 0,
        turns: 0,
        activeMs: 0,
        tokens: 0,
        cost: 0,
        reason: 'Isolated request evaluation; no moves executed',
        version: 'request-eval-v1',
        split: 'probe',
        benchmarkId: null,
      };
      let request!: JevRequest;
      const captured = new Error('captured');
      try {
        await skillDecision(
          run,
          'jev-1.13.0',
          async (req) => {
            request = req;
            throw captured;
          },
          [],
        );
      } catch (error) {
        if (error !== captured) throw error;
      }
      if (!request) throw new Error('No assessment request captured');
      result.push({
        id: split + '/case-' + String(index + 1).padStart(2, '0'),
        split,
        run,
        request,
        accepted,
        evidence: edges,
      });
    }
  }
  if (new Set(result.map((f) => hash(f.run.state))).size !== result.length)
    throw new Error('Overlapping cases');
  return result;
}
