import { expect, test } from 'bun:test';
import timings from '../src/lib/article-request-timings.json';
import { replayCamera, cameraTravel } from '../src/lib/replay-camera';

test('camera follows completed goals and seeks deterministically', () => {
  const cross = timings.skills.find(row => row.answers.goal === 'cross')!;
  expect(replayCamera('skills', cross.endMs).latitude).toBe(-68);
  expect(replayCamera('skills', cross.endMs).longitude).toBe(20);
  expect(replayCamera('skills', cross.endMs).label).toContain('D');
  const daisy = timings.skills.find(row => row.answers.goal === 'daisy')!;
  expect(replayCamera('skills', daisy.endMs).latitude).toBeGreaterThan(0);
  const last = timings.skills.find(row => row.answers.goal === 'pll')!;
  expect(replayCamera('skills', last.endMs).latitude).toBeGreaterThan(0);
  expect(replayCamera('skills', 0).latitude).toBe(45);
});

test('camera takes shortest route across the longitude seam', () => {
  expect(cameraTravel(170, -170)).toBe(20);
  expect(cameraTravel(-170, 170)).toBe(-20);
  expect(cameraTravel(750, 30)).toBe(0);
});


test('flow and replay share angled views for each working layer and reference face', async () => {
  const { cameraForGoal } = await import('../src/lib/camera-view');
  expect(cameraForGoal('cross').latitude).toBe(-68);
  expect(cameraForGoal('first-layer').latitude).toBe(-55);
  for (const goal of ['f2l', 'middle-layer']) {
    expect(cameraForGoal(goal, 'R')).toMatchObject({ latitude: -20, longitude: 120 });
    expect(cameraForGoal(goal, 'B').longitude).toBe(210);
    expect(cameraForGoal(goal, 'L').longitude).toBe(-60);
  }
  expect(cameraForGoal('pll').latitude).toBe(45);
  expect(cameraForGoal()).toMatchObject({ latitude: 45, longitude: 30 });
});
