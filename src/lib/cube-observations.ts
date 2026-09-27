import type { CubeData } from './types';
export const names = {
  EDGES: 'UF UR UB UL DF DR DB DL FR FL BR BL'.split(' '),
  CORNERS: 'UFR URB UBL ULF DRF DFL DLB DBR'.split(' '),
};
export const colors: Record<string, string> = {
  U: 'white',
  D: 'yellow',
  F: 'green',
  B: 'blue',
  R: 'red',
  L: 'orange',
};
export function isSolved(state: CubeData) {
  return ['EDGES', 'CORNERS'].every((o) =>
    state[o].pieces.every((p, i) => p === i && state[o].orientation[i] === 0),
  );
}
export function pieces(state: CubeData) {
  return Object.entries(names).flatMap(([orbit, slots]) =>
    slots.map((position, i) => {
      const home = slots[state[orbit].pieces[i]];
      const orientation = state[orbit].orientation[i];
      return {
        piece: home,
        kind: orbit === 'EDGES' ? 'edge' : 'corner',
        position,
        destination: home,
        stickers: Object.fromEntries(
          [...home].map((face, j) => [
            colors[face],
            position[(j - orientation + home.length) % home.length],
          ]),
        ),
        solved: home === position && orientation === 0,
      };
    }),
  );
}
export function facts(s: CubeData) {
  const correct = (o: string, start: number, end: number) =>
    s[o].pieces
      .slice(start, end)
      .every((p, j) => p === start + j && s[o].orientation[start + j] === 0);
  return {
    daisy: pieces(s).filter(
      (p) => p.kind === 'edge' && p.position.includes('U') && p.stickers.yellow === 'U',
    ).length,
    cross: correct('EDGES', 4, 8),
    firstLayer: correct('EDGES', 4, 8) && correct('CORNERS', 4, 8),
    middle: correct('EDGES', 4, 12) && correct('CORNERS', 4, 8),
    topCross: s.EDGES.pieces.slice(0, 4).every((p, i) => p < 4 && s.EDGES.orientation[i] === 0),
    topOriented: s.CORNERS.pieces
      .slice(0, 4)
      .every((p, i) => p < 4 && s.CORNERS.orientation[i] === 0),
    cornersPlaced: s.CORNERS.pieces.every((p, i) => p === i),
    solved: isSolved(s),
    solvedPieces: pieces(s).filter((p) => p.solved).length,
  };
}
