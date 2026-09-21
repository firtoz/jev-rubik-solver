import { db, getRun, saveRun, event, lock, unlock, assertOwner } from './store';
import { createRun } from './runner';
import { evaluate, MODEL, budget } from './jev';
import { goalRequest } from './goal-policy';
import { measuredSkillDecision } from './measured-policy';
import { apply, isSolved, hash } from '../lib/cube';
import type { JevRequest, JevResponse } from '../lib/types';
db.exec('CREATE TABLE IF NOT EXISTS tutorial_sessions(id TEXT PRIMARY KEY,json TEXT NOT NULL)');
type Answer = {
  request: JevRequest;
  response: JevResponse;
  nativeResponse: unknown;
  elapsedMs: number;
};
type Session = { id: string; revision: number; answers: Answer[]; archive: Answer[][] };
function read(id: string): Session {
  const row = db.query('SELECT json FROM tutorial_sessions WHERE id=?').get(id) as {
    json: string;
  } | null;
  if (!row) throw new Error('Article session not found');
  return JSON.parse(row.json);
}
function save(s: Session) {
  db.query('INSERT OR REPLACE INTO tutorial_sessions VALUES (?,?)').run(s.id, JSON.stringify(s));
}
// Replay only cached answers through the real policy. Stop at the next dependency.
export async function nextLayer(
  run: ReturnType<typeof getRun>,
  answers: Answer[],
): Promise<{
  request: JevRequest | null;
  action: Awaited<ReturnType<typeof measuredSkillDecision>> | null;
  solved: boolean;
  error: string | null;
}> {
  let cursor = 0;
  const pending = new Error('pending');
  let request: JevRequest | null = null;
  const ask = async (q: JevRequest): Promise<JevResponse> => {
    const cached = answers[cursor++];
    if (!cached) {
      request = q;
      throw pending;
    }
    if (JSON.stringify(cached.request) !== JSON.stringify(q))
      throw new Error('Policy changed; create a new configuration');
    return cached.response;
  };
  if (['stopped', 'error', 'capped'].includes(run.status))
    return {
      request: null,
      action: null,
      solved: false,
      error: 'Session stopped. Prepare a new configuration to continue.',
    };
  if (isSolved(run.state)) return { request: null, action: null, solved: true, error: null };
  try {
    const goal = await ask(
      goalRequest(MODEL, run.state, run.stage === 'choose-goal' ? null : run.stage, run.history),
    );
    const action = await measuredSkillDecision(
      {
        ...run,
        stage: goal.answers.goal.choice,
        target: goal.answers.goal.choice === run.stage ? run.target : null,
      },
      MODEL,
      ask,
      [],
    );
    return { request: null, action, solved: false, error: null };
  } catch (e) {
    if (e === pending) return { request, action: null, solved: false, error: null };
    return {
      request: null,
      action: null,
      solved: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
export async function viewSession(id: string) {
  const s = read(id),
    run = getRun(id);
  return { ...s, run, ...(await nextLayer(run, s.answers)), budget: budget() };
}
export async function createSession(scramble: string) {
  const run = await createRun(scramble, 'skills', 'article-manual');
  save({ id: run.id, revision: 0, answers: [], archive: [] });
  return viewSession(run.id);
}
export async function advanceSession(
  id: string,
  revision: number,
  command: string,
  action: 'ask' | 'apply',
) {
  const owner = lock(id, revision, command);
  try {
    const s = read(id),
      run = getRun(id);
    if (['stopped', 'error', 'capped'].includes(run.status))
      throw new Error('Session is stopped; prepare a new configuration');
    const next = await nextLayer(run, s.answers);
    let applied: {
      before: typeof run.state;
      after: typeof run.state;
      action: NonNullable<typeof next.action>;
    } | null = null;
    if (action === 'ask') {
      if (!next.request) throw new Error('No pending request');
      const d = await evaluate(id, next.request, AbortSignal.timeout(30000), { maxAttempts: 1 });
      s.answers.push({
        request: d.request,
        response: d.response,
        nativeResponse: d.nativeResponse,
        elapsedMs: d.elapsedMs,
      });
    } else {
      if (!next.action) throw new Error('Finish the model layers before applying');
      const a = next.action,
        count = a.alg.split(/\s+/).filter(Boolean).length;
      if (run.turns + count > 1000) throw new Error('Face-turn limit reached');
      const before = run.state,
        after = await apply(before, a.alg);
      run.state = after;
      run.history.push(a.alg);
      run.turns += count;
      run.stage = s.answers[0].response.answers.goal.choice;
      run.target = a.target;
      run.status = isSolved(after) ? 'solved' : 'ready';
      applied = { before, after, action: a };
      s.archive.push(s.answers);
      s.answers = [];
    }
    db.transaction(() => {
      assertOwner(id, owner);
      if (applied && ['stopped', 'error', 'capped'].includes(getRun(id).status))
        throw new Error('Session stopped before applying');
      const latest = applied ? run : getRun(id);
      if (applied)
        event(id, 'article-apply', {
          before: applied.before,
          after: applied.after,
          ...applied.action,
          beforeHash: hash(applied.before),
          manual: true,
        });
      latest.revision++;
      saveRun(latest);
      s.revision = latest.revision;
      save(s);
    }).immediate();
    return await viewSession(id);
  } finally {
    unlock(id, owner);
  }
}
