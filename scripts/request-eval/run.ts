import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fixtures } from './cases';
import { wording, variants, type Variant } from './variants';
import { evaluate, budget } from '../../src/server/jev';
import { db, event, saveRun } from '../../src/server/store';

const split = process.argv.includes('--validation') ? 'validation' : 'development';
const names = (process.argv
  .find((a) => a.startsWith('--variants='))
  ?.slice(11)
  .split(',') ?? Object.keys(variants)) as Variant[];
if (names.some((n) => !(n in variants))) throw new Error('Unknown variant');
const label = process.argv.find((a) => a.startsWith('--id='))?.slice(5) ?? 'assessment-unique-v1';
if (!/^[a-z0-9-]+$/.test(label)) throw new Error('Invalid experiment ID');
const live = process.argv.includes('--live');
const repeats = 1;
const cases = (await fixtures()).filter((f) => f.split === split);
const sourcePaths = [
  'scripts/request-eval/cases.ts',
  'scripts/request-eval/variants.ts',
  'scripts/request-eval/run.ts',
  'src/server/skill-policy.ts',
  'src/lib/cube.ts',
  'src/lib/skills.ts',
];
const frozen = {
  label,
  split,
  repeats,
  model: 'jev-1.13.0',
  variants: names,
  selection:
    'Maximise whole-request exact-match rate. Also report chosen-target intention and each case. Equal scores are a plateau, not proof of improvement. Validation is evaluated once after selection; never used for further tuning.',
  limitations:
    'Twenty distinct states per split, one call per state per variant. Development mixes single turns and 4/5/10-turn scrambles; validation uses separate fixed-seed 5/10-turn scrambles. These measure cross-assessment accuracy only, not full-solve reliability.',
  ceiling: {
    requests: cases.length * repeats * names.length,
    additionalDollars: 0.15,
    concurrency: 4,
    retries: 0,
  },
  heldOutManifest: (await fixtures())
    .filter((f) => f.split === 'validation')
    .map((f) => ({ id: f.id, scramble: f.run.scramble, state: f.run.state, accepted: f.accepted })),
  cases: cases.map((f) => ({
    ...f,
    requests: Object.fromEntries(names.map((n) => [n, wording(f.request, n)])),
  })),
  sources: Object.fromEntries(sourcePaths.map((p) => [p, readFileSync(p, 'utf8')])),
};
const fingerprint = createHash('sha256').update(JSON.stringify(frozen)).digest('hex');
const dir = `experiments/${label}-${split}`;
mkdirSync(dir, { recursive: true });
if (!live) {
  writeFileSync(dir + '/preview.json', JSON.stringify({ fingerprint, ...frozen }, null, 2));
  console.log(
    JSON.stringify({
      dir,
      cases: cases.length,
      variants: names,
      requests: frozen.ceiling.requests,
      live: false,
    }),
  );
  process.exit(0);
}
if (
  (
    db
      .query("SELECT COUNT(*) n FROM runs WHERE json_extract(json,'$.status')='running'")
      .get() as any
  ).n ||
  (db.query('SELECT COUNT(*) n FROM locks WHERE expires>?').get(Date.now()) as any).n
)
  throw new Error('Another run is active. Stop it before isolated evaluation.');
writeFileSync(dir + '/live.lock', fingerprint, { flag: 'wx' });
writeFileSync(dir + '/frozen.json', JSON.stringify({ fingerprint, ...frozen }, null, 2));
const start = budget();
const results: any[] = [];
const jobs: { fixture: (typeof cases)[number]; variant: Variant; repeat: number; runId: string }[] =
  [];
const runs = new Map<string, string>();
for (const f of cases)
  for (const n of names) {
    const id = crypto.randomUUID();
    saveRun({ ...f.run, id, createdAt: new Date().toISOString() });
    event(id, 'probe-created', { fingerprint, fixture: f.id, variant: n, state: f.run.state });
    runs.set(f.id + n, id);
  }
for (let repeat = 0; repeat < repeats; repeat++)
  for (let c = 0; c < cases.length; c++) {
    // Rotate ordering across repeats and cases to spread temporal effects.
    for (let j = 0; j < names.length; j++) {
      const variant = names[(j + repeat + c) % names.length];
      jobs.push({ fixture: cases[c], variant, repeat, runId: runs.get(cases[c].id + variant)! });
    }
  }
