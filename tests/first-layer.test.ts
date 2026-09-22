import { test, expect } from 'bun:test';
import {
  makeCases,
  faceObservation,
  initialRequest,
  combineRequest,
} from '../scripts/request-eval/first-layer';
import { apply, solved, facts, parseScramble } from '../src/lib/cube';
test('legal balanced first-layer fixtures have consistent physical face grids and independent labels', async () => {
  const cases = await makeCases('development');
  expect(cases.length).toBe(20);
  expect(new Set(cases.map((c) => c.stateHash)).size).toBe(20);
  expect(cases.filter((c) => c.expected === 'yes').length).toBe(10);
  for (const c of cases) {
    const state = await apply(await solved(), parseScramble(c.scramble));
    expect(facts(state).firstLayer).toBe(c.expected === 'yes');
    const f = c.observation.faces;
    const fromGrid =
      f.D.rows.flat().every((x: string) => x === f.D.center) &&
      ['F', 'R', 'B', 'L'].every((side) =>
        f[side].rows[2].every((x: string) => x === f[side].center),
      );
    expect(fromGrid).toBe(c.expected === 'yes');
    const stickers = Object.values(f).flatMap((x: any) => x.rows.flat());
    expect(stickers.length).toBe(54);
    for (const color of ['white', 'yellow', 'green', 'blue', 'red', 'orange'])
      expect(stickers.filter((x) => x === color).length).toBe(9);
    for (const variant of ['direct', 'checklist', 'sequential'])
      expect(initialRequest(c.observation, variant).state).toEqual(c.observation);
  }
});
test('outside-view face grid has known clockwise F layout; model answers remain uncorrected', async () => {
  const f = faceObservation(await apply(await solved(), 'F')).faces;
  expect(f.U.rows[2]).toEqual(['orange', 'orange', 'orange']);
  expect(f.R.rows.map((r: string[]) => r[0])).toEqual(['white', 'white', 'white']);
  const answers = { D: 'yes', F: 'no', R: 'yes', B: 'yes', L: 'yes' };
  expect(
    (combineRequest(answers, 'sequential').state as any).regionChecksFromPreviousModelResponse,
  ).toEqual(answers);
});
