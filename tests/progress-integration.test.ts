import { test, expect } from 'bun:test';
import { apply, solved } from '../src/lib/cube';
import { expectedEarlyGoals } from '../scripts/request-eval/progress-integration';
test('integration fixtures cover cross, corners and middle repair with independent terminal scoring', async () => {
  const s = await solved();
  expect(expectedEarlyGoals(s)).toEqual(['solved']);
  expect(expectedEarlyGoals(await apply(s, 'R'))).toEqual(['daisy', 'cross']);
  expect(expectedEarlyGoals(await apply(s, "R U R'"))).toEqual(['first-layer']);
  expect(expectedEarlyGoals(await apply(s, "F' U' F U R U R' U'"))).toEqual(['middle-layer']);
  expect(expectedEarlyGoals(await apply(s, 'U'))).toEqual(['last-layer']);
});
