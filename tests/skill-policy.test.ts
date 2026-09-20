import { test, expect } from 'bun:test';
import { skillDecision } from '../src/server/skill-policy';
import { prepare, fixtures } from '../scripts/decision-probe';
import type { JevRequest } from '../src/lib/types';
test('intention-selected alignment asks a narrower dependent question without a solver', async () => {
  const { run } = await prepare(fixtures[0]);
  const requests: JevRequest[] = [];
  const d = await skillDecision(
    run,
    'jev-1.13.0',
    async (request) => {
      requests.push(request);
      if (request.questions.target)
        expect(Object.keys(request.questions.target.criteria)).toHaveLength(4);
      expect(request.state).not.toHaveProperty('scramble');
      const answers = Object.fromEntries(
        Object.entries(request.questions).map(([id, q]) => {
          const choice =
            id === 'target'
              ? 'DRF'
              : id === 'reference'
                ? 'F'
                : id === 'operation'
                  ? "U'"
                  : 'align';
          expect(Object.keys(q.criteria)).toContain(choice);
          return [
            id,
            {
              type: 'choice' as const,
              choice,
              confidence: 1,
              probabilities: Object.fromEntries(
                Object.keys(q.criteria).map((k) => [k, k === choice ? 1 : 0]),
              ),
            },
          ];
        }),
      );
      return { model: request.model, answers, usage: { input_tokens: 0, output_tokens: 0 } };
    },
    [],
  );
  expect(d.alg).toBe("U'");
  expect(requests).toHaveLength(3);
  expect(Object.keys(requests[2].questions.operation.criteria)).toEqual([
    'U',
    "U'",
    'U2',
    'reconsider',
  ]);
  expect((requests[2].state as any).chosenIntention).toBe('align');
  expect((requests[2].state as any).target).not.toHaveProperty('piece');
  expect((requests[1].state as any).referenceViews.F.centers.F).toBe('green');
});

test('reference questions contain visible last-layer side rows, not undefined hints', async () => {
  const { run } = await prepare(fixtures[0]);
  const { apply, solved, inverse } = await import('../src/lib/cube');
  const { skills } = await import('../src/lib/skills');
  run.state = await apply(
    await solved(),
    inverse(skills.find((s) => s.id === 'corner-permute')!.alg),
  );
  run.stage = 'top-corners';
  run.target = 'whole';
  await skillDecision(
    run,
    'jev-1.13.0',
    async (req) => {
      if (req.questions.reference) {
        const state = req.state as any;
        expect(state.referenceViews.F.sideRows.L.map((p: any) => p.color)).toEqual([
          'orange',
          'orange',
        ]);
        for (const value of Object.values(req.questions.reference.criteria))
          expect(value).not.toContain('undefined');
      }
      const answers = Object.fromEntries(
        Object.entries(req.questions).map(([id, q]) => {
          const choice =
            id === 'target'
              ? 'whole'
              : id === 'reference'
                ? 'F'
                : id === 'operation'
                  ? 'corner-permute'
                  : 'permute';
          return [
            id,
            {
              type: 'choice' as const,
              choice,
              confidence: 1,
              probabilities: Object.fromEntries(
                Object.keys(q.criteria).map((k) => [k, k === choice ? 1 : 0]),
              ),
            },
          ];
        }),
      );
      return { model: req.model, answers, usage: { input_tokens: 0, output_tokens: 0 } };
    },
    [],
  );
});
