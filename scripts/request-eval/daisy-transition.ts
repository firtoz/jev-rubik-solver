import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { apply, solved, facts, hash, pieces } from '../../src/lib/cube';
import { faceObservation } from './first-layer';
import { MODEL, evaluate, budget } from '../../src/server/jev';
import { createRun } from '../../src/server/runner';
import { getRun, saveRun } from '../../src/server/store';
import type { CubeData, JevRequest } from '../../src/lib/types';
const positions = [
  [0, 1],
  [1, 2],
  [2, 1],
  [1, 0],
];
// Outside-view grids: U top/back, right/right, bottom/front, left/left.
const sides = ['B', 'R', 'F', 'L'];
export function checksFor(state: CubeData) {
  const obs = faceObservation(state);
  return Object.fromEntries(
    positions.flatMap(([r, c], i) => [
      [`petal${i + 1}`, obs.faces.U.rows[r][c] === 'yellow' ? 'yes' : 'no'],
      [
        `bottom${i + 1}`,
        obs.faces.D.rows[r][c] === 'yellow' &&
        obs.faces[['F', 'R', 'B', 'L'][i]].rows[2][1] === obs.faces[['F', 'R', 'B', 'L'][i]].center
          ? 'yes'
          : 'no',
      ],
    ]),
  );
}
export const lesson =
  'Use the daisy-first beginner method for this exercise. A petal is a yellow sticker in an EDGE cell of U, around its white center. A solved bottom edge has yellow facing D and its side sticker matching its side center. There are exactly four yellow edges. If all four bottom edges are solved, choose first-layer. Otherwise, if all four yellow edges are accounted for as either U petals OR solved bottom edges, choose cross: transfer the remaining petals down while preserving solved bottom edges. This includes a complete four-petal daisy and a partial transfer. Otherwise choose daisy to gather the missing petals. Do not rebuild a complete daisy or undo a partial transfer. These fixtures have unfinished bottom corners whenever the cross is complete.';
