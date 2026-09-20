// Resumable, frozen evaluation: at most four assigned runs per invocation.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRun, finish, controlRun } from '../src/server/runner';
import { db, events, getRun, saveRun } from '../src/server/store';
import { budget, MODEL } from '../src/server/jev';
import { apply, solved, hash, isSolved } from '../src/lib/cube';
import { VERSION, LIMITS } from '../src/lib/types';
import { SKILL_VERSION } from '../src/lib/skills';
const [mode, arg] = process.argv.slice(2);
const paths = [
  'src/server/runner.ts',
  'src/server/skill-policy.ts',
  'src/server/goal-policy.ts',
  'src/server/jev.ts',
  'src/server/store.ts',
  'src/lib/cube.ts',
  'src/lib/skills.ts',
  'src/lib/types.ts',
  'scripts/evaluate.ts',
];
const source = Object.fromEntries(paths.map((p) => [p, readFileSync(p, 'utf8')]));
const sourceHash = createHash('sha256').update(JSON.stringify(source)).digest('hex');
mkdirSync('.data/configs', { recursive: true });
mkdirSync('.data/reports', { recursive: true });
let report: any;
if (mode === 'begin') {
  const dataset = JSON.parse(readFileSync(arg, 'utf8'));
  if (!['validation', 'final-test'].includes(dataset.split))
    throw new Error('Use validation or final-test data');
  if (dataset.split === 'final-test' && dataset.cases.length !== 100)
    throw new Error('Final evaluation requires exactly 100 cases');
  const old = (db.query('SELECT json FROM benchmarks').all() as { json: string }[]).map((x) =>
    JSON.parse(x.json),
  );
  if (old.some((x) => x.datasetId === dataset.id)) throw new Error('Dataset already consumed');
  const exposed = new Set<string>();
  for (const row of db
    .query(
      "SELECT payload FROM events WHERE kind IN ('created','action','probe-created','checkpoint')",
    )
    .all() as { payload: string }[]) {
    const p = JSON.parse(row.payload);
    for (const state of [p.state, p.before, p.after]) if (state?.EDGES) exposed.add(hash(state));
  }
  for (const c of dataset.cases) {
    const h = hash(await apply(await solved(), c.scramble));
    if (exposed.has(h)) throw new Error('Dataset overlaps previously exposed or duplicate state');
    exposed.add(h);
  }
  report = {
    id: crypto.randomUUID(),
    name: dataset.split === 'final-test' ? 'Frozen held-out skill evaluation' : 'Frozen validation',
    split: dataset.split,
    datasetId: dataset.id,
    cases: dataset.cases,
    policies: ['skills'],
    version: VERSION + '/' + SKILL_VERSION,
    model: MODEL,
    limits: LIMITS,
    stopRule:
      'After each four-case batch, retire a final evaluation if more than five attempts failed: 95/100 is then impossible. Preserve unattempted cases separately.',
    sourceHash,
    status: 'pending',
    startedAt: new Date().toISOString(),
    results: [],
    assignments: [],
    budgetBefore: budget(),
  };
  writeFileSync(`.data/configs/${sourceHash}.json`, JSON.stringify(source));
  db.query('INSERT INTO benchmarks VALUES (?,?)').run(report.id, JSON.stringify(report));
  for (const c of dataset.cases) {
    const r = await createRun(c.scramble, 'skills', dataset.split, report.id);
    report.assignments.push({ caseId: c.id, runId: r.id });
    db.query('UPDATE benchmarks SET json=? WHERE id=?').run(JSON.stringify(report), report.id);
  }
} else if (mode === 'batch') {
  const row = db.query('SELECT json FROM benchmarks WHERE id=?').get(arg) as {
    json: string;
  } | null;
  if (!row) throw new Error('Unknown evaluation');
  report = JSON.parse(row.json);
  if (report.sourceHash !== sourceHash)
    throw new Error(
      'Frozen evaluation source changed; retire this dataset, do not resume with a tuned policy',
    );
  if (report.cancelRequested || report.status === 'cancelled')
    throw new Error('Evaluation was cancelled');
  if (report.status === 'complete') throw new Error('Evaluation already complete');
  if (report.assignments.length !== report.cases.length)
    throw new Error('Incomplete assignment manifest');
} else throw new Error('Use begin DATASET.json or batch BENCHMARK_ID');
function persist() {
  const current = JSON.parse(
    (db.query('SELECT json FROM benchmarks WHERE id=?').get(report.id) as any).json,
  );
  if (current.cancelRequested) {
    report.cancelRequested = true;
    report.status = report.retirementReason || current.retirementReason ? 'retired' : 'cancelled';
  }
  if (current.retirementReason) report.retirementReason = current.retirementReason;
  const rs = report.results;
  const latencies = rs
    .flatMap((r: any) =>
      events(r.runId)
        .filter((e) => e.kind === 'decision')
        .map((e) => e.payload.elapsedMs),
    )
    .sort((a: number, b: number) => a - b);
  report.summary = {
    skills: {
      assigned: report.cases.length,
      completed: rs.length,
      remaining: report.cases.length - rs.length,
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
  };
  report.budgetAfter = budget();
  db.query('UPDATE benchmarks SET json=? WHERE id=?').run(JSON.stringify(report), report.id);
  writeFileSync(`.data/reports/${report.id}.json`, JSON.stringify(report, null, 2));
}
persist();
console.log(JSON.stringify({ id: report.id, status: report.status, summary: report.summary }));
if (mode === 'begin') process.exit(0);
const pending = report.assignments
  .filter((a: any) => !report.results.some((r: any) => r.runId === a.runId))
  .slice(0, 4);
const stop = () => {
  report.cancelRequested = true;
  persist();
  for (const a of pending) {
    try {
      controlRun(a.runId, 'stop');
    } catch {}
  }
};
process.once('SIGTERM', stop);
process.once('SIGINT', stop);
report.status = 'running';
persist();
await Promise.all(
  pending.map(async (a: any) => {
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
    const row = {
      caseId: a.caseId,
      policy: r.policy,
      runId: r.id,
      status: r.status,
      verifiedSolved,
      autonomous: !events(r.id).some((e) => e.kind === 'control'),
      stage: r.stage,
      requests: r.requests,
      turns: r.turns,
      tokens: r.tokens,
      cost: r.cost,
      activeMs: r.activeMs,
      recovery: events(r.id).filter((e) => e.kind === 'recovery').length,
      reason: r.reason,
    };
    report.results.push(row);
    persist();
    console.log(JSON.stringify(row));
  }),
);
process.off('SIGTERM', stop);
process.off('SIGINT', stop);
if (
  report.split === 'final-test' &&
  report.results.filter((r: any) => !r.verifiedSolved).length > 5
) {
  report.cancelRequested = true;
  report.retirementReason =
    'More than five failures: 95/100 is impossible. Remaining cases were not attempted.';
  report.retiredAt = new Date().toISOString();
}
report.status = report.cancelRequested
  ? report.retirementReason
    ? 'retired'
    : 'cancelled'
  : report.results.length === report.cases.length
    ? 'complete'
    : 'pending';
report.accepted =
  report.split === 'final-test' &&
  report.status === 'complete' &&
  report.results.filter((r: any) => r.verifiedSolved).length >= 95;
if (report.status === 'complete') report.finishedAt = new Date().toISOString();
persist();
console.log(
  JSON.stringify({
    id: report.id,
    status: report.status,
    accepted: report.accepted,
    summary: report.summary,
  }),
);
