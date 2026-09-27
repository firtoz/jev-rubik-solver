import { validateResponse } from '../src/lib/jev-protocol';
// Offline verification: no provider client, credentials or local database are used.
import { gunzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { deepStrictEqual } from 'node:assert';
import { apply, solved, hash, isSolved } from '../src/lib/cube';
import { decideRound, remember, type Context } from '../src/solver';
import type { Run } from '../src/lib/types';

const directory = 'research/evidence/grouped-menu';
const report = JSON.parse(gunzipSync(readFileSync(directory + '/results.json.gz')).toString());
const fixtures = JSON.parse(readFileSync(directory + '/fixtures.json', 'utf8'));
if (fixtures.length !== 100 || new Set(fixtures.map((f: any) => f.hash)).size !== 100)
  throw Error('Expected 100 unique fixtures');
let requests = 0,
  actions = 0,
  successes = 0;
for (const row of report.rows) {
  const fixture = fixtures.find((f: any) => f.id === row.id);
  const initial = await apply(await solved(), fixture.scramble);
  deepStrictEqual(hash(initial), hash(row.before), row.id + ': initial state');
  const run = { state: initial, stage: '', target: null, history: [], turns: 0 } as unknown as Run;
  const context: Context = { rounds: [], pendingPlan: null };
  for (const [index, step] of row.steps.entries()) {
    deepStrictEqual(hash(run.state), hash(step.before), row.id + ': discontinuous round');
    let cursor = 0;
    const end = Symbol('recorded requests end');
    let decision;
    try {
      decision = await decideRound(
        run,
        async (request) => {
          const exchange = step.exchanges[cursor++];
          if (!exchange) throw end;
          deepStrictEqual(
            JSON.parse(JSON.stringify(request)),
            exchange.request,
            row.id + ': request in round ' + (index + 1),
          );
          deepStrictEqual(
            validateResponse(exchange.nativeResponse, exchange.request),
            exchange.response,
          );
          requests++;
          return exchange.response;
        },
        context,
      );
    } catch (error) {
      if (error !== end || step.after) throw error;
    }
    if (!decision) continue; // Preserve an interrupted attempt without inventing a response.
    deepStrictEqual(cursor, step.exchanges.length, row.id + ': unused responses');
    if (!step.after) continue; // Abstention/cap is retained in the denominator.
    deepStrictEqual(decision.alg, step.alg, row.id + ': selected moves');
    const after = await apply(run.state, decision.alg);
    deepStrictEqual(hash(after), hash(step.after), row.id + ': resulting state');
    context.rounds.push({
      before: run.state,
      after,
      action: decision,
      recovery: decision.recovery,
    });
    context.pendingPlan = remember(decision);
    run.state = after;
    run.stage = decision.goal;
    run.target = decision.target;
    run.history.push(decision.alg);
    run.turns += decision.alg.split(/\s+/).filter(Boolean).length;
    if (run.turns > 100) throw Error('Exceeded 100 turns');
    actions++;
  }
  deepStrictEqual(hash(run.state), hash(row.after), row.id + ': final state');
  deepStrictEqual(run.turns, row.turns, row.id + ': turn count');
  deepStrictEqual(isSolved(run.state), row.status === 'solved', row.id + ': outcome');
  if (isSolved(run.state)) successes++;
}
if (report.rows.length !== 100 || successes !== 98)
  throw Error('Unexpected evaluation denominator');
console.log(
  JSON.stringify(
    { attempts: report.rows.length, successes, requests, actions, liveCalls: 0 },
    null,
    2,
  ),
);
