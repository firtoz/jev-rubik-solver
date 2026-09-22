import { readFileSync, writeFileSync } from 'node:fs';
const data = JSON.parse(readFileSync('experiments/progress-integration-v1/results.json', 'utf8'));
const rows = data.results.map((r: any) => ({
  caseId: r.caseId,
  variant: r.variant,
  outcome: r.outcome,
  requests: r.requests,
  turns: r.turns,
  cost: r.cost,
  actions: r.steps.filter((s: any) => s.decision).length,
  goalErrors: r.steps.filter((s: any) => s.goalCorrect === false).length,
  goalDecisions: r.steps.filter((s: any) => s.goal !== undefined).length,
}));
writeFileSync(
  'src/lib/progress-integration.json',
  JSON.stringify({ rows, requests: data.requests, cost: data.cost }, null, 2),
);
