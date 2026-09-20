import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  apply,
  solved,
  pieces,
  facts,
  hash,
  focusedObservation,
  semanticFacts,
  setupDescription,
} from '../src/lib/cube';
import { skills, SKILL_VERSION } from '../src/lib/skills';
import type { JevRequest, Run } from '../src/lib/types';
import { MODEL, evaluate, budget } from '../src/server/jev';
import { db, event, saveRun } from '../src/server/store';

// Development fixtures and offline scoring only. No search or solution enters a request.
export const PROBE_VERSION = 'decision-probe-v1';
type Fixture = {
  id: string;
  scramble: string;
  stage: string;
  target: string;
  objective: string;
  options: Record<string, string>;
  actions: Record<string, string>;
  accepted: string[];
  rationale: string;
  history?: string[];
  context?: Record<string, unknown>;
};
const skill = (id: string) => skills.find((s) => s.id === id)!;
const option = (id: string) => `${skill(id).purpose} Moves: ${skill(id).alg}.`;
const corners = {
  U: setupDescription('U'),
  "U'": setupDescription("U'"),
  U2: setupDescription('U2'),
  insertRight: option('corner-insert'),
  insertFront: option('corner-front-right'),
  extractRight: option('right-trigger'),
  insertLeft: option('corner-insert-left'),
  reconsider: 'Do not move. Reconsider the target or operation because none of these fits.',
};
const cornerActions = {
  U: 'U',
  "U'": "U'",
  U2: 'U2',
  insertRight: skill('corner-insert').alg,
  insertFront: skill('corner-front-right').alg,
  extractRight: skill('right-trigger').alg,
  insertLeft: skill('corner-insert-left').alg,
  reconsider: '',
};
export const fixtures: Fixture[] = [
  {
    id: 'alignment',
    scramble: "F' U F U",
    stage: 'first-layer',
    target: 'DRF',
    objective:
      'Prepare the selected corner for insertion into its home; complete the bottom corners while preserving the bottom cross.',
    options: corners,
    actions: cornerActions,
    accepted: ["U'"],
    rationale:
      'U-prime places DRF at UFR; the cross stays complete. This is a setup, not a finished insertion.',
  },
  {
    id: 'flipped-edge',
    scramble: "R F'",
    stage: 'daisy',
    target: 'DR',
    objective:
      'Place the selected yellow edge on the top with yellow pointing up, preserving existing yellow-up petals. Its final bottom destination is not the current objective.',
    options: {
      lift: option('lift-bottom'),
      flipRight: option('flip-top-edge'),
      flipLeft: option('flip-top-edge-left'),
      U: setupDescription('U'),
      reconsider: 'No operation fits; reconsider.',
    },
    actions: { lift: 'F2', flipRight: 'F R', flipLeft: "F' L'", U: 'U', reconsider: '' },
    accepted: ['flipRight', 'flipLeft'],
    rationale: 'Either flip puts the selected edge yellow-up; both landing slots are free.',
  },
  {
    id: 'trapped-corner',
    scramble: "R U R' U' R U R' U'",
    stage: 'first-layer',
    target: 'DRF',
    objective:
      'Make the twisted selected bottom corner available for reinsertion while preserving the bottom cross after the operation.',
    options: corners,
    actions: cornerActions,
    accepted: ['extractRight', 'insertRight'],
    rationale:
      'Both R U R-prime and the right trigger extract this corner to U and restore the cross. U alone cannot move it.',
  },
  {
    id: 'competing-targets',
    scramble: "F' U F L' U L",
    stage: 'first-layer',
    target: 'whole',
    objective:
      'Choose which of the two unfinished corners to work on first. Prefer an immediate valid insertion over extraction when it preserves the bottom cross.',
    options: {
      DRF: 'Work on corner DRF.',
      DFL: 'Work on corner DFL.',
      reconsider: 'Neither target offers a suitable next operation.',
    },
    actions: { DRF: '', DFL: '', reconsider: '' },
    accepted: ['DFL'],
    rationale:
      'DFL is above its own slot with yellow facing L; DRF is trapped in the wrong bottom slot.',
  },
  {
    id: 'temporary-disruption',
    scramble: "R U' R'",
    history: ['R', 'U'],
    stage: 'first-layer',
    target: 'DRF',
    objective:
      'Finish the committed corner insertion if the recorded execution still matches it. Judge preservation at completion, allowing intermediate disruption.',
    context: { committedOperation: { moves: "R U R'", executed: ['R', 'U'], remaining: ["R'"] } },
    options: {
      finish: 'Execute remaining R-prime of the committed insertion.',
      undo: 'Undo only the last U turn.',
      restart: 'Start the entire R U R-prime insertion again.',
      reconsider: 'Abandon this operation and select a different target.',
    },
    actions: { finish: "R'", undo: "U'", restart: "R U R'", reconsider: '' },
    accepted: ['finish'],
    rationale:
      'The cross is temporarily disturbed after R U. Remaining R-prime completes the insertion and solves this fixture.',
  },
  {
    id: 'repeated-state',
    scramble: "F' U F U",
    history: ['U', "U'", 'U', "U'"],
    stage: 'first-layer',
    target: 'DRF',
    objective:
      'Break the observed no-progress cycle. Choose a different operation from the same state, change target, or stop for inspection.',
    context: { lastActionWasUndo: true },
    options: {
      repeat: 'Execute U again.',
      undo: 'Undo the last action again (execute U).',
      alternative: 'Execute U-prime instead of repeating U.',
      retarget: 'Choose a different target without moving.',
      inspect: 'Stop this probe to inspect the failure.',
    },
    actions: { repeat: 'U', undo: 'U', alternative: "U'", retarget: '', inspect: '' },
    accepted: ['alternative', 'retarget', 'inspect'],
    rationale:
      'U and undo repeat the recorded cycle. Alternative U-prime stages the target; retarget/inspect are also valid recovery decisions.',
  },
];

