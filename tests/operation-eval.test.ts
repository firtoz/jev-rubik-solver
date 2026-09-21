import { test, expect } from 'bun:test';
import { fixtures, wording } from '../scripts/request-eval/operation';
test('operation labels accept mechanically verified outcomes and remain outside requests', async () => {
  const fs = await fixtures();
  expect(fs).toHaveLength(40);
  for (const f of fs) {
    expect(f.accepted.operation.length).toBeGreaterThan(0);
    expect(f.request.state).not.toHaveProperty('scramble');
    expect(f.request.state).not.toHaveProperty('accepted');
    expect(Object.keys(f.request.questions)).toEqual(['operation']);
    for (const v of ['baseline', 'preconditions', 'local', 'concise'] as const)
      expect(wording(f.request, v).questions.operation.criteria).toEqual(
        f.request.questions.operation.criteria,
      );
  }
});
