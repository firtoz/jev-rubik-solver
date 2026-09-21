import { createRun, step } from '../src/server/runner';
import { db, getRun, saveRun, events, event } from '../src/server/store';
import { budget } from '../src/server/jev';
import { hash, facts, apply, solved, isSolved } from '../src/lib/cube';
import { VERSION } from '../src/lib/types';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const args = process.argv.slice(2);
const dataset = args[0] === '--dataset' ? JSON.parse(readFileSync(args[1], 'utf8')) : null;
if (dataset && !['development', 'validation'].includes(dataset.split))
  throw new Error(
    'Diagnostic runner accepts development/validation only; use lab final for held-out evaluation.',
  );
const scrambles =
  args[0] === '--dataset'
    ? JSON.parse(readFileSync(args[1], 'utf8')).cases.map((c: { scramble: string }) => c.scramble)
    : args[0] === '--from'
      ? (() => {
          const row = db.query('SELECT id FROM runs WHERE id LIKE ?').get(args[1] + '%') as {
            id: string;
          };
          const source = getRun(row.id);
          return [[source.scramble, ...source.history.slice(0, Number(args[2]))].join(' ')];
        })()
      : args.length
        ? args
        : ['R', 'R U', "F' U F U"];
const start = budget(),
  results = [];
const batch = crypto.randomUUID();
mkdirSync('.data/iterations', { recursive: true });
const source = Object.fromEntries(
  [
    'src/server/skill-policy.ts',
    'src/server/cross-intention.ts',
    'src/server/measured-policy.ts',
    'src/server/goal-policy.ts',
    'src/server/runner.ts',
    'src/lib/cube.ts',
    'src/lib/skills.ts',
    'src/lib/types.ts',
    'src/server/jev.ts',
  ].map((f) => [f, readFileSync(f, 'utf8')]),
);
const sourceHash = createHash('sha256').update(JSON.stringify(source)).digest('hex');
writeFileSync(`.data/iterations/${batch}-source.json`, JSON.stringify({ sourceHash, source }));
// Development diagnostic ceilings, intentionally smaller than final acceptance ceilings.
for (const scramble of scrambles) {
  const run = await createRun(scramble, 'skills', dataset?.split ?? 'development');
  const seen = new Map<string, number>();
  let count = 0;
  for (; count < 60; count++) {
    const r = getRun(run.id);
    if (['solved', 'stopped', 'error', 'capped', 'paused'].includes(r.status)) break;
    const h = hash(r.state),
      n = (seen.get(h) || 0) + 1;
    seen.set(h, n);
    if (n >= 3 || r.requests + 4 > 180 || r.cost >= 0.03) {
      r.status = 'capped';
      r.reason = n >= 3 ? 'Diagnostic repeated-state stop' : 'Diagnostic request/cost ceiling';
      saveRun(r);
      event(r.id, 'diagnostic-stop', { reason: r.reason });
      break;
    }
    await step(r.id, r.revision, crypto.randomUUID());
    const after = getRun(r.id);
    const action = events(r.id)
      .filter((e) => e.kind === 'action')
      .at(-1)?.payload;
    console.log(
      JSON.stringify({
        run: r.id.slice(0, 8),
        n: count + 1,
        stage: after.stage,
        target: action?.target,
        intent: action?.recognisedCase,
        front: action?.front,
        skill: action?.skill,
        alg: action?.alg,
        status: after.status,
        reason: after.reason,
        requests: after.requests,
        facts: facts(after.state),
      }),
    );
  }
  const r = getRun(run.id);
  if (r.status === 'ready') {
    r.status = 'capped';
    r.reason = 'Diagnostic 60-action ceiling';
    saveRun(r);
  }
  const verified = isSolved(await apply(await solved(), [scramble, ...r.history].join(' ')));
  results.push({
    runId: r.id,
    scramble,
    version: VERSION,
    verified,
    requests: r.requests,
    turns: r.turns,
    cost: r.cost,
    status: r.status,
    stage: r.stage,
    reason: r.reason,
  });
  writeFileSync(
    `.data/iterations/${batch}.json`,
    JSON.stringify(
      {
        batch,
        sourceHash,
        datasetId: dataset?.id ?? null,
        split: dataset?.split ?? 'development',
        assigned: scrambles.length,
        start,
        end: budget(),
        results,
      },
      null,
      2,
    ),
  );
  console.log('RESULT ' + JSON.stringify(results.at(-1)));
  // Stop the batch after a failure: inspect before repeating this policy elsewhere.
  if (!verified) break;
}
console.log(JSON.stringify({ batch, results, additionalCost: budget().usage - start.usage }));
