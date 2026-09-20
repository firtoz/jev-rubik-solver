import { test, expect } from 'bun:test';
import { fixtures, wording } from '../scripts/request-eval/reference';
import { pieces } from '../src/lib/cube';
test('reference fixtures verify local geometry and last-layer effects, with no answer leakage', async () => {
  const cases = await fixtures();
  expect(cases).toHaveLength(40);
  expect(new Set(cases.map((f) => f.run.stage)).size).toBe(8);
  for (const f of cases) {
    expect(f.accepted.reference.length).toBeGreaterThan(0);
    expect(Object.keys(f.request.questions)).toEqual(['reference']);
    expect(f.request.state).not.toHaveProperty('scramble');
    expect(f.request.state).not.toHaveProperty('accepted');
    const e = f.evidence as any,
      p = pieces(f.run.state).find((p) => p.piece === e.target);
    if (e.spec.id === 'daisy-side') expect(p!.stickers.yellow).not.toBe('U');
    if (e.spec.id === 'corner-insert') expect(p!.position.includes('U')).toBe(true);
    if (e.spec.id === 'middle-extract') expect(p!.position).not.toMatch(/[UD]/);
    for (const variant of ['baseline', 'checklist', 'concise', 'neutral'] as const) {
      const req = wording(f.request, variant);
      expect(req.state).toEqual(f.request.state);
      expect(Object.keys(req.questions.reference.criteria)).toEqual(['F', 'R', 'B', 'L']);
    }
  }
});
