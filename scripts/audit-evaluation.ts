// Offline audit: no provider calls; independently replay every recorded action.
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { events, getRun } from '../src/server/store';
import { apply, solved, hash, isSolved } from '../src/lib/cube';
const report = JSON.parse(readFileSync(process.argv[2] || 'experiments/v26-final-100.json', 'utf8'));
assert.equal(report.status, 'complete');
assert.equal(report.results.length, 100);
assert.equal(new Set(report.cases.map((c: any) => c.id)).size, 100);
const initialStates = new Set<string>();
let successes = 0, actions = 0, requests = 0, responses = 0;
for (const result of report.results) {
  const run = getRun(result.runId);
  const fixture = report.cases.find((c: any) => c.id === result.caseId);
  assert.equal(run.scramble, fixture.scramble);
  let state = await apply(await solved(), fixture.scramble);
  initialStates.add(hash(state));
  const recorded = events(run.id);
  assert(!recorded.some(e => e.kind === 'control'), 'Manual intervention');
  const history: string[] = [];
  for (const e of recorded) {
    if (e.kind === 'request') {
      requests++;
      assert.equal(e.payload.request.model, 'jev-1.13.0');
      assert.deepEqual(Object.keys(e.payload.request).sort(), ['model', 'questions', 'state']);
      assert(!JSON.stringify(e.payload.request).includes(fixture.scramble), 'Scramble leaked');
    }
    if (e.kind === 'decision') {
      responses++;
      assert(e.payload.nativeResponse, 'Missing native response');
    }
    if (e.kind === 'action') {
      actions++;
      assert.equal(hash(state), hash(e.payload.before));
      state = await apply(state, e.payload.alg);
      assert.equal(hash(state), hash(e.payload.after));
      history.push(e.payload.alg);
    }
  }
  assert.deepEqual(history, run.history);
  assert.equal(hash(state), hash(run.state));
  assert.equal(isSolved(state), result.verifiedSolved);
  assert(run.requests <= report.limits.requests);
  assert(run.turns <= report.limits.turns);
  assert(run.activeMs <= report.limits.ms);
  assert.equal(history.join(' ').split(/\s+/).filter(Boolean).length, run.turns);
  if (isSolved(state)) successes++;
}
assert.equal(initialStates.size, 100);
assert.equal(successes, report.summary.skills.solved);
const audit = { evaluation: report.id, checkedAt: new Date().toISOString(), uniqueInitialStates: initialStates.size, successes, failures: 100-successes, actions, requests, responses, checks: ['Independent action-by-action replay and final state equality', 'No manual control events', 'Pinned model and body-only requests', 'No initial scramble string in model requests', 'Native responses present', 'Execution ceilings respected', 'Recorded face-turn counts match histories'] };
writeFileSync('experiments/v26-final-audit.json', JSON.stringify(audit, null, 2)+'\n');
console.log(JSON.stringify(audit, null, 2));
