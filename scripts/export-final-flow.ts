// Offline export. Explicit allowlist excludes credentials, headers and server configuration.
import { readFileSync, writeFileSync } from 'node:fs';
const root = process.argv[2] || 'experiments/brain-full-v3-final';
const output = process.argv[3] || 'public/recordings/brain-v3-flow.json';
const run = JSON.parse(readFileSync(`${root}/random-1.json`, 'utf8'));
const manifest = JSON.parse(readFileSync(`${root}/started.json`, 'utf8'));
const fixtures = JSON.parse(readFileSync(`${root}/fixtures.json`, 'utf8'));
const previewSetup = fixtures.find((f: any) => f.id === run.id).scramble;
const steps = run.steps.map((s: any) => ({
  before: s.before, after: s.after, pendingPlan: s.pendingPlan,
  nextPendingPlan: s.nextPendingPlan, decision: s.decision, alg: s.alg,
  recovery: s.recovery, transportRetries: s.transportRetries,
  exchanges: s.exchanges.map((e: any) => ({
    request: e.request, response: e.response, nativeResponse: e.nativeResponse,
    elapsedMs: e.elapsedMs, cost: e.cost,
  })),
}));
writeFileSync(output, JSON.stringify({
  previewSetup, id: run.id, status: run.status, turns: run.turns, elapsedMs: run.elapsedMs,
  source: `${root}/random-1.json`, policyDigest: manifest.digest, steps,
}));
console.log(`Exported ${steps.length} action cycles without API calls.`);
