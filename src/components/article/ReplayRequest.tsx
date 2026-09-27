import timings from '../../lib/article-request-timings.json';
const names: Record<string, string> = {
  goal: 'Choose the goal',
  gatherTarget: 'Choose targets',
  target: 'Choose a target',
  situation: 'Read the piece and frame',
  front: 'Choose the front',
  reference: 'Choose the frame',
  routine: 'Choose a routine',
  readiness: 'Check landing space',
  decision: 'Check execution',
  plan: 'Check the plan',
  freeSlot: 'Choose landing space',
  setup: 'Choose a setup',
  preparation: 'Choose preparation',
  group: 'Recognise the pattern',
  turn: 'Choose a turn',
  slot: 'Choose extraction slot',
  extraction: 'Choose extraction',
  operation: 'Choose an operation',
  recovery: 'Choose recovery',
};
const duration = (ms: number) =>
  ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
export function ReplayRequest({
  policy,
  time,
}: {
  policy: 'skills' | 'primitive';
  time: number;
}) {
  const rows = timings[policy];
  const started = rows.filter((r) => r.startMs < time);
  // Keep the outgoing row mounted above the clipping window until it has slid out.
  const visible = started.slice(-4);
  const latest = visible.at(-1);
  const current = latest && time < latest.endMs ? latest : undefined;
  const growth = current
    ? Math.max(0, Math.min(1, (time - current.startMs) / (current.endMs - current.startMs)))
    : 1;
  const displacement = Math.max(0, (visible.length - 1 + growth) * 56 - 168);
  return (
    <div className="replay-request">
      <small>JEV requests</small>
      <div className="replay-request-history height-progress" aria-label="Latest three requests">
        {Array.from({ length: Math.max(0, 3 - visible.length) }, (_, i) => (
          <div
            key={`blank-${i}`}
            className="replay-request-slot is-empty"
            style={{ transform: `translateY(${(visible.length + i) * 56}px)` }}
            aria-hidden="true"
          >
            <div className="replay-request-bar" />
          </div>
        ))}
        {visible.map((row, index) => {
          const running = time < row.endMs;
          const progress = running
            ? Math.max(0, Math.min(1, (time - row.startMs) / (row.endMs - row.startMs)))
            : 1;
          const boundary = row.step === 1;
          return (
            <div
              key={`${policy}-${row.startMs}`}
              className="replay-request-slot"
              style={{
                transform: `translateY(${index * 56 - displacement}px)`,
                height: 56 * progress,
              }}
              aria-hidden={index * 56 - displacement <= -56 || undefined}
            >
              <div
                className={`replay-round-divider ${boundary ? 'is-boundary' : ''}`}
                style={{ height: 12 * progress }}
              >
                {boundary && <span>Round {row.round + 1}</span>}
              </div>
              <div
                className={`replay-request-bar ${running ? 'is-running' : 'is-complete'}`}
                style={{ height: 40 * progress }}
                title={`Saved send/receive interval: ${duration(row.endMs - row.startMs)}. API latency: ${row.elapsedMs === null ? 'unavailable' : duration(row.elapsedMs)}.`}
              >
                <span className="replay-request-number">{row.step}</span>
                <span className="replay-request-name">
                  {names[row.questions[0]] || row.questions.join(' + ')}
                </span>
                <time>
                  {duration(
                    running ? time - row.startMs : (row.elapsedMs ?? row.endMs - row.startMs),
                  )}
                </time>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
