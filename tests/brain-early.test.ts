import { test, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { apply, solved, pieces, mapAlg, hash, inverse } from '../src/lib/cube';
import reference from '../scripts/brain-early/routine-reference.json';
import { decide } from '../scripts/brain-early/policy';
test('routine motor metadata matches independent cube execution in every frame', async () => {
  const state = await solved(),
    ring = ['F', 'R', 'B', 'L'];
  for (const r of reference)
    for (const front of ring) {
      const offset = ring.indexOf(front),
        local = (f: string) => (ring.includes(f) ? ring[(ring.indexOf(f) - offset + 4) % 4] : f);
      const alg = mapAlg(r.sequence, front),
        after = pieces(await apply(state, alg));
      const lower = after
        .filter((p) => p.kind === 'edge' && p.piece.includes('D') && !p.solved)
        .map((p) => [...p.piece].map(local).join(''))
        .sort();
      const upper = after
        .filter((p) => p.kind === 'edge' && p.piece.includes('U') && p.stickers.white !== 'U')
        .map((p) => [...p.piece].map(local).join(''))
        .sort();
      expect(lower).toEqual([...r.affectedBottomSlots].sort());
      expect(upper).toEqual([...r.requiredFreeSlots].sort());
      expect(hash(await apply(await apply(state, alg), inverse(alg)))).toBe(hash(state));
    }
});
test('model alignment choice routes to a setup without code selecting the turn', async () => {
  const state = await apply(await solved(), 'F2 U');
  const target = pieces(state).find((p) => p.kind === 'edge' && p.stickers.yellow === 'U')!;
  const front = [...target.position].find((f) => f !== 'U')!;
  const requests: any[] = [];
  const replies = [
    { goal: 'cross', transferTarget: target.piece, gatherTarget: 'none' },
    { situation: 'petal', reference: front },
    { decision: 'align' },
    { setup: 'U2' },
  ];
  const r = await decide(state, async (req) => {
    requests.push(req);
    return replies[requests.length - 1] as any;
  });
  expect(r.alg).toBe('U2');
  expect(requests).toHaveLength(4);
  expect(Object.keys(requests[3].questions.setup.criteria)).toEqual(['U', "U'", 'U2']);
  expect(JSON.stringify(requests)).not.toMatch(/"expected"|"scramble"|"candidateOutcomes"/);
});
test('the policy has no evaluator import or candidate simulation', () => {
  const s = readFileSync('scripts/brain-early/policy.ts', 'utf8');
  expect(s).not.toMatch(/\bapply\(|\bsolved\(|from.*evaluator|from.*search/);
});
test('offline scorer records a model abstention as failure without crashing', async () => {
  const { score } = await import('../scripts/brain-early/run');
  const result = await score(await apply(await solved(), 'R'), {
    plan: { goal: 'cross', gatherTarget: 'DB', transferTarget: 'none' },
    target: 'none',
    front: null,
    routine: null,
    preparation: null,
    alg: '',
  });
  expect(result.correct).toBe(false);
});
test('new validation excludes both prior boundary sets and records exact action replay', async () => {
  const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
  const old = ['development', 'validation'].flatMap((p) =>
    read(`experiments/observation-boundary-v1/${p}-fixtures.json`).map((c: any) => c.stateHash),
  );
  const fresh = read('experiments/brain-early-v1/validation-fixtures.json');
  expect(fresh.length).toBe(20);
  for (const c of fresh) expect(old.includes(c.stateHash)).toBe(false);
  for (const phase of ['development', 'validation'])
    for (const row of read(`experiments/brain-early-v1/${phase}-results.json`).rows) {
      if (row.after) expect(hash(await apply(row.before, row.decision.alg))).toBe(hash(row.after));
    }
});
