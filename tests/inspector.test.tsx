import { test, expect } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { RequestInspector, DataTree } from '../src/components/RequestInspector';
import { stageVisuals } from '../src/components/StageFacts';
import { solved, apply } from '../src/lib/cube';
import type { Event } from '../src/lib/types';

const response = {
  model: 'jev-1.13.0',
  answers: {
    move: {
      type: 'choice',
      choice: 'R',
      confidence: 0.7,
      probabilities: { R: 1 },
      extraAnswerField: 'extra-answer',
    },
  },
  usage: { input_tokens: 100, output_tokens: 20, extraUsageField: 'extra-usage' },
  providerMetadata: { value: 'extra-response' },
};
const request = {
  model: 'jev-1.13.0',
  state: { visibleFact: 'front-green' },
  questions: {
    move: { type: 'choice', instructions: 'inspect-target', criteria: { R: 'right-quarter-turn' } },
  },
  extraParameter: 'extra-request',
};
const events: Event[] = [
  {
    id: 1,
    runId: 'test',
    kind: 'request',
    createdAt: '2026-09-20T00:00:00Z',
    payload: { id: 'exchange', request, attempt: 0 },
  },
  {
    id: 2,
    runId: 'test',
    kind: 'decision',
    createdAt: '2026-09-20T00:00:01Z',
    payload: {
      id: 'exchange',
      request,
      response,
      nativeResponse: response,
      elapsedMs: 1000,
      cost: 0.00001,
    },
  },
];
test('inspector renders complete inputs, unknown response fields and optional raw bodies', () => {
  const html = renderToStaticMarkup(
    <RequestInspector events={events} selected={2} onSelect={() => {}} throughEventId={2} />,
  );
  for (const text of [
    'front-green',
    'inspect-target',
    'right-quarter-turn',
    'extra-request',
    'extra-answer',
    'extra-usage',
    'extra-response',
    'Raw request JSON',
    'Raw response JSON',
    'Complete response body',
  ])
    expect(html).toContain(text);
});
test('recorded request phase does not reveal its future response', () => {
  const html = renderToStaticMarkup(
    <RequestInspector events={events} selected={1} onSelect={() => {}} throughEventId={1} />,
  );
  expect(html).toContain('Waiting for the response.');
  expect(html).toContain('front-green');
  expect(html).not.toContain('extra-response');
  expect(html).not.toContain('Raw response JSON');
});
test('compact flags retain explicit true/false accessibility labels', () => {
  const html = renderToStaticMarkup(<DataTree value={{ x: true, y: false, z: true }} />);
  expect(html).toContain('aria-label="x: true"');
  expect(html).toContain('aria-label="y: false"');
  expect(html).toContain('is-true');
  expect(html).toContain('is-false');
});
test('stage icons use actual sticker directions and distinguish the temporary daisy from solved', async () => {
  const complete = await solved();
  const solvedFacts = stageVisuals(complete);
  expect(solvedFacts.find((s) => s.key === 'daisy')?.count).toBe(0);
  expect(solvedFacts.find((s) => s.key === 'solved')?.count).toBe(20);
  const daisy = await apply(complete, 'F2 B2 R2 L2');
  const d = stageVisuals(daisy).find((s) => s.key === 'daisy')!;
  expect(d.count).toBe(4);
  expect(d.complete).toBe(true);
  const partial = stageVisuals(await apply(daisy, 'F2')).find((s) => s.key === 'daisy')!;
  expect(partial.count).toBe(3);
  expect(partial.selected.filter((p) => !partial.match(p)).map((p) => p.position)).toEqual(['UF']);
  const html = renderToStaticMarkup(
    <DataTree value={{ completed: { daisy: 3 } }} cubeState={await apply(daisy, 'F2')} />,
  );
  expect(html).toContain('Goal pattern');
  expect(html).toContain('UF');
  expect(html).toContain('Recorded value sent to JEV: 3');
});
