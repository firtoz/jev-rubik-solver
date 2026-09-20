import type { JevRequest } from '../../src/lib/types';
export const variants = {
  baseline: '',
  'literal-fields':
    'Assess ONLY the named stagePieces record. Read its current position and yellow sticker direction literally. Its permanent piece name and destination are not its current position. Being directly above home is insufficient for insertion: yellow must point U. A sideways yellow sticker needs extraction/reorientation, not alignment. A correctly solved bottom edge is done.',
  'ordered-checklist':
    'Use these checks in order on this exact record: (1) solved=true → done. (2) Otherwise, yellow sticker not pointing U OR position not in U layer → extract. (3) Otherwise, compare its current U slot with the U slot above destination: different → align, same → insert. Use observed sticker directions, not requiredStickerDirections. Do not select an action or reference yet.',
  'compact-table':
    'Classify the exact named record using this table. done: solved=true. extract: unsolved and NOT a yellow-up top edge. align: yellow-up top edge but position differs from the slot directly above destination. insert: yellow-up top edge in the slot directly above destination. DF→UF, DR→UR, DB→UB, DL→UL. The destination field describes the final goal, not the current location.',
};
export type Variant = keyof typeof variants;
export function wording(base: JevRequest, variant: Variant): JevRequest {
  const request = structuredClone(base);
  if (variant === 'baseline') return request;
  for (const [name, question] of Object.entries(request.questions)) {
    if (!name.startsWith('intent_')) continue;
    const original = String(question.instructions);
    const record = original.match(/stagePieces\[\d+\]/)?.[0];
    if (!record) throw new Error('Missing exact record index');
    question.instructions =
      variant === 'literal-fields'
        ? original + ' ' + variants[variant]
        : `Choose the immediate intention for the exact record at ${record}. ${variants[variant]}`;
  }
  return request;
}
