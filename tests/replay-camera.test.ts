import { expect, test } from 'bun:test';
import timings from '../src/lib/article-request-timings.json';
import { replayCamera, cameraTravel } from '../src/lib/replay-camera';

test('camera follows completed goals and seeks deterministically', () => {
  const cross = timings.skills.find(row => row.answers.goal === 'cross')!;
  expect(replayCamera('skills', cross.endMs).latitude).toBeLessThan(0);
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
