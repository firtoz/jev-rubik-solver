import type { Ask } from './skill-policy';
import type { JevRequest } from '../lib/types';
export function crossPhaseRequest(model: string, target: any): JevRequest {
  return {
    model,
    state: {
      alreadySolved: target.solved,
      currentPosition: target.position,
      yellowStickerDirection: target.stickers.yellow,
    },
    questions: {
      phase: {
        type: 'choice',
        instructions:
          'Classify the CURRENT yellow edge for solving the yellow bottom cross. Check alreadySolved first. If already solved choose done. Otherwise, only a yellow sticker pointing U is ready to transfer toward the bottom. Any other yellow direction requires lifting/reorientation first. Do not plan alignment in this question.',
        criteria: {
          done: 'alreadySolved is true',
          extract:
            'Not solved, and yellowStickerDirection is D, F, R, B, or L: lift/reorient first',
          transfer: 'Not solved, and yellowStickerDirection is U: ready to align/transfer',
        },
      },
    },
  };
}
export function crossAlignmentRequest(model: string, target: any): JevRequest {
  return {
    model,
    state: {
      currentPosition: target.position,
      requiredPosition: 'U' + target.destination.slice(1),
    },
    questions: {
      alignment: {
        type: 'choice',
        instructions:
          'The yellow edge has already been classified by the model as ready to transfer. Compare the two position labels exactly. If currentPosition and requiredPosition are IDENTICAL choose insert. If they are DIFFERENT choose align. requiredPosition is the top slot geometrically above the bottom destination; it does not say whether the target is there.',
        criteria: {
          align: 'The two position labels are different',
          insert: 'The two position labels are identical',
        },
      },
    },
  };
}
export async function decideCrossIntention(model: string, target: any, ask: Ask) {
  const phase = await ask(crossPhaseRequest(model, target));
  const choice = phase.answers.phase.choice;
  // These branches route model-selected phases; they do not inspect the cube.
  if (choice === 'transfer')
    return (await ask(crossAlignmentRequest(model, target))).answers.alignment;
  return phase.answers.phase;
}
