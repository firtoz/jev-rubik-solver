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
export function daisyPreparation(model: string, state: any): JevRequest {
  return {
    model,
    state: {
      targetLayer: state.target.layer,
      topSlotOccupancy: state.topSlotOccupancy,
      mustBeFree: state.mustBeFree,
    },
    questions: {
      preparation: {
        type: 'choice',
        instructions:
          'Decide whether preparation is needed before the selected lift. Inspect only the slots listed in mustBeFree. Unlisted slots do not matter. Every listed slot must be free of yellow-up petals. An empty mustBeFree list requires no preparation. Do not choose a rotation yet.',
        criteria: {
          execute: 'Every required slot is free: execute the selected operation now.',
          clear:
            'At least one required slot is occupied AND targetLayer is bottom or middle: clear space with a U turn, leaving the target stationary.',
          lower:
            'At least one required slot is occupied AND targetLayer is top: lower the sideways edge to the middle first, so a later U turn can clear space without moving the target.',
        },
      },
    },
  };
}
export function daisyClearance(model: string, state: any): JevRequest {
  return {
    model,
    state: { topSlotOccupancy: state.topSlotOccupancy, mustBeFree: state.mustBeFree },
    questions: {
      clearance: {
        type: 'choice',
        instructions:
          'Rotate the top layer so every slot in mustBeFree becomes free of yellow-up petals. The target is below the top layer and stays still. Track occupied slots through the given cycles. Choose one rotation that moves petals OUT of required slots without bringing another petal IN. If several work, choose any.',
        criteria: {
          U: 'UF moves to UL; UL moves to UB; UB moves to UR; UR moves to UF.',
          "U'": 'UF moves to UR; UR moves to UB; UB moves to UL; UL moves to UF.',
          U2: 'UF swaps with UB; UR swaps with UL.',
        },
      },
    },
  };
}
const intentions: Record<string, Record<string, string>> = {
  daisy: {
    lift: 'Lift a yellow edge from bottom/middle into an empty top landing slot.',
    clear: 'Move top petals away from the landing slot before lifting a bottom/middle edge.',
    flip: 'Reorient a top yellow edge whose yellow sticker faces sideways.',
    done: 'Target already has yellow facing U; choose another.',
  },
  cross: {
    align: 'Yellow-up top edge needs its side sticker aligned with its matching center.',
    insert: 'Yellow-up top edge is aligned with its destination and can transfer down.',
    extract: 'Target is not yellow-up on top and needs lifting/reorientation.',
    done: 'Target matches both centers in its bottom home slot.',
  },
  'first-layer': {
    align: 'Target is on top but not directly above its home bottom slot.',
    insert: 'Target is above its home bottom slot with yellow facing sideways.',
    reorient: 'Target is above its home with yellow pointing U.',
    extract: 'Target is in bottom but misplaced or twisted.',
    done: 'Target is fully solved.',
  },
  'middle-layer': {
    align: 'Target is on top but its side-facing sticker does not match the center below it.',
    insert: 'Target is on top with its side-facing sticker aligned with its center.',
    extract: 'Target is trapped in the middle in a wrong slot or orientation.',
    done: 'Target is fully solved.',
  },
  'top-cross': {
    line: 'Two opposite edges have white facing U.',
    elbow: 'Two adjacent edges have white facing U.',
    dot: 'No edge has white facing U.',
  },
  'top-orientation': { orient: 'Orient the white corners using a Sune or inverse Sune.' },
  'top-corners': {
    align: 'All four corners can be placed by only rotating U.',
    permute: 'Corners need a permutation, not just U alignment.',
  },
  'top-edges': {
    align: 'All four top edges and corners can be solved by only rotating U.',
    permute: 'Top edges need a cycle; U alignment alone cannot solve them.',
  },
};
const referenceRules: Record<string, string> = {
  daisy:
    'For yellow pointing sideways choose front facing the yellow sticker. For yellow pointing D choose front adjacent to its current edge slot (DF in local coordinates).',
  cross: 'Choose front so the target destination is DF. Its side color is the front center.',
  'first-layer':
    'For extraction choose front so the CURRENT bottom position is DRF. Otherwise choose front so its DESTINATION is DRF.',
  'middle-layer':
    'For a target on U, choose the reference whose front center equals target.sideFacingStickers[0].color. Do NOT match topStickerColor. For extraction, put its CURRENT middle position at FR. Do not choose front from its final destination for extraction.',
  'top-cross':
    'For a line choose front with white-up edges at UL and UR. For an elbow put white-up edges at UB and UL. For a dot any front works.',
  'top-orientation':
    'For Sune seek white-up corner ULF and white facing F on UFR. For inverse Sune seek white-up corner URB and white facing R on UFR. Compare all four reference views.',
  'top-corners':
    'Inspect sideRows: if one side has TWO corner stickers of the SAME COLOR, choose the view placing that matching pair on L (left). The T permutation swaps the opposite right corners. If no side has a matching pair, any reference can create one. If all four sides have matching pairs, only U alignment is needed and front does not matter.',
  'top-edges':
    'For a three-edge cycle put the already correctly placed edge at UB. For final U alignment any front works.',
};
const guidance: Record<string, string> = {
  daisy:
    'Goal is yellow-up petals, not solved D edges. Lift-bottom lands UF. Lift-middle-right lands UR. Lift-middle-left lands UL. Flip-top-edge lands UR; flip-top-edge-left lands UL. Protect existing yellow-up petals. If a landing slot is occupied, choose a U setup, then reconsider next step. A top sideways target can first be lowered with F if lifting is blocked.',
  cross:
    'For alignment, move the target on U above its destination: DF→UF, DR→UR, DB→UB, DL→UL. Once yellow faces U and its side matches the front center, F2 transfers it down. Sideways or trapped edges may need lifting first.',
  'first-layer':
    'Insertion staging positions: DRF→UFR, DFL→ULF, DLB→UBL, DBR→URB. ALIGN means only rotate U to place target directly above its destination. INSERT means use the short skill matching yellow sticker direction. EXTRACT means lift the misplaced bottom corner. REORIENT means use yellow-up insertion or a trigger. Preservation is required after a complete skill, not every internal turn.',
  'middle-layer':
    'ALIGN means rotate U until its side-facing color matches the center below it. INSERT from UF: upper sticker matching R goes right; upper sticker matching L goes left. EXTRACT uses an insertion to eject the wrong middle edge; preserve the completed bottom layer.',
  'top-cross':
    'In local reference: a line at UL/UR uses orient-edges; elbow at UB/UL uses orient-elbow; dot uses orient-edges once. Do not require top corners to stay oriented.',
  'top-orientation':
    'Use Sune/antisune to orient corners. More than one operation may be needed; preserve lower layers and top-edge orientation. Choose U setup only when it places a recognizable pattern for the next operation.',
  'top-corners':
    'Inspect sideRows. If ALL four sides show same-color corner pairs, align U so these colors match the centers. Otherwise, use T permutation when a matching pair is on L; if no matching pair exists, T can create a pair for the next operation. Preserve lower layers and orientation.',
  'top-edges':
    'Compare destination with current position. edge-cycle moves UF→UR→UL→UF; inverse moves UF→UL→UR→UF; UB stays fixed. If every top piece needs the same U rotation, use that rotation instead.',
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
  if (view.stage !== 'daisy') return local;
  const clean = (p: any) => {
    const {
      solved,
      destination,
      destinationWords,
      directlyAboveHome,
      sideStickersMatchingCenters,
      ...rest
    } = p;
    return rest;
  };
  return {
    ...local,
    target: typeof local.target === 'object' && local.target ? clean(local.target) : local.target,
    stagePieces: local.stagePieces.map(clean),
    completed: { daisy: local.completed.daisy },
  };
}
export async function skillDecision(
  run: Run,
  model: string,
  ask: Ask,
  experience: unknown[],
  excludedTarget: string | null = null,
) {
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
  if (run.stage === 'daisy') {
    const local = views[front];
    const piece =
      typeof local.target === 'object' && local.target
        ? Object.fromEntries(Object.entries(local.target).filter(([k]) => k !== 'piece'))
        : null;
    const petals = local.stagePieces
      .filter((p) => p.stickers.yellow === 'U')
      .map((p) => p.position);
    const lift = await ask({
      model,
      state: { target: piece, yellowUpSlots: petals },
      questions: {
        lift: {
          type: 'choice',
          instructions:
            'Choose the lift/flip whose stated starting POSITION and yellow sticker DIRECTION match target. Ignore occupied landing slots for this question; a separate setup decision will clear them. Do not choose lift-bottom unless target is at DF with yellow pointing D.',
          criteria: { ...skillOptions('daisy'), reconsider: 'No described operation matches.' },
        },
      },
    });
    const selectedLift = lift.answers.lift.choice;
    if (selectedLift === 'reconsider')
      throw new Error('Policy abstained: no matching daisy operation');
    const clearSlots: Record<string, string[]> = {
      'lift-bottom': ['UF'],
      'lift-middle-right': ['UR'],
      'lift-middle-left': ['UL'],
      'flip-bottom-edge': ['UF', 'UL'],
      'stage-bottom-edge': ['UF'],
      'flip-top-edge': ['UR'],
      'flip-top-edge-left': ['UL'],
      'lower-top-edge': [],
    };
    const occupancy = Object.fromEntries(
      ['UF', 'UR', 'UB', 'UL'].map((slot) => [
        slot,
        petals.includes(slot) ? 'occupied by yellow-up petal' : 'free of yellow-up petals',
      ]),
    );
    const preparationState = {
      target: piece,
      topSlotOccupancy: occupancy,
      mustBeFree: clearSlots[selectedLift],
    };
    const preparation = await ask(daisyPreparation(model, preparationState));
    const prep = preparation.answers.preparation.choice;
    const clearance = prep === 'clear' ? await ask(daisyClearance(model, preparationState)) : null;
    const skill =
      prep === 'execute'
        ? selectedLift
        : prep === 'lower'
          ? 'lower-top-edge'
          : clearance!.answers.clearance.choice;
    const alg = mapAlg(skills.find((s) => s.id === skill)?.alg || skill, front);
    return { target, front, skill, alg, intent: prep === 'execute' ? intent : 'clear' };
  }
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
        instructions: `Execute the chosenIntention, selecting just ONE next setup turn or complete skill. ${intent === 'align' ? (run.stage === 'first-layer' ? 'The target corner must move from target.position to the top slot directly above target.destination. DRF requires UFR; DFL requires ULF; DLB requires UBL; DBR requires URB. Use ONLY local destination, never original piece identity. Read U position cycles in the options.' : run.stage === 'middle-layer' ? 'The reference front center matches the SIDE-facing sticker. Rotate U so the target moves to UF and that sticker faces F. Use the edge-position cycles in the options.' : guidance[run.stage]) : guidance[run.stage]} Avoid repeating an action from this exact state that already failed. A setup need not solve the piece; insertion comes later.`,
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
