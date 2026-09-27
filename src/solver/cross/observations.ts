// Experimental policy. No evaluator, fixture labels or outcome search may enter this module.
import { colors, pieces } from '../../lib/cube';
import type { CubeData, JevRequest, Question } from '../../lib/types';
export const VERSION = 'observation-boundary-v1';
export type Boundary = 'code' | 'jev';
export type Wording = 'structured' | 'player';
export type Answers = Record<string, string>;
export const ids = ['DF', 'DR', 'DB', 'DL'];
export const fronts = ['F', 'R', 'B', 'L'];
export const frame = {
  centers: colors,
  note: 'Fixed frame: yellow D, white U. Clockwise is viewed directly at the turned face. Camera has no effect.',
};
export type Memory = { target: string | null; recentActions: string[] };
export function observe(state: CubeData, memory: Memory = { target: null, recentActions: [] }) {
  return {
    frame,
    edges: pieces(state)
      .filter((p) => p.kind === 'edge' && ids.includes(p.piece))
      .map((p) => ({
        id: p.piece,
        position: p.position,
        stickers: p.stickers,
      }))
      .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)),
    memory: { target: memory.target, recentActions: memory.recentActions.slice(-2) },
  };
}
export type Observation = ReturnType<typeof observe>;
export function measuredChecks(o: Observation): Answers {
  return Object.fromEntries(
    o.edges.flatMap((e) => [
      [`petal_${e.id}`, e.stickers.yellow === 'U' ? 'yes' : 'no'],
      [
        `bottom_${e.id}`,
        e.stickers.yellow === 'D' &&
        Object.entries(e.stickers).every(([color, face]) => colors[face] === color)
          ? 'yes'
          : 'no',
      ],
    ]),
  );
}
export function aggregate(checks: Answers) {
  for (const id of ids)
    for (const prefix of ['petal', 'bottom'])
      if (!['yes', 'no'].includes(checks[`${prefix}_${id}`]))
        throw new Error('Missing recognition answer');
  return {
    checks: { ...checks },
    counts: {
      petals: ids.filter((id) => checks[`petal_${id}`] === 'yes').length,
      bottom: ids.filter((id) => checks[`bottom_${id}`] === 'yes').length,
    },
  };
}
const q = (instructions: string, criteria: Record<string, string>): Question => ({
  type: 'choice',
  instructions,
  criteria,
});
const req = (state: unknown, questions: Record<string, Question>): JevRequest => ({
  model: 'jev-1.13.0',
  state,
  questions,
});
function evidence(o: Observation, wording: Wording) {
  if (wording === 'structured') return o;
  return {
    frame: o.frame,
    edges: o.edges.map(
      (e) =>
        `Edge ${e.id} is at ${e.position}. ${Object.entries(e.stickers)
          .map(([c, f]) => `${c} faces ${f}`)
          .join('; ')}.`,
    ),
    memory: o.memory,
  };
}
export const lesson =
  'Use the daisy-first beginner method. Preserve petals and correctly solved bottom edges. When bottom=4, hand off to corners. Otherwise, when petals+bottom=4, transfer remaining petals to matching bottom slots. When petals+bottom<4, gather missing petals. Partial transfers must not be rebuilt. Counts describe distinct yellow edges. This experiment stops at a completed cross, not a completed cube.';
export function planning(o: Observation, summary: ReturnType<typeof aggregate>, wording: Wording) {
  const targetOptions = Object.fromEntries([
    ...ids.map((id) => [id, `Work on edge ${id}`]),
    ['none', 'No eligible edge for this hypothetical goal'],
  ]);
  return req(
    { observation: evidence(o, wording), ...summary },
    {
      goal: q(lesson, {
        daisy: 'Gather missing petals',
        cross: 'Transfer remaining petals',
        'first-layer': 'Cross complete: hand off to corners',
      }),
      gatherTarget: q(
        'Assume the goal is gathering missing petals, regardless of the goal answer in this request. Choose an edge with petal=no AND bottom=no. Preserve both existing petals and solved bottom edges. Prefer an accessible edge; any eligible edge is allowed. If none is eligible, choose none.',
        targetOptions,
      ),
      transferTarget: q(
        'Assume the goal is transferring petals, regardless of the goal answer in this request. Choose an edge with petal=yes AND bottom=no. Any eligible petal is allowed. If none is eligible, choose none.',
        targetOptions,
      ),
    },
  );
}
export const situationOptions = {
  petal: 'Yellow faces U',
  bottomDown: 'Edge is on D and yellow faces D',
  bottomSide: 'Edge is on D and yellow faces a side',
  middle: 'Edge is between side faces, not on U or D',
  topSide: 'Edge is on U and yellow faces a side',
};
