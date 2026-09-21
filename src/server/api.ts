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

export const articleCreate = createServerFn({ method: 'POST' })
  .validator(z.object({ scramble: z.string().max(1000) }))
  .handler(async ({ data }) =>
    JSON.stringify(await (await import('./tutorial')).createSession(data.scramble)),
  );
export const articleRead = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) =>
    JSON.stringify(await (await import('./tutorial')).viewSession(data.id)),
  );
export const articleAdvance = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.string().uuid(),
      revision: z.number().int().min(0),
      command: z.string().uuid(),
      action: z.enum(['ask', 'apply']),
    }),
  )
  .handler(async ({ data }) =>
    JSON.stringify(
      await (
        await import('./tutorial')
      ).advanceSession(data.id, data.revision, data.command, data.action),
    ),
  );
export const articleEvidence = createServerFn({ method: 'GET' }).handler(async () => {
  const { readFileSync, existsSync } = await import('node:fs');
  const { getRun, events } = await import('./store');
  const fresh = 'experiments/article-fresh-comparison.json';
  const report = JSON.parse(
    readFileSync(existsSync(fresh) ? fresh : 'experiments/v26-primitive-comparison.json', 'utf8'),
  );
  return JSON.stringify(
    report.policies.map((policy: string) => {
      const result = report.results.find(
        (r: any) => r.policy === policy && r.caseId === report.cases[0].id,
      );
      const run = getRun(result.runId);
      const saved = events(run.id);
      const start = saved.find((e) => e.kind === 'step-start' || e.kind === 'request');
      const origin = start ? Date.parse(start.createdAt) : 0;
      return {
        policy,
        result,
        scramble: run.scramble,
        durationMs: Math.max(0, Date.parse(saved.at(-1)!.createdAt) - origin),
        costs: saved
          .filter((e) => e.kind === 'decision')
          .map((e) => ({
            ms: Math.max(0, Date.parse(e.createdAt) - origin),
            cost: e.payload.cost as number,
          })),
        timeline: saved
          .filter((e) => e.kind === 'action')
          .map((e) => ({
            alg: e.payload.alg as string,
            ms: Math.max(0, Date.parse(e.createdAt) - origin),
          })),
        actions: saved.filter((e) => e.kind === 'action').map((e) => e.payload.alg),
        firstRequest: events(run.id).find(
          (e) =>
            e.kind === 'request' &&
            (policy === 'primitive'
              ? e.payload.request.questions.turn
              : e.payload.request.questions.goal),
        )?.payload.request,
      };
    }),
  );
});
