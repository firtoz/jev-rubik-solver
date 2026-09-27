import { test, expect } from 'bun:test';
import { solved, apply, inverse } from '../src/lib/cube';
import { routines } from '../src/solver/f2l/reference';
import { view } from '../src/solver/f2l/controller';
const pairView = (state: Parameters<typeof view>[0]) => view(state, 'FR', 'F');
import { choose } from '../src/solver/f2l/recognition';
import type { JevRequest, JevResponse } from '../src/lib/types';
test('grouped selector exposes the correct static reference for all 41 fixtures', async () => {
  const base = await solved();
  for (const routine of routines) {
    const state = await apply(base, inverse(routine.alg)),
      a: JevRequest[] = [],
      b: JevRequest[] = [];
    const ask =
      (log: JevRequest[]) =>
      async (r: JevRequest): Promise<JevResponse> => {
        log.push(r);
        const key = Object.keys(r.questions)[0];
        return {
          model: 'jev-1.13.0',
          answers: {
            [key]: {
              type: 'choice',
              choice: key === 'group' ? routine.group : routine.id,
              probabilities: {},
              confidence: 1,
            },
          },
          usage: { input_tokens: 0, output_tokens: 0 },
        };
      };
    await choose(pairView(state), ask(b));
    expect(Object.keys(b[0].questions)).toEqual(['group']);
    expect(b[1].questions.routine.criteria[routine.id]).toBe(routine.description);
    expect(b[1].state).toEqual({
      ...pairView(state),
      frame: 'Local front F, right R, down D. Target pair belongs at DRF corner and FR edge.',
    });
  }
});
test('wrong corner group controls the menu without code correcting it', async () => {
  const r = routines[0],
    state = await apply(await solved(), inverse(r.alg));
  const wrong = routines.find((x) => x.group !== r.group)!.group;
  const requests: JevRequest[] = [];
  const answer = await choose(pairView(state), async (request) => {
    requests.push(request);
    const key = Object.keys(request.questions)[0];
    return {
      model: 'jev-1.13.0',
      answers: {
        [key]: {
          type: 'choice',
          choice: key === 'group' ? wrong : 'reconsider',
          probabilities: {},
          confidence: 0,
        },
      },
      usage: { input_tokens: 0, output_tokens: 0 },
    };
  });
  expect(requests[1].questions.routine.criteria[r.id]).toBeUndefined();
  expect(answer.answers.routine.choice).toBe('reconsider');
});
