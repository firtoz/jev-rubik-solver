import { goalNames, requestMetadata, type ReplayPolicy } from '../../lib/replay-requests';
import { algorithmLabel } from '../../lib/algorithm-labels';
export function ReplayGoal({ policy, time }: { policy: ReplayPolicy; time: number }) {
  const state = requestMetadata(policy, time);
  const fields: [string, string | undefined][] = [
    ['Target', state.target],
    ['Situation', state.answers.situation],
    ['Front', state.answers.front ?? state.answers.reference],
    ['Preparation', state.answers.preparation],
    ['Pattern', state.answers.group],
    ['Routine', state.answers.routine],
    ['Setup', state.answers.setup],
    ['Landing', state.answers.freeSlot],
    ['Ready', state.answers.readiness ?? state.answers.decision],
    ['Turn', state.answers.turn],
    ['Extraction slot', state.answers.slot],
    ['Extraction', state.answers.extraction],
    ['Operation', state.answers.operation],
    ['Plan', state.answers.plan],
    ['Recovery', state.answers.recovery],
  ];
  return (
    <div className="replay-goal">
      <small>Round {state.round + 1}</small>
      <strong>{state.goal ? (goalNames[state.goal] ?? state.goal) : 'Waiting for a goal'}</strong>
      <dl>
        {fields
          .filter(([, value]) => value !== undefined)
          .map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{algorithmLabel(value!)}</dd>
            </div>
          ))}
      </dl>
    </div>
  );
}
