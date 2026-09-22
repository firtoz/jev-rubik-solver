import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { apply, solved, pieces, facts, hash, colors } from '../../src/lib/cube';
import { coordinate, vectors } from './geometric-prediction';
import type { CubeData, JevRequest } from '../../src/lib/types';
import { MODEL, budget, evaluate } from '../../src/server/jev';
import { createRun } from '../../src/server/runner';
import { getRun, saveRun } from '../../src/server/store';
const dot = (a: number[], b: number[]) => a.reduce((n, x, i) => n + x * b[i], 0);
const cross = (a: number[], b: number[]) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export function faceObservation(state: CubeData) {
  const all = pieces(state);
  return {
    frame:
      'U top, D bottom, F front, B back, R right, L left. Every grid is viewed from outside. For F/R/B/L, row 3 touches D. For U the top of the grid touches B; for D the top touches F. Rows are top to bottom; columns left to right.',
    faces: Object.fromEntries(
      Object.keys(colors).map((face) => {
        const up = vectors[face === 'U' ? 'B' : face === 'D' ? 'F' : 'U'],
          right = cross(up, vectors[face]);
        const grid = Array.from({ length: 3 }, () => Array(3).fill(''));
        grid[1][1] = colors[face];
        for (const p of all.filter((p) => p.position.includes(face))) {
          const v = coordinate(p.position);
          grid[1 - dot(v, up)][1 + dot(v, right)] = Object.entries(p.stickers).find(
            ([, f]) => f === face,
          )![0];
        }
        return [face, { center: colors[face], rows: grid }];
      }),
    ),
  };
}
export async function makeCases(split: 'development' | 'validation') {
  let seed = split === 'development' ? 424242 : 818181;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed;
  };
  const top = [
    'U',
    "U'",
    'U2',
    "R U R' U R U2 R'",
    "F R U R' U' F'",
    "R U R' U' R' F R2 U' R' U' R U R' F'",
  ];
  const used = new Set<string>();
  if (split === 'validation') {
    const old = JSON.parse(
      readFileSync('experiments/first-layer-development/fixtures.json', 'utf8'),
    );
    for (const c of old) used.add(c.stateHash);
  }
  const cases = [];
  for (let i = 0; i < 20; i++) {
    const category =
      i < 10
        ? 'complete'
        : i < 14
          ? 'uniform-bottom-misaligned-sides'
          : i < 17
            ? 'near-complete'
            : 'scrambled';
    let candidate: any;
    for (let attempt = 0; attempt < 1000; attempt++) {
      const base = Array.from(
        { length: 3 + (random() % 4) },
        () => top[random() % top.length],
      ).join(' ');
      let scramble = base;
      if (category === 'uniform-bottom-misaligned-sides')
        scramble += ' ' + ['D', "D'", 'D2'][random() % 3];
      if (category === 'near-complete')
        scramble += ' ' + ["R U R' U'", "L' U' L U", "F' U' F U"][random() % 3];
      if (category === 'scrambled')
        scramble +=
          ' ' +
          Array.from(
            { length: 8 },
            () => ['R', 'F', "B'", 'L2', 'D', "R'", 'U2'][random() % 7],
          ).join(' ');
      const state = await apply(await solved(), scramble),
        key = hash(state),
        expected = facts(state).firstLayer;
      if (used.has(key) || expected !== (category === 'complete')) continue;
      const observation = faceObservation(state);
      const bottom = observation.faces.D.rows.flat().every((c) => c === colors.D);
      if (category === 'uniform-bottom-misaligned-sides' && !bottom)
        throw new Error('Wrong fixture category');
      used.add(key);
      candidate = {
        id: `${split}-${i + 1}`,
        category,
        scramble,
        stateHash: key,
        expected: expected ? 'yes' : 'no',
        observation,
      };
      break;
    }
    if (!candidate) throw new Error('Fixture generation exhausted');
    cases.push(candidate);
  }
  return cases;
}
const definition =
  'The first layer is the bottom D layer. It is complete exactly when all nine D stickers match the D center AND all three stickers in row 3 of EACH side face F,R,B,L match that side face’s center. A uniform D face alone is insufficient. Upper and middle rows of side faces, and U, need not be solved.';
