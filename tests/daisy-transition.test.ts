import { test, expect } from 'bun:test';
import {
  fixtures,
  checksFor,
  regionInput,
  goalInput,
} from '../scripts/request-eval/daisy-transition';
import { apply, solved, pieces, facts } from '../src/lib/cube';
test('daisy fixtures labels agree with piece mechanics and sticker-only checks', async () => {
  const cs = await fixtures('development');
  expect(cs.length).toBe(20);
  expect(new Set(cs.map((c) => c.stateHash)).size).toBe(20);
  for (const c of cs) {
    const state = await apply(await solved(), c.scramble);
    const p = pieces(state);
    const checked = checksFor(state);
    expect(
      Object.entries(checked).filter(([k, v]) => k.startsWith('petal') && v === 'yes').length,
    ).toBe(facts(state).daisy);
    expect(
      Object.entries(checked).filter(([k, v]) => k.startsWith('bottom') && v === 'yes').length,
    ).toBe(p.filter((x) => x.kind === 'edge' && x.destination.includes('D') && x.solved).length);
    const eachBottom = ['DF', 'DR', 'DB', 'DL'];
    for (let i = 0; i < 4; i++)
      expect(checked[`bottom${i + 1}`] === 'yes').toBe(
        p.find((x) => x.position === eachBottom[i])!.solved,
      );
    const eachTop = ['UB', 'UR', 'UF', 'UL'];
    for (let i = 0; i < 4; i++)
      expect(checked[`petal${i + 1}`] === 'yes').toBe(
        p.find((x) => x.position === eachTop[i])!.stickers.yellow === 'U',
      );
    expect(Object.keys(regionInput(c.observation, true).questions)).toHaveLength(8);
    expect(JSON.stringify(goalInput(c.observation))).not.toContain(c.scramble);
  }
  for (const cat of ['incomplete', 'full-daisy', 'partial-transfer', 'cross-complete'])
    expect(cs.filter((c) => c.category === cat)).toHaveLength(5);
});
test('goal request preserves contradictory model checks and all options', () => {
  const bad = { petal1: 'yes', bottom1: 'yes' };
  const req = goalInput({}, bad);
  expect((req.state as any).previousModelChecks).toEqual(bad);
  expect(Object.keys(req.questions.goal.criteria)).toEqual(['daisy', 'cross', 'first-layer']);
});

test('dependent count and goal requests preserve actual model claims', async () => {
  const { countRequest, decisionRequest } = await import('../scripts/request-eval/daisy-decision');
  const checks = {
    petal1: 'yes',
    petal2: 'no',
    petal3: 'no',
    petal4: 'no',
    bottom1: 'yes',
    bottom2: 'yes',
    bottom3: 'yes',
    bottom4: 'yes',
  };
  expect((countRequest(checks).state as any).checks).toEqual(checks);
  const counts = { petal: '4', bottom: '4' };
  const request = decisionRequest(checks, 'counts-rule', counts);
  expect((request.state as any).modelCounts).toEqual(counts);
  expect(Object.keys(request.questions.goal.criteria).sort()).toEqual([
    'cross',
    'daisy',
    'first-layer',
  ]);
  expect(JSON.stringify(request.state)).not.toContain('expected');
});
