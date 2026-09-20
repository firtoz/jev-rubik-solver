import { test, expect } from 'bun:test';
import { fixtures } from '../scripts/request-eval/cases';
import { targetRequest, intentionRequest } from '../scripts/request-eval/separate';
test('split requests depend on the actual chosen target without exposing golden labels', async () => {
  const f = (await fixtures())[0];
  expect(Object.keys(targetRequest(f.request).questions)).toEqual(['target']);
  for (const target of Object.keys(f.request.questions.target.criteria)) {
    for (const variant of ['split-full', 'split-focused', 'split-checklist'] as const) {
      const req = intentionRequest(f.request, target, variant);
      expect(Object.keys(req.questions)).toEqual(['intention']);
      expect(req.questions.intention.criteria).toEqual(
        f.request.questions['intent_' + target].criteria,
      );
      expect(req.state).not.toHaveProperty('accepted');
      expect(req.state).not.toHaveProperty('scramble');
      if (variant !== 'split-full') {
        expect((req.state as any).target.piece).toBe(target);
        expect(req.state).not.toHaveProperty('stagePieces');
      } else expect(req.state).toEqual(f.request.state);
    }
  }
  expect(() => intentionRequest(f.request, 'invalid', 'split-focused')).toThrow();
});
