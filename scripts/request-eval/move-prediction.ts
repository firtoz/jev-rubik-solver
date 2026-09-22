import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { apply, solved, pieces, names, turns, hash } from '../../src/lib/cube';
import type { JevRequest } from '../../src/lib/types';
import { MODEL, evaluate, budget } from '../../src/server/jev';
import { createRun } from '../../src/server/runner';
import { getRun, saveRun } from '../../src/server/store';

export async function fixtures(seed = 271828, extraLength = 0) {
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed;
  };
  const cases = [];
  for (let i = 0; i < 20; i++) {
    const length = (i < 6 ? 1 : i < 13 ? 5 : 10) + extraLength;
    const scramble = Array.from(
      { length },
      (_, j) => turns[i < 6 && !extraLength ? i * 3 : random() % 18],
    ).join(' ');
    const state = await apply(await solved(), scramble);
    const move = turns[i % 18];
    const kind = i % 2 ? 'corner' : 'edge';
    const affected = i % 5 !== 0;
    const candidates = pieces(state).filter(
      (p) => p.kind === kind && p.position.includes(move[0]) === affected,
    );
    const target = candidates[random() % candidates.length];
    const sticker = Object.keys(target.stickers)[random() % Object.keys(target.stickers).length];
    const after = pieces(await apply(state, move)).find((p) => p.piece === target.piece)!;
    const request: JevRequest = {
      model: MODEL,
      state: {
        target: { piece: target.piece, kind, position: target.position, stickers: target.stickers },
        trackedSticker: sticker,
        proposedTurn: move,
      },
      questions: {
        position: {
          type: 'choice',
          instructions:
            'Predict the current position of this same physical piece AFTER the proposed single face turn. Its piece name identifies its home, not its current location. Fixed frame: U top, D bottom, F front, B back, R right, L left. A slot name lists its touching faces; letter order does not change the physical slot. A plain face letter means 90 degrees clockwise looking directly at that face from outside; prime means counterclockwise; 2 means 180 degrees. Only pieces touching the turned face move. Mentally track the piece through the turn.',
          criteria: Object.fromEntries(
            (kind === 'edge' ? names.EDGES : names.CORNERS).map((p) => [
              p,
              `The slot touching faces ${p.split('').join(', ')}`,
            ]),
          ),
        },
        stickerDirection: {
          type: 'choice',
          instructions:
            'After the same proposed turn, which fixed face direction will the tracked colored sticker point toward? Use its observed direction before the move. Directions rotate with the piece only if it belongs to the turned layer. A sticker facing along the turn axis keeps that direction. Use the same outside-view clockwise convention as the position question.',
          criteria: { U: 'Up', D: 'Down', F: 'Front', B: 'Back', R: 'Right', L: 'Left' },
        },
      },
    };
    cases.push({
      id: `move-${String(i + 1).padStart(2, '0')}`,
      scramble,
      stateHash: hash(state),
      affected,
      request,
      expected: { position: after.position, stickerDirection: after.stickers[sticker] },
    });
  }
  return cases;
}
if (import.meta.main) {
  const live = process.argv.includes('--live');
  const directory = 'experiments/move-prediction-v1';
  mkdirSync(directory, { recursive: true });
  const cases = await fixtures();
  if (new Set(cases.map((c) => c.stateHash)).size !== 20) throw new Error('Duplicate states');
  writeFileSync(`${directory}/fixtures.json`, JSON.stringify(cases, null, 2));
  if (!live) {
    console.log(
      '20 unique offline fixtures prepared. --live sends exactly one request per case, no retries.',
    );
    process.exit(0);
  }
  if (existsSync(`${directory}/started.json`))
    throw new Error(
      'This suite already started. Preserve it; use a new version for further experiments.',
    );
  const start = budget();
  if (start.cap - start.reservedAndSpent < (20 * 64000 * 0.042) / 1e6)
    throw new Error('Insufficient conservative request budget');
  writeFileSync(
    `${directory}/started.json`,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        budget: start,
        model: MODEL,
        maximumRequests: 20,
        notes:
          'Development only. No algorithms, case mappings, simulated outcomes or expected answers sent to JEV.',
      },
      null,
      2,
    ),
  );
  const results: any[] = [];
  for (const c of cases) {
    const run = await createRun(c.scramble, 'primitive', 'move-prediction-development');
    let result: any = { caseId: c.id, runId: run.id, affected: c.affected, expected: c.expected };
    try {
      const d = await evaluate(run.id, c.request, AbortSignal.timeout(30000), { maxAttempts: 1 });
      const actual = Object.fromEntries(
        Object.entries(d.response.answers).map(([k, v]) => [k, v.choice]),
      );
      result = {
        ...result,
        actual,
        positionCorrect: actual.position === c.expected.position,
        stickerCorrect: actual.stickerDirection === c.expected.stickerDirection,
        ...d,
      };
    } catch (e) {
      result.error = String(e);
    }
    const saved = getRun(run.id);
    saved.status = 'stopped';
    saved.reason = 'Isolated move prediction complete; no solving action executed';
    saveRun(saved);
    results.push(result);
    const summary = {
      cases: 20,
      completed: results.length,
      positionCorrect: results.filter((r) => r.positionCorrect).length,
      stickerCorrect: results.filter((r) => r.stickerCorrect).length,
      bothCorrect: results.filter((r) => r.positionCorrect && r.stickerCorrect).length,
      errors: results.filter((r) => r.error).length,
      cost: results.reduce((s, r) => s + (r.cost || 0), 0),
    };
    writeFileSync(`${directory}/results.json`, JSON.stringify({ summary, results }, null, 2));
    console.log(JSON.stringify({ id: c.id, actual: result.actual, expected: c.expected, summary }));
  }
}
