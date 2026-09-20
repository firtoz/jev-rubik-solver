import { db, events, getRun } from '../src/server/store';
import { hash, stageProgress, pieces } from '../src/lib/cube';
const id = process.argv[2];
if (!id) throw new Error('Pass a benchmark id or run id');
const row = db.query('SELECT json FROM benchmarks WHERE id=?').get(id) as { json: string } | null;
const report = row ? JSON.parse(row.json) : null;
const runIds = report ? report.results.map((r: any) => r.runId) : [id];
const measurements = runIds.map((runId: string) => {
  const r = getRun(runId),
    es = events(runId),
    actions = es.filter((e) => e.kind === 'action');
  const stages: Record<string, any> = {};
  const seen = new Set<string>();
  let repeatedStates = 0,
    unfinishedTargetSwitches = 0;
  for (let i = 0; i < actions.length; i++) {
    const a = actions[i].payload;
    const stage = (stages[a.stageBefore] ??= {
      actions: 0,
      turns: 0,
      progressGains: 0,
      progressLosses: 0,
      neutralActions: 0,
    });
    stage.actions++;
    stage.turns += a.alg.split(/\s+/).filter(Boolean).length;
    const delta = stageProgress(a.after, a.stageBefore) - stageProgress(a.before, a.stageBefore);
    if (delta > 0) stage.progressGains++;
    else if (delta < 0) stage.progressLosses++;
    else stage.neutralActions++;
    if (seen.has(hash(a.after))) repeatedStates++;
    seen.add(hash(a.after));
    const prev = actions[i - 1]?.payload;
    if (
      prev &&
      prev.stageAfter === a.stageBefore &&
      prev.target !== a.target &&
      prev.target !== 'whole'
    ) {
      const p = pieces(a.before).find((p) => p.piece === prev.target);
      if (p && !(a.stageBefore === 'daisy' ? p.stickers.yellow === 'U' : p.solved))
        unfinishedTargetSwitches++;
    }
  }
  return {
    runId,
    status: r.status,
    policy: r.policy,
    version: r.version,
    requests: r.requests,
    turns: r.turns,
    cost: r.cost,
    repeatedStates,
    unfinishedTargetSwitches,
    recoveries: es.filter((e) => e.kind === 'recovery').length,
    reason: r.reason,
    stages,
  };
});
console.log(
  JSON.stringify(
    {
      benchmark: report?.id ?? null,
      assigned: report?.cases.length ?? 1,
      completed: measurements.length,
      measurements,
    },
    null,
    2,
  ),
);
