import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRun, finish, getRun, events, observation, controlRun } from '../src/server/runner';
import { db, saveRun } from '../src/server/store';
import { evaluate, MODEL, budget } from '../src/server/jev';
import { solved, apply, inverse, isSolved, hash, turnDescription } from '../src/lib/cube';
import { skills, SKILL_VERSION } from '../src/lib/skills';
import { VERSION, type Policy, type Run } from '../src/lib/types';
const [command = 'status', ...args] = process.argv.slice(2);
mkdirSync('.data/reports', { recursive: true });
mkdirSync('.data/datasets', { recursive: true });
mkdirSync('.data/configs', { recursive: true });
function output(name: string, data: unknown) {
  writeFileSync(`.data/reports/${name}.json`, JSON.stringify(data, null, 2));
  console.log(JSON.stringify(data, null, 2));
}
function snapshot() {
  const files = Object.fromEntries(
    [
      'src/server/runner.ts',
      'src/server/skill-policy.ts',
      'src/lib/cube.ts',
      'src/lib/skills.ts',
      'src/lib/types.ts',
      'src/server/jev.ts',
    ].map((path) => [path, readFileSync(path, 'utf8')]),
  );
  const sourceHash = createHash('sha256').update(JSON.stringify(files)).digest('hex');
  writeFileSync(`.data/configs/${sourceHash}.json`, JSON.stringify(files, null, 2));
  return sourceHash;
}
async function probe() {
  const cases = [
    {
      name: 'recognition',
      scramble: 'R',
      question: 'Where is the white-green-red corner currently located?',
      criteria: Object.fromEntries('UFR URB UBL ULF DRF DFL DLB DBR'.split(' ').map((x) => [x, x])),
      expected: 'URB',
    },
    {
      name: 'setup',
      scramble: 'U',
      question:
        'The lower two layers and orientations are already solved. Which U turn restores all pieces to their destinations? Use the static sticker-direction mappings.',
      criteria: { U: turnDescription('U'), "U'": turnDescription("U'"), U2: turnDescription('U2') },
      expected: "U'",
    },
    {
      name: 'skill',
      scramble: inverse(skills.find((s) => s.id === 'sune')!.alg),
      question:
        'Choose the algorithm that solves this top-corner orientation case in the fixed F reference without a setup.',
      criteria: Object.fromEntries(
        skills
          .filter((s) => s.stages.includes('top-orientation'))
          .map((s) => [s.id, s.purpose + ' ' + s.alg]),
      ),
      expected: 'sune',
    },
  ];
  const results = [];
  for (const c of cases) {
    const r = await createRun(c.scramble, 'skills', 'probe');
    const d = await evaluate(
      r.id,
      {
        model: MODEL,
        state: observation(r),
        questions: { [c.name]: { type: 'choice', instructions: c.question, criteria: c.criteria } },
      },
      AbortSignal.timeout(30000),
    );
    results.push({
      name: c.name,
      expected: c.expected,
      actual: d.response.answers[c.name].choice,
      correct: d.response.answers[c.name].choice === c.expected,
      runId: r.id,
      ...d,
    });
    const done = getRun(r.id);
    done.status = 'stopped';
    done.reason = 'Capability probe completed; no solve attempted';
    saveRun(done);
  }
  output(`probes-${VERSION}`, { sourceHash: snapshot(), results, budget: budget() });
}
async function generate(split: string, count: number) {
  if (
    !['development', 'validation', 'final-test'].includes(split) ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 1000
  )
    throw new Error('Use development, validation, or final-test and a count from 1 to 1000');
  const { randomScrambleForEvent } = await import('cubing/scramble');
  const used = new Set(
    (
      db
        .query("SELECT json_extract(payload,'$.state') state FROM events WHERE kind='created'")
        .all() as { state: string }[]
    ).map((x) => hash(JSON.parse(x.state))),
  );
  const cases = [];
  while (cases.length < count) {
    const scramble = (await randomScrambleForEvent('333')).toString();
    const stateHash = hash(await apply(await solved(), scramble));
    if (used.has(stateHash)) continue;
    used.add(stateHash);
    cases.push({ id: crypto.randomUUID(), scramble, stateHash });
  }
  const dataset = { id: crypto.randomUUID(), split, createdAt: new Date().toISOString(), cases };
  const path = `.data/datasets/${split}-${dataset.id}.json`;
  writeFileSync(path, JSON.stringify(dataset, null, 2));
  writeFileSync(`.data/${split}.json`, JSON.stringify(dataset, null, 2));
  console.log(`Saved ${count} ${split} cases to ${path}; default pointer .data/${split}.json`);
}
function summarise(report: any) {
  return Object.fromEntries(
    ['skills', 'primitive'].map((policy) => {
      const rs = report.results.filter((r: any) => r.policy === policy);
      const latency = rs
        .flatMap((r: any) =>
          events(r.runId)
            .filter((e) => e.kind === 'decision')
            .map((e) => e.payload.elapsedMs),
        )
        .sort((a: number, b: number) => a - b);
      return [
        policy,
        {
          assigned: (report.policies ?? ['skills', 'primitive']).includes(policy)
            ? report.cases.length
            : 0,
          completed: rs.length,
          solved: rs.filter((r: any) => r.verifiedSolved).length,
          requests: rs.reduce((n: number, r: any) => n + r.requests, 0),
          turns: rs.reduce((n: number, r: any) => n + r.turns, 0),
          inputTokens: rs.reduce((n: number, r: any) => n + r.tokens, 0),
          cost: rs.reduce((n: number, r: any) => n + r.cost, 0),
          activeMs: rs.reduce((n: number, r: any) => n + r.activeMs, 0),
          recoveryDecisions: rs.reduce((n: number, r: any) => n + r.recovery, 0),
          requestLatencyMs: {
            p50: latency[Math.floor(latency.length * 0.5)] || null,
            p95: latency[Math.floor(latency.length * 0.95)] || null,
          },
          failures: rs
            .filter((r: any) => !r.verifiedSolved)
            .map((r: any) => ({ caseId: r.caseId, stage: r.stage, reason: r.reason })),
        },
      ];
    }),
  );
}
async function compare(final = false) {
  const policies: Policy[] = args.includes('--skills-only') ? ['skills'] : ['skills', 'primitive'];
  const id = crypto.randomUUID();
  let cases: { id: string; scramble: string }[],
    split = 'development',
    datasetId: string | null = null;
  if (args[0] || final) {
    const data = JSON.parse(readFileSync(args[0] || '.data/final-test.json', 'utf8'));
    cases = data.cases;
    split = data.split;
    datasetId = data.id;
    if (
      !['development', 'validation', 'final-test'].includes(split) ||
      !Array.isArray(cases) ||
      !cases.length
    )
      throw new Error('Invalid dataset');
    if (final && (split !== 'final-test' || cases.length !== 100))
      throw new Error('Final evaluation requires a fresh 100-case final-test dataset');
    if (!final && split === 'final-test') throw new Error('Use lab final for held-out data');
    if (final) {
      const prior = (db.query('SELECT json FROM benchmarks').all() as { json: string }[]).map((x) =>
        JSON.parse(x.json),
      );
      if (prior.some((x) => x.datasetId === datasetId))
        throw new Error('Final dataset already consumed; generate a fresh one.');
      const used = new Set(
        (
          db
            .query("SELECT json_extract(payload,'$.state') state FROM events WHERE kind='created'")
            .all() as { state: string }[]
        ).map((x) => hash(JSON.parse(x.state))),
      );
      for (const c of cases) {
        const h = hash(await apply(await solved(), c.scramble));
        if (used.has(h))
          throw new Error('Held-out state duplicates prior exposure or another test case');
        used.add(h);
      }
    }
  } else
    cases = [
      'R',
      'R U',
      "R U F'",
      "R U R' U'",
      "R U F' L D2",
      "F R U R' U' F'",
      inverse(skills.find((s) => s.id === 'sune')!.alg),
    ].map((scramble, i) => ({ id: String(i), scramble }));
  const report: any = {
    id,
    name: final ? 'Held-out reliability evaluation' : 'Policy comparison',
    split,
    version: VERSION + '/' + SKILL_VERSION,
    sourceHash: snapshot(),
    datasetId,
    cases,
    policies,
    status: 'running',
    startedAt: new Date().toISOString(),
    results: [],
  };
  const persist = () => {
    report.summary = summarise(report);
    db.query('INSERT OR REPLACE INTO benchmarks VALUES (?,?)').run(id, JSON.stringify(report));
  };
  persist();
  const queue: { c: { id: string; scramble: string }; policy: Policy; run: Run }[] = [];
  for (const c of cases)
    for (const policy of policies)
      queue.push({ c, policy, run: await createRun(c.scramble, policy, split, id) });
  const assignedRuns = queue.map((x) => x.run.id);
  const stopOnSignal = () => {
    for (const runId of assignedRuns) {
      try {
        controlRun(runId, 'stop');
      } catch {}
    }
  };
  process.once('SIGTERM', stopOnSignal);
  process.once('SIGINT', stopOnSignal);
  const capture = async (r: (typeof queue)[number]) => {
    let result = getRun(r.run.id);
    let verifiedSolved = false;
    try {
      result = await finish(r.run.id);
      verifiedSolved =
        result.status === 'solved' &&
        isSolved(await apply(await solved(), [result.scramble, ...result.history].join(' ')));
    } catch (error) {
      result = getRun(r.run.id);
      result.status = 'error';
      result.reason = error instanceof Error ? error.message : 'Worker failure';
      saveRun(result);
    }
    const entry = {
      caseId: r.c.id,
      policy: r.policy,
      runId: result.id,
      status: result.status,
      verifiedSolved,
      stage: result.stage,
      requests: result.requests,
      turns: result.turns,
      tokens: result.tokens,
      cost: result.cost,
      activeMs: result.activeMs,
      recovery: events(result.id).filter((e) => e.kind === 'recovery').length,
      reason: result.reason,
    };
    report.results.push(entry);
    persist();
    console.log(JSON.stringify(entry));
  };
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (queue.length) await capture(queue.shift()!);
    }),
  );
  process.off('SIGTERM', stopOnSignal);
  process.off('SIGINT', stopOnSignal);
  report.status = 'complete';
  report.finishedAt = new Date().toISOString();
  report.accepted = final && report.summary.skills.solved >= 95;
  persist();
  output(id, report);
}
if (command === 'probe') await probe();
else if (command === 'compare') await compare();
else if (command === 'final') await compare(true);
else if (command === 'generate') await generate(args[0] || 'development', Number(args[1] || 20));
else if (command === 'solve') {
  snapshot();
  const r = await createRun(
    args.slice(1).join(' ') || 'R',
    args[0] === 'primitive' ? 'primitive' : 'skills',
    'development',
  );
  output(r.id, await finish(r.id));
} else if (command === 'status') output('status', budget());
else
  throw new Error(
    'Commands: status, probe, solve [skills|primitive] [scramble], generate [split] [count], compare [dataset.json], final [dataset.json]',
  );
