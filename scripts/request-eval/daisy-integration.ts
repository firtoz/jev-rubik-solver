import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRun } from '../../src/server/runner';
import { getRun, saveRun, event, events } from '../../src/server/store';
import { evaluate, budget, MODEL } from '../../src/server/jev';

import { measuredSkillDecision } from '../../src/server/measured-policy';
import { apply, solved, facts, hash, isSolved } from '../../src/lib/cube';
import type { JevRequest } from '../../src/lib/types';
import { faceObservation } from './first-layer';
import { regionInput } from './daisy-transition';
import { countRequest, decisionRequest } from './daisy-decision';

const dir = 'experiments/daisy-integration-v1';
const limits = { requests: 60, turns: 200, ms: 120000, batchDollars: 0.05 };
const sourceFixtures = JSON.parse(
  readFileSync('experiments/daisy-transition-development/fixtures.json', 'utf8'),
);
const fixtures = [
  ...['incomplete', 'full-daisy', 'partial-transfer'].map((category) => {
    const c = sourceFixtures.find((c: any) => c.category === category);
    return { id: category, scramble: c.scramble, sourceCase: c.id };
  }),
  { id: 'earlier-cross-repair', scramble: 'R', sourceCase: 'previous failed integration' },
];
async function main() {
  if (existsSync(`${dir}/started.json`))
    throw new Error('Study already started; use saved results');
  mkdirSync(dir, { recursive: true });
  const initialBudget = budget();
  if (initialBudget.cap - initialBudget.reservedAndSpent < limits.batchDollars)
    throw new Error('Insufficient budget');
  const sourcePaths = [
    'scripts/request-eval/daisy-integration.ts',
    'scripts/request-eval/daisy-transition.ts',
    'scripts/request-eval/daisy-decision.ts',

    'scripts/request-eval/first-layer.ts',
    'src/server/measured-policy.ts',
    'src/server/skill-policy.ts',
    'src/server/cross-intention.ts',

    'src/server/jev.ts',
    'src/lib/cube.ts',
    'src/lib/skills.ts',
  ];
  writeFileSync(
    `${dir}/source.json`,
    JSON.stringify(
      Object.fromEntries(sourcePaths.map((p) => [p, readFileSync(p, 'utf8')])),
      null,
      2,
    ),
  );
  writeFileSync(
    `${dir}/started.json`,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        model: MODEL,
        limits,
        fixtures,
        initialBudget,
        scope:
          'Four diagnostic development attempts. Frozen counts-plain recognition chain; original skill assistance retained downstream. Stop only when JEV chooses first-layer and independently score cross completion. No retries/recovery/tuning. No full solving claim.',
      },
      null,
      2,
    ),
  );
  const results: any[] = [];
  const persist = () =>
    writeFileSync(
      `${dir}/results.json`,
      JSON.stringify(
        {
          limits,
          results,
          requests: results.reduce((n, r) => n + r.requests, 0),
          cost: results.reduce((n, r) => n + r.cost, 0),
          budget: budget(),
        },
        null,
        2,
      ),
    );
  for (const fixture of fixtures)
    for (const variant of ['counts-plain']) {
      let run = await createRun(fixture.scramble, 'skills', 'daisy-integration-v1');
      // A distinct version prevents normal UI runner from advancing experimental runs.
      run.version += '/daisy-integration-v1';
      saveRun(run);
      const started = Date.now(),
        steps: any[] = [];
      let outcome = 'capped',
        reason = 'Action limit',
        pending: any;
      const check = () => {
        run = getRun(run.id);
        if (run.requests >= limits.requests || Date.now() - started >= limits.ms)
          throw new Error('Attempt limit');
        if (
          budget().reservedAndSpent - initialBudget.reservedAndSpent + (64000 * 0.042) / 1e6 >
          limits.batchDollars
        )
          throw new Error('Batch spending limit');
      };
      const ask = async (request: JevRequest) => {
        check();
        const d = await evaluate(
          run.id,
          request,
          AbortSignal.timeout(Math.max(1, Math.min(30000, limits.ms - (Date.now() - started)))),
          { maxAttempts: 1 },
        );
        pending?.exchanges.push(d);
        return d.response;
      };
      try {
        while (true) {
          check();
          const before = run.state;
          pending = { before, exchanges: [] };
          steps.push(pending);
          const observation = faceObservation(before);
          const regions = await ask(regionInput(observation, true));
          const checks = Object.fromEntries(
            Object.entries(regions.answers).map(([k, a]) => [k, a.choice]),
          );
          const counted = await ask(countRequest(checks));
          const counts = Object.fromEntries(
            Object.entries(counted.answers).map(([k, a]) => [k, a.choice]),
          );
          const goal = (await ask(decisionRequest(checks, 'counts-plain', counts))).answers.goal
            .choice;
          pending.checks = checks;
          pending.counts = counts;
          pending.goal = goal;
          // Independent evaluation only: these facts never build or alter a request.
          pending.facts = facts(before);
          if (goal === 'first-layer') {
            outcome = facts(before).cross ? 'cross-complete' : 'premature-handoff';
            reason = 'JEV chose first-layer';
            break;
          }
          run = getRun(run.id);
          if (run.stage !== goal) run.target = null;
          run.stage = goal;
          saveRun(run);
          const decision = await measuredSkillDecision(run, MODEL, ask, []);
          run = getRun(run.id);
          const count = decision.alg.split(/\s+/).filter(Boolean).length;
          if (run.turns + count > limits.turns) throw new Error('Face turn limit');
          if (Date.now() - started >= limits.ms) throw new Error('Time limit');
          const after = await apply(before, decision.alg);
          run.state = after;
          run.target = decision.target;
          run.history.push(decision.alg);
          run.turns += count;
          run.revision++;
          pending.decision = decision;
          pending.after = after;
          event(run.id, 'action', {
            before,
            after,
            alg: decision.alg,
            target: decision.target,
            stageBefore: goal,
            stageAfter: goal,
            skill: decision.skill,
            front: decision.front,
            factsBefore: facts(before),
            factsAfter: facts(after),
          });
          saveRun(run);
        }
      } catch (e) {
        reason = String(e);
        outcome = /limit/i.test(reason) ? 'capped' : 'error';
      }
      run = getRun(run.id);
      run.status = 'stopped';
      run.reason = reason;
      run.activeMs = Date.now() - started;
      saveRun(run);
      let replay = await apply(await solved(), fixture.scramble);
      for (const alg of run.history) replay = await apply(replay, alg);
      if (hash(replay) !== hash(run.state)) throw new Error('Replay mismatch');
      const result = {
        caseId: fixture.id,
        variant,
        runId: run.id,
        outcome,
        reason,
        requests: run.requests,
        turns: run.turns,
        cost: run.cost,
        activeMs: run.activeMs,
        replayVerified: true,
        crossComplete: facts(replay).cross,
        cubeSolved: isSolved(replay),
        steps,
        events: events(run.id),
      };
      results.push(result);
      persist();
      console.log(JSON.stringify({ ...result, steps: steps.length, events: undefined }));
    }
}
if (import.meta.main) await main();
