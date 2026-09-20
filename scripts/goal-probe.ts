import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { apply, solved, inverse, facts } from '../src/lib/cube';
import { skills } from '../src/lib/skills';
import { goalRequest, STRATEGY_VERSION } from '../src/server/goal-policy';
import { createRun } from '../src/server/runner';
import { event, getRun, saveRun } from '../src/server/store';
import { evaluate, MODEL, budget } from '../src/server/jev';

// Hand-labelled development situations only. Neither fixture labels nor their
// construction algorithms are sent to the model. No final-test states are used.
const undoSkill = (id: string) => inverse(skills.find((s) => s.id === id)!.alg);
export const goalFixtures = [
  { name: 'mixed-yellow-edges', scramble: "R U F'", expected: ['daisy'], previous: null },
  { name: 'four-petals', scramble: 'F2 R2 B2 L2', expected: ['cross'], previous: 'daisy' },
  {
    name: 'cross-transfer-in-progress',
    scramble: 'F2 R2 B2 L2 L2',
    expected: ['cross'],
    previous: 'cross',
  },
  {
    name: 'cross-done-corners-unfinished',
    scramble: undoSkill('corner-insert'),
    expected: ['first-layer'],
    previous: 'cross',
  },
  {
    name: 'bottom-layer-done',
    scramble: undoSkill('middle-right'),
    expected: ['middle-layer'],
    previous: null,
  },
  {
    name: 'lower-layers-done',
    scramble: undoSkill('orient-edges'),
    expected: ['top-cross'],
    previous: 'middle-layer',
  },
  {
    name: 'white-edges-oriented',
    scramble: undoSkill('sune'),
    expected: ['top-orientation'],
    previous: 'top-cross',
  },
  {
    name: 'white-face-done',
    scramble: undoSkill('corner-permute'),
    expected: ['top-corners'],
    previous: 'top-orientation',
  },
  {
    name: 'corners-placed',
    scramble: undoSkill('edge-cycle'),
    expected: ['top-edges'],
    previous: 'top-corners',
  },
  {
    name: 'only-top-alignment',
    scramble: 'U',
    expected: ['top-corners', 'top-edges'],
    previous: null,
  },
];
if (import.meta.main) {
  const probeName = 'goal-probe-' + STRATEGY_VERSION;
  const live = process.argv.includes('--live');
  mkdirSync('experiments', { recursive: true });
  if (live)
    writeFileSync(`experiments/${probeName}.lock`, new Date().toISOString(), { flag: 'wx' });
  const before = budget();
  const results = [];
  for (const fixture of goalFixtures.filter(
    (f) =>
      !process.argv.includes('--focused') ||
      [
        'bottom-layer-done',
        'cross-done-corners-unfinished',
        'lower-layers-done',
        'cross-transfer-in-progress',
      ].includes(f.name),
  )) {
    const state = await apply(await solved(), fixture.scramble);
    const request = goalRequest(MODEL, state, fixture.previous, []);
    if (!live) {
      console.log(
        JSON.stringify({ name: fixture.name, expected: fixture.expected, facts: facts(state) }),
      );
      continue;
    }
    const r = await createRun(fixture.scramble, 'skills', 'probe');
    r.status = 'stopped';
    saveRun(r);
    const d = await evaluate(r.id, request, AbortSignal.timeout(30000), { maxAttempts: 1 });
    const actual = d.response.answers.goal.choice;
    const result = {
      name: fixture.name,
      expected: fixture.expected,
      actual,
      correct: fixture.expected.includes(actual),
      cost: getRun(r.id).cost,
      runId: r.id,
    };
    event(r.id, 'goal-probe-result', result);
    results.push(result);
    console.log(JSON.stringify(result));
    writeFileSync(
      `experiments/${probeName}.json`,
      JSON.stringify(
        {
          results,
          additionalCost: budget().usage - before.usage,
          source: readFileSync('src/server/goal-policy.ts', 'utf8'),
        },
        null,
        2,
      ),
    );
  }
}
