import { readFileSync, writeFileSync } from 'node:fs';
import { faceObservation } from './request-eval/first-layer';
const source = JSON.parse(readFileSync('experiments/daisy-integration-v1/results.json', 'utf8'));
const config = JSON.parse(readFileSync('experiments/daisy-integration-v1/started.json', 'utf8'));
// Explicit allowlist: export provider bodies and local metrics, never transport headers or credentials.
const runs = source.results.map((r: any) => ({
  id: r.caseId,
  runId: r.runId,
  outcome: r.outcome,
  reason: r.reason,
  requests: r.requests,
  cost: r.cost,
  turns: r.turns,
  scramble: config.fixtures.find((f: any) => f.id === r.caseId).scramble,
  steps: r.steps.map((s: any, index: number) => ({
    index,
    before: s.before,
    after: s.after ?? null,
    faces: faceObservation(s.before).faces,
    decision: s.decision ?? null,
    goal: s.goal ?? null,
    beforeAlg: r.steps
      .slice(0, index)
      .filter((x: any) => x.decision)
      .map((x: any) => x.decision.alg)
      .join(' '),
    exchanges: s.exchanges.map((e: any) => ({
      id: e.id,
      request: e.request,
      response: e.nativeResponse ?? e.response,
      elapsedMs: e.elapsedMs,
      cost: e.cost,
    })),
  })),
}));
writeFileSync(
  'src/lib/flow-recordings.json',
  JSON.stringify({ source: 'daisy-integration-v1', runs }, null, 2),
);
console.log(
  `Exported ${runs.length} recordings and ${runs.reduce((n: number, r: any) => n + r.steps.reduce((m: number, s: any) => m + s.exchanges.length, 0), 0)} exchanges`,
);
