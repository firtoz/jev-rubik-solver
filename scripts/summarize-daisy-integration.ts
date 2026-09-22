import { readFileSync, writeFileSync } from 'node:fs';
import { checksFor } from './request-eval/daisy-transition';
import { facts, pieces } from '../src/lib/cube';
const data = JSON.parse(readFileSync('experiments/daisy-integration-v1/results.json', 'utf8'));
if (data.results.length !== 4) throw new Error('Incomplete study');
const rows = data.results.map((r: any) => {
  const decisions = r.steps.filter((s: any) => s.goal);
  const audit = decisions.map((s: any, i: number) => {
    const expectedChecks = checksFor(s.before),
      f = facts(s.before);
    const bottom = pieces(s.before).filter(
      (p) => p.kind === 'edge' && p.destination.includes('D') && p.solved,
    ).length;
    const expectedGoal = f.cross ? 'first-layer' : f.daisy + bottom === 4 ? 'cross' : 'daisy';
    return {
      step: i + 1,
      expectedGoal,
      goal: s.goal,
      correctGoal: s.goal === expectedGoal,
      correctChecks: Object.keys(expectedChecks).every((k) => expectedChecks[k] === s.checks[k]),
      correctCounts: s.counts.petal === String(f.daisy) && s.counts.bottom === String(bottom),
      counts: s.counts,
      alg: s.decision?.alg ?? null,
    };
  });
  return {
    caseId: r.caseId,
    outcome: r.outcome,
    reason: r.reason,
    requests: r.requests,
    turns: r.turns,
    cost: r.cost,
    activeMs: r.activeMs,
    crossComplete: r.crossComplete,
    actions: r.steps.filter((s: any) => s.decision).length,
    goalDecisions: decisions.length,
    correctGoals: audit.filter((a: any) => a.correctGoal).length,
    correctRecognition: audit.filter((a: any) => a.correctChecks && a.correctCounts).length,
    audit,
  };
});
writeFileSync(
  'src/lib/daisy-integration.json',
  JSON.stringify({ rows, requests: data.requests, cost: data.cost }, null, 2),
);
console.log(JSON.stringify({ rows, requests: data.requests, cost: data.cost }, null, 2));
