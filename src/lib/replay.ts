import type { Event } from './types';
export const replayKinds = new Set([
  'request',
  'decision',
  'action',
  'recovery',
  'halt',
  'request-error',
  'invalid-response',
  'control',
]);
export function recordedTimeline(events: Event[]) {
  const start = events.find((e) => e.kind === 'step-start' || e.kind === 'request');
  if (!start) return [];
  const origin = Date.parse(start.createdAt);
  return events
    .filter((e) => replayKinds.has(e.kind) && e.id >= start.id)
    .map((event) => ({
      event,
      ms: Math.max(0, Date.parse(event.createdAt) - origin),
    }));
}
export function frameAt(timeline: ReturnType<typeof recordedTimeline>, ms: number) {
  for (let i = timeline.length - 1; i >= 0; i--) if (timeline[i].ms <= ms) return timeline[i];
  return undefined;
}
export type RecordedTransition = { key: number; beforeAlg: string; alg: string; progress: number };
export function transitionAt(
  timeline: ReturnType<typeof recordedTimeline>,
  ms: number,
): RecordedTransition | undefined {
  let beforeMs = 0;
  const prior: string[] = [];
  for (const frame of timeline) {
    if (frame.event.kind !== 'action') continue;
    if (ms < frame.ms)
      return {
        key: frame.event.id,
        beforeAlg: prior.join(' '),
        alg: frame.event.payload.alg,
        progress: Math.max(0, Math.min(1, (ms - beforeMs) / (frame.ms - beforeMs))),
      };
    prior.push(frame.event.payload.alg);
    beforeMs = frame.ms;
  }
  return undefined;
}
export function frameLabel(event?: Event) {
  if (!event) return 'Scrambled cube · before the first request';
  if (event.kind === 'request')
    return `Request sent · ${Object.keys(event.payload.request.questions).join(', ')}`;
  if (event.kind === 'decision')
    return `Response received · ${Object.values(event.payload.response.answers)
      .map((a: any) => a.choice)
      .join(', ')}`;
  if (event.kind === 'action') return `Moves applied · ${event.payload.alg}`;
  return `${event.kind} · ${event.payload.choice || event.payload.reason || event.payload.action || ''}`;
}
