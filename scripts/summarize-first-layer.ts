import { readFileSync, writeFileSync } from 'node:fs';
const read = (split: string, round: number) =>
  JSON.parse(readFileSync(`experiments/first-layer-${split}/round-${round}/results.json`, 'utf8'));
const round1 = read('development', 1),
  round2 = read('development', 2),
  validation = read('validation', 1);
const example = round1.results.find(
  (r: any) => r.variant === 'checklist' && r.expected === 'yes' && !r.correct,
);
const summaries = [...round1.summary, ...round2.summary, ...validation.summary];
writeFileSync(
  'src/lib/first-layer-experiment.json',
  JSON.stringify(
    {
      round1: round1.summary,
      round2: round2.summary,
      validation: validation.summary,
      totalRequests: summaries.reduce((n, r) => n + r.requests, 0),
      cost: summaries.reduce((n, r) => n + r.cost, 0),
      example: {
        caseId: example.caseId,
        expected: example.expected,
        request: example.exchanges[0].request,
        response: example.exchanges[0].nativeResponse,
      },
    },
    null,
    2,
  ),
);
