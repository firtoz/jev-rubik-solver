import {
  focusedObservation,
  semanticFacts,
  referenceObservation,
  setupDescription,
  turnDescription,
  mapAlg,
} from '../lib/cube';
import { skills, skillOptions } from '../lib/skills';
import type { Run, JevRequest, JevResponse } from '../lib/types';
export type Ask = (request: JevRequest) => Promise<JevResponse>;
const intentions: Record<string, Record<string, string>> = {
  'top-cross': {
    line: 'Two opposite edges have white facing U.',
    elbow: 'Two adjacent edges have white facing U.',
    dot: 'No edge has white facing U.',
  },
};
const referenceRules: Record<string, string> = {
  'top-cross':
    'For a line choose front with white-up edges at UL and UR. For an elbow put white-up edges at UB and UL. For a dot any front works.',
};
const guidance: Record<string, string> = {
  'top-cross':
    'In local reference: a line at UL/UR uses orient-edges; elbow at UB/UL uses orient-elbow; dot uses orient-edges once. Do not require top corners to stay oriented.',
};
function stageView(view: ReturnType<typeof semanticFacts>) {
  const { otherPieces, ...local } = view;
  if (view.stage.startsWith('top-'))
    return {
      ...local,
      sideRows: Object.fromEntries(
        ['F', 'R', 'B', 'L'].map((face) => [
          face,
          local.stagePieces
            .filter((p) => p.position.includes(face))
            .map((p) => ({
              position: p.position,
              color: Object.entries(p.stickers).find(([, direction]) => direction === face)?.[0],
            })),
        ]),
      ),
      stagePieces: local.stagePieces.map((p) => ({
        position: p.position,
        destination: p.destination,
        stickers: p.stickers,
        whiteDirection: p.stickers.white,
      })),
      whiteUpPositions: local.stagePieces
        .filter((p) => p.stickers.white === 'U')
        .map((p) => p.position),
    };
  return local;
}
export async function skillDecision(
  run: Run,
  model: string,
  ask: Ask,
  experience: unknown[],
  excludedTarget: string | null = null,
) {
  if (run.stage !== 'top-cross') throw new Error('Expected top-cross goal');
  const view = stageView(semanticFacts(focusedObservation({ ...run, target: null }, run.state)));
  // Offer every piece in the model-selected goal, including completed ones.
  // Only an explicit model recovery decision excludes its previous target.
  const candidates = view.stagePieces.filter((p) => p.piece !== excludedTarget);
  const q: JevRequest['questions'] = {
    target: {
      type: 'choice',
      instructions:
        'Choose one unfinished piece for the current goal. Keep working on previousTarget while its stage goal is incomplete, so setup/staging is followed by insertion/lifting. Change target when the previous one is complete, absent from this stage, or excluded by recovery. When choosing a new target, prefer an accessible piece. Do not choose pieces marked stage goal complete. A solved bottom edge is NOT a complete daisy petal. For top-layer stages select whole.',
      criteria: run.stage.startsWith('top-')
        ? { whole: 'Work on the entire top layer pattern.' }
        : Object.fromEntries(
            candidates.map((p) => [
              p.piece,
              `${p.piece} at ${p.position}; destination ${p.destination}; stage goal ${p.satisfiesStageGoal ? 'complete' : 'incomplete'}.`,
            ]),
          ),
    },
  };
  const ids = run.stage.startsWith('top-') ? ['whole'] : candidates.map((p) => p.piece);
  for (const id of ids)
    q['intent_' + id] = {
      type: 'choice',
      instructions: `Choose the immediate intention for ${id === 'whole' ? 'the top layer' : `the exact record at \`stagePieces[${view.stagePieces.findIndex((p) => p.piece === id)}]\``}. Read its position and stickers, not the position suggested by its permanent piece identifier. ${guidance[run.stage]}`,
      criteria: intentions[run.stage],
    };
  const assessed = await ask({
    model,
    state: {
      ...view,
      previousTarget: candidates.find((p) => p.piece === run.target) ?? null,
      previouslyTriedFromThisState: experience,
    },
    questions: q,
  });
  const target = assessed.answers.target.choice;
  const intent = assessed.answers['intent_' + target].choice;
  if (intent === 'done') throw new Error('Policy abstained: selected completed target');
  const selected = { ...run, target };
  const views = Object.fromEntries(
    ['F', 'R', 'B', 'L'].map((front) => {
      const local = stageView(
        semanticFacts(referenceObservation(focusedObservation(selected, run.state), front)),
      );
      return [front, local];
    }),
  );
  const ref = await ask({
    model,
    state: {
      intent,
      stage: run.stage,
      referenceViews: Object.fromEntries(
        Object.entries(views).map(([f, v]) => [
          f,
          {
            target: v.target,
            whiteUpPositions: (v as any).whiteUpPositions,
            sideRows: (v as any).sideRows,
            centers: v.frame.centers,
            ...(run.stage.startsWith('top-') ? { stagePieces: v.stagePieces } : {}),
          },
        ]),
      ),
    },
    questions: {
      reference: {
        type: 'choice',
        instructions: `Compare referenceViews.F, referenceViews.R, referenceViews.B and referenceViews.L. Choose the view satisfying this reference requirement for the target. This renames coordinates, not a move. ${referenceRules[run.stage]}`,
        criteria: Object.fromEntries(
          ['F', 'R', 'B', 'L'].map((f) => [
            f,
            `Reference ${f}: front center ${views[f].frame.centers.F}; target ${JSON.stringify(views[f].target)}; white-up positions ${JSON.stringify((views[f] as any).whiteUpPositions)}; side rows ${JSON.stringify((views[f] as any).sideRows)}. All subsequent moves use these local coordinates.`,
          ]),
        ),
      },
    },
  });
  const front = ref.answers.reference.choice;
  const options = {
    ...(intent === 'align' || intent === 'clear' ? {} : skillOptions(run.stage)),
    ...Object.fromEntries(['U', "U'", 'U2'].map((m) => [m, setupDescription(m)])),
    reconsider: 'No suitable action: stop for inspection rather than move arbitrarily.',
  };
  const answer = await ask({
    model,
    state: {
      ...views[front],
      target:
        typeof views[front].target === 'object' && views[front].target
          ? Object.fromEntries(Object.entries(views[front].target).filter(([k]) => k !== 'piece'))
          : views[front].target,
      stagePieces: intent === 'align' ? undefined : views[front].stagePieces,
      chosenIntention: intent,
      previouslyTriedFromThisState: experience,
    },
    questions: {
      operation: {
        type: 'choice',
        instructions: `Execute the chosenIntention, selecting just ONE next setup turn or complete skill. ${guidance[run.stage]} Avoid repeating an action from this exact state that already failed. A setup need not solve the piece; insertion comes later.`,
        criteria: options,
      },
    },
  });
  const skill = answer.answers.operation.choice;
  if (skill === 'reconsider' || intent === 'done')
    throw new Error('Policy abstained: no suitable operation or target already complete');
  const alg = mapAlg(skills.find((s) => s.id === skill)?.alg || skill, front);
  return { target, front, skill, alg, intent };
}