const criteria = {
  yes: 'The bottom first layer is complete.',
  no: 'The bottom first layer is incomplete.',
};
export function initialRequest(observation: unknown, variant: string): JevRequest {
  const family = variant.split(':')[0];
  const style = variant.split(':')[1] ?? 'base';
  const extra =
    style === 'counterexample'
      ? ' Look specifically for any sticker that violates these conditions. One mismatch makes the answer no.'
      : style === 'scope'
        ? ' Check exactly the specified cells. Ignore unsolved cells outside the bottom layer. Compare each region with its own center, not a neighboring face’s center.'
        : '';
  const question = {
    type: 'choice' as const,
    instructions: definition + extra + ' Is the first layer complete?',
    criteria,
  };
  if (family === 'direct')
    return { model: MODEL, state: observation, questions: { complete: question } };
  const checks = Object.fromEntries(
    ['D', 'F', 'R', 'B', 'L'].map((face) => [
      face,
      {
        type: 'choice' as const,
        instructions:
          definition +
          extra +
          (face === 'D'
            ? ' Inspect only the D face. Do all nine cells match its center?'
            : ` Inspect only row 3 of face ${face}. Do all three cells match that face's center?`),
        criteria: {
          yes: 'Every specified cell matches this face center.',
          no: 'At least one specified cell differs from this face center.',
        },
      },
    ]),
  );
  if (family === 'checklist')
    checks.complete = {
      ...question,
      instructions:
        definition +
        extra +
        ' Check the five required regions systematically and give the overall answer. All five checks must pass.',
    };
  return { model: MODEL, state: observation, questions: checks };
}
export function combineRequest(answers: Record<string, string>, variant: string): JevRequest {
  return {
    model: MODEL,
    state: { regionChecksFromPreviousModelResponse: answers },
    questions: {
      complete: {
        type: 'choice',
        instructions:
          definition +
          ' These are your previous region assessments. Choose yes only if all five are yes; otherwise choose no. Do not invent a replacement assessment.' +
          (variant.includes('counterexample') ? ' A single no suffices for no.' : ''),
        criteria,
      },
    },
  };
}
export async function runTournament(
  split: 'development' | 'validation',
  round: number,
  variants: string[],
) {
  const root = `experiments/first-layer-${split}`,
    dir = `${root}/round-${round}`;
  if (existsSync(`${dir}/started.json`))
    throw new Error('Preserve the started suite; use a new round.');
  mkdirSync(dir, { recursive: true });
  let cases: any[];
  if (existsSync(`${root}/fixtures.json`))
    cases = JSON.parse(readFileSync(`${root}/fixtures.json`, 'utf8'));
  else {
    cases = await makeCases(split);
    writeFileSync(`${root}/fixtures.json`, JSON.stringify(cases, null, 2));
  }
  const start = budget(),
    maxRequests = 20 * variants.reduce((n, v) => n + (v.startsWith('sequential') ? 2 : 1), 0);
  if (start.cap - start.reservedAndSpent < (maxRequests * 64000 * 0.042) / 1e6)
    throw new Error('Conservative budget reservation insufficient');
  writeFileSync(`${dir}/source.ts`, readFileSync(import.meta.path));
  writeFileSync(
    `${dir}/started.json`,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        model: MODEL,
        variants,
        split,
        start,
        maxRequests,
        concurrency: 3,
        ranking:
          'accuracy descending, false positives ascending, requests ascending, cost ascending. Stop at a perfect cheapest baseline or after two rounds without a two-case gain. Validation must not select or tune variants.',
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
        total: 20,
        completed: rs.length,
        correct: rs.filter((r) => r.correct).length,
        falsePositive: rs.filter((r) => r.actual === 'yes' && r.expected === 'no').length,
        falseNegative: rs.filter((r) => r.actual === 'no' && r.expected === 'yes').length,
        errors: rs.filter((r) => r.error).length,
        requests: rs.reduce((n, r) => n + r.exchanges.length, 0),
        cost: rs.flatMap((r) => r.exchanges).reduce((n, d) => n + d.cost, 0),
        latencyMs: rs.flatMap((r) => r.exchanges).reduce((n, d) => n + d.elapsedMs, 0),
      };
    });
    writeFileSync(`${dir}/results.json`, JSON.stringify({ summary, results }, null, 2));
    return summary;
  };
  const queue = [...variants];
  await Promise.all(
    Array.from({ length: Math.min(3, variants.length) }, async () => {
      while (queue.length) {
        const variant = queue.shift()!;
        for (const c of cases) {
          const run = await createRun(c.scramble, 'primitive', `first-layer-${split}`);
          const exchanges: any[] = [];
          let row: any = {
            caseId: c.id,
            category: c.category,
            expected: c.expected,
            runId: run.id,
            variant,
          };
          try {
            const first = await evaluate(
              run.id,
              initialRequest(c.observation, variant),
              AbortSignal.timeout(30000),
              { maxAttempts: 1 },
            );
            exchanges.push(first);
            let last = first;
            if (variant.startsWith('sequential')) {
              const answers = Object.fromEntries(
                Object.entries(first.response.answers).map(([k, v]) => [k, v.choice]),
              );
              last = await evaluate(
                run.id,
                combineRequest(answers, variant),
                AbortSignal.timeout(30000),
                { maxAttempts: 1 },
              );
              exchanges.push(last);
            }
            row.actual = last.response.answers.complete.choice;
            row.correct = row.actual === c.expected;
          } catch (e) {
            row.error = String(e);
          }
          row.exchanges = exchanges;
          results.push(row);
          const saved = getRun(run.id);
          saved.status = 'stopped';
          saved.reason = 'First-layer recognition probe complete';
          saveRun(saved);
          persist();
        }
        console.log(JSON.stringify(persist()));
      }
    }),
  );
  return persist();
}
if (import.meta.main) {
  const split = process.argv.includes('--validation') ? 'validation' : 'development';
  const round = Number(process.argv.find((a) => a.startsWith('--round='))?.split('=')[1] ?? 1);
  const variants = (
    process.argv.find((a) => a.startsWith('--variants='))?.split('=')[1] ??
    'direct,checklist,sequential'
  ).split(',');
  console.log(JSON.stringify(await runTournament(split, round, variants)));
}
