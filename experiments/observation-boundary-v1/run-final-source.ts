import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { apply, facts } from '../../src/lib/cube';
import { evaluate, budget } from '../../src/server/jev';
import { db, getRun, saveRun, event } from '../../src/server/store';
import { createRun } from '../../src/server/runner';
import type { CubeData, Decision, JevRequest } from '../../src/lib/types';
import * as policy from './policy';
import * as revision from './policy-v2';
import { fixtures, expected, labels, type Fixture } from './evaluator';
export const DIR = 'experiments/observation-boundary-v1';
import { LIMIT, checkLimits } from './limits';
const variants = ['code/structured', 'code/player', 'jev/structured', 'jev/player'];
const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const write = (path: string, data: unknown) => writeFileSync(path, JSON.stringify(data, null, 2));
export function studyUsage() {
  return db
    .query(
      `SELECT COUNT(*) requests, COALESCE(SUM(amount),0) committed,
    COALESCE(SUM(CASE WHEN l.status='settled' THEN amount ELSE 0 END),0) spent
    FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split')=?`,
    )
    .get(policy.VERSION) as { requests: number; committed: number; spent: number };
}
const digest = () =>
  createHash('sha256').update(readFileSync('scripts/observation-boundary/policy.ts')).digest('hex');
async function prepare() {
  if (existsSync(`${DIR}/manifest.json`)) throw new Error('Study already prepared');
  mkdirSync(DIR, { recursive: true });
  const dev = await fixtures('development');
  const validation = await fixtures(
    'validation',
    dev.map((c) => c.stateHash),
  );
  write(`${DIR}/development-fixtures.json`, dev);
  write(`${DIR}/validation-fixtures.json`, validation);
  write(`${DIR}/manifest.json`, {
    version: policy.VERSION,
    model: 'jev-1.13.0',
    limits: LIMIT,
    preparedAt: new Date().toISOString(),
    pricing: {
      url: 'https://docs.typesafe.ai/models',
      verifiedOn: '2026-09-21',
      inputPerMillion: 0.042,
    },
    variants,
    budget: budget(),
    policyDigest: digest(),
    fixtureCaveat:
      'Controlled generator families, filtered so every eligible target has a usable routine; not representative random-state solve performance. Gold action sets use offline outcome inspection, never supplied to the policy.',
  });
  for (const name of ['policy', 'evaluator', 'run'])
    writeFileSync(
      `${DIR}/${name}-source.ts`,
      readFileSync(`scripts/observation-boundary/${name}.ts`),
    );
  console.log('Prepared 20 development + 20 disjoint validation states. No API calls.');
}
function answers(d: Decision) {
  return Object.fromEntries(Object.entries(d.response.answers).map(([k, a]) => [k, a.choice]));
}
export async function cycle(
  state: CubeData,
  variant: string,
  ask: (r: JevRequest) => Promise<policy.Answers>,
  memory: policy.Memory = { target: null, recentActions: [] },
  revised = false,
) {
  const [boundary, wording] = variant.split('/') as [policy.Boundary, policy.Wording];
  const observation = policy.observe(state, memory);
  const checks =
    boundary === 'code'
      ? policy.measuredChecks(observation)
      : await ask(policy.recognition(observation, wording));
  const summary = policy.aggregate(checks);
  const plan = await ask(policy.planning(observation, summary, wording));
  const base = { checks, summary, plan, provenance: policy.provenance(boundary) };
  if (plan.goal === 'first-layer')
    return { ...base, target: null, recognised: null, operation: null, alg: '', after: state };
  const target = plan.goal === 'daisy' ? plan.gatherTarget : plan.transferTarget;
  if (!policy.ids.includes(target))
    return { ...base, target, recognised: null, operation: 'reconsider', alg: '', after: state };
  const recognised = await ask(policy.situation(observation, plan.goal, target, wording));
  const operation = (
    await ask(
      (revised ? revision : policy).action(
        observation,
        summary,
        plan.goal,
        target,
        recognised,
        wording,
      ),
    )
  ).operation;
  const alg = policy.executeSelection(operation, recognised.reference);
  return { ...base, target, recognised, operation, alg, after: await apply(state, alg) };
}
export function score(c: Fixture, result: Awaited<ReturnType<typeof cycle>>) {
  const e = c.expected;
  const recognition = Object.entries(e.checks).every(([k, v]) => result.checks[k] === v);
  const goal = result.plan.goal === e.goal;
  const selectedTargets = e.goal === 'daisy' ? e.gatherTargets : e.transferTargets;
  const target =
    e.goal === 'first-layer' ? result.target === null : selectedTargets.includes(result.target!);
  const s = result.target ? e.situations[result.target] : null;
  const situation =
    e.goal === 'first-layer' ? true : !!s && result.recognised?.situation === s.situation;
  const reference =
    e.goal === 'first-layer' ? true : !!s && result.recognised?.reference === s.reference;
  const operation =
    e.goal === 'first-layer'
      ? !result.alg
      : !!result.target && !!e.actions[result.target]?.includes(result.operation!);
  const gathering = e.gatherTargets.length
    ? e.gatherTargets.includes(result.plan.gatherTarget)
    : result.plan.gatherTarget === 'none';
  const transfer = e.transferTargets.length
    ? e.transferTargets.includes(result.plan.transferTarget)
    : result.plan.transferTarget === 'none';
  return {
    recognition,
    goal,
    target,
    situation,
    reference,
    operation,
    conditionalTargets: gathering && transfer,
    chain: recognition && goal && target && situation && reference && operation,
  };
}
async function newRun(scramble: string) {
  const run = await createRun(scramble, 'skills', policy.VERSION);
  run.version = policy.VERSION;
  saveRun(run);
  return run;
}
function asker(runId: string, exchanges: Decision[], deadline = Infinity, maxRequests = Infinity) {
  return async (request: JevRequest) => {
    if (Date.now() >= deadline) throw new Error('Attempt time cap');
    if (getRun(runId).requests >= maxRequests) throw new Error('Attempt request cap');
    checkLimits(studyUsage(), budget());
    const d = await evaluate(
      runId,
      request,
      AbortSignal.timeout(Math.max(1, Math.min(30000, deadline - Date.now()))),
      { maxAttempts: 1 },
    );
    exchanges.push(d);
    return answers(d);
  };
}
export function summarise(rows: any[]) {
  return [...new Set(rows.map((r) => r.variant))].map((variant) => {
    const rs = rows.filter((r) => r.variant === variant),
      ex = rs.flatMap((r) => r.exchanges);
    return {
      variant,
      cases: rs.length,
      correct: rs.filter((r) => r.score?.chain).length,
      components: Object.fromEntries(
        [
          'recognition',
          'goal',
          'target',
          'situation',
          'reference',
          'operation',
          'conditionalTargets',
        ].map((k) => [k, rs.filter((r) => r.score?.[k]).length]),
      ),
      errors: rs.filter((r) => r.error).length,
      requests: ex.length,
      tokens: ex.reduce((s, d) => s + d.response.usage.input_tokens, 0),
      cost: ex.reduce((s, d) => s + d.cost, 0),
      latencyMs: ex.reduce((s, d) => s + d.elapsedMs, 0),
    };
  });
}
async function runPhase(phase: 'development' | 'validation') {
  const selected: string[] =
    phase === 'development' ? variants : json(`${DIR}/selection.json`).variants;
  const cases: Fixture[] = json(`${DIR}/${phase}-fixtures.json`);
  writeFileSync(
    `${DIR}/${phase}-started.json`,
    JSON.stringify({
      at: new Date().toISOString(),
      selected,
      policyDigest: digest(),
      usage: studyUsage(),
    }),
    { flag: 'wx' },
  );
  const rows: any[] = [];
  const persist = () =>
    write(`${DIR}/${phase}-results.json`, { summary: summarise(rows), rows, usage: studyUsage() });
  // One sequential worker per variant, at most four independent requests in flight.
  await Promise.all(
    selected.map(async (variant) => {
      for (const c of cases) {
        const run = await newRun(c.scramble);
        const row: any = {
          caseId: c.id,
          category: c.category,
          variant,
          runId: run.id,
          before: c.state,
          expected: c.expected,
          exchanges: [],
        };
        rows.push(row);
        persist();
        try {
          row.result = await cycle(
            c.state,
            variant,
            asker(run.id, row.exchanges),
            undefined,
            phase === 'validation' && json(`${DIR}/selection.json`).revised === true,
          );
          row.score = score(c, row.result);
          event(run.id, 'boundary-cycle', {
            before: c.state,
            result: row.result,
            score: row.score,
          });
        } catch (e) {
          row.error = String(e);
        }
        const saved = getRun(run.id);
        saved.status = row.error ? 'error' : 'stopped';
        saved.reason = `${phase} component probe`;
        saveRun(saved);
        persist();
      }
    }),
  );
  console.log(JSON.stringify(summarise(rows), null, 2));
  if (phase === 'development') {
    const summaries = summarise(rows);
    const winners = ['code', 'jev'].map(
      (boundary) =>
        summaries
          .filter((s) => s.variant.startsWith(boundary + '/'))
          .sort(
            (a, b) =>
              b.correct - a.correct ||
              a.requests - b.requests ||
              a.tokens - b.tokens ||
              a.variant.localeCompare(b.variant),
          )[0].variant,
    );
    write(`${DIR}/selection.json`, {
      variants: winners,
      policyDigest: digest(),
      rule: 'Highest complete-chain score, then fewer requests, fewer tokens, lexical tie-break. No validation inspection. One revision round allowed but omitted unless a specific defect merits the remaining budget.',
    });
  }
}
async function runRevision() {
  const selection = json(`${DIR}/selection.json`);
  writeFileSync(
    `${DIR}/revision-started.json`,
    JSON.stringify({
      at: new Date().toISOString(),
      variants: selection.variants,
      scope:
        'One action-only request per recorded actionable case; all upstream answers replayed unchanged.',
      digest: createHash('sha256')
        .update(readFileSync('scripts/observation-boundary/policy-v2.ts'))
        .digest('hex'),
    }),
    { flag: 'wx' },
  );
  writeFileSync(
    `${DIR}/policy-v2-source.ts`,
    readFileSync('scripts/observation-boundary/policy-v2.ts'),
  );
  const cases: Fixture[] = json(`${DIR}/development-fixtures.json`);
  const original = json(`${DIR}/development-results.json`).rows;
  const rows: any[] = [];
  await Promise.all(
    selection.variants.map(async (variant: string) => {
      for (const old of original.filter((r: any) => r.variant === variant)) {
        const c = cases.find((c) => c.id === old.caseId)!;
        const run = await newRun(c.scramble);
        const row: any = {
          caseId: c.id,
          category: c.category,
          variant,
          runId: run.id,
          before: c.state,
          expected: c.expected,
          exchanges: [],
          replayedFrom: old.runId,
          result: structuredClone(old.result),
        };
        rows.push(row);
        try {
          const r = row.result;
          if (r.recognised) {
            const o = policy.observe(c.state);
            r.operation = (
              await asker(
                run.id,
                row.exchanges,
              )(
                revision.action(
                  o,
                  r.summary,
                  r.plan.goal,
                  r.target,
                  r.recognised,
                  variant.split('/')[1] as policy.Wording,
                ),
              )
            ).operation;
            r.alg = revision.executeSelection(r.operation, r.recognised.reference);
            r.after = await apply(c.state, r.alg);
          }
          row.score = score(c, r);
          event(run.id, 'boundary-revision', {
            before: c.state,
            result: r,
            score: row.score,
            replayedFrom: old.runId,
          });
        } catch (e) {
          row.error = String(e);
        }
        const saved = getRun(run.id);
        saved.status = row.error ? 'error' : 'stopped';
        saved.reason = 'Action-only revision with saved upstream answers';
        saveRun(saved);
        write(`${DIR}/revision-results.json`, {
          summary: summarise(rows),
          rows,
          usage: studyUsage(),
        });
      }
    }),
  );
  const summary = summarise(rows),
    oldSummary = json(`${DIR}/development-results.json`).summary;
  // Select the common action revision only if neither boundary regresses and at least one improves.
  const nonRegressed = summary.every(
    (s) => s.correct >= oldSummary.find((o: any) => o.variant === s.variant).correct,
  );
  const improved = summary.some(
    (s) => s.correct > oldSummary.find((o: any) => o.variant === s.variant).correct,
  );
  write(`${DIR}/selection.json`, {
    ...selection,
    revised: nonRegressed && improved,
    revisionSummary: summary,
    revisionDigest: createHash('sha256')
      .update(readFileSync('scripts/observation-boundary/policy-v2.ts'))
      .digest('hex'),
    revisionSelectionRule:
      'Adopt the shared revision only if neither arm regresses and at least one improves. Action-only development replay; validate complete pipelines fresh.',
  });
  console.log(JSON.stringify({ summary, adopt: nonRegressed && improved }, null, 2));
}
async function integration() {
  const validation = json(`${DIR}/validation-results.json`);
  if (
    validation.summary.length !== 2 ||
    validation.summary.some((s: any) => s.cases !== 20 || s.correct < 19 || s.errors)
  )
    throw new Error('Integration gate failed: both arms need 19/20 complete chains');
  writeFileSync(
    `${DIR}/integration-started.json`,
    JSON.stringify({
      at: new Date().toISOString(),
      limits: { requests: 60, turns: 200, ms: 120000 },
    }),
    { flag: 'wx' },
  );
  const dev: Fixture[] = json(`${DIR}/development-fixtures.json`);
  const starts = ['zero', 'one', 'full-daisy', 'partial-transfer'].map((cat) =>
    dev.find((c) => c.category === cat)!,
  );
  const rows: any[] = [];
  for (const c of starts)
    for (const variant of json(`${DIR}/selection.json`).variants) {
      const run = await newRun(c.scramble),
        deadline = Date.now() + 120000;
      const row: any = {
        caseId: c.id,
        variant,
        runId: run.id,
        steps: [],
        status: 'capped',
        turns: 0,
      };
      let state = c.state,
        memory: policy.Memory = { target: null, recentActions: [] };
      try {
        while (true) {
          const exchanges: Decision[] = [],
            step: any = { before: state, exchanges };
          row.steps.push(step);
          const result = await cycle(
            state,
            variant,
            asker(run.id, exchanges, deadline, 60),
            memory,
            json(`${DIR}/selection.json`).revised === true,
          );
          step.result = result;
          if (result.plan.goal === 'first-layer') {
            row.status = facts(state).cross ? 'complete' : 'false-handoff';
            break;
          }
          if (!result.alg) {
            row.status = 'abstained';
            break;
          }
          const count = result.alg.split(/\s+/).filter(Boolean).length;
          if (row.turns + count > 200 || Date.now() >= deadline) {
            row.status = 'capped';
            break;
          }
          state = result.after;
          row.turns += count;
          memory = {
            target: result.target,
            recentActions: [...memory.recentActions, result.alg].slice(-2),
          };
          event(run.id, 'boundary-action', { before: step.before, after: state, alg: result.alg });
        }
      } catch (e) {
        row.error = String(e);
      }
      row.after = state;
      rows.push(row);
      const saved = getRun(run.id);
      saved.status = 'stopped';
      saved.reason = `Boundary integration: ${row.status}`;
      saved.state = state;
      saveRun(saved);
      write(`${DIR}/integration-results.json`, { rows, usage: studyUsage() });
    }
}
if (import.meta.main) {
  const command = process.argv[2];
  if (command === 'prepare') await prepare();
  else {
    if (json(`${DIR}/manifest.json`).policyDigest !== digest())
      throw new Error('Frozen policy changed; explicitly version a revision before running');
    if (
      (command === 'validation' || command === 'integration') &&
      json(`${DIR}/selection.json`).revised &&
      json(`${DIR}/selection.json`).revisionDigest !==
        createHash('sha256')
          .update(readFileSync('scripts/observation-boundary/policy-v2.ts'))
          .digest('hex')
    )
      throw new Error('Frozen revision changed');
    if (command === 'development' || command === 'validation') await runPhase(command);
    else if (command === 'revision') await runRevision();
    else if (command === 'integration') await integration();
    else if (command === 'status') console.log({ study: studyUsage(), global: budget() });
    else throw new Error('Use prepare, development, validation, integration or status');
  }
}
