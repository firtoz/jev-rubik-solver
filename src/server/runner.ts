import { apply, solved, parseScramble, facts, isSolved, focusedObservation } from '../lib/cube';
import { decideRound, remember, type Round } from '../solver';
import { VERSION, LIMITS, type Run, type Policy } from '../lib/types';
import {
  db,
  event,
  events,
  getRun,
  saveRun,
  listRuns,
  lock,
  unlock,
  renew,
  assertOwner,
  recover,
} from './store';
import { evaluate } from './jev';
const globals = globalThis as typeof globalThis & {
  rubikActive?: Map<string, AbortController>;
  rubikRecovered?: boolean;
  rubikReaper?: ReturnType<typeof setInterval>;
};
const active = (globals.rubikActive ??= new Map<string, AbortController>());
if (!globals.rubikRecovered) {
  recover();
  globals.rubikRecovered = true;
}
if (!globals.rubikReaper) {
  globals.rubikReaper = setInterval(() => recover(), 15000);
  globals.rubikReaper.unref();
}
export async function createRun(
  scramble: string,
  policy: Policy,
  split = 'interactive',
  benchmarkId: string | null = null,
) {
  if (policy !== 'skills')
    throw new Error(
      'Only the grouped-menu solver is available. Older recordings remain replayable.',
    );
  scramble = parseScramble(scramble);
  const state = await apply(await solved(), scramble);
  const r: Run = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    policy,
    scramble,
    state,
    status: isSolved(state) ? 'solved' : 'ready',
    revision: 0,
    stage: isSolved(state) ? 'solved' : '',
    target: null,
    history: [],
    requests: 0,
    turns: 0,
    activeMs: 0,
    tokens: 0,
    cost: 0,
    reason: null,
    version: VERSION,
    split,
    benchmarkId,
  };
  saveRun(r);
  event(r.id, 'created', { state, policy, version: r.version });
  return r;
}
export function observation(r: Run, state = r.state) {
  return focusedObservation(r, state);
}
const terminal = (r: Run) => ['solved', 'stopped', 'capped', 'error'].includes(r.status);
export async function step(id: string, revision: number, command: string) {
  const initial = getRun(id);
  if (initial.split === 'article-manual')
    throw new Error('Retired manual sessions cannot execute.');
  if (terminal(initial)) throw new Error('Run is finished');
  if (initial.version !== VERSION)
    throw new Error('This run uses an older policy version. Replay it or create a new run.');
  const owner = lock(id, revision, command);
  const control = new AbortController();
  active.set(id, control);
  const started = Date.now();
  const remaining = LIMITS.ms - initial.activeMs;
  const timeout = setTimeout(() => control.abort(), Math.max(1, remaining));
  const lease = setInterval(() => {
    try {
      renew(id, owner);
      const r = getRun(id);
      if (r.status === 'stopped' || (initial.status === 'running' && r.status === 'paused'))
        control.abort();
    } catch {
      control.abort();
    }
  }, 1000);
  const check = () => {
    control.signal.throwIfAborted();
    assertOwner(id, owner);
    const r = getRun(id);
    if (r.revision !== revision) throw new Error('Run changed during decision');
    if (
      r.requests >= LIMITS.requests ||
      r.turns >= LIMITS.turns ||
      r.activeMs + Date.now() - started >= LIMITS.ms
    )
      throw new Error('Execution limit reached');
  };
  try {
    check();
    let r = getRun(id);
    if (isSolved(r.state)) {
      r.status = 'solved';
      saveRun(r);
      return r;
    }
    const rounds: Round[] = events(id)
      .filter((e) => e.kind === 'action')
      .map((e) => ({
        before: e.payload.before,
        after: e.payload.after,
        action: e.payload.decision,
        recovery: e.payload.decision?.recovery,
      }));
    const decision = await decideRound(
      r,
      async (request) => {
        check();
        return (await evaluate(id, request, control.signal)).response;
      },
      { rounds, pendingPlan: rounds.length ? remember(rounds.at(-1)!.action) : null },
    );
    const { alg, target, front, skill, intent: recognisedCase } = decision;
    if (!alg) throw new Error('Policy abstained: no executable routine selected');
    const recovery = decision.recovery === 'undo';
    const setup = 'none';

    check();
    r = getRun(id);
    const count = alg.split(/\s+/).filter(Boolean).length;
    if (r.turns + count > LIMITS.turns) throw new Error('Face-turn limit reached');
    const after = await apply(r.state, alg);
    check();
    db.transaction(() => {
      assertOwner(id, owner);
      r = getRun(id);
      if (r.revision !== revision) throw new Error('Stale action');
      const before = r.state,
        stageBefore = r.stage;
      r.state = after;
      r.stage = isSolved(after) ? 'solved' : decision.goal;
      event(id, 'goal', { previousGoal: stageBefore, selectedGoal: decision.goal, owner: 'jev' });
      r.target = target;
      r.history.push(alg);
      r.turns += count;
      r.revision++;
      r.reason = null;
      if (isSolved(after)) r.status = 'solved';
      event(id, 'action', {
        decision,
        nextPendingPlan: remember(decision),
        before,
        after,
        alg,
        target,
        front,
        setup,
        skill,
        recognisedCase,
        recovery,
        stageBefore,
        stageAfter: r.stage,
        factsBefore: facts(before),
        factsAfter: facts(after),
      });
      saveRun(r);
    }).immediate();
  } catch (error) {
    const r = getRun(id);
    const msg = error instanceof Error ? error.message : 'Execution failed';
    if (!['paused', 'stopped'].includes(r.status)) {
      r.status = /limit|budget|abort|cancel/i.test(msg) ? 'capped' : 'error';
      r.reason = msg;
      saveRun(r);
    }
    event(id, 'halt', { reason: msg, status: r.status });
  } finally {
    clearTimeout(timeout);
    clearInterval(lease);
    const r = getRun(id);
    r.activeMs += Date.now() - started;
    if (
      r.status === 'running' &&
      (r.requests >= LIMITS.requests || r.turns >= LIMITS.turns || r.activeMs >= LIMITS.ms)
    ) {
      r.status = 'capped';
      r.reason = 'Execution limit reached';
    }
    saveRun(r);
    unlock(id, owner);
    active.delete(id);
  }
  return getRun(id);
}
export function controlRun(id: string, action: 'start' | 'pause' | 'stop') {
  if (action === 'start' && getRun(id).split === 'article-manual')
    throw new Error('Retired manual sessions cannot execute.');
  const r = getRun(id);
  if (terminal(r)) throw new Error('Run is finished');
  if (action === 'start') {
    if (r.status === 'running') return r;
    const pending = db.query('SELECT expires FROM locks WHERE run_id=?').get(id) as {
      expires: number;
    } | null;
    if (pending && pending.expires > Date.now())
      throw new Error('A decision is already in progress');
    r.status = 'running';
    r.reason = null;
    saveRun(r);
    event(id, 'control', { action });
    void loop(id);
  } else {
    r.status = action === 'pause' ? 'paused' : 'stopped';
    r.revision++;
    saveRun(r);
    active.get(id)?.abort();
    event(id, 'control', { action });
  }
  return r;
}
async function loop(id: string) {
  while (getRun(id).status === 'running') {
    const r = getRun(id);
    try {
      await step(id, r.revision, crypto.randomUUID());
    } catch {
      const latest = getRun(id);
      if (latest.status === 'running') {
        latest.status = 'paused';
        latest.reason = 'Another decision is in progress; resume when it completes.';
        saveRun(latest);
      }
      break;
    }
  }
}
export async function finish(id: string) {
  let r = getRun(id);
  if (terminal(r)) return r;
  r.status = 'running';
  saveRun(r);
  while (r.status === 'running') {
    r = await step(id, r.revision, crypto.randomUUID());
  }
  return r;
}
export { getRun, listRuns, events };