let cursor = 0,
  stopReason: string | null = null;
function summarise() {
  return Object.fromEntries(
    names.map((name) => {
      const rows = results.filter((r) => r.variant === name);
      return [
        name,
        {
          attempted: rows.length,
          planned: cases.length * repeats,
          correct: rows.filter((r) => r.correct).length,
          rate: rows.length ? rows.filter((r) => r.correct).length / rows.length : null,
          selectedTargetAndIntentCorrect: rows.filter((r) => r.selectedCorrect).length,
          errors: rows.filter((r) => r.error).length,
          cost: rows.reduce((a, r) => a + (r.cost ?? 0), 0),
          inputTokens: rows.reduce((a, r) => a + (r.inputTokens ?? 0), 0),
          cases: Object.fromEntries(
            cases.map((f) => {
              const xs = rows.filter((r) => r.fixture === f.id);
              return [
                f.id,
                {
                  correct: xs.filter((r) => r.correct).length,
                  attempted: xs.length,
                  answerPatterns: [...new Set(xs.map((r) => JSON.stringify(r.choices)))],
                  failures: xs.filter((r) => !r.correct).map((r) => r.wrong ?? r.error),
                },
              ];
            }),
          ),
        },
      ];
    }),
  );
}
function persist() {
  writeFileSync(
    dir + '/results.json',
    JSON.stringify(
      {
        fingerprint,
        split,
        status: stopReason ? 'stopped' : results.length === jobs.length ? 'complete' : 'running',
        stopReason,
        planned: jobs.length,
        attempted: results.length,
        unattempted: jobs.length - results.length,
        start,
        end: budget(),
        summary: summarise(),
        results,
      },
      null,
      2,
    ),
  );
}
process.on('SIGINT', () => {
  stopReason = 'User interrupted; finish current requests only';
});
process.on('SIGTERM', () => {
  stopReason = 'Interrupted; finish current requests only';
});
async function worker() {
  while (!stopReason && cursor < jobs.length) {
    if (budget().reservedAndSpent - start.reservedAndSpent + (64000 * 0.042) / 1e6 > 0.15) {
      stopReason = 'Local experiment cost cap';
      break;
    }
    const job = jobs[cursor++];
    const { fixture: f, variant, repeat, runId } = job;
    const request = wording(f.request, variant);
    let row: any = { fixture: f.id, variant, repeat, runId };
    try {
      const d = await evaluate(runId, request, AbortSignal.timeout(35000), { maxAttempts: 1 });
      const choices = Object.fromEntries(
        Object.entries(d.response.answers).map(([id, a]) => [id, a.choice]),
      );
      const wrong = Object.entries(f.accepted)
        .filter(([id, allowed]) => !allowed.includes(choices[id]))
        .map(([id, expected]) => ({ question: id, expected, actual: choices[id] }));
      row = {
        ...row,
        correct: wrong.length === 0,
        selectedCorrect:
          f.accepted.target.includes(choices.target) &&
          f.accepted['intent_' + choices.target]?.includes(choices['intent_' + choices.target]),
        choices,
        wrong,
        decisionId: d.id,
        cost: d.cost,
        inputTokens: d.response.usage.input_tokens,
        elapsedMs: d.elapsedMs,
        confidence: Object.fromEntries(
          Object.entries(d.response.answers).map(([id, a]) => [id, a.confidence]),
        ),
      };
    } catch (error) {
      row = { ...row, correct: false, selectedCorrect: false, error: String(error) };
      stopReason = 'Request failed; no retry, retained in denominator';
    }
    results.push(row);
    event(runId, 'request-eval-result', row);
    persist();
    if (results.length % 40 === 0)
      console.log(
        JSON.stringify({
          completed: results.length,
          planned: jobs.length,
          cost: budget().usage - start.usage,
        }),
      );
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
persist();
console.log(
  JSON.stringify({
    dir,
    stopReason,
    summary: summarise(),
    additionalCost: budget().usage - start.usage,
  }),
);
