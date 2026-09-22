import { test, expect } from 'bun:test';
import { progressCases, progressRequest, selectGoal } from '../scripts/request-eval/progress-goal';
import { solved } from '../src/lib/cube';
import { faceObservation } from '../scripts/request-eval/first-layer';
test('progress fixtures have independent grid labels and preserve all goal options', async () => {
  const cases = await progressCases('development');
  expect(cases.length).toBe(20);
  expect(new Set(cases.map((c) => c.stateHash)).size).toBe(20);
  for (const category of ['cross-needed', 'corners-needed', 'middle-needed', 'last-layer-needed'])
    expect(cases.filter((c) => c.category === category).length).toBe(5);
  for (const c of cases) {
    const f = c.observation.faces;
    const sides = ['F', 'R', 'B', 'L'];
    const cross =
      [
        [0, 1],
        [1, 0],
        [1, 2],
        [2, 1],
      ].every(([r, col]) => f.D.rows[r][col] === f.D.center) &&
      sides.every((side) => f[side].rows[2][1] === f[side].center);
    const first =
      f.D.rows.flat().every((x: string) => x === f.D.center) &&
      sides.every((side) => f[side].rows[2].every((x: string) => x === f[side].center));
    const lower =
      first && sides.every((side) => f[side].rows[1].every((x: string) => x === f[side].center));
    expect(c.expected.cross === 'yes').toBe(cross);
    expect(c.expected.firstLayer === 'yes').toBe(first);
    expect(c.expected.lowerTwo === 'yes').toBe(lower);
    const bad = { cross: 'no', firstLayer: 'yes', lowerTwo: 'yes', solved: 'yes' };
    const req = selectGoal(c.observation, 'chain', bad);
    expect((req.state as any).previousModelAssessments).toEqual(bad);
    expect(Object.keys(req.questions.goal.criteria)).toHaveLength(6);
    expect(progressRequest(c.observation).state).toEqual(c.observation);
  }
});
test('solved observations remain raw and the stop option remains available', async () => {
  const obs = faceObservation(await solved());
  expect(Object.keys(obs)).toEqual(['frame', 'faces']);
  expect(selectGoal(obs, 'direct').questions.goal.criteria.solved).toBeDefined();
});

import { regionRequest, combineProgress } from '../scripts/request-eval/progress-goal';
test('regional decomposition retains all model answers, including contradictory ones', async () => {
  const obs = faceObservation(await solved());
  const request = regionRequest(obs);
  expect(request.state).toEqual(obs);
  expect(Object.keys(request.questions).length).toBe(19);
  const answers = Object.fromEntries(Object.keys(request.questions).map((k) => [k, 'no']));
  answers.Dface = 'yes';
  expect((combineProgress(answers).state as any).regionChecksFromPreviousModelResponse).toEqual(
    answers,
  );
  expect(combineProgress(answers).questions.lowerTwo.instructions).toContain('Lmiddle');
  expect(progressRequest(obs, 'selfcontained').questions.lowerTwo.instructions).toContain(
    'all nine D cells',
  );
});
