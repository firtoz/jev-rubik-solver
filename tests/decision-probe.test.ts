import { test, expect } from 'bun:test';
import { fixtures, prepare, verifyFixtures } from '../scripts/decision-probe';
test('six frozen capability fixtures have verified mechanical outcomes', async () => {
  expect(fixtures).toHaveLength(6);
  await verifyFixtures();
});
test('paired prompts share action menus and omit fixture answers and scramble history', async () => {
  for (const f of fixtures) {
    const p = await prepare(f);
    expect(p.broad.questions.action.criteria).toEqual(p.structured.questions.action.criteria);
    for (const request of [p.broad, p.structured]) {
      const state = request.state as Record<string, unknown>;
      expect(state).not.toHaveProperty('scramble');
      expect(state).not.toHaveProperty('accepted');
      expect(state).not.toHaveProperty('rationale');
      expect(state.goal).toBe(f.objective);
    }
  }
});
