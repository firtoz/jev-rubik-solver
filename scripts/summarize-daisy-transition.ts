import { readFileSync, writeFileSync } from 'node:fs';
const read = (p: string) => JSON.parse(readFileSync(`experiments/${p}/results.json`, 'utf8'));
const first = read('daisy-transition-development'),
  second = read('daisy-decision-development'),
  validation = read('daisy-decision-validation');
if (validation.summary.some((r: any) => r.completed !== 20))
  throw new Error('Validation incomplete');
const summaries = [...first.summary, ...second.summary, ...validation.summary];
writeFileSync(
  'src/lib/daisy-transition.json',
  JSON.stringify(
    {
      first: first.summary,
      second: second.summary,
      validation: validation.summary,
      requests: summaries.reduce((n, r) => n + r.requests, 0),
      cost: summaries.reduce((n, r) => n + r.cost, 0),
      example: validation.results.find(
        (r: any) => r.variant === 'counts-plain' && r.category === 'partial-transfer',
      ),
    },
    null,
    2,
  ),
);
