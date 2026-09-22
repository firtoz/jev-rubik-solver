import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fixtures } from './move-prediction';
import { requestFor, coordinate, vectors } from './geometric-prediction';
import { evaluate, budget, MODEL } from '../../src/server/jev';
import { createRun } from '../../src/server/runner';
import { getRun, saveRun } from '../../src/server/store';
import type { JevRequest } from '../../src/lib/types';
const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
const cross = (a: number[], b: number[]) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export function faceCell(position: string, face: string) {
  const up = vectors[face === 'U' ? 'B' : face === 'D' ? 'F' : 'U'];
  const right = cross(up, vectors[face]);
  const p = coordinate(position);
  return `${['bottom', 'middle', 'top'][dot(p, up) + 1]}_${['left', 'center', 'right'][dot(p, right) + 1]}`;
}
const cells = [
  'top_left',
  'top_center',
  'top_right',
  'middle_left',
  'middle_right',
  'bottom_left',
  'bottom_center',
  'bottom_right',
];
export function gridRequest(source: JevRequest, membership: string): JevRequest {
  const s = source.state as any,
    face = s.proposedTurn[0];
  const cell = faceCell(s.target.position, face);
  const grid = ['top', 'middle', 'bottom']
    .map((row) =>
      ['left', 'center', 'right']
        .map((col) =>
          `${row}_${col}` === cell ? 'X' : row === 'middle' && col === 'center' ? 'O' : '.',
        )
        .join(' '),
    )
    .join('\n');
  return {
    model: MODEL,
    state: {
      previousModelAnswer: { affected: membership },
      view: 'Straight at the turned face, from outside. Top of diagram is screen top.',
      markerBefore: cell,
      diagramBefore: grid,
      turn: s.proposedTurn.includes('2')
        ? '180 degrees'
        : s.proposedTurn.includes("'")
          ? '90 degrees counterclockwise'
          : '90 degrees clockwise',
    },
    questions: {
      cell: {
        type: 'choice',
        instructions:
          'If your earlier affected answer is no, select unaffected: this piece is outside the rotating face, so its projection is not a marker on that face. Otherwise rotate the marked square diagram by the stated angle around O and choose the new position of X. Think of rotating a sheet of paper on a desk. Screen top is up and screen right is right. Do not mirror the diagram.',
        criteria: {
          ...Object.fromEntries(cells.map((c) => [c, c.replace('_', ' ')])),
          unaffected: 'The selected piece is outside this face; its cube position does not change.',
        },
      },
    },
  };
}
if (import.meta.main) {
  const validation = process.argv.includes('--validation');
  const dir = `experiments/grid-prediction-v4-${validation ? 'validation' : 'development'}`;
  if (existsSync(`${dir}/started.json`)) throw new Error('Already started');
  const cases = await fixtures(validation ? 141421 : 271828, validation ? 3 : 0);
  const old = JSON.parse(readFileSync('experiments/move-prediction-v1/fixtures.json', 'utf8'));
  if (
    new Set(cases.map((c) => c.stateHash)).size !== 20 ||
    (validation && cases.some((c) => old.some((x: any) => x.stateHash === c.stateHash)))
  )
    throw new Error('Overlap');
  const start = budget();
  if (start.cap - start.reservedAndSpent < (40 * 64000 * 0.042) / 1e6) throw new Error('Budget');
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/fixtures.json`, JSON.stringify(cases, null, 2));
  writeFileSync(`${dir}/source.ts`, readFileSync(import.meta.path));
  writeFileSync(
    `${dir}/started.json`,
    JSON.stringify({ at: new Date().toISOString(), start, maxRequests: 40 }, null, 2),
  );
  const results: any[] = [];
  for (const c of cases) {
    const run = await createRun(c.scramble, 'primitive', 'grid-prediction');
    const face = (c.request.state as any).proposedTurn[0];
    const expected = c.affected ? faceCell(c.expected.position, face) : 'unaffected';
    let row: any = { caseId: c.id, runId: run.id, affected: c.affected, expected };
    const exchanges: any[] = [];
    try {
      const a = await evaluate(
        run.id,
        requestFor(c.request, 'membership'),
        AbortSignal.timeout(30000),
        { maxAttempts: 1 },
      );
      exchanges.push(a);
      const member = a.response.answers.affected.choice;
      row.membershipCorrect = (member === 'yes') === c.affected;
      const d = await evaluate(run.id, gridRequest(c.request, member), AbortSignal.timeout(30000), {
        maxAttempts: 1,
      });
      exchanges.push(d);
      row.actual = d.response.answers.cell.choice;
      row.correct = row.actual === expected;
    } catch (e) {
      row.error = String(e);
    }
    row.exchanges = exchanges;
    results.push(row);
    const saved = getRun(run.id);
    saved.status = 'stopped';
    saved.reason = 'Grid prediction probe complete';
    saveRun(saved);
    const summary = {
      total: 20,
      completed: results.length,
      membership: results.filter((r) => r.membershipCorrect).length,
      position: results.filter((r) => r.correct).length,
      cost: results.flatMap((r) => r.exchanges).reduce((n, d) => n + d.cost, 0),
      errors: results.filter((r) => r.error).length,
    };
    writeFileSync(`${dir}/results.json`, JSON.stringify({ summary, results }, null, 2));
    console.log(JSON.stringify(summary));
  }
}
