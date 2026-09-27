import type { RecordedTransition } from './replay';
export const DISPLAY_MS_PER_TURN = 300;
export function actionSchedule(timeline: { alg: string; ms: number }[]) {
  let end = 0,
    beforeAlg = '';
  return timeline.map((action, index) => {
    const start = Math.max(action.ms, end);
    end = start + Math.max(1, action.alg.trim().split(/\s+/).length) * DISPLAY_MS_PER_TURN;
    const entry = { ...action, index, start, end, beforeAlg };
    beforeAlg = [beforeAlg, action.alg].filter(Boolean).join(' ');
    return entry;
  });
}
export function actionFrame(schedule: ReturnType<typeof actionSchedule>, time: number) {
  const completed = schedule.filter((a) => a.end <= time);
  const active = schedule.find((a) => a.start <= time && time < a.end);
  const transition: RecordedTransition | undefined = active
    ? {
        key: active.index,
        beforeAlg: active.beforeAlg,
        alg: active.alg,
        progress: (time - active.start) / (active.end - active.start),
      }
    : undefined;
  return {
    completed: completed.length,
    alg: completed.map((a) => a.alg).join(' '),
    index: active?.index ?? completed.length - 1,
    transition,
  };
}
