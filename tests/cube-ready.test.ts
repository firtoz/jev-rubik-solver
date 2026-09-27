import { expect, test } from 'bun:test';
import { waitForCubeRender } from '../src/lib/cube-ready';

test('readiness waits for geometry and every viewport to render', async () => {
  const geometry = Promise.withResolvers<void>();
  const main = Promise.withResolvers<void>();
  const inset = Promise.withResolvers<void>();
  let rendering = false, ready = false;
  const pending = waitForCubeRender({
    experimentalCurrentThreeJSPuzzleObject: () => geometry.promise,
    experimentalCurrentVantages: async () => {
      rendering = true;
      return [{ render: () => main.promise }, { render: () => inset.promise }];
    },
  }).then(() => { ready = true; });
  await Promise.resolve();
  expect(rendering).toBe(false);
  geometry.resolve();
  await Promise.resolve();
  await Promise.resolve();
  expect(rendering).toBe(true);
  expect(ready).toBe(false);
  main.resolve();
  await Promise.resolve();
  expect(ready).toBe(false);
  inset.resolve();
  await pending;
  expect(ready).toBe(true);
});

test('a renderer failure cannot signal readiness', async () => {
  await expect(waitForCubeRender({
    experimentalCurrentThreeJSPuzzleObject: async () => ({}),
    experimentalCurrentVantages: async () => [{ render: async () => { throw new Error('WebGL unavailable'); } }],
  })).rejects.toThrow('WebGL unavailable');
});
