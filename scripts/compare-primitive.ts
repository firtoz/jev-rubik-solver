// Reuse the frozen skill results; make live primitive calls on the first three manifest cases.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { db, events, getRun, saveRun } from '../src/server/store';
import { createRun, finish, controlRun } from '../src/server/runner';
import { budget } from '../src/server/jev';
import { solved, apply, isSolved } from '../src/lib/cube';
const sourceId = process.argv[2];
const row = db.query('SELECT json FROM benchmarks WHERE id=?').get(sourceId) as {
  json: string;
} | null;
if (!row) throw new Error('Pass the completed frozen evaluation id');
const source = JSON.parse(row.json);
if (source.status !== 'complete') throw new Error('Finish the skill evaluation first');
const snapshot = JSON.parse(readFileSync(`.data/configs/${source.sourceHash}.json`, 'utf8'));
for (const [path, text] of Object.entries(snapshot))
  if (readFileSync(path, 'utf8') !== text) throw new Error('Frozen policy source changed');
for (const row of db.query('SELECT json FROM benchmarks').all() as { json: string }[])
  if (JSON.parse(row.json).sourceEvaluation === sourceId)
    throw new Error('Comparison already recorded; do not silently retry');
const cases = source.cases.slice(0, 3);
const report: any = {
  id: crypto.randomUUID(),
  name: 'Matched primitive comparison',
  split: 'comparison',
  sourceEvaluation: sourceId,
  sourceHash: source.sourceHash,
  version: source.version,
  model: source.model,
  limits: source.limits,
  policies: ['skills', 'primitive'],
  selection: 'First three cases in the frozen evaluation manifest, independent of outcomes.',
  cases,
  results: cases.map((c: any) => source.results.find((r: any) => r.caseId === c.id)),
  assignments: [],
  status: 'running',
  startedAt: new Date().toISOString(),
  budgetBefore: budget(),
  evaluatorHash: createHash('sha256')
    .update(readFileSync(import.meta.path))
    .digest('hex'),
};
if (report.results.some((r: any) => !r)) throw new Error('Missing paired skill result');
writeFileSync(
  `.data/configs/${report.evaluatorHash}.json`,
  JSON.stringify({
    script: readFileSync(import.meta.path, 'utf8'),
    policySourceHash: source.sourceHash,
  }),
);
function persist() {
  report.summary = Object.fromEntries(
    report.policies.map((policy: string) => {
      const rs = report.results.filter((r: any) => r.policy === policy);
      const latencies = rs
        .flatMap((r: any) =>
          events(r.runId)
            .filter((e) => e.kind === 'decision')
            .map((e) => e.payload.elapsedMs),
        )
        .sort((a: number, b: number) => a - b);
      return [
        policy,
        {
          assigned: cases.length,
          completed: rs.length,
          solved: rs.filter((r: any) => r.verifiedSolved).length,
          requests: rs.reduce((n: number, r: any) => n + r.requests, 0),
          turns: rs.reduce((n: number, r: any) => n + r.turns, 0),
          inputTokens: rs.reduce((n: number, r: any) => n + r.tokens, 0),
          cost: rs.reduce((n: number, r: any) => n + r.cost, 0),
          activeMs: rs.reduce((n: number, r: any) => n + r.activeMs, 0),
          recoveryDecisions: rs.reduce((n: number, r: any) => n + r.recovery, 0),
          requestLatencyMs: {
            p50: latencies[Math.floor(latencies.length * 0.5)] ?? null,
            p95: latencies[Math.floor(latencies.length * 0.95)] ?? null,
          },
          failures: rs
            .filter((r: any) => !r.verifiedSolved)
            .map((r: any) => ({ caseId: r.caseId, stage: r.stage, reason: r.reason })),
        },
      ];
    }),
  );
  report.budgetAfter = budget();
  db.query('INSERT OR REPLACE INTO benchmarks VALUES (?,?)').run(report.id, JSON.stringify(report));
  writeFileSync(`.data/reports/${report.id}.json`, JSON.stringify(report, null, 2));
}
persist();
for (const c of cases) {
  const r = await createRun(c.scramble, 'primitive', 'comparison', report.id);
  report.assignments.push({ caseId: c.id, runId: r.id });
}
persist();
const stop = () => {
  for (const a of report.assignments) {
    try {
      controlRun(a.runId, 'stop');
    } catch {}
  }
};
process.once('SIGTERM', stop);
process.once('SIGINT', stop);
await Promise.all(
  report.assignments.map(async (a: any) => {
    let r = getRun(a.runId),
      verifiedSolved = false;
    try {
      r = await finish(a.runId);
      verifiedSolved =
        r.status === 'solved' &&
        !events(r.id).some((e) => e.kind === 'control') &&
        isSolved(await apply(await solved(), [r.scramble, ...r.history].join(' ')));
    } catch (error) {
      r = getRun(a.runId);
      r.status = 'error';
      r.reason = String(error);
      saveRun(r);
    }
    const result = {
      caseId: a.caseId,
      policy: 'primitive',
      runId: r.id,
      status: r.status,
      verifiedSolved,
      stage: r.stage,
      requests: r.requests,
      turns: r.turns,
      tokens: r.tokens,
      cost: r.cost,
      activeMs: r.activeMs,
      recovery: events(r.id).filter((e) => e.kind === 'recovery').length,
      reason: r.reason,
    };
    report.results.push(result);
    persist();
    console.log(JSON.stringify(result));
  }),
);
process.off('SIGTERM', stop);
process.off('SIGINT', stop);
report.status = 'complete';
report.finishedAt = new Date().toISOString();
persist();
console.log(
  JSON.stringify({ id: report.id, summary: report.summary, budget: report.budgetAfter }, null, 2),
);
