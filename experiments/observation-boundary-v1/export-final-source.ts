import { existsSync, readFileSync, writeFileSync } from 'node:fs';
const dir = 'experiments/observation-boundary-v1';
const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const phases = ['development', 'revision', 'validation'].flatMap((phase) => {
  const path = `${dir}/${phase}-results.json`;
  if (!existsSync(path)) return [];
  const data = read(path);
  return [
    {
      phase,
      summary: data.summary,
      rows: data.rows.map((r: any) => ({
        caseId: r.caseId,
        category: r.category,
        variant: r.variant,
        runId: r.runId,
        before: r.before,
        result: r.result,
        score: r.score,
        error: r.error,
        replayedFrom: r.replayedFrom,
        exchanges: r.exchanges.map((d: any) => ({
          id: d.id,
          request: d.request,
          response: d.nativeResponse ?? d.response,
          elapsedMs: d.elapsedMs,
          cost: d.cost,
        })),
      })),
    },
  ];
});
writeFileSync(
  'src/lib/observation-boundary.json',
  JSON.stringify(
    {
      source: dir,
      phases,
      selection: existsSync(`${dir}/selection.json`) ? read(`${dir}/selection.json`) : null,
      usage: phases.length ? read(`${dir}/${phases.at(-1)!.phase}-results.json`).usage : null,
    },
    null,
    2,
  ),
);
console.log(
  `Exported ${phases.reduce((n, p) => n + p.rows.reduce((n: number, r: any) => n + r.exchanges.length, 0), 0)} exchanges without transport headers.`,
);

writeFileSync(
  'src/lib/observation-boundary-summary.json',
  JSON.stringify({ phases: phases.map((p) => ({ phase: p.phase, summary: p.summary })) }, null, 2),
);
