import { test, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import exported from '../src/lib/flow-recordings.json';
const source = JSON.parse(readFileSync('experiments/daisy-integration-v1/results.json', 'utf8'));
test('viewer preserves all 140 exact provider bodies and excludes transport metadata', () => {
  let count = 0;
  for (const [ri, run] of exported.runs.entries())
    for (const [si, step] of run.steps.entries())
      for (const [ei, exchange] of step.exchanges.entries()) {
        const original = source.results[ri].steps[si].exchanges[ei];
        expect(exchange.request).toEqual(original.request);
        expect(exchange.response).toEqual(original.nativeResponse ?? original.response);
        expect(Object.keys(exchange).sort()).toEqual([
          'cost',
          'elapsedMs',
          'id',
          'request',
          'response',
        ]);
        count++;
      }
  expect(count).toBe(140);
});
test('displayed first two handoffs are exact copies of recorded model choices', () => {
  for (const run of exported.runs as any[])
    for (const step of run.steps) {
      const [recognition, count, goal] = step.exchanges;
      const choices = (e: any) =>
        Object.fromEntries(Object.entries(e.response.answers).map(([k, a]: any) => [k, a.choice]));
      expect(count.request.state.checks).toEqual(choices(recognition));
      expect(goal.request.state.modelCounts).toEqual(choices(count));
    }
});

test('final whiteboard preserves every exchange and consecutive state in the verified solve', () => {
  const original = JSON.parse(readFileSync('experiments/brain-full-v3-final/random-1.json', 'utf8'));
  const displayed = JSON.parse(readFileSync('public/recordings/brain-v3-flow.json', 'utf8'));
  expect(displayed.steps.length).toBe(original.steps.length);
  let count = 0;
  displayed.steps.forEach((step: any, i: number) => {
    expect(step.before).toEqual(original.steps[i].before);
    expect(step.after).toEqual(original.steps[i].after);
    if (i) expect(step.before).toEqual(displayed.steps[i - 1].after);
    expect(step.exchanges.length).toBe(original.steps[i].exchanges.length);
    step.exchanges.forEach((exchange: any, j: number) => {
      const saved = original.steps[i].exchanges[j];
      for (const key of ['request', 'response', 'nativeResponse']) expect(exchange[key]).toEqual(saved[key]);
      expect(Object.keys(exchange).sort()).toEqual(['cost', 'elapsedMs', 'nativeResponse', 'request', 'response']);
      count++;
    });
  });
  expect(count).toBe(179);
});
