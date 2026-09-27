import { useEffect, useMemo, useRef, useState } from 'react';
import { Cube, type CubeMoveProgress } from '../Cube';
import { RequestView } from './RequestView';
import { actionSchedule, actionFrame } from '../../lib/article-replay';
import { ReplayRequest } from './ReplayRequest';
import { ReplayDecision } from './ReplayDecision';
export function useInView(delay = 500) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(timer);
        if (entry.isIntersecting && entry.intersectionRatio >= 0.25)
          timer = setTimeout(() => setVisible(true), delay);
        else setVisible(false);
      },
      { threshold: 0.25 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [delay]);
  return { ref, visible };
}
export type Recording = {
  policy: string;
  scramble: string;
  timeline: { alg: string; ms: number }[];
  durationMs: number;
  costs: { ms: number; cost: number }[];
  result: { verifiedSolved: boolean; requests: number; turns: number; cost: number };
  firstRequest: import('../../lib/types').JevRequest;
};
export function ComparisonDemo({
  recordings,
  latest = false,
}: {
  recordings: Recording[];
  latest?: boolean;
}) {
  const { ref, visible } = useInView(500);
  const [moveProgress, setMoveProgress] = useState<Record<string, CubeMoveProgress>>({});
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [time, setTime] = useState(0);
  const clock = useRef(0);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const left = recordings.find((r) => r.policy === 'primitive');
  const right = recordings.find((r) => r.policy === 'skills');
  const schedules = useMemo(
    () => Object.fromEntries(recordings.map((r) => [r.policy, actionSchedule(r.timeline)])),
    [recordings],
  );
  const recordedFinish = right?.timeline.at(-1)?.ms ?? 0;
  const finish = schedules.skills?.at(-1)?.end ?? 0;
  const requestTime = Math.min(time, recordedFinish);
  const ended = finish > 0 && time >= finish;
  const playing = visible && !paused && !reduced && !ended && finish > 0;
  useEffect(() => {
    if (!playing) return;
    let handle = 0,
      last = performance.now();
    const tick = (now: number) => {
      clock.current = Math.min(finish, clock.current + Math.max(0, now - last));
      last = now;
      setTime(clock.current);
      if (clock.current < finish) handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [playing, finish]);
  if (
    !left ||
    !right ||
    left.scramble !== right.scramble ||
    !right.result.verifiedSolved ||
    !finish
  )
    return null;
  return (
    <div ref={ref} className="recorded-demo comparison-demo">
      <div className="demo-top">
        <span className="eyebrow">REAL RECORDINGS · NO API CALLS</span>
        <span>Same scramble · 1× speed{latest ? ' · selected best case' : ''}</span>
      </div>
      <div className="comparison-cubes">
        {[left, right].map((recording, index) => {
          const frame = actionFrame(schedules[recording.policy], index ? time : requestTime);
          const actionIndex = frame.index;
          const elapsed = Math.min(requestTime, recording.durationMs);
          const spent = recording.costs
            .filter((c) => c.ms <= requestTime)
            .reduce((sum, c) => sum + c.cost, 0);
          return (
            <section
              className={`comparison-side ${ended ? (index ? 'has-won' : 'has-lost') : ''}`}
              key={recording.policy}
            >
              <header>
                <small>{index ? 'FOCUSED QUESTIONS' : 'INDIVIDUAL TURNS'}</small>
                <h3>
                  {index ? (latest ? 'Grouped-menu solver' : 'Beginner routines') : 'Single turns'}
                </h3>
              </header>
              <div className="comparison-stage">
                <Cube
                  scramble={recording.scramble}
                  alg={frame.alg}
                  speed={1}
                  instant
                  onMoveProgress={(progress) =>
                    setMoveProgress((previous) => {
                      const old = previous[recording.policy];
                      return old?.key === progress.key &&
                        old.active === progress.active &&
                        old.done === progress.done
                        ? previous
                        : { ...previous, [recording.policy]: progress };
                    })
                  }
                  transition={frame.transition}
                />
                {ended && (
                  <div className={`result-stamp ${index ? 'win' : 'fail'}`}>
                    {index ? 'WIN' : 'FAIL'}
                  </div>
                )}
              </div>
              <div className="comparison-status">
                {ended
                  ? index
                    ? 'Solved'
                    : 'Still unsolved when skills finished'
                  : `Completed ${frame.completed} / ${recording.timeline.length} actions`}
              </div>
              {latest && (
                <ReplayRequest
                  policy={index ? 'skills' : 'primitive'}
                  time={requestTime}
                />
              )}
              {latest && actionIndex >= 0 && (
                <ReplayDecision
                  policy={index ? 'skills' : 'primitive'}
                  index={actionIndex}
                  final={ended && !!index}
                  settled={!frame.transition}
                  moveProgress={moveProgress[recording.policy]}
                />
              )}
              {latest && actionIndex < 0 && (
                <div className="comparison-decision">
                  <small>Waiting for JEV’s first move decision</small>
                </div>
              )}
              <div
                className="comparison-metrics"
                aria-label={`${recording.policy} recorded time and cost`}
              >
                <div>
                  <small>ELAPSED</small>
                  <strong>
                    {(elapsed / 1000).toFixed(1)}
                    <span>s</span>
                  </strong>
                  <span>Full run: {(recording.durationMs / 1000).toFixed(1)}s</span>
                </div>
                <div>
                  <small>{latest ? 'API COMMITMENT' : 'SPENT SO FAR'}</small>
                  <strong>${spent.toFixed(5)}</strong>
                  <span>Full run: ${recording.result.cost.toFixed(5)}</span>
                </div>
              </div>
              <details>
                <summary>Full recording and first request</summary>
                <p>
                  {recording.result.requests} requests · {recording.result.turns} face turns · $
                  {recording.result.cost.toFixed(4)}.{' '}
                  {index
                    ? 'Solved autonomously.'
                    : 'The full attempt stopped without solving; all executed turns and requests are included.'}
                </p>
                <RequestView request={recording.firstRequest} />
              </details>
            </section>
          );
        })}
      </div>
      {latest && (
        <p className="fine-print" style={{ padding: '0 20px' }}>
          Selected after evaluation: case 30, the grouped-menu solver’s fewest-turn success (59
          turns, 128 requests). The single-turn run starts from exactly the same cube. Both have
          100-turn, 500-request and ten-minute ceilings. They were recorded at different times. The
          single-turn timeline includes an HTTP interruption and resume gap; its cost includes a
          $0.002688 uncertain reservation. This is a best-case illustration, not a representative
          performance comparison.
        </p>
      )}
      <div className="demo-transport">
        <button
          onClick={() => {
            if (ended) {
              clock.current = 0;
              setTime(0);
              setPaused(false);
            } else setPaused(playing);
            setReduced(false);
          }}
        >
          {ended ? 'Restart replay' : playing ? 'Pause' : 'Play'}
        </button>
        <span>
          {(requestTime / 1000).toFixed(1)}s / {(recordedFinish / 1000).toFixed(1)}s recorded time
        </span>
        <span aria-live="polite">
          {ended ? 'Skills wins. Both recordings stopped.' : playing ? 'Playing at 1×' : 'Paused'}
        </span>
      </div>
      <p className="fine-print">
        Both recordings share one clock at 1× their original speed, starting with the first solving
        request. Each bar follows saved request and response timestamps, including gaps between
        calls. Timing labels show recorded API latency after completion. Moves start only after
        their action was recorded; the next round’s requests can run alongside them. Cube animation
        is a display aid at 300ms per face turn, not measured hand movement.
        We let the final solve animation finish after freezing both request clocks at the solve’s
        recorded end. FAIL means the primitive policy was still unsolved at that cutoff. Costs
        accumulate as recorded responses arrive. Both counters freeze with playback; full-run totals
        also include the primitive attempt’s remaining time and requests.
      </p>
    </div>
  );
}
const examples = [
  [
    'Goal input',
    'firstLayer: true · middle: false',
    'Model choice',
    'middle-layer',
    'A completed yellow face alone is insufficient. The goal request includes edge and corner completion facts so JEV can decide whether the first layer is actually finished. All eight goals remain available.',
  ],
  [
    'Target input',
    'BR piece currently at FR',
    'Model choice',
    'target: BR',
    'A piece’s name identifies its home slot. Its current position is a separate field. JEV chooses among all the pieces for its selected goal, including pieces already solved.',
  ],
  [
    'Intention input',
    'solved: false · currentLayer: middle',
    'Model choice',
    'extract',
    'For a middle edge, this question follows target selection. The edge can be in its home slot but flipped, so the request includes a solved flag as well as its layer.',
  ],
  [
    'Reference input',
    'current position: FR · destination: BR',
    'Model choice',
    'reference: F',
    'The extraction rule asks JEV to put the occupied slot at local FR. Here the front stays F. Using the destination would select the wrong frame. This step changes notation only.',
  ],
  [
    'Operation input',
    'local position: FR · intention: extract',
    'Model choice',
    'middle-right',
    'The static skill describes an insertion that ejects the trapped edge. JEV chooses the operation. Other stages can instead produce a U setup or branch into daisy clearance questions.',
  ],
  [
    'Executor input',
    'middle-right · front: F',
    'Code result',
    'new state + solved check',
    'The selected algorithm is translated from the chosen reference into fixed-face moves. cubing.js applies it. Actual piece changes and move history become observations for the next goal request.',
  ],
];
export function LayerStory({ layer, index }: { layer: string[]; index: number }) {
  const { ref, visible } = useInView(150);
  const ex = examples[index];
  return (
    <div ref={ref} className={`layer-story ${visible ? 'is-reading' : ''}`}>
      <div className="layer-story-heading">
        <span>{layer[0]}</span>
        <div>
          <small>{index === 5 ? 'CODE EXECUTES' : 'JEV DECIDES'}</small>
          <h3>{layer[1]}</h3>
        </div>
      </div>
      <p>{ex[4]}</p>
      <div className="story-flow">
        <div>
          <small>{ex[0]}</small>
          <code>{ex[1]}</code>
        </div>
        <span className="flow-arrow" aria-hidden="true">
          →
        </span>
        <div>
          <small>{ex[2]}</small>
          <code>{ex[3]}</code>
        </div>
      </div>
      <p className="example-caption">
        Illustrative middle-edge example, not a new live model response.
      </p>
      <details>
        <summary>What this layer receives and passes forward</summary>
        <dl className="choice-list">
          <div>
            <dt>Receives</dt>
            <dd>{layer[2]}</dd>
          </div>
          <div>
            <dt>Produces</dt>
            <dd>{layer[3]}</dd>
          </div>
          <div>
            <dt>Next layer</dt>
            <dd>{layer[4]}</dd>
          </div>
        </dl>
      </details>
    </div>
  );
}