const options = {
  daisy: 'Gather missing yellow-up petals on U',
  cross: 'Continue transferring yellow-up petals to correctly matched D slots',
  'first-layer': 'Cross complete: work on bottom corners',
};
export function goalInput(observation: unknown, checks?: Record<string, string>): JevRequest {
  return {
    model: MODEL,
    state: { observations: observation, ...(checks ? { previousModelChecks: checks } : {}) },
    questions: { goal: { type: 'choice', instructions: lesson, criteria: options } },
  };
}
export function regionInput(
  observation: ReturnType<typeof faceObservation>,
  focused: boolean,
): JevRequest {
  const cells: Record<string, unknown> = {};
  const questions: JevRequest['questions'] = {};
  for (let i = 0; i < 4; i++) {
    const [r, c] = positions[i];
    const side = ['F', 'R', 'B', 'L'][i];
    cells[`petal${i + 1}`] = { U: observation.faces.U.rows[r][c] };
    cells[`bottom${i + 1}`] = {
      D: observation.faces.D.rows[r][c],
      side: observation.faces[side].rows[2][1],
      sideCenter: observation.faces[side].center,
    };
    questions[`petal${i + 1}`] = {
      type: 'choice',
      instructions: focused
        ? `Look only at samples.petal${i + 1}. Is its U sticker yellow?`
        : `Look only at U row ${r + 1} column ${c + 1}. Is that sticker yellow? Ignore the U center and all other cells.`,
      criteria: { yes: 'The specified U sticker is yellow', no: 'It is not yellow' },
    };
    questions[`bottom${i + 1}`] = {
      type: 'choice',
      instructions: focused
        ? `Look only at samples.bottom${i + 1}. Is D yellow AND side equal to sideCenter? Both must hold.`
        : `Look only at D row ${r + 1} column ${c + 1} and ${side} row 3 column 2. Is that D sticker yellow AND that ${side} sticker equal to the ${side} center? Both must hold.`,
      criteria: { yes: 'Both required conditions hold', no: 'One or both conditions do not hold' },
    };
  }
  return {
    model: MODEL,
    state: focused
      ? {
          samples: cells,
          note: 'These are literal sticker colors copied from fixed grid locations, not precomputed matches. Each bottom pair is the two stickers of one D edge.',
        }
      : observation,
    questions,
  };
}
export async function fixtures(split: 'development' | 'validation') {
  let seed = split === 'development' ? 542319 : 811771;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed >>> 8;
  };
  const used = new Set<string>();
  if (split === 'validation')
    for (const c of JSON.parse(
      readFileSync('experiments/daisy-transition-development/fixtures.json', 'utf8'),
    ))
      used.add(c.stateHash);
  const top = ['U', "U'", 'U2', "R U R' U R U2 R'", "F R U R' U' F'"];
  const result = [];
  for (const category of ['incomplete', 'full-daisy', 'partial-transfer', 'cross-complete'])
    for (let n = 0; n < 5; n++) {
      let found = false;
      for (let attempt = 0; attempt < 2000; attempt++) {
        let scramble = Array.from(
          { length: 2 + (random() % 5) },
          () => top[random() % top.length],
        ).join(' ');
        if (category === 'cross-complete') scramble += " R U R' U'";
        else {
          scramble += ' F2 R2 B2 L2';
          if (category === 'partial-transfer')
            scramble += ' ' + ['F2', 'R2 B2', 'L2 F2 R2'][random() % 3];
          if (category === 'incomplete')
            scramble += ' ' + ['F', 'R U', 'B L', 'L U R'][random() % 4];
        }
        const state = await apply(await solved(), scramble),
          f = facts(state),
          key = hash(state);
        const bottom = pieces(state).filter(
          (p) => p.kind === 'edge' && p.destination.includes('D') && p.solved,
        ).length;
        const actual = f.cross
          ? 'cross-complete'
          : f.daisy === 4
            ? 'full-daisy'
            : f.daisy > 0 && bottom > 0 && f.daisy + bottom === 4
              ? 'partial-transfer'
              : 'incomplete';
        if (actual !== category || f.firstLayer || used.has(key)) continue;
        used.add(key);
        result.push({
          id: `${split}-${result.length + 1}`,
          category,
          scramble,
          stateHash: key,
          observation: faceObservation(state),
          checks: checksFor(state),
          petals: f.daisy,
          bottom,
          expected:
            category === 'incomplete'
              ? 'daisy'
              : category === 'cross-complete'
                ? 'first-layer'
                : 'cross',
        });
        found = true;
        break;
      }
      if (!found) throw new Error('Fixture generation exhausted for ' + category);
    }
  return result;
}
async function main() {
  const split = process.argv.includes('--validation') ? 'validation' : 'development';
  const variants = (
    process.argv.find((x) => x.startsWith('--variants='))?.split('=')[1] ?? 'direct,regions,focused'
  ).split(',');
  if (variants.some((v) => !['direct', 'regions', 'focused', 'gold'].includes(v)))
    throw new Error('Unknown variant');
  const dir = `experiments/daisy-transition-${split}`;
  if (existsSync(`${dir}/started.json`)) throw new Error('Already started');
  const cases = await fixtures(split);
  const start = budget();
  const maxRequests =
    20 * variants.reduce((n, v) => n + (v === 'direct' || v === 'gold' ? 1 : 2), 0);
  if (start.cap - start.reservedAndSpent < (maxRequests * 64000 * 0.042) / 1e6)
    throw new Error('Insufficient reserved headroom');
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/fixtures.json`, JSON.stringify(cases, null, 2));
  writeFileSync(`${dir}/source.ts`, readFileSync(import.meta.path));
  writeFileSync(
    `${dir}/started.json`,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        split,
        variants,
        start,
        maxRequests,
        method:
          'Fixed daisy-first strategy, three choices, scope ends at first-layer handoff. Golden checks are supplied only to the explicitly labelled isolated gold variant. Winner by goal score, then fewer calls. Validation frozen before dispatch. No retries.',
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
        recognitionFields:
          variant === 'direct' || variant === 'gold'
            ? null
            : rs.reduce((n, r) => n + (r.recognitionFields || 0), 0),
        recognitionAll:
          variant === 'direct' || variant === 'gold'
            ? null
            : rs.filter((r) => r.recognitionAll).length,
        wrongDespiteCorrectChecks: rs.filter((r) => r.recognitionAll && !r.correct).length,
        errors: rs.filter((r) => r.error).length,
        requests: rs.reduce((n, r) => n + r.exchanges.length, 0),
        cost: rs.flatMap((r) => r.exchanges).reduce((n, d) => n + d.cost, 0),
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
          const run = await createRun(c.scramble, 'primitive', `daisy-transition-${split}`);
          const row: any = {
            caseId: c.id,
            category: c.category,
            variant,
            expected: c.expected,
            runId: run.id,
            exchanges: [],
          };
          try {
            let checks: Record<string, string> | undefined =
              variant === 'gold' ? c.checks : undefined;
            if (variant === 'regions' || variant === 'focused') {
              const d = await evaluate(
                run.id,
                regionInput(c.observation, variant === 'focused'),
                AbortSignal.timeout(30000),
                { maxAttempts: 1 },
              );
              row.exchanges.push(d);
              checks = Object.fromEntries(
                Object.entries(d.response.answers).map(([k, a]) => [k, a.choice]),
              );
              row.checks = checks;
              row.recognitionFields = Object.keys(c.checks).filter(
                (k) => c.checks[k] === checks![k],
              ).length;
              row.recognitionAll = row.recognitionFields === 8;
            }
            const d = await evaluate(
              run.id,
              goalInput(c.observation, checks),
              AbortSignal.timeout(30000),
              { maxAttempts: 1 },
            );
            row.exchanges.push(d);
            row.actual = d.response.answers.goal.choice;
            row.correct = row.actual === c.expected;
          } catch (e) {
            row.error = String(e);
          }
          results.push(row);
          const saved = getRun(run.id);
          saved.status = 'stopped';
          saved.reason = 'Daisy transition component probe; no moves';
          saveRun(saved);
          persist();
        }
        console.log(JSON.stringify(persist()));
      }
    }),
  );
}
if (import.meta.main) await main();
