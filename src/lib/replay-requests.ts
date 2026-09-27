import timings from './article-request-timings.json';
export type ReplayPolicy = 'skills' | 'primitive';
export function requestLink(policy: ReplayPolicy, round: number, step: number) {
  return `${import.meta.env?.BASE_URL ?? '/'}request-flow/?recording=${policy}&round=${round + 1}&request=${step}`;
}
export function nextRequestEnd(policy: ReplayPolicy, time: number, finish: number) {
  return timings[policy].find((row) => row.endMs > time && row.endMs <= finish)?.endMs;
}
export function requestMetadata(policy: ReplayPolicy, time: number) {
  const rows = timings[policy];
  const latest = rows.filter((row) => row.startMs <= time).at(-1) ?? rows[0];
  const completed = rows.filter(
    (row) => row.round === latest.round && row.endMs <= time && !row.failed,
  );
  const answers = Object.assign({}, ...completed.map((row) => row.answers)) as Partial<Record<string, string>>;
  const target =
    answers.target ??
    (answers.goal === 'daisy'
      ? answers.gatherTarget
      : answers.goal === 'cross'
        ? answers.transferTarget
        : undefined);
  return { round: latest.round, goal: answers.goal, target, answers };
}
export { goalNames } from './goal-names';
