import { cameraForGoal } from './camera-view';
export { cameraTravel } from './camera-view';
import timings from './article-request-timings.json';
import type { ReplayPolicy } from './replay-requests';

/** Presentation only: observations and move notation retain the recorded fixed frame. */
export function replayCamera(policy: ReplayPolicy, time: number) {
  let goal = '', front = 'F';
  for (const row of timings[policy]) {
    if (row.endMs > time) break;
    if (row.failed) continue;
    const answers = row.answers as Partial<Record<string, string>>;
    if (answers.goal && answers.goal !== goal) { goal = answers.goal; front = 'F'; }
    front = answers.front ?? answers.reference ?? front;
  }
  return cameraForGoal(goal, front);
}
