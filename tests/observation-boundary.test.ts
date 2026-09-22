import { describe, test, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { apply, solved, hash, inverse, pieces, facts } from '../src/lib/cube';
import * as p from '../scripts/observation-boundary/policy';
import {
  fixtures,
  expectedSituation,
  acceptableAction,
} from '../scripts/observation-boundary/evaluator';

describe('observation boundary experiment', () => {
  test('literal observations omit hidden solved labels and scramble; aggregate preserves mistakes', async () => {
    const o = p.observe(await apply(await solved(), 'R U'), {
      target: 'DF',
      recentActions: ['F', 'R', 'U'],
    });
    expect(o.memory.recentActions).toEqual(['R', 'U']);
    expect(o.edges).toHaveLength(4);
    expect(Object.keys(o.edges[0]).sort()).toEqual(['id', 'position', 'stickers']);
    const checks = p.measuredChecks(o),
      wrong = { ...checks };
    wrong.petal_DF = checks.petal_DF === 'yes' ? 'no' : 'yes';
    const a = p.aggregate(wrong);
    expect(a.checks).toEqual(wrong);
    expect(a.counts.petals).not.toBe(p.aggregate(checks).counts.petals);
    expect(() => p.aggregate({})).toThrow('Missing recognition');
    expect(JSON.stringify(p.planning(o, a, 'structured'))).not.toMatch(
      /scramble|expected|acceptableActions/,
    );
  });
  test('fixtures are disjoint, labelled and all selected targets admit an action', async () => {
    const dev = await fixtures('development'),
      val = await fixtures(
        'validation',
        dev.map((c) => c.stateHash),
      );
    expect(dev.length).toBe(20);
    expect(val.length).toBe(20);
    expect(new Set([...dev, ...val].map((c) => c.stateHash)).size).toBe(40);
    for (const c of [...dev, ...val]) {
      expect(hash(await apply(await solved(), c.scramble))).toBe(c.stateHash);
      const counts = c.expected.counts;
      expect(counts.petals).toBe(facts(c.state).daisy);
      expect(counts.bottom).toBe(
        pieces(c.state).filter((p) => p.kind === 'edge' && p.piece.includes('D') && p.solved)
          .length,
      );
      for (const [target, actions] of Object.entries(c.expected.actions)) {
        expect(actions.length).toBeGreaterThan(0);
        const s = expectedSituation(c.state, target);
        for (const op of actions)
          expect(await acceptableAction(c.state, c.expected.goal, target, s.reference, op)).toBe(
            true,
          );
        expect(
          await acceptableAction(c.state, c.expected.goal, target, s.reference, 'reconsider'),
        ).toBe(false);
      }
    }
    expect(dev.filter((c) => c.category === 'zero').length).toBe(3);
    expect(dev.filter((c) => c.category === 'one').length).toBe(3);
  });
  test('same action vocabulary across boundaries and wording; frames roundtrip', async () => {
    const state = await apply(await solved(), "R U F' L2"),
      o = p.observe(state),
      summary = p.aggregate(p.measuredChecks(o));
    const criteria = Object.keys(
      p.action(o, summary, 'daisy', 'DF', { reference: 'F', situation: 'middle' }, 'structured')
        .questions.operation.criteria,
    );
    for (const front of p.fronts) {
      const r = p.action(
        o,
        summary,
        'cross',
        'DF',
        { reference: front, situation: 'petal' },
        'player',
      );
      expect(Object.keys(r.questions.operation.criteria)).toEqual(criteria);
      for (const op of Object.keys(p.actionMenu)) {
        const alg = p.executeSelection(op, front);
        expect(hash(await apply(await apply(state, alg), inverse(alg)))).toBe(hash(state));
      }
    }
    expect(Object.keys(p.planning(o, summary, 'structured').questions)).toEqual([
      'goal',
      'gatherTarget',
      'transferTarget',
    ]);
    expect(Object.keys(p.situation(o, 'daisy', 'DF', 'structured').questions)).toEqual([
      'situation',
      'reference',
    ]);
  });
  test('policy cannot access offline labels, outcome search or solver', () => {
    const source = readFileSync('scripts/observation-boundary/policy.ts', 'utf8');
    expect(source).not.toMatch(
      /from ['"].*(evaluator|search|solver)|\bapply\(|\bfacts\(|\bstage\(/,
    );
  });
});

test('revised local slots use canonical names in every reference and retain exact sticker locations', async () => {
  const v2 = await import('../scripts/observation-boundary/policy-v2');
  const { names, colors } = await import('../src/lib/cube');
  const o = p.observe(await apply(await solved(), 'R U F L B'));
  for (const front of p.fronts) {
    const request = v2.action(
      o,
      p.aggregate(p.measuredChecks(o)),
      'daisy',
      'DF',
      { reference: front, situation: 'middle' },
      'structured',
    );
    const s = request.state as any;
    expect(s.selectedTarget).toEqual(s.observation.edges.find((e: any) => e.id === 'DF'));
    for (const e of s.observation.edges) {
      expect(names.EDGES).toContain(e.position);
      expect([...e.position].sort()).toEqual(Object.values(e.stickers).sort());
    }
    expect(Object.values(s.observation.frame.centers).sort()).toEqual(Object.values(colors).sort());
    expect(Object.keys(request.questions.operation.criteria)).toEqual(Object.keys(p.actionMenu));
  }
});

test('study guards account for uncertain reservations and stop before dispatch', async () => {
  const { checkLimits, RESERVATION } = await import('../scripts/observation-boundary/limits');
  expect(() =>
    checkLimits({ requests: 399, committed: 0.01 }, { reservedAndSpent: 4.2, cap: 5 }),
  ).not.toThrow();
  expect(() =>
    checkLimits({ requests: 400, committed: 0 }, { reservedAndSpent: 0, cap: 5 }),
  ).toThrow('request cap');
  expect(() =>
    checkLimits(
      { requests: 1, committed: 0.05 - RESERVATION / 2 },
      { reservedAndSpent: 0, cap: 5 },
    ),
  ).toThrow('cost cap');
  expect(() =>
    checkLimits({ requests: 1, committed: 0 }, { reservedAndSpent: 5 - RESERVATION / 2, cap: 5 }),
  ).toThrow('Project budget');
});

test('dependent pipeline propagates incorrect recognition without a tactical override', async () => {
  const { cycle } = await import('../scripts/observation-boundary/run');
  const state = await apply(await solved(), 'R');
  const supplied = Object.fromEntries(
    p.ids.flatMap((id) => [
      [`petal_${id}`, 'no'],
      [`bottom_${id}`, 'yes'],
    ]),
  );
  const requests: any[] = [];
  const result = await cycle(state, 'jev/structured', async (request) => {
    requests.push(request);
    if (requests.length === 1) return supplied;
    expect((request.state as any).checks).toEqual(supplied);
    expect((request.state as any).counts).toEqual({ petals: 0, bottom: 4 });
    return { goal: 'first-layer', gatherTarget: 'none', transferTarget: 'none' };
  });
  expect(requests).toHaveLength(2);
  expect(result.plan.goal).toBe('first-layer');
  expect(result.alg).toBe('');
  expect(hash(result.after)).toBe(hash(state));
  expect(facts(state).cross).toBe(false);
});

test('viewer preserves all recorded request bodies and native responses', () => {
  const data = JSON.parse(readFileSync('src/lib/observation-boundary.json', 'utf8'));
  let total = 0;
  for (const phase of data.phases) {
    const original = JSON.parse(
      readFileSync(`experiments/observation-boundary-v1/${phase.phase}-results.json`, 'utf8'),
    );
    for (const row of phase.rows) {
      const source = original.rows.find((r: any) => r.runId === row.runId);
      expect(row.exchanges.length).toBe(source.exchanges.length);
      row.exchanges.forEach((e: any, i: number) => {
        expect(e.request).toEqual(source.exchanges[i].request);
        expect(e.response).toEqual(
          source.exchanges[i].nativeResponse ?? source.exchanges[i].response,
        );
        expect(Object.keys(e).sort()).toEqual(['cost', 'elapsedMs', 'id', 'request', 'response']);
        expect(JSON.stringify(e.request)).not.toMatch(
          /"expected"|"scramble"|"Authorization"|"api_key"/,
        );
        total++;
      });
    }
  }
  expect(total).toBe(380);
});