export async function prepare(f: Fixture) {
  let state = await apply(await solved(), f.scramble);
  const history: unknown[] = [];
  for (const move of f.history ?? []) {
    const after = await apply(state, move);
    history.push({
      move,
      before: hash(state),
      after: hash(after),
      factsBefore: facts(state),
      factsAfter: facts(after),
    });
    state = after;
  }
  const run: Run = {
    id: 'offline',
    createdAt: '',
    policy: 'skills',
    scramble: f.scramble,
    state,
    status: 'ready',
    revision: 0,
    stage: f.stage,
    target: f.target,
    history: f.history ?? [],
    requests: 0,
    turns: 0,
    activeMs: 0,
    tokens: 0,
    cost: 0,
    reason: null,
    version: PROBE_VERSION,
    split: 'development-probe',
    benchmarkId: null,
  };
  const view = focusedObservation(run, state);
  const common = { ...view, goal: f.objective, executionHistory: history, ...f.context };
  const broad: JevRequest = {
    model: MODEL,
    state: common,
    questions: {
      action: {
        type: 'choice',
        instructions:
          'Choose the best next action for the current goal and target while protecting completed progress. Use the available operation descriptions and recent actions.',
        criteria: f.options,
      },
    },
  };
  const enriched = semanticFacts(view);
  const structured: JevRequest = {
    model: MODEL,
    state: {
      ...common,
      ...enriched,
      goal: f.objective,
      operationContract: {
        frame:
          'Fixed U white, D yellow, F green, R red, B blue, L orange. Camera orientation does not change notation.',
        preservation:
          'Preserve completed stage goals after a whole operation; temporary disruption inside a committed operation is allowed.',
        choiceBoundary:
          'Descriptions explain operations generally; they are not recommendations for this state. You may reconsider if none applies.',
        task: 'Choose only the next operation or target. You are not asked to produce a full solution.',
      },
    },
    questions: {
      action: {
        type: 'choice',
        instructions: {
          question:
            'Which option best advances `goal` using `target`, `stagePieces`, `completed`, and `executionHistory`?',
          guidance:
            'Compare present positions AND sticker directions with the operation descriptions. Distinguish being in a home slot from being correctly oriented. Respect any committedOperation. Avoid repeating a recorded no-progress cycle. Return reconsider/inspect when appropriate.',
        },
        criteria: f.options,
      },
    },
  };
  const targets = f.target === 'whole' ? ['DRF', 'DFL'] : [f.target];
  for (const target of targets)
    structured.questions[`situation_${target}`] = {
      type: 'choice',
      instructions: `Describe piece ${target} in state.stagePieces using current position and stickers. This is an independent observation; your answer is NOT available to the action question.`,
      criteria: {
        top: 'In the top layer.',
        bottomCorrect: 'In its bottom home slot with correct orientation.',
        bottomWrong: 'In the bottom layer but misplaced or twisted.',
        middle: 'In the middle layer.',
        absent: 'Not present in stagePieces.',
      },
    };
  return { run, state, broad, structured };
}

