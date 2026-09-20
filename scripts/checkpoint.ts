import { db, events, saveRun, getRun, event } from '../src/server/store';
import { skillDecision } from '../src/server/skill-policy';
import { evaluate, MODEL, budget } from '../src/server/jev';
import { VERSION } from '../src/lib/types';
import { SKILL_VERSION } from '../src/lib/skills';
import { apply, facts, hash } from '../src/lib/cube';
const [prefix, indexText] = process.argv.slice(2);
const row = db.query('SELECT id FROM runs WHERE id LIKE ?').get(prefix + '%') as { id: string };
const source = getRun(row.id);
const es = events(source.id).filter((e) => e.kind === 'action');
const index = Number(indexText ?? es.length - 1);
const e = es[index];
const r = {
  ...source,
  id: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  state: e.payload.before,
  stage: e.payload.stageBefore,
  target: null,
  history: source.history.slice(0, index),
  requests: 0,
  cost: 0,
  tokens: 0,
  turns: 0,
  revision: 0,
  activeMs: 0,
  status: 'stopped' as const,
  version: VERSION + '/' + SKILL_VERSION,
  reason: 'Single checkpoint diagnostic; no autonomous solve',
};
saveRun(r);
event(r.id, 'checkpoint', { source: source.id, index, before: r.state });
const d = await skillDecision(
  r,
  MODEL,
  async (request) =>
    (await evaluate(r.id, request, AbortSignal.timeout(30000), { maxAttempts: 1 })).response,
  [],
);
const after = await apply(r.state, d.alg);
event(r.id, 'checkpoint-result', {
  decision: d,
  after,
  before: r.state,
  factsBefore: facts(r.state),
  factsAfter: facts(after),
});
console.log(
  JSON.stringify({
    runId: r.id,
    decision: d,
    before: facts(r.state),
    after: facts(after),
    cost: getRun(r.id).cost,
  }),
);
