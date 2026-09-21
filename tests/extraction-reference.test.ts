import { test, expect } from 'bun:test';
import { fixtures, wording, observationRequest } from '../scripts/request-eval/extraction';
import { hash, facts } from '../src/lib/cube';
test('extraction fixtures balance frames, separate home from current slot, and preserve lower layer', async () => {
  const fs = await fixtures();
  expect(fs).toHaveLength(40);
  expect(new Set(fs.map((f) => hash(f.run.state))).size).toBe(40);
  for (const split of ['development', 'validation'])
    for (const front of ['F', 'R', 'B', 'L'])
      expect(
        fs.filter((f) => f.split === split && f.accepted.reference.includes(front)),
      ).toHaveLength(5);
  for (const f of fs) {
    const e = f.evidence as any;
    expect(e.piece.position).not.toBe(e.piece.destination);
    expect(facts(f.run.state).firstLayer).toBe(true);
    expect(f.request.state).not.toHaveProperty('accepted');
    expect(Object.keys(observationRequest(f.request).questions)).toEqual(['currentSlot']);
  }
});
test('position-only request uses the model response without a hidden correction or option leakage', async () => {
  const f = (await fixtures())[0];
  const r = wording(f.request, 'position-only', 'BL');
  expect((r.state as any).modelReportedCurrentSlot).toBe('BL');
  expect(r.state).not.toHaveProperty('referenceViews');
  expect(Object.values(r.questions.reference.criteria).join(' ')).not.toContain('target');
});
