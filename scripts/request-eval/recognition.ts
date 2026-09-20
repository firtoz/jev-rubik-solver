import { readFileSync } from 'node:fs';
import { fixtures as priorFixtures, intentionRequest } from './separate';
import { hash } from '../../src/lib/cube';
import type { JevRequest } from '../../src/lib/types';
export const variants = {
  direct: 'Direct intention',
  'direct-cue': 'Direct intention with the same sideways-sticker reminder',
  'direction-first': 'Identify yellow direction first',
  'facts-first': 'Identify four facts before intention',
  'facts-only': 'Intention from model-reported facts only',
};
export type Variant = keyof typeof variants;
export async function fixtures() {
  const old = JSON.parse(
    readFileSync('experiments/separate-assessment-v1-validation/frozen.json', 'utf8'),
  );
  return priorFixtures({
    validationSeed: 529831,
    excludeValidation: old.cases.map((f: any) => hash(f.run.state)),
  });
}
export function selectedPiece(base: JevRequest, target: string) {
  const p = (base.state as any).stagePieces.find((p: any) => p.piece === target);
  if (!p) throw new Error('Missing fixed target');
  return p;
}
export function observationRequest(base: JevRequest, target: string, variant: Variant): JevRequest {
  const p = selectedPiece(base, target);
  const questions: JevRequest['questions'] = {
    yellowDirection: {
      type: 'choice',
      instructions:
        'Which direction does the yellow sticker ACTUALLY face on target? Read target.stickers.yellow. This is the current direction, not the desired direction and not a letter from the piece name.',
      criteria: { U: 'Up', D: 'Down', F: 'Front', B: 'Back', R: 'Right', L: 'Left' },
    },
  };
  if (variant !== 'direction-first')
    Object.assign(questions, {
      layer: {
        type: 'choice',
        instructions:
          'Which layer currently contains target? Read current position, not destination.',
        criteria: {
          top: 'Position contains U',
          bottom: 'Position contains D',
          middle: 'Position contains neither U nor D',
        },
      },
      solved: {
        type: 'choice',
        instructions: 'Is this piece already correctly placed AND oriented? Read target.solved.',
        criteria: { yes: 'Already solved', no: 'Not solved' },
      },
      aboveHome: {
        type: 'choice',
        instructions:
          'Is its current position the top-layer slot immediately above its bottom-layer destination? Position and destination only; ignore orientation. DF→UF, DR→UR, DB→UB, DL→UL.',
        criteria: { yes: 'Directly above its destination', no: 'Elsewhere' },
      },
    });
  return { model: base.model, state: { target: p }, questions };
}
export function decisionRequest(
  base: JevRequest,
  target: string,
  variant: Variant,
  reported?: Record<string, string>,
): JevRequest {
  const req = intentionRequest(base, target, 'split-focused');
  if (variant === 'direct') return req;
  if (variant === 'direct-cue') {
    req.questions.intention.instructions +=
      ' A piece directly above home with yellow facing sideways still needs reorientation; it is not ready to insert.';
    return req;
  }
  if (variant === 'facts-only') {
    req.state = { goal: (base.state as any).goal, modelReportedObservations: reported };
    req.questions.intention.instructions =
      'Choose the immediate intention using the preceding model-reported observations. solved=yes means done. Otherwise, yellowDirection other than U or layer other than top means extract (reorient/lift). Otherwise aboveHome=yes means insert; aboveHome=no means align. These are your own earlier observations, not a program-selected action.';
  } else {
    req.state = { ...(req.state as any), modelReportedObservations: reported };
    req.questions.intention.instructions +=
      ' The earlier observation question recorded the current facts in modelReportedObservations. A piece directly above home with yellow facing sideways still needs reorientation; it is not ready to insert.';
  }
  return req;
}
export function expectedFacts(base: JevRequest, target: string) {
  const p = selectedPiece(base, target);
  return {
    yellowDirection: p.stickers.yellow,
    layer: p.position.includes('U') ? 'top' : p.position.includes('D') ? 'bottom' : 'middle',
    solved: p.solved ? 'yes' : 'no',
    aboveHome: p.position === 'U' + p.destination.slice(1) ? 'yes' : 'no',
  };
}