export async function verifyFixtures() {
  const check = (ok: boolean, message: string) => {
    if (!ok) throw new Error(message);
  };
  for (const f of fixtures) {
    const { state } = await prepare(f);
    const p = pieces(state).find((p) => p.piece === f.target);
    if (f.id === 'alignment')
      check(p?.position === 'ULF' && facts(await apply(state, "U'")).cross, 'alignment fixture');
    if (f.id === 'flipped-edge')
      for (const a of f.accepted)
        check(
          pieces(await apply(state, f.actions[a])).find((p) => p.piece === 'DR')?.stickers
            .yellow === 'U',
          'edge fixture',
        );
    if (f.id === 'trapped-corner')
      for (const a of f.accepted) {
        const after = await apply(state, f.actions[a]);
        check(
          p?.position === 'DRF' &&
            !p.solved &&
            pieces(after)
              .find((p) => p.piece === 'DRF')!
              .position.includes('U') &&
            facts(after).cross,
          'extraction fixture',
        );
      }
    if (f.id === 'competing-targets') {
      const after = await apply(state, skill('corner-insert-left').alg);
      check(
        pieces(after).find((p) => p.piece === 'DFL')!.solved && facts(after).cross,
        'competing fixture',
      );
    }
    if (f.id === 'temporary-disruption')
      check(!facts(state).cross && facts(await apply(state, "R'")).solved, 'temporary fixture');
    if (f.id === 'repeated-state')
      check(hash(state) === hash(await apply(await solved(), f.scramble)), 'cycle fixture');
  }
}

async function main() {
  const live = process.argv.includes('--live');
  const out = 'experiments/' + PROBE_VERSION;
  mkdirSync(out, { recursive: true });
  await verifyFixtures();
  const prepared = await Promise.all(fixtures.map(prepare));
  const frozen = {
    version: PROBE_VERSION,
    skillVersion: SKILL_VERSION,
    model: MODEL,
    fixtures: fixtures.map((f, i) => ({
      ...f,
      initialState: prepared[i].state,
      requests: { broad: prepared[i].broad, structured: prepared[i].structured },
    })),
  };
  const fingerprint = createHash('sha256').update(JSON.stringify(frozen)).digest('hex');
  if (!live) {
    writeFileSync(out + '/preview.json', JSON.stringify({ ...frozen, fingerprint }, null, 2));
    console.log('Offline fixtures verified. Preview: ' + out + '/preview.json. No API calls.');
    return;
  }
  // Exclusive persistent marker prevents accidental reruns, including after a crash.
  writeFileSync(
    out + '/live-lock.json',
    JSON.stringify({ fingerprint, started: new Date().toISOString() }),
    { flag: 'wx' },
  );
  if (
    (
      db
        .query("SELECT COUNT(*) n FROM runs WHERE json_extract(json,'$.status')='running'")
        .get() as { n: number }
    ).n
  )
    throw new Error('An autonomous run is active; refusing to start probes.');
  writeFileSync(out + '/frozen.json', JSON.stringify({ ...frozen, fingerprint }, null, 2));
  const start = budget();
  const results: any[] = [];
  let attempts = 0;
  for (let i = 0; i < fixtures.length; i++) {
    const f = fixtures[i],
      p = prepared[i];
    // Alternate order to avoid consistently favouring one format by order.
    for (const style of (i % 2 ? ['structured', 'broad'] : ['broad', 'structured']) as (
      'broad' | 'structured'
    )[]) {
      if (attempts >= 12) throw new Error('Twelve-request probe limit');
      const run = {
        ...p.run,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        status: 'stopped' as const,
        reason: 'Bounded decision probe; no runner loop',
      };
      saveRun(run);
      event(run.id, 'probe-created', {
        version: PROBE_VERSION,
        fingerprint,
        fixture: f.id,
        style,
        before: p.state,
      });
      attempts++;
      try {
        const decision = await evaluate(run.id, p[style], AbortSignal.timeout(35000), {
          maxAttempts: 1,
        });
        const choice = decision.response.answers.action.choice;
        const alg = f.actions[choice];
        const after = alg ? await apply(p.state, alg) : p.state;
        const row = {
          fixture: f.id,
          style,
          runId: run.id,
          accepted: f.accepted.includes(choice),
          choice,
          confidence: decision.response.answers.action.confidence,
          expected: f.accepted,
          rationale: f.rationale,
          before: p.state,
          after,
          changes: { before: facts(p.state), after: facts(after) },
          ...decision,
        };
        results.push(row);
        event(run.id, 'probe-result', row);
        console.log(
          JSON.stringify({
            fixture: f.id,
            style,
            choice,
            accepted: row.accepted,
            confidence: row.confidence,
            tokens: decision.response.usage.input_tokens,
            cost: decision.cost,
          }),
        );
      } catch (error) {
        results.push({
          fixture: f.id,
          style,
          runId: run.id,
          error: String(error),
          accepted: false,
        });
      }
      writeFileSync(
        out + '/results.json',
        JSON.stringify(
          { fingerprint, attempts, budgetBefore: start, budgetAfter: budget(), results },
          null,
          2,
        ),
      );
      if (results.at(-1).error) throw new Error('Probe stopped after request failure; no retry.');
    }
  }
  console.log(
    JSON.stringify({
      attempts,
      additionalCost: budget().usage - start.usage,
      report: out + '/results.json',
    }),
  );
}
if (import.meta.main) await main();
