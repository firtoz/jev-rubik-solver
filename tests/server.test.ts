import { test, expect, afterAll } from 'bun:test';
process.env.RUBIK_DB = `/tmp/rubik-test-${crypto.randomUUID()}.sqlite`;
process.env.TYPESAFE_API_KEY = 'test-only-credential';
const store = await import('../src/server/store');
const runner = await import('../src/server/runner');
const jev = await import('../src/server/jev');
const originalFetch = globalThis.fetch;
afterAll(() => {
  globalThis.fetch = originalFetch;
  store.db.close();
});
test('complete native response fields survive validation, and credentials never enter records', async () => {
  const raw = {
    model: jev.MODEL,
    answers: {
      q: {
        type: 'choice',
        choice: 'a',
        confidence: 0.8,
        probabilities: { a: 0.8, b: 0.2 },
        providerExtra: { value: 7 },
      },
    },
    usage: { input_tokens: 20, output_tokens: 5, extraCount: 1 },
    providerMetadata: { trace: 'example' },
  };
  globalThis.fetch = (async () => Response.json(raw)) as unknown as typeof fetch;
  const r = await runner.createRun('R', 'primitive');
  const request: any = {
    model: jev.MODEL,
    state: { fact: 'test' },
    questions: { q: { type: 'choice', instructions: 'pick', criteria: { a: 'A', b: 'B' } } },
  };
  const d = await jev.evaluate(r.id, request, AbortSignal.timeout(1000), { maxAttempts: 1 });
  expect(d.nativeResponse).toEqual(raw);
  const saved = store.events(r.id);
  expect(saved.find((e) => e.kind === 'decision')?.payload.nativeResponse).toEqual(raw);
  expect(JSON.stringify(saved)).not.toContain('test-only-credential');
  expect(JSON.stringify(saved)).not.toContain('Authorization');
});
function fake(chooser: (q: string, criteria: Record<string, string>) => string) {
  globalThis.fetch = (async (_url: any, init: any) => {
    const req = JSON.parse(init.body);
    const answers = Object.fromEntries(
      Object.entries(req.questions).map(([name, q]: any) => {
        const choice = chooser(name, q.criteria);
        return [
          name,
          {
            type: 'choice',
            choice,
            confidence: 1,
            probabilities: Object.fromEntries(
              Object.keys(q.criteria).map((k) => [k, k === choice ? 1 : 0]),
            ),
          },
        ];
      }),
    );
    return Response.json({
      model: jev.MODEL,
      answers,
      usage: { input_tokens: 100, output_tokens: 20 },
    });
  }) as unknown as typeof fetch;
}
test('live protocol executes selected turn; duplicates and stale steps reject', async () => {
  const spentBefore = store.spend();
  fake((q, c) => (q === 'turn' ? "R'" : Object.keys(c)[0]));
  const r = await runner.createRun('R', 'primitive');
  const command = crypto.randomUUID();
  const result = await runner.step(r.id, 0, command);
  expect(result.status).toBe('solved');
  expect(result.requests).toBe(3);
  expect(result.turns).toBe(1);
  expect(store.events(r.id).filter((e) => e.kind === 'decision')).toHaveLength(3);
  expect(store.spend() - spentBefore).toBeCloseTo(0.0000126, 8);
  await expect(runner.step(r.id, 0, command)).rejects.toThrow();
  const other = await runner.createRun('R', 'primitive');
  expect(() => store.lock(other.id, 5, crypto.randomUUID())).toThrow('Stale');
});
test('leases reject concurrent work and events cannot be overwritten', async () => {
  const r = await runner.createRun('R', 'skills');
  const id = crypto.randomUUID(),
    owner = store.lock(r.id, 0, id);
  expect(() => store.lock(r.id, 0, crypto.randomUUID())).toThrow('progress');
  store.unlock(r.id, owner);
  expect(() => store.lock(r.id, 0, id)).toThrow('Duplicate');
  expect(() => store.db.query("UPDATE events SET kind='wrong'").run()).toThrow('immutable');
});
test('malformed response does not change cube; reservation remains', async () => {
  globalThis.fetch = (async () => Response.json({ bad: true })) as unknown as typeof fetch;
  const r = await runner.createRun('R', 'primitive');
  const before = store.spend();
  const after = await runner.step(r.id, 0, crypto.randomUUID());
  expect(after.status).toBe('error');
  expect(after.history).toHaveLength(0);
  expect(store.spend() - before).toBeCloseTo(64000 * store.PRICE, 8);
});
test('probability keys, model and sum are validated', () => {
  const req: any = {
    model: jev.MODEL,
    state: {},
    questions: { q: { type: 'choice', instructions: 'pick', criteria: { a: 'A', b: 'B' } } },
  };
  const raw: any = {
    model: jev.MODEL,
    answers: {
      q: { type: 'choice', choice: 'a', confidence: 0.8, probabilities: { a: 0.8, b: 0.2 } },
    },
    usage: { input_tokens: 20, output_tokens: 5 },
  };
  expect(jev.validateResponse(raw, req)).toEqual(raw);
  raw.answers.q.probabilities.b = 0.5;
  expect(() => jev.validateResponse(raw, req)).toThrow();
});
test('pause cancels pending request and prevents an action', async () => {
  let began!: () => void;
  const started = new Promise<void>((r) => (began = r));
  globalThis.fetch = ((_u: any, init: any) =>
    new Promise((_resolve, reject) => {
      began();
      init.signal.addEventListener('abort', () => reject(new Error('aborted')));
    })) as unknown as typeof fetch;
  const r = await runner.createRun('R', 'primitive');
  const task = runner.step(r.id, 0, crypto.randomUUID());
  await started;
  runner.controlRun(r.id, 'pause');
  const result = await task;
  expect(result.status).toBe('paused');
  expect(result.history).toHaveLength(0);
});
test('request cap, recovery after restart and budget cap are durable', async () => {
  const r = await runner.createRun('R', 'skills');
  r.requests = 500;
  store.saveRun(r);
  const result = await runner.step(r.id, 0, crypto.randomUUID());
  expect(result.status).toBe('capped');
  const s = await runner.createRun('R', 'skills');
  s.status = 'running';
  store.saveRun(s);
  store.recover();
  expect(store.getRun(s.id).status).toBe('paused');
  const reservationId = crypto.randomUUID();
  store.reserve(reservationId, s.id, 4.9 - store.spend());
  expect(() => store.reserve(crypto.randomUUID(), s.id, 0.11)).toThrow('budget');
  store.settle(reservationId, 0);
});
test('policy input contains observations but no scramble or initial history', async () => {
  const r = await runner.createRun("R U F'", 'skills');
  const obs = runner.observation(r);
  expect('scramble' in obs).toBe(false);
  expect(obs.recentActions).toEqual([]);
  expect(obs.stagePieces).toHaveLength(4);
});
test('rate limits retry with separate reservations and network failures retain theirs', async () => {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    return new Response('{}', { status: 429 });
  }) as unknown as typeof fetch;
  const r = await runner.createRun('R', 'primitive');
  const before = store.spend();
  const done = await runner.step(r.id, 0, crypto.randomUUID());
  expect(calls).toBe(3);
  expect(done.requests).toBe(3);
  expect(done.status).toBe('error');
  expect(store.spend() - before).toBeCloseTo(3 * 64000 * store.PRICE, 8);
  globalThis.fetch = (async () => {
    throw new Error('offline');
  }) as unknown as typeof fetch;
  const next = await runner.createRun('R', 'primitive');
  const failed = await runner.step(next.id, 0, crypto.randomUUID());
  expect(failed.status).toBe('error');
  expect(failed.history).toHaveLength(0);
}, 10000);
test('a paused run can resume from its recorded state without lost moves', async () => {
  fake((q, c) => (q === 'turn' ? "R'" : Object.keys(c)[0]));
  const r = await runner.createRun('R', 'primitive');
  runner.controlRun(r.id, 'pause');
  const paused = store.getRun(r.id);
  const finished = await runner.step(r.id, paused.revision, crypto.randomUUID());
  expect(finished.status).toBe('solved');
  expect(finished.history).toEqual(["R'"]);
});
test('concurrent processes reserve against one shared budget without snapshot-lock failures', async () => {
  const before = store.spend();
  const children = Array.from({ length: 4 }, () =>
    Bun.spawn(
      [
        process.execPath,
        '-e',
        "import {reserve} from './src/server/store';for(let i=0;i<10;i++)reserve(crypto.randomUUID(),'concurrency-test',0.0001);",
      ],
      { cwd: process.cwd(), env: { ...process.env }, stdout: 'pipe', stderr: 'pipe' },
    ),
  );
  for (const child of children) {
    const code = await child.exited;
    if (code !== 0) throw new Error(await new Response(child.stderr).text());
    expect(code).toBe(0);
  }
  expect(store.spend() - before).toBeCloseTo(0.004, 8);
});

