import { requestMetadata, type ReplayPolicy } from '../../lib/replay-requests';
import { DecisionMetadata } from './DecisionMetadata';
export { DecisionMetadata } from './DecisionMetadata';
export function ReplayGoal({ policy, time }: { policy: ReplayPolicy; time: number }) {
  return <DecisionMetadata state={requestMetadata(policy, time)}/>;
}
