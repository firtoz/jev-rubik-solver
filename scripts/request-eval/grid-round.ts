import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { gridRequest, faceCell } from './grid-prediction';
import { fixtures } from './move-prediction';
import { evaluate, budget } from '../../src/server/jev';
import { createRun } from '../../src/server/runner';
import { getRun, saveRun } from '../../src/server/store';
const variants = {
  baseline: '',
  paper:
    'Treat this as a paper square lying flat on the screen. X is fixed to the paper. The viewer and screen directions remain stationary while the paper rotates. Follow the marker around the center, then report its final SCREEN position. Clockwise and counterclockwise describe the paper motion, not a change of camera. For a half turn the paper is upside down. First decide whether the piece is affected using the supplied previous model answer; if no choose unaffected.',
  clock:
    'Imagine the diagram as the face of a clock viewed straight on. X moves around the center as the clock face itself turns. Clockwise follows the motion of clock hands; counterclockwise goes the other way. A quarter turn is one fourth of a complete revolution; a half turn is one half. Choose the final location of X relative to the stationary screen. If the supplied previous model answer says the piece is unaffected, choose unaffected.',
};
const round = process.argv.includes('--round2') ? 2 : 1;
const dir = `experiments/grid-search-round-${round}`;
if (existsSync(`${dir}/started.json`)) throw new Error('Already started');
const cases = await fixtures();
const prior = JSON.parse(
  readFileSync('experiments/grid-prediction-v4-development/results.json', 'utf8'),
);
const budgetBefore = budget();
if (budgetBefore.cap - budgetBefore.reservedAndSpent < (60 * 64000 * 0.042) / 1e6)
  throw new Error('Budget');
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/source.ts`, readFileSync(import.meta.path));
writeFileSync(
  `${dir}/started.json`,
  JSON.stringify(
    {
      round,
      budgetBefore,
      variants: Object.keys(variants),
      concurrency: 3,
      cases: 20,
      maxRequests: 60,
      primaryMetric: 'exact resulting grid cell',
      minimumDevelopmentGain: 2,
      plateauRule:
        'Change representation after two rounds with no improvement of at least 2/20; validate a winner on fresh cases.',
      membership:
        'Actual cached v4 model answers supplied unchanged to every variant. This round isolates grid prediction.',
    },
    null,
    2,
  ),
);
const results: any[] = [];
function persist() {
  const summary = Object.keys(variants).map((variant) => {
    const r = results.filter((r) => r.variant === variant);
    return {
      variant,
      total: 20,
      completed: r.length,
      correct: r.filter((r) => r.correct).length,
      errors: r.filter((r) => r.error).length,
      cost: r.reduce((n, r) => n + (r.exchange?.cost || 0), 0),
    };
  });
  writeFileSync(`${dir}/results.json`, JSON.stringify({ summary, results }, null, 2));
  console.log(JSON.stringify(summary));
}
await Promise.all(
  Object.entries(variants).map(async ([variant, instructions]) => {
    for (const c of cases) {
      const cached = prior.results.find((r: any) => r.caseId === c.id);
      const membership = cached.exchanges[0].response.answers.affected.choice;
      const request = gridRequest(c.request, membership);
      if (instructions && round === 1) request.questions.cell.instructions = instructions;
      if (round === 2 && variant !== 'baseline') {
        request.questions.cell.instructions +=
          variant === 'paper'
            ? ' Work out the horizontal and vertical destination separately, then choose the cell that matches both. Do not stop at an intermediate quarter turn when a half turn is requested.'
            : ' Check that the final answer preserves whether X is a corner or an edge-center. Confirm the rotation direction from the fixed viewer before choosing.';
      }
      const run = await createRun(c.scramble, 'primitive', 'grid-variant-development');
      const expected = c.affected
        ? faceCell(c.expected.position, (c.request.state as any).proposedTurn[0])
        : 'unaffected';
      let row: any = { caseId: c.id, variant, runId: run.id, expected, membership };
      try {
        const exchange = await evaluate(run.id, request, AbortSignal.timeout(30000), {
          maxAttempts: 1,
        });
        row = {
          ...row,
          actual: exchange.response.answers.cell.choice,
          correct: exchange.response.answers.cell.choice === expected,
          exchange,
        };
      } catch (e) {
        row.error = String(e);
      }
      results.push(row);
      const saved = getRun(run.id);
      saved.status = 'stopped';
      saved.reason = 'Grid variant experiment complete';
      saveRun(saved);
      persist();
    }
  }),
);
