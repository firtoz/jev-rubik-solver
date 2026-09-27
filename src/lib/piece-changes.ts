import { pieces } from './cube-observations';
import type { CubeData } from './types';

/** Compare the recorded endpoints by physical piece identity, not occupied slot. */
export function pieceChanges(before: CubeData, after: CubeData, target?: string) {
  const results = new Map(pieces(after).map(p => [p.piece, p]));
  return pieces(before).flatMap(from => {
    const to = results.get(from.piece)!;
    if (from.position === to.position && Object.entries(from.stickers).every(([color, face]) => to.stickers[color] === face)) return [];
    return [{from, to, status: to.solved ? 'Solved' : from.solved ? 'Displaced from solved' : from.position === to.position ? 'Reoriented' : 'Moved'}];
  }).sort((a,b) => Number(b.from.piece === target) - Number(a.from.piece === target));
}
