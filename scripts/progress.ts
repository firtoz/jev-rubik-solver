// Offline progress: reads persisted metrics; never dispatches model requests.
import { db, getRun } from '../src/server/store';
import { budget } from '../src/server/jev';
const id = process.argv[2];
const row = (
  id
    ? db.query('SELECT json FROM benchmarks WHERE id=?').get(id)
    : db.query('SELECT json FROM benchmarks ORDER BY rowid DESC LIMIT 1').get()
) as { json: string } | null;
if (!row) throw new Error('No matching evaluation');
const report = JSON.parse(row.json);
const runs = (report.assignments ?? []).map((a: { runId: string }) => getRun(a.runId));
console.log(
  JSON.stringify(
    {
      id: report.id,
      status: report.status,
      accepted: report.accepted ?? false,
      summary: report.summary,
      active: runs
        .filter((r: { status: string }) => r.status === 'running')
        .map((r: { id: string; stage: string; requests: number; turns: number }) => ({
          id: r.id,
          stage: r.stage,
          requests: r.requests,
          turns: r.turns,
        })),
      budget: budget(),
    },
    null,
    2,
  ),
);
