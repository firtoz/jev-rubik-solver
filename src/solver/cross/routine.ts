import type { JevRequest } from '../../lib/types';
export function request(original: JevRequest) {
  const r = structuredClone(original),
    s = r.state as any;
  for (const [id, text] of Object.entries(r.questions.routine.criteria)) {
    if (id === 'reconsider') continue;
    const routine = JSON.parse(text);
    r.questions.routine.criteria[id] = JSON.stringify({
      ...routine,
      turnCount: routine.sequence.split(/\s+/).length,
    });
  }
  r.state = {
    target: { position: s.target.position, yellowDirection: s.target.yellowDirection },
    protectedBottomSlots: s.protectedBottomSlots,
    previouslyRejectedByModel: s.previouslyRejectedByModel,
  };
  r.questions.routine.instructions =
    'Choose one routine. First require its position to equal target.position EXACTLY and yellowDirection to equal target.yellowDirection EXACTLY. Different slot names are different positions. Reject previouslyRejectedByModel routines and any routine with an affectedBottomSlot listed in protectedBottomSlots. Among the remaining lifts, choose the smallest turnCount. Consider staging only when no lift remains. Landing occupancy is checked in the next request. Do not choose a cheaper routine that fails the position or protection checks.';
  return r;
}
