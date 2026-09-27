import { cube3x3x3 } from 'cubing/puzzles';
import { KPattern } from 'cubing/kpuzzle';
import { Alg } from 'cubing/alg';
import type { CubeData } from './types';
import { names, colors, pieces, facts, isSolved } from './cube-observations';
export { names, colors, pieces, facts, isSolved } from './cube-observations';
export const turns = 'U D F B R L'.split(' ').flatMap((f) => [f, f + "'", f + '2']);
const puzzle = cube3x3x3.kpuzzle();
export async function solved() {
  return structuredClone((await puzzle).defaultPattern().patternData) as CubeData;
}
export async function apply(state: CubeData, alg: string) {
  return new KPattern(await puzzle, state).applyAlg(alg).patternData as CubeData;
}
export function inverse(alg: string) {
  return new Alg(alg)
    .invert()
    .toString()
    .replace(/([UDFBRL])2'/g, (_, f) => f + '2');
}
export function parseScramble(text: string) {
  const a = text.trim().split(/\s+/).filter(Boolean);
  if (a.length > 100 || a.some((x) => !turns.includes(x)))
    throw new Error("Use at most 100 standard face turns, e.g. R U R' U'.");
  return a.join(' ');
}
export function hash(state: CubeData) {
  return JSON.stringify([state.EDGES, state.CORNERS]);
}
// Legacy curriculum classifier, retained only for historical fixtures.
// The solving runner must use JEV goal selection instead.
export function stage(s: CubeData, previous?: string) {
  const f = facts(s);
  return !f.cross
    ? previous === 'cross' || f.daisy === 4
      ? 'cross'
      : 'daisy'
    : !f.firstLayer
      ? 'first-layer'
      : !f.middle
        ? 'middle-layer'
        : !f.topCross
          ? 'top-cross'
          : !f.topOriented
            ? 'top-orientation'
            : !f.cornersPlaced
              ? 'top-corners'
              : !f.solved
                ? 'top-edges'
                : 'solved';
}
export const goals: Record<string, string> = {
  daisy:
    'Put all four yellow edges around the white U center, with yellow stickers pointing U. These are petals. Preserve existing petals. Side colors do not need to match centers yet; already solved D edges may be moved to build the daisy.',
  cross:
    'Solve the four yellow edges on D with side colors matching centers. You may use a daisy on U or insert directly.',
  'first-layer': 'Solve yellow corners on D while preserving the yellow cross.',
  'middle-layer':
    'Insert the four edges without white or yellow into the middle layer; preserve D.',
  'top-cross': 'Orient white edge stickers toward U, preserving both lower layers.',
  'top-orientation':
    'Orient all white corner stickers toward U, preserving the lower layers and top cross.',
  'top-corners': 'Position the oriented top corners in their correct destinations.',
  'top-edges': 'Permute the top edges and align U to finish.',
  solved: 'Cube solved.',
};
// Reference yaw is a notation mapping only; it never changes the authoritative frame.
export function mapAlg(alg: string, front: string) {
  const ring = ['F', 'R', 'B', 'L'];
  const offset = ring.indexOf(front);
  if (offset < 0) throw new Error('Invalid reference front');
  return alg
    .split(/\s+/)
    .filter(Boolean)
    .map((m) => {
      const i = ring.indexOf(m[0]);
      return (i < 0 ? m[0] : ring[(i + offset) % 4]) + m.slice(1);
    })
    .join(' ');
}
// Static mechanics reference, independent of the current cube and goal.
const faceCycles: Record<string, string[]> = {
  R: ['U', 'B', 'D', 'F'],
  L: ['U', 'F', 'D', 'B'],
  U: ['F', 'L', 'B', 'R'],
  D: ['F', 'R', 'B', 'L'],
  F: ['U', 'R', 'D', 'L'],
  B: ['U', 'L', 'D', 'R'],
};
export function turnDescription(move: string) {
  const cycle = faceCycles[move[0]];
  const amount = move.endsWith('2') ? 2 : move.endsWith("'") ? 3 : 1;
  return `Turn ${move[0]} ${amount === 1 ? 'clockwise' : amount === 3 ? 'counterclockwise' : '180 degrees'} looking at that face. Only pieces touching ${move[0]} move. Their sticker directions change: ${cycle.map((f, i) => `${f}→${cycle[(i + amount) % 4]}`).join(', ')}; the ${move[0]} sticker direction stays fixed.`;
}
export function targetNames(stageName: string) {
  if (stageName === 'cross' || stageName === 'daisy') return names.EDGES.slice(4, 8);
  if (stageName === 'first-layer') return names.CORNERS.slice(4, 8);
  if (stageName === 'middle-layer') return names.EDGES.slice(8);
  if (stageName === 'top-cross' || stageName === 'top-edges') return names.EDGES.slice(0, 4);
  return names.CORNERS.slice(0, 4);
}
export function stageProgress(state: CubeData, stageName: string) {
  const relevant = pieces(state).filter((p) => targetNames(stageName).includes(p.piece));
  if (stageName === 'daisy') return relevant.filter((p) => p.stickers.yellow === 'U').length;
  if (stageName === 'top-cross' || stageName === 'top-orientation')
    return relevant.filter((p) => p.stickers.white === 'U').length;
  if (stageName === 'top-corners')
    return relevant.filter((p) => p.position === p.destination).length;
  return relevant.filter((p) => p.solved).length;
}
export function focusedObservation(
  r: { state: CubeData; target: string | null; stage: string; history: string[] },
  state = r.state,
) {
  const all = pieces(state),
    target = all.find((p) => p.piece === r.target);
  return {
    frame: {
      centers: colors,
      note: 'Fixed frame. Yellow D first; white U last. Clockwise is viewed directly at the turned face.',
    },
    stage: r.stage,
    goal: goals[r.stage],
    target: target
      ? {
          ...target,
          requiredStickerDirections:
            r.stage === 'daisy'
              ? { yellow: 'U' }
              : r.stage === 'top-cross' || r.stage === 'top-orientation'
                ? { white: 'U' }
                : Object.fromEntries([...target.destination].map((f) => [colors[f], f])),
        }
      : r.target,
    stagePieces: all
      .filter((p) => targetNames(r.stage).includes(p.piece))
      .map((p) => ({
        ...p,
        satisfiesStageGoal: r.stage === 'daisy' ? p.stickers.yellow === 'U' : p.solved,
      })),
    otherPieces: all
      .filter((p) => !targetNames(r.stage).includes(p.piece))
      .map((p) => ({
        piece: p.piece,
        position: p.position,
        stickers: p.stickers,
        solved: p.solved,
      })),
    completed: facts(state),
    recentActions: r.history.slice(-6),
  };
}
export function referenceObservation(
  observation: ReturnType<typeof focusedObservation>,
  front: string,
) {
  const ring = ['F', 'R', 'B', 'L'],
    offset = ring.indexOf(front);
  if (offset < 0) throw new Error('Invalid reference front');
  const face = (f: string) => (ring.includes(f) ? ring[(ring.indexOf(f) - offset + 4) % 4] : f);
  const position = (s: string) => {
    const faces = [...s].map(face);
    return (
      [...names.EDGES, ...names.CORNERS].find(
        (n) => n.length === faces.length && [...n].every((f) => faces.includes(f)),
      ) || faces.join('')
    );
  };
  const transform = (p: any) => ({
    ...p,
    position: position(p.position),
    ...(p.destination ? { destination: position(p.destination) } : {}),
    stickers: Object.fromEntries(
      Object.entries(p.stickers).map(([color, f]) => [color, face(f as string)]),
    ),
    ...(p.requiredStickerDirections
      ? {
          requiredStickerDirections: Object.fromEntries(
            Object.entries(p.requiredStickerDirections).map(([color, f]) => [
              color,
              face(f as string),
            ]),
          ),
        }
      : {}),
  });
  return {
    ...observation,
    frame: {
      centers: Object.fromEntries(Object.entries(colors).map(([f, c]) => [face(f), c])),
      note: `All positions, sticker directions, and algorithm notation in this question use a reference with original ${front} as F. U and D are unchanged. Piece IDs remain permanent identities.`,
    },
    target:
      typeof observation.target === 'object' && observation.target
        ? transform(observation.target)
        : observation.target,
    stagePieces: observation.stagePieces.map(transform),
    otherPieces: observation.otherPieces.map(transform),
    recentActions: observation.recentActions.map((a) =>
      a
        .split(' ')
        .map((m) => face(m[0]) + m.slice(1))
        .join(' '),
    ),
  };
}
export function setupDescription(move: string) {
  if (move === 'none') return 'Do not turn U; every piece stays where it is.';
  const cycle = ['UFR', 'ULF', 'UBL', 'URB'];
  const edges = ['UF', 'UL', 'UB', 'UR'];
  const n = move === 'U' ? 1 : move === 'U2' ? 2 : 3;
  return `${turnDescription(move)} Corner positions: ${cycle.map((s, i) => `${s}→${cycle[(i + n) % 4]}`).join(', ')}. Edge positions: ${edges.map((s, i) => `${s}→${edges[(i + n) % 4]}`).join(', ')}.`;
}
const faceWords: Record<string, string> = {
  U: 'top',
  D: 'bottom',
  F: 'front',
  B: 'back',
  R: 'right',
  L: 'left',
};
export function semanticFacts(view: ReturnType<typeof focusedObservation>) {
  const describe = (p: any) => {
    const targetSides = [...(p.destination || '')]
      .filter((f) => f !== 'U' && f !== 'D')
      .sort()
      .join('');
    const currentSides = [...p.position]
      .filter((f) => f !== 'U' && f !== 'D')
      .sort()
      .join('');
    return {
      ...p,
      topStickerColor: Object.entries(p.stickers).find(([, f]) => f === 'U')?.[0] ?? null,
      sideFacingStickers: Object.entries(p.stickers)
        .filter(([, f]) => !['U', 'D'].includes(f as string))
        .map(([color, direction]) => ({ color, direction })),
      locationWords: [...p.position].map((f) => faceWords[f]).join(' '),
      ...(p.destination
        ? { destinationWords: [...p.destination].map((f) => faceWords[f]).join(' ') }
        : {}),
      layer: p.position.includes('U') ? 'top' : p.position.includes('D') ? 'bottom' : 'middle',
      stickerDirectionsInWords: Object.fromEntries(
        Object.entries(p.stickers).map(([c, f]) => [c, faceWords[f as string]]),
      ),
      directlyAboveHome:
        p.position.includes('U') && p.destination?.includes('D') && currentSides === targetSides,
      sideStickersMatchingCenters: Object.entries(p.stickers)
        .filter(
          ([color, face]) =>
            !['U', 'D'].includes(face as string) && view.frame.centers[face as string] === color,
        )
        .map(([color]) => color),
    };
  };
  return {
    ...view,
    target: typeof view.target === 'object' && view.target ? describe(view.target) : view.target,
    stagePieces: view.stagePieces.map(describe),
  };
}
