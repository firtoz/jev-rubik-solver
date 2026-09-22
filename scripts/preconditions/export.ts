import { existsSync, readFileSync, writeFileSync } from 'node:fs';
const source = 'experiments/action-preconditions-v1';
const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const phases = ['development', 'validation'].flatMap((phase) => {
  if (!existsSync(`${source}/${phase}-results.json`)) return [];
  const d = read(`${source}/${phase}-results.json`);
  return [
    {
      phase,
      summary: d.summary,
      rows: d.rows.map((r: any) => ({
        caseId: r.caseId,
        variant: r.variant,
        family: r.family,
        expected: r.expected,
        actual: r.actual,
        correct: r.correct,
        error: r.error,
        runId: r.runId,
        exchanges: r.exchanges.map((e: any) => ({
          id: e.id,
          request: e.request,
          response: e.nativeResponse ?? e.response,
          cost: e.cost,
          elapsedMs: e.elapsedMs,
        })),
      })),
    },
  ];
});
writeFileSync('src/lib/action-preconditions.json', JSON.stringify({ source, phases }, null, 2));
writeFileSync(
  'src/lib/action-preconditions-summary.json',
  JSON.stringify(
    { source, phases: phases.map((p) => ({ phase: p.phase, summary: p.summary })) },
    null,
    2,
  ),
);
