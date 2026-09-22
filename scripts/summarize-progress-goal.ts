import { readFileSync, writeFileSync } from 'node:fs';
const read = (path: string) => JSON.parse(readFileSync(`experiments/${path}/results.json`, 'utf8'));
const round1 = read('progress-goal-development/round-1');
const round2 = read('progress-goal-development/round-2');
const handoff = read('progress-goal-handoff');
const validation = read('progress-goal-validation/round-1');
const summaries = [...round1.summary, ...round2.summary, ...handoff.summary, ...validation.summary];
const failure = validation.results.find((r: any) => r.variant === 'regional' && !r.correct);
writeFileSync(
  'src/lib/progress-goal-experiment.json',
  JSON.stringify(
    {
      round1: round1.summary,
      round2: round2.summary,
      handoff: handoff.summary,
      validation: validation.summary,
      requests: summaries.reduce((n, s) => n + (s.requests ?? s.completed), 0),
      cost: summaries.reduce((n, s) => n + s.cost, 0),
      example: {
        caseId: failure.caseId,
        expected: failure.expected,
        accepted: failure.accepted,
        actual: failure.actual,
        exchanges: failure.exchanges.map((e: any) => ({
          request: e.request,
          response: e.nativeResponse,
        })),
      },
    },
    null,
    2,
  ),
);