test('bounded probes disable automatic retries and retain uncertain reservations', async () => {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    return new Response('{}', { status: 429 });
  }) as unknown as typeof fetch;
  const r = await runner.createRun('R', 'primitive');
  const before = store.spend();
  await expect(
    jev.evaluate(
      r.id,
      {
        model: jev.MODEL,
        state: {},
        questions: { action: { type: 'choice', instructions: 'Choose', criteria: { R: 'R' } } },
      },
      AbortSignal.timeout(1000),
      { maxAttempts: 1 },
    ),
  ).rejects.toThrow('429');
  expect(calls).toBe(1);
  expect(store.getRun(r.id).requests).toBe(1);
  expect(store.spend() - before).toBeCloseTo(64000 * store.PRICE, 8);
});

test('runner obeys a model-selected goal even when the old curriculum would disagree', async () => {
  fake((q, c) => (q === 'goal' ? 'middle-layer' : q === 'turn' ? 'U' : Object.keys(c)[0]));
  const r = await runner.createRun('R', 'primitive');
  expect(r.stage).toBe('choose-goal');
  const after = await runner.step(r.id, 0, crypto.randomUUID());
  expect(after.stage).toBe('middle-layer');
  const recorded = store.events(r.id);
  expect(recorded.find((e) => e.kind === 'goal')?.payload.selectedGoal).toBe('middle-layer');
  expect(recorded.find((e) => e.kind === 'action')?.payload.stageBefore).toBe('middle-layer');
  expect(recorded.find((e) => e.kind === 'action')?.payload.stageAfter).toBe('middle-layer');
  expect(after.history).toEqual(['U']);
});

