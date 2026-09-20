import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
export const getLab = createServerFn({ method: 'GET' }).handler(async () => {
  const [r, j, s] = await Promise.all([import('./runner'), import('./jev'), import('./store')]);
  return {
    runs: r.listRuns(),
    budget: j.budget(),
    activity: (
      s.db
        .query(
          "SELECT COUNT(DISTINCT id) count FROM (SELECT id FROM runs WHERE json_extract(json,'$.status')='running' UNION SELECT run_id id FROM locks WHERE expires>?)",
        )
        .get(Date.now()) as { count: number }
    ).count,
    benchmarks: (
      s.db.query('SELECT json FROM benchmarks ORDER BY rowid DESC LIMIT 20').all() as {
        json: string;
      }[]
    ).map((x) => JSON.parse(x.json)),
  };
});
export const getDetail = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string(), after: z.number().int().min(0).default(0) }))
  .handler(async ({ data }) => {
    const r = await import('./runner');
    return { run: r.getRun(data.id), events: r.events(data.id, data.after) };
  });
export const newRun = createServerFn({ method: 'POST' })
  .validator(z.object({ scramble: z.string().max(1000), policy: z.enum(['skills', 'primitive']) }))
  .handler(async ({ data }) => (await import('./runner')).createRun(data.scramble, data.policy));
export const stepRun = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string(), revision: z.number().int(), command: z.string().uuid() }))
  .handler(async ({ data }) =>
    (await import('./runner')).step(data.id, data.revision, data.command),
  );
export const setControl = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string(), action: z.enum(['start', 'pause', 'stop']) }))
  .handler(async ({ data }) => (await import('./runner')).controlRun(data.id, data.action));
export const generateScramble = createServerFn({ method: 'POST' }).handler(async () => {
  const { randomScrambleForEvent } = await import('cubing/scramble');
  return (await randomScrambleForEvent('333')).toString();
});

export const stopAllRuns = createServerFn({ method: 'POST' }).handler(async () => {
  const r = await import('./runner');
  const s = await import('./store');
  const ids = (
    s.db
      .query(
        "SELECT id FROM runs WHERE json_extract(json,'$.status')='running' UNION SELECT run_id id FROM locks WHERE expires>?",
      )
      .all(Date.now()) as { id: string }[]
  ).map((x) => x.id);
  // Cancel the queued portion of resumable evaluations as well as active calls.
  for (const row of s.db.query('SELECT id,json FROM benchmarks').all() as {
    id: string;
    json: string;
  }[]) {
    const report = JSON.parse(row.json);
    if (!report.assignments || !['pending', 'running'].includes(report.status)) continue;
    report.cancelRequested = true;
    report.status = 'cancelled';
    s.db.query('UPDATE benchmarks SET json=? WHERE id=?').run(JSON.stringify(report), row.id);
    for (const a of report.assignments) {
      if (!report.results.some((result: { runId: string }) => result.runId === a.runId))
        ids.push(a.runId);
    }
  }
  for (const id of new Set(ids)) {
    try {
      r.controlRun(id, 'stop');
    } catch {}
  }
  return { stopped: new Set(ids).size };
});
