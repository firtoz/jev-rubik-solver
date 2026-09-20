import { test, expect } from 'bun:test';
import { apply, solved, pieces } from '../src/lib/cube';
import { goalRequest, goalObservation } from '../src/server/goal-policy';

test('goal menu and strategy are independent of cube state; observations contain no answer or scramble', async () => {
  const a = goalRequest('jev-1.13.0', await apply(await solved(), 'R'), null, []);
  const b = goalRequest('jev-1.13.0', await apply(await solved(), 'U'), 'cross', ['F2']);
  expect(a.questions).toEqual(b.questions);
  expect(Object.keys(a.questions.goal.criteria)).toHaveLength(8);
  expect(a.state).not.toHaveProperty('scramble');
  expect(a.state).not.toHaveProperty('stage');
  expect(a.state).not.toHaveProperty('recommendedGoal');
  expect((a.state as any).recentActions).toEqual([]);
  expect((b.state as any).previousGoal).toBe('cross');
});

test('six-face observations account for all 48 non-center stickers without recommending a goal', async () => {
  const state = await apply(await solved(), "R U F'");
  const obs = goalObservation(state, null, []);
  let count = 0;
  for (const [face, view] of Object.entries(obs.faces)) {
    expect(Object.keys(view.stickers)).toHaveLength(8);
    for (const [position, color] of Object.entries(view.stickers)) {
      expect(pieces(state).find((p) => p.position === position)!.stickers[color]).toBe(face);
      count++;
    }
  }
  expect(count).toBe(48);
});
