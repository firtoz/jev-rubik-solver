// Experimental policy. No evaluator, fixture labels or outcome search may enter this module.
import { colors, pieces, mapAlg, names } from '../../src/lib/cube';
import { skills } from '../../src/lib/skills';
import type { CubeData, JevRequest, Question } from '../../src/lib/types';
export const VERSION = 'observation-boundary-v2';
export type Boundary = 'code' | 'jev';
export type Wording = 'structured' | 'player';
export type Answers = Record<string, string>;
export const ids = ['DF', 'DR', 'DB', 'DL'];
export const fronts = ['F', 'R', 'B', 'L'];
export const frame = { centers: colors, note: 'Fixed frame: yellow D, white U. Clockwise is viewed directly at the turned face. Camera has no effect.' };
export type Memory = { target: string | null; recentActions: string[] };
export function observe(state: CubeData, memory: Memory = { target: null, recentActions: [] }) {
  return {
    frame,
    edges: pieces(state).filter(p => p.kind === 'edge' && ids.includes(p.piece)).map(p => ({
      id: p.piece, position: p.position, stickers: p.stickers,
    })).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)),
    memory: { target: memory.target, recentActions: memory.recentActions.slice(-2) },
  };
}
export type Observation = ReturnType<typeof observe>;
export function measuredChecks(o: Observation): Answers {
  return Object.fromEntries(o.edges.flatMap(e => [
    [`petal_${e.id}`, e.stickers.yellow === 'U' ? 'yes' : 'no'],
    [`bottom_${e.id}`, e.stickers.yellow === 'D' && Object.entries(e.stickers).every(([color, face]) => colors[face] === color) ? 'yes' : 'no'],
  ]));
}
export function aggregate(checks: Answers) {
  for (const id of ids) for (const prefix of ['petal', 'bottom'])
    if (!['yes', 'no'].includes(checks[`${prefix}_${id}`])) throw new Error('Missing recognition answer');
  return { checks: { ...checks }, counts: {
    petals: ids.filter(id => checks[`petal_${id}`] === 'yes').length,
    bottom: ids.filter(id => checks[`bottom_${id}`] === 'yes').length,
  } };
}
const q = (instructions: string, criteria: Record<string, string>): Question => ({ type: 'choice', instructions, criteria });
const req = (state: unknown, questions: Record<string, Question>): JevRequest => ({ model: 'jev-1.13.0', state, questions });
function evidence(o: Observation, wording: Wording) {
  if (wording === 'structured') return o;
  return {
    frame: o.frame,
    edges: o.edges.map(e => `Edge ${e.id} is at ${e.position}. ${Object.entries(e.stickers).map(([c, f]) => `${c} faces ${f}`).join('; ')}.`),
    memory: o.memory,
  };
}
export function recognition(o: Observation, wording: Wording) {
  return req(evidence(o, wording), Object.fromEntries(ids.flatMap(id => [
    [`petal_${id}`, q(`Inspect only edge ${id}. Is its yellow sticker facing U? A yellow-up edge on U is a petal; side-center matching is irrelevant.`, { yes: 'Yellow faces U', no: 'Yellow does not face U' })],
    [`bottom_${id}`, q(`Inspect only edge ${id}. Does yellow face D AND does its other sticker face the center of the same color? Read centers from frame. Both conditions must hold.`, { yes: 'Both stickers match their face centers', no: 'At least one sticker does not match its face center' })],
  ])));
}
export const lesson = 'Use the daisy-first beginner method. Preserve petals and correctly solved bottom edges. When bottom=4, hand off to corners. Otherwise, when petals+bottom=4, transfer remaining petals to matching bottom slots. When petals+bottom<4, gather missing petals. Partial transfers must not be rebuilt. Counts describe distinct yellow edges. This experiment stops at a completed cross, not a completed cube.';
export function planning(o: Observation, summary: ReturnType<typeof aggregate>, wording: Wording) {
  const targetOptions = Object.fromEntries([...ids.map(id => [id, `Work on edge ${id}`]), ['none', 'No eligible edge for this hypothetical goal']]);
  return req({ observation: evidence(o, wording), ...summary }, {
    goal: q(lesson, { daisy: 'Gather missing petals', cross: 'Transfer remaining petals', 'first-layer': 'Cross complete: hand off to corners' }),
    gatherTarget: q('Assume the goal is gathering missing petals, regardless of the goal answer in this request. Choose an edge with petal=no AND bottom=no. Preserve both existing petals and solved bottom edges. Prefer an accessible edge; any eligible edge is allowed. If none is eligible, choose none.', targetOptions),
    transferTarget: q('Assume the goal is transferring petals, regardless of the goal answer in this request. Choose an edge with petal=yes AND bottom=no. Any eligible petal is allowed. If none is eligible, choose none.', targetOptions),
  });
}
export const situationOptions = {
  petal: 'Yellow faces U', bottomDown: 'Edge is on D and yellow faces D',
  bottomSide: 'Edge is on D and yellow faces a side', middle: 'Edge is between side faces, not on U or D',
  topSide: 'Edge is on U and yellow faces a side',
};
export function situation(o: Observation, goal: string, target: string, wording: Wording) {
  return req({ observation: evidence(o, wording), goal, target }, {
    situation: q('Classify the selected target using its current position and yellow sticker direction. Do not predict a move.', situationOptions),
    reference: q('Choose a reference front for the selected target. If yellow faces a side, use that side as front. If yellow faces U or D, use the other face in its current position as front. U and D stay fixed. This is based on its CURRENT position, not where it belongs.', Object.fromEntries(fronts.map(f => [f, `Use fixed ${f} as reference front`]))),
  });
}
export const routines = skills.filter(s => s.stages.some(s => s === 'daisy' || s === 'cross'));
// Fixed menu, identical for every cube and both arms. No current-case filtering.
export const actionMenu = Object.fromEntries([
  ...['U', "U'", 'U2'].map(move => [`turn:${move}`, { alg: move, description: `Only ${move}: align a petal with its side center, or clear a landing position before a later lift. Reobserve afterward.` }]),
  ...routines.flatMap(s => ['', 'U', "U'", 'U2'].map(setup => [`${setup || 'none'}:${s.id}`, {
    alg: [setup, s.alg].filter(Boolean).join(' '),
    description: `${setup ? `First ${setup}, then` : 'No setup; execute'} ${s.alg}. ${s.purpose} Setup can move a target on U: applicability must hold AFTER setup. Preserve existing petals when gathering and solved bottom edges throughout.`,
  }])),
  ['reconsider', { alg: '', description: 'No suitable action recognised. Abstain and record this attempt as incomplete.' }],
]) as Record<string, { alg: string; description: string }>;
export function action(o: Observation, summary: ReturnType<typeof aggregate>, goal: string, target: string, recognised: Answers, wording: Wording) {
  const front = recognised.reference;
  if (!fronts.includes(front)) throw new Error('Invalid reference');
  const ring = fronts;
  const local = (f: string) => ring.includes(f) ? ring[(ring.indexOf(f) - ring.indexOf(front) + 4) % 4] : f;
  const localObservation: Observation = {
    ...o, frame: { ...frame, centers: Object.fromEntries(Object.entries(colors).map(([f,c]) => [local(f), c])) },
    edges: o.edges.map(e => ({ ...e, position: names.EDGES.find(slot => [...slot].sort().join('') === [...e.position].map(local).sort().join(''))!, stickers: Object.fromEntries(Object.entries(e.stickers).map(([c,f]) => [c, local(f)])) })),
  };
  return req({ observation: evidence(localObservation, wording), selectedTarget: localObservation.edges.find(e => e.id === target), ...summary, goal, target,
    previousModelAnswers: recognised, reference: `All observation face names and routine moves are local to front=${front}. Piece IDs are identities, not current positions. U/D unchanged.`,
  }, { operation: q('Use selectedTarget.position and selectedTarget.stickers for the current case. Its id is an immutable name and says NOTHING about its current position or orientation. Choose one useful setup/routine for the selected goal and target. Read current stickers and the routine conditions. Use the recognised situation as context. During gather, gain a petal or stage this target for its next lift while protecting existing petals. During transfer, align the target or insert it. Do not move an already solved bottom edge. U-only setup is allowed when it prepares this target. Never assume an action outcome was checked by code.', Object.fromEntries(Object.entries(actionMenu).map(([id, a]) => [id, a.description]))) });
}
export function executeSelection(operation: string, front: string) {
  if (!(operation in actionMenu)) throw new Error('Unknown operation');
  return mapAlg(actionMenu[operation].alg, front);
}
export function provenance(boundary: Boundary) {
  return {
    'observation.frame,edges,memory': 'mechanics: literal centers, positions, sticker directions, previous chosen target and last two executed actions',
    checks: boundary === 'code' ? 'code: color comparisons' : 'JEV: recognition answers copied unchanged',
    counts: 'code: count yes answers; never correct inconsistent recognition',
    'goal,target,situation,reference,operation': 'JEV choices',
    localObservation: 'code: coordinate renaming using JEV-selected reference',
    routines: 'human-authored fixed reference; code executes selected sequence without tactical correction',
  };
}
