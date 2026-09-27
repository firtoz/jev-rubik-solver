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
  const lower = goal === 'cross' || goal === 'first-layer';
  const middle = goal === 'f2l' || goal === 'middle-layer';
  const longitude = ({ F: 0, R: 90, B: 180, L: -90 } as Record<string, number>)[front] ?? 0;
  return {
    // Favor the bottom face while leaving side faces visible for depth.
    latitude: goal === 'cross' ? -68 : lower ? -55 : middle ? -20 : 45,
    longitude: goal === 'cross' ? 20 : longitude + 30,
    label: lower ? 'Yellow underside · D' : middle ? `Lower layers · ${front} side` : 'Top face · U',
  };
}
export function cameraTravel(from: number, to: number) {
  return ((to - from + 540) % 360 + 360) % 360 - 180;
}
