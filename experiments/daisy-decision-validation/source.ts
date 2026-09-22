import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fixtures, regionInput, goalInput, lesson } from './daisy-transition';
import { createRun } from '../../src/server/runner';
import { getRun, saveRun } from '../../src/server/store';
import { evaluate, MODEL, budget } from '../../src/server/jev';
import type { JevRequest } from '../../src/lib/types';
export function countRequest(checks: Record<string, string>): JevRequest {
  return {
    model: MODEL,
    state: { checks },
    questions: Object.fromEntries(
      ['petal', 'bottom'].map((prefix) => [
        prefix,
        {
          type: 'choice',
          instructions: `Count how many of ${prefix}1, ${prefix}2, ${prefix}3, ${prefix}4 are yes. Ignore the other four checks. Return the number of yes answers.`,
          criteria: Object.fromEntries(
            [0, 1, 2, 3, 4].map((n) => [
              String(n),
              `Exactly ${n} of the four ${prefix} checks are yes`,
            ]),
          ),
        },
      ]),
    ),
  };
}
export function decisionRequest(
  checks: Record<string, string>,
  variant: string,
  counts?: Record<string, string>,
): JevRequest {
  const state = counts
    ? {
        modelCounts: counts,
        meaning:
          'petal = number of yellow-up U edge petals; bottom = number of correctly solved D yellow edges. Model counts passed unchanged.',
      }
    : {
        modelChecks: checks,
        meaning:
          'petal1..4 say whether each U edge sticker is yellow. bottom1..4 say whether each D edge is correctly solved. Model checks passed unchanged.',
      };
  const explicit = variant !== 'counts-plain';
  return {
    model: MODEL,
    state,
    questions: {
      goal: {
        type: 'choice',
        instructions:
          lesson +
          ' ' +
          (counts
            ? 'Use modelCounts.'
            : 'Count yes values separately in the petal and bottom groups. Each yes represents a different yellow edge. A no is not an edge to count.'),
        criteria: explicit
          ? {
              'first-layer':
                'Choose when bottom count = 4. All bottom edges are solved; stop cross work.',
              cross:
                'Choose when bottom count < 4 AND petal count + bottom count = 4. All four yellow edges are either petals or already solved. Transfer the remaining petals.',
              daisy:
                'Choose when petal count + bottom count < 4. At least one yellow edge is neither a petal nor correctly solved. Gather the missing petals.',
            }
          : goalInput({}).questions.goal.criteria,
      },
    },
  };
}
async function main() {
  const validation = process.argv.includes('--validation');
  const variants = (
    process.argv.find((x) => x.startsWith('--variants='))?.split('=')[1] ??
    'checks-only,counts-plain,counts-rule'
  ).split(',');
  if (variants.some((v) => !['checks-only', 'counts-plain', 'counts-rule', 'direct'].includes(v)))
    throw new Error('Unknown variant');
  const dir = `experiments/daisy-decision-${validation ? 'validation' : 'development'}`;
  if (existsSync(`${dir}/started.json`)) throw new Error('Already started');
  const cases = validation
    ? await fixtures('validation')
    : JSON.parse(readFileSync('experiments/daisy-transition-development/fixtures.json', 'utf8'));
  const recorded = JSON.parse(
    readFileSync('experiments/daisy-transition-development/results.json', 'utf8'),
  ).results.filter((r: any) => r.variant === 'focused');
  const start = budget();
  const maxRequests =
    20 *
    variants.reduce(
      (n, v) => n + (v === 'direct' ? 1 : (v === 'checks-only' ? 1 : 2) + (validation ? 1 : 0)),
      0,
    );
  if (start.cap - start.reservedAndSpent < (maxRequests * 64000 * 0.042) / 1e6)
    throw new Error('Budget');
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/fixtures.json`, JSON.stringify(cases, null, 2));
  writeFileSync(`${dir}/source.ts`, readFileSync(import.meta.path));
  writeFileSync(
    `${dir}/recognition-source.ts`,
    readFileSync('scripts/request-eval/daisy-transition.ts'),
  );
  writeFileSync(
    `${dir}/started.json`,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        variants,
        maxRequests,
        start,
        validation,
        scope: validation
          ? 'Fresh complete pipelines, original direct comparator'
          : 'Second development round: recorded focused model checks passed unchanged; no recognition calls repeated. Score decisions and model counts separately.',
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
        recognitionAll: rs.filter((r) => r.recognitionAll).length,
        countsCorrect: rs.filter((r) => r.countsCorrect).length,
        wrongDespiteCorrectCounts: rs.filter((r) => r.countsCorrect && !r.correct).length,
        errors: rs.filter((r) => r.error).length,
        requests: rs.reduce((n, r) => n + r.exchanges.length, 0),
        cost: rs.flatMap((r) => r.exchanges).reduce((n, d) => n + d.cost, 0),
      };
    });
    writeFileSync(`${dir}/results.json`, JSON.stringify({ summary, results }, null, 2));
    return summary;
  };
  await Promise.all(
    variants.map(async (variant) => {
      for (const c of cases) {
        const run = await createRun(c.scramble, 'primitive', 'daisy-decision');
        const row: any = {
          caseId: c.id,
          category: c.category,
          variant,
          expected: c.expected,
          runId: run.id,
          exchanges: [],
        };
        try {
          const ask = async (req: JevRequest) => {
            const d = await evaluate(run.id, req, AbortSignal.timeout(30000), { maxAttempts: 1 });
            row.exchanges.push(d);
            return Object.fromEntries(
              Object.entries(d.response.answers).map(([k, a]) => [k, a.choice]),
            );
          };
          if (variant === 'direct') row.actual = (await ask(goalInput(c.observation))).goal;
          else {
            const checks = validation
              ? await ask(regionInput(c.observation, true))
              : recorded.find((r: any) => r.caseId === c.id).checks;
            row.checks = checks;
            row.recognitionAll = Object.keys(c.checks).every((k) => checks[k] === c.checks[k]);
            let counts: Record<string, string> | undefined;
            if (variant.startsWith('counts-')) {
              counts = await ask(countRequest(checks));
              row.counts = counts;
              row.countsCorrect =
                counts.petal === String(c.petals) && counts.bottom === String(c.bottom);
            }
            row.actual = (await ask(decisionRequest(checks, variant, counts))).goal;
          }
          row.correct = row.actual === c.expected;
        } catch (e) {
          row.error = String(e);
        }
        results.push(row);
        const saved = getRun(run.id);
        saved.status = 'stopped';
        saved.reason = 'Daisy decision component probe';
        saveRun(saved);
        persist();
      }
      console.log(JSON.stringify(persist()));
    }),
  );
}
if (import.meta.main) await main();
