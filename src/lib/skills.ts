export const SKILL_VERSION = 'beginner-v7';
export const skills = [
  {id:'cross-lift-right',alg:"R U R'",stages:['cross'],purpose:'Target at FR with yellow pointing F: lift it to UF yellow-up, preserving all bottom edges. Use for extraction, not insertion.'},
  {id:'cross-lift-left',alg:"L' U' L",stages:['cross'],purpose:'Target at FL with yellow pointing F: lift it to UF yellow-up, preserving all bottom edges. Use for extraction, not insertion.'},
  {id:'cross-flip-top-right',alg:"F R U2 R' F'",stages:['cross'],purpose:'Target at UF with yellow pointing F: reorient it to UL yellow-up, preserving all bottom edges.'},
  {id:'cross-flip-top-left',alg:"F' L' U2 L F",stages:['cross'],purpose:'Target at UF with yellow pointing F: reorient it to UR yellow-up, preserving all bottom edges.'},
  {id:'cross-flip-bottom',alg:"F L' U2 L F'",stages:['cross'],purpose:'Target at DF with yellow pointing F: lift it to UR yellow-up, preserving the OTHER three bottom edges. The target bottom slot itself is unsolved.'},

  {
    id: 'lift-bottom',
    alg: 'F2',
    stages: ['daisy', 'cross'],
    purpose:
      'Target at DF with yellow pointing D: F2 lifts it to UF yellow-up. Before lifting, UF should not contain an existing yellow-up petal.',
  },
  {
    id: 'lift-middle-right',
    alg: 'R',
    stages: ['daisy'],
    purpose:
      'Target at FR with yellow pointing F: R lifts it to UR yellow-up. Before lifting, UR should not contain an existing yellow-up petal.',
  },
  {
    id: 'lift-middle-left',
    alg: "L'",
    stages: ['daisy'],
    purpose:
      'Target at FL with yellow pointing F: L-prime lifts it to UL yellow-up. Before lifting, UL should not contain an existing yellow-up petal.',
  },
  {
    id: 'flip-bottom-edge',
    alg: "F L'",
    stages: [], // Retained for historical replay; superseded for cross work.
    purpose:
      'Target at DF with yellow pointing F: F then L-prime lifts it via FL to UL yellow-up. First clear yellow-up petals away from UF and UL using U setup.',
  },
  {
    id: 'stage-bottom-edge',
    alg: 'F',
    stages: ['daisy'],
    purpose:
      'Target at DF with yellow pointing F: F moves it to FL with yellow still pointing F. Requires UF free of yellow-up petals. This stages the edge in the middle, not yet a petal. On a later decision, clear UL and use lift-middle-left.',
  },
  {
    id: 'flip-top-edge',
    alg: 'F R',
    stages: ['daisy'],
    purpose:
      'Target at UF with yellow pointing F: F then R lifts it via FR to UR yellow-up. Before executing, UR should not hold a yellow-up petal.',
  },
  {
    id: 'lower-top-edge',
    alg: 'F',
    stages: ['daisy'],
    purpose:
      'Target at UF with yellow facing F, and the lift landing slots are occupied by petals: move it into FR first. Then a later U setup can clear UR before lifting it, without moving this target.',
  },
  {
    id: 'flip-top-edge-left',
    alg: "F' L'",
    stages: ['daisy'],
    purpose:
      'Target at UF with yellow pointing F: F-prime then L-prime lifts it via FL to UL yellow-up. UL must be clear of existing petals.',
  },
  {
    id: 'daisy-to-cross',
    alg: 'F2',
    stages: ['cross'],
    purpose:
      'Target at UF, yellow points U, its other sticker matches the front center, and destination is DF: F2 inserts the target as a correct yellow D cross edge. Do not transfer an unaligned petal.',
  },
  {
    id: 'right-trigger',
    alg: "R U R' U'",
    stages: ['first-layer'],
    purpose:
      'Use when the target is at UFR with yellow facing U to reorient it, or at DRF misplaced/twisted to extract it. Does NOT insert a target at ULF, UBL, or URB: align it first.',
  },
  {
    id: 'left-trigger',
    alg: "L' U' L U",
    stages: ['first-layer'],
    purpose:
      'Use when the target is at ULF with yellow facing U to reorient it, or at DFL misplaced/twisted to extract it. Other U positions need alignment first.',
  },
  {
    id: 'corner-insert',
    alg: "R U R'",
    stages: ['first-layer'],
    purpose:
      'Insert target from UFR into DRF. Required: destination DRF, current position UFR, yellow sticker pointing R. If at another U corner, align it first.',
  },
  {
    id: 'corner-insert-left',
    alg: "L' U' L",
    stages: ['first-layer'],
    purpose:
      'Insert target from ULF into DFL. Required: destination DFL, current position ULF, yellow sticker pointing L. If at another U corner, align it first.',
  },
  {
    id: 'corner-front-right',
    alg: "F' U' F",
    stages: ['first-layer'],
    purpose:
      'Insert target from UFR into DRF. Required: destination DRF, current position UFR, yellow sticker pointing F.',
  },
  {
    id: 'corner-front-left',
    alg: "F U F'",
    stages: ['first-layer'],
    purpose:
      'Insert target from ULF into DFL. Required: destination DFL, current position ULF, yellow sticker pointing F.',
  },
  {
    id: 'middle-right',
    alg: "U R U' R' U' F' U F",
    stages: ['middle-layer'],
    purpose:
      'Insert UF into FR when its front sticker matches F and its upper sticker matches R. Can eject a wrong FR edge.',
  },
  {
    id: 'middle-left',
    alg: "U' L' U L U F U' F'",
    stages: ['middle-layer'],
    purpose:
      'Insert UF into FL when its front sticker matches F and its upper sticker matches L. Can eject a wrong FL edge.',
  },
  {
    id: 'orient-edges',
    alg: "F R U R' U' F'",
    stages: ['top-cross'],
    purpose:
      'Orient U edges with an oriented line across UL–UR. A dot first needs this algorithm to form an elbow. Preserves lower layers.',
  },
  {
    id: 'orient-elbow',
    alg: "F U R U' R' F'",
    stages: ['top-cross'],
    purpose:
      'Orient the top edges when white-up edges form an elbow at UB and UL. Preserves lower layers.',
  },
  {
    id: 'sune',
    alg: "R U R' U R U2 R'",
    stages: ['top-orientation'],
    purpose:
      'Twist top corners while preserving lower layers and top-edge orientation. Standard Sune: a single white-up corner at ULF and white on F at UFR.',
  },
  {
    id: 'antisune',
    alg: "R U2 R' U' R U' R'",
    stages: ['top-orientation'],
    purpose:
      'Inverse Sune: white points U at URB, R at UFR, L at UBL and F at ULF. Preserves lower layers and top-edge orientation. Other patterns may require several operations.',
  },
  {
    id: 'corner-permute',
    alg: "R U R' U' R' F R2 U' R' U' R U R' F'",
    stages: ['top-corners'],
    purpose:
      'T permutation: swap UFR and URB corners and UR/UL edges; preserves orientations and lower layers. Position the corner pair on the right.',
  },
  {
    id: 'edge-cycle',
    alg: "R U' R U R U R U' R' U' R2",
    stages: ['top-edges'],
    purpose:
      'Cycle top edge positions UF→UR→UL→UF with UB fixed. All corner positions and orientations and lower layers are preserved. Hold the correctly placed edge at UB.',
  },
  {
    id: 'edge-cycle-inverse',
    alg: "R2 U R U R' U' R' U' R' U R'",
    stages: ['top-edges'],
    purpose:
      'Cycle top edge positions UF→UL→UR→UF with UB fixed. All corners and lower layers are preserved. Hold the correctly placed edge at UB.',
  },
];
export function skillOptions(stage: string) {
  return Object.fromEntries(
    skills
      .filter((s) => s.stages.includes(stage))
      .map((s) => [s.id, `${s.purpose} Algorithm in selected reference: ${s.alg}`]),
  );
}
export const casesByStage: Record<string, Record<string, string>> = {
  daisy: {
    petal: 'Target already has yellow pointing U: preserve it and select another target',
    bottomDown: 'Target in D layer, yellow pointing D: lift with a side half turn',
    bottomSide: 'Target in D layer, yellow pointing sideways: flip-bottom-edge',
    middle:
      'Target in middle layer, yellow pointing sideways: orient reference with yellow facing F and lift left/right',
    topSide: 'Target in U layer, yellow pointing sideways: flip-top-edge',
  },
  cross: {
    aligned: 'Target yellow edge already matches both centers; protect it',
    daisy:
      'Target yellow sticker faces U; align its other color with its center then use that side half turn',
    middle:
      'Target edge is in the middle slice; lift or insert it without disturbing solved yellow edges',
    bottom: 'Target is on D but displaced or flipped; extract or align it',
    topSide: 'Target is on U with yellow pointing sideways; reorient it',
  },
  'first-layer': {
    solved: 'Target yellow corner is already solved; protect it',
    topSide:
      'Target is in U layer with yellow facing a side; align it over its destination and insert',
    topUp:
      'Target is in U layer with yellow facing U; a trigger can turn it sideways before insertion',
    bottomWrong: 'Target is in D layer but misplaced or twisted; lift it to U first',
  },
  'middle-layer': {
    solved: 'Target middle edge is solved; protect it',
    top: 'Target is in U layer; align its side sticker with its matching center, then choose left/right insertion',
    trapped:
      'Target middle edge is misplaced or flipped in the middle; eject it using an insertion algorithm',
  },
  'top-cross': {
    dot: 'No U edge has white facing U',
    line: 'Two opposite U edges have white facing U',
    elbow: 'Two adjacent U edges have white facing U',
    cross: 'All four U edges have white facing U',
  },
  'top-orientation': {
    none: 'No U corners have white facing U',
    one: 'One U corner has white facing U',
    two: 'Two U corners have white facing U',
    all: 'All four U corners have white facing U',
  },
  'top-corners': {
    alignment: 'A U-layer rotation alone can align all four corner destinations',
    adjacent: 'An adjacent corner pair must be swapped',
    diagonal: 'A diagonal corner pair must be swapped; more than one adjacent swap may be needed',
  },
  'top-edges': {
    alignment: 'Only a U-layer rotation is needed',
    cycle: 'One edge is correctly placed and three need cycling',
    pairs: 'No edge is correctly placed; multiple cycles or alignment may be needed',
  },
};