const { createSession, viewSession, advanceSession } = await import('../src/server/tutorial');
const { hash } = await import('../src/lib/cube');
test('article pauses at real dependencies, preserves responses and applies only on command', async () => {
  let calls = 0;
  globalThis.fetch = (async (_url: any, init: any) => {
    calls++;
    const request = JSON.parse(init.body);
    const chosen: Record<string, string> = {
      goal: 'top-edges',
      target: 'whole',
      intent_whole: 'align',
      reference: 'F',
      operation: "U'",
    };
    return Response.json({
      model: 'jev-1.13.0',
      answers: Object.fromEntries(
        Object.entries(request.questions).map(([id, q]: any) => [
          id,
          {
            type: 'choice',
            choice: chosen[id],
            confidence: 0.9,
            probabilities: Object.fromEntries(
              Object.keys(q.criteria).map((k) => [k, k === chosen[id] ? 1 : 0]),
            ),
          },
        ]),
      ),
      usage: { input_tokens: 50, output_tokens: 10 },
      extra: { kept: true },
    });
  }) as typeof fetch;
  let s = await createSession('U');
  await expect(runner.step(s.id,0,crypto.randomUUID())).rejects.toThrow('How it works');
  expect(()=>runner.controlRun(s.id,'start')).toThrow('How it works');
  const initial = hash(s.run.state);
  expect(calls).toBe(0);
  expect(Object.keys(s.request!.questions)).toEqual(['goal']);
  const id = s.id;
  let firstCommand = '';
  for (let i = 0; i < 4; i++) {
    const command = crypto.randomUUID();
    if (i === 0) firstCommand = command;
    s = await advanceSession(id, s.revision, command, 'ask');
    expect(hash(s.run.state)).toBe(initial);
  }
  expect(calls).toBe(4);
  expect(s.action?.alg).toBe("U'");
  expect((s.answers[0].nativeResponse as any).extra.kept).toBe(true);
  const restored = await viewSession(id);
  expect(restored.answers).toEqual(s.answers);
  expect(calls).toBe(4);
  await expect(advanceSession(id, 0, crypto.randomUUID(), 'ask')).rejects.toThrow('Stale');
  await expect(advanceSession(id, s.revision, firstCommand, 'apply')).rejects.toThrow('Duplicate');
  s = await advanceSession(id, s.revision, crypto.randomUUID(), 'apply');
  expect(s.solved).toBe(true);
  expect(s.archive).toHaveLength(1);
  expect(calls).toBe(4);
});
test('solved and malformed configurations never dispatch', async () => {
  const s = await createSession('');
  expect(s.solved).toBe(true);
  expect(s.request).toBeNull();
  await expect(advanceSession(s.id, 0, crypto.randomUUID(), 'ask')).rejects.toThrow('No pending');
  await expect(createSession('not moves')).rejects.toThrow('standard face turns');
});
