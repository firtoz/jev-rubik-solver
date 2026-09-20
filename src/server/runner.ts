import { goalRequest } from './goal-policy';
import { skillDecision } from './skill-policy';
import {
  apply,
  solved,
  parseScramble,
  stageProgress,
  pieces,
  facts,
  hash,
  isSolved,
  inverse,
  turns,
  turnDescription,
  targetNames,
  focusedObservation,
  semanticFacts,
} from '../lib/cube';
import { SKILL_VERSION } from '../lib/skills';
import { VERSION, LIMITS, type Run, type Policy, type JevRequest } from '../lib/types';
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
import { evaluate, MODEL } from './jev';
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
    stage: isSolved(state) ? 'solved' : 'choose-goal',
    target: null,
    history: [],
    requests: 0,
    turns: 0,
    activeMs: 0,
    tokens: 0,
    cost: 0,
    reason: null,
    version: VERSION + '/' + SKILL_VERSION,
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
function localView(view: ReturnType<typeof observation>) {
  const { otherPieces, ...local } = semanticFacts(view);
  return local;
}
const terminal = (r: Run) => ['solved', 'stopped', 'capped', 'error'].includes(r.status);
export async function step(id: string, revision: number, command: string) {
  const initial = getRun(id);
  if (terminal(initial)) throw new Error('Run is finished');
  if (initial.version !== VERSION + '/' + SKILL_VERSION)
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
    const choose = async (
      name: string,
      instructions: unknown,
      criteria: Record<string, string>,
      state: unknown = observation(r),
    ) => {
      check();
      const req: JevRequest = {
        model: MODEL,
        state,
        questions: { [name]: { type: 'choice', instructions, criteria } },
      };
      const d = await evaluate(id, req, control.signal);
      return d.response.answers[name].choice;
    };
    // JEV owns goal selection. Always offer the same complete goal menu;
    // factual completion predicates never dispatch the next goal in code.
    const previousGoal = r.stage === 'choose-goal' ? null : r.stage;
    const goalInput = goalRequest(MODEL, r.state, previousGoal, r.history);
    const selectedGoal = await choose(
      'goal',
      goalInput.questions.goal.instructions,
      goalInput.questions.goal.criteria,
      goalInput.state,
    );
    check();
    r = getRun(id); // Preserve usage counters written by evaluate.
    if (selectedGoal !== r.stage) r.target = null;
    r.stage = selectedGoal;
    saveRun(r);
    event(id, 'goal', { previousGoal, selectedGoal, owner: 'jev' });
    let alg = '',
      recovery = false,
      retarget = false,
      target = r.target,
      front = 'F',
      setup = 'none',
      skill = '',
      recognisedCase = '';
    const previous = events(id).filter((e) => e.kind === 'action');
    const experience = previous
      .filter((e) => hash(e.payload.before) === hash(r.state))
      .slice(-3)
      .map((e) => ({
        action: e.payload.alg,
        target: e.payload.target,
        factsBefore: e.payload.factsBefore,
        factsAfter: e.payload.factsAfter,
      }));
    const repeated = previous.filter((e) => hash(e.payload.after) === hash(r.state)).length >= 2;
    const recent = previous.slice(-6);
    const stalled =
      recent.length === 6 &&
      recent.every((e) => e.payload.stageBefore === r.stage) &&
      stageProgress(r.state, r.stage) <= stageProgress(recent[0].payload.before, r.stage);
    const lastRecovery = events(id)
      .filter((e) => e.kind === 'recovery')
      .at(-1);
    const recoveryReady =
      !lastRecovery || previous.filter((e) => e.id > lastRecovery.id).length >= 4;
    if ((repeated || stalled) && r.history.length && recoveryReady) {
      const response = await choose(
        'recovery',
        'The solve has repeated a state or stayed in this stage for six actions. Choose recovery deliberately. Temporary regression can be necessary. Do not repeatedly undo an undo: that only repeats the same two states. If previous recovery did not help, retarget or continue with a different action.',
        {
          continue:
            'Continue from this position, choosing a different operation or reference if needed',
          undo: 'Undo exactly the last executed action',
          retarget: 'Choose a different target piece or reconsider the layer pattern',
        },
        {
          ...observation(r),
          lastRecovery:
            events(id)
              .filter((e) => e.kind === 'recovery')
              .at(-1)?.payload || null,
          lastActionWasUndo: previous.at(-1)?.payload.recovery || false,
        },
      );
      event(id, 'recovery', { choice: response, repeated, stalled });
      if (response === 'undo') {
        alg = inverse(r.history.at(-1)!);
        recovery = true;
      }
      if (response === 'retarget') {
        target = null;
        retarget = true;
      }
    }
    if (!alg) {
      if (r.policy === 'skills') {
        const decision = await skillDecision(
          r,
          MODEL,
          async (request) => {
            check();
            return (await evaluate(id, request, control.signal, { maxAttempts: 1 })).response;
          },
          experience,
          retarget ? r.target : null,
        );
        ({ target, front, skill, alg } = decision);
        recognisedCase = decision.intent;
      } else {
        const targets = pieces(r.state).filter((p) => targetNames(r.stage).includes(p.piece));
        const criteria = Object.fromEntries(
          targets.map((p) => [
            p.piece,
            `${p.kind} ${p.piece}, currently at ${p.position}, destination ${p.destination}; ${(r.stage === 'daisy' ? p.stickers.yellow === 'U' : p.solved) ? 'current stage goal satisfied — protect it' : 'current stage goal NOT satisfied'}`,
          ]),
        );
        if (r.stage.startsWith('top-')) criteria.whole = 'Work on the layer pattern as a whole';
        target = await choose(
          'target',
          'Choose a piece whose current stage goal is NOT satisfied. For the daisy, select a yellow edge that is not a yellow-up petal, even if it is solved on D. For later stages protect solved pieces.',
          criteria,
          localView(observation(r)),
        );
        r = { ...r, target };
        if (r.policy === 'primitive') {
          alg = await choose(
            'turn',
            'Choose one face turn that moves the target toward its requiredStickerDirections and destination while protecting solved pieces. Read the static direction mappings in the options. If one turn solves the entire cube, choose it. Quarter turns are clockwise looking directly at that face; prime is counterclockwise.',
            Object.fromEntries(turns.map((t) => [t, turnDescription(t)])),
          );
          skill = alg;
        }
      }
    }

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
      // Keep the model's selected goal until its next goal decision.
      if (isSolved(after)) r.stage = 'solved';
      r.target = target;
      r.history.push(alg);
      r.turns += count;
      r.revision++;
      r.reason = null;
      if (isSolved(after)) r.status = 'solved';
      event(id, 'action', {
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
