import { test, expect } from 'bun:test';
import { fixtures } from '../scripts/request-eval/cases';
import { variants, wording } from '../scripts/request-eval/variants';
test('request evaluation labels are verified offline and wording variants cannot change state or menu', async () => {
  const fs = await fixtures();
  expect(fs).toHaveLength(40);
  for (const f of fs) {
    expect(Object.keys(f.accepted).sort()).toEqual(Object.keys(f.request.questions).sort());
    for (const [q, answers] of Object.entries(f.accepted))
      for (const a of answers) expect(f.request.questions[q].criteria).toHaveProperty(a);
    for (const v of Object.keys(variants) as (keyof typeof variants)[]) {
      const req = wording(f.request, v);
      expect(req.state).toEqual(f.request.state);
      expect(req.state).not.toHaveProperty('accepted');
      expect(req.state).not.toHaveProperty('scramble');
      for (const q of Object.keys(req.questions))
        expect(req.questions[q].criteria).toEqual(f.request.questions[q].criteria);
    }
  }
});
