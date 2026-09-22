import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { selectGoal } from './progress-goal';
import { evaluate, budget } from '../../src/server/jev';
import { createRun } from '../../src/server/runner';
import { getRun, saveRun } from '../../src/server/store';
const dir = 'experiments/progress-goal-handoff';
if (existsSync(`${dir}/started.json`)) throw new Error('Already started');
const cases = JSON.parse(
  readFileSync('experiments/progress-goal-development/fixtures.json', 'utf8'),
);
const recorded = JSON.parse(
  readFileSync('experiments/progress-goal-development/round-2/results.json', 'utf8'),
).results.filter((r: any) => r.variant === 'regional');
const variants = ['regional', 'regional:handoff', 'regional:compact'];
const start = budget();
if (start.cap - start.reservedAndSpent < (60 * 64000 * 0.042) / 1e6) throw new Error('Budget');
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/source.ts`, readFileSync(import.meta.path));
writeFileSync(`${dir}/request-source.ts`, readFileSync('scripts/request-eval/progress-goal.ts'));
writeFileSync(
  `${dir}/started.json`,
  JSON.stringify(
    {
      at: new Date().toISOString(),
      variants,
      start,
      maxRequests: 60,
      scope:
        'New isolated handoff experiment after two broader development rounds. Actual cached regional-model progress used unchanged; includes its recognition error. Compare goal input scopes on identical cases.',
    },
    null,
    2,
  ),
);
const results: any[] = [];
const persist = () => {
  const summary = variants.map((variant) => {
    const rs = results.filter((r) => r.variant === variant);
    return {
      variant,
      completed: rs.length,
      total: 20,
      correct: rs.filter((r) => r.correct).length,
      wrongDespiteCorrectRecognition: rs.filter((r) => r.recognitionAll && !r.correct).length,
      cost: rs.reduce((n, r) => n + (r.exchange?.cost || 0), 0),
    };
  });
  writeFileSync(`${dir}/results.json`, JSON.stringify({ summary, results }, null, 2));
  return summary;
};
await Promise.all(
  variants.map(async (variant) => {
    for (const c of cases) {
      const prior = recorded.find((r: any) => r.caseId === c.id);
      const run = await createRun(c.scramble, 'primitive', 'goal-handoff');
      let row: any = {
        caseId: c.id,
        variant,
        accepted: c.accepted,
        recognitionAll: prior.recognitionAll,
        recognized: prior.recognized,
        runId: run.id,
      };
      try {
        const d = await evaluate(
          run.id,
          selectGoal(c.observation, variant, prior.recognized),
          AbortSignal.timeout(30000),
          { maxAttempts: 1 },
        );
        row.exchange = d;
        row.actual = d.response.answers.goal.choice;
        row.correct = c.accepted.includes(row.actual);
      } catch (e) {
        row.error = String(e);
      }
      results.push(row);
      const saved = getRun(run.id);
      saved.status = 'stopped';
      saved.reason = 'Isolated goal handoff probe';
      saveRun(saved);
      persist();
    }
    console.log(JSON.stringify(persist()));
  }),
);
