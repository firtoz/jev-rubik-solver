import { prepare, fixtures } from './decision-probe';
import { referenceObservation, semanticFacts } from '../src/lib/cube';
import { evaluate, budget, MODEL } from '../src/server/jev';
import { event, saveRun } from '../src/server/store';
import { writeFileSync } from 'node:fs';
const results = [];
for (const front of ['F', 'R', 'B', 'L']) {
  const p = await prepare(fixtures[0]);
  const { otherPieces, ...view } = semanticFacts(referenceObservation(p.broad.state as any, front));
  const r = {
    ...p.run,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'stopped' as const,
    version: 'intention-probe-v1',
  };
  saveRun(r);
  const state = {
    ...view,
    goal: 'Put the selected yellow corner correctly into its bottom home slot while preserving the yellow cross after an operation.',
    reference:
      'Insertion staging positions: DRF needs UFR; DFL needs ULF; DLB needs UBL; DBR needs URB. First align a top corner above its own home; then use an insertion suited to its yellow direction. A twisted/misplaced bottom corner needs extraction.',
  };
  const d = await evaluate(
    r.id,
    {
      model: MODEL,
      state,
      questions: {
        intent: {
          type: 'choice',
          instructions:
            'What immediate intention is appropriate for state.target? Use its current position, destination and yellow sticker direction.',
          criteria: {
            align:
              'Corner is on top but not directly above its own bottom destination: align it using U.',
            insert: 'Corner is directly above its home with yellow pointing sideways: insert it.',
            reorient: 'Corner is directly above home but yellow points up: reorient it.',
            extract: 'Corner is in bottom but not solved: extract it.',
            done: 'Corner is solved; select another.',
          },
        },
      },
    },
    AbortSignal.timeout(30000),
    { maxAttempts: 1 },
  );
  const a = await evaluate(
    r.id,
    {
      model: MODEL,
      state: { ...state, chosenIntention: d.response.answers.intent.choice },
      questions: {
        action: {
          type: 'choice',
          instructions:
            'Execute chosenIntention for target. For alignment choose the U turn that moves target to the staging position ABOVE ITS DESTINATION. This is only a setup; insertion will be a later action.',
          criteria: p.broad.questions.action.criteria,
        },
      },
    },
    AbortSignal.timeout(30000),
    { maxAttempts: 1 },
  );
  results.push({
    front,
    intent: d.response.answers.intent,
    action: a.response.answers.action,
    cost: d.cost + a.cost,
  });
  event(r.id, 'intention-probe', results.at(-1));
  console.log(JSON.stringify(results.at(-1)));
}
writeFileSync(
  'experiments/intention-probe-v1.json',
  JSON.stringify({ results, budget: budget() }, null, 2),
);
