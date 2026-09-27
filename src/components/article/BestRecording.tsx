import { useEffect, useRef, useState } from 'react';
import recording from '../../lib/article-best-recording.json';
import { actionSchedule, actionFrame } from '../../lib/article-replay';
import { ReplayRequest } from './ReplayRequest';
import { ReplayDecision } from './ReplayDecision';
import { Cube, type CubeMoveProgress } from '../Cube';
import { useInView } from './ScrollDemo';
import { RequestView } from './RequestView';

const schedule = actionSchedule(recording.timeline);
const finish = schedule.at(-1)!.end;
export function BestRecording() {
  const [moveProgress, setMoveProgress] = useState<CubeMoveProgress>();
  const { ref, visible } = useInView(500);
  const [time, setTime] = useState(0),
    [paused, setPaused] = useState(false),
    [reduced, setReduced] = useState(true);
  const clock = useRef(0);
  useEffect(() => {
    const q = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(q.matches);
    update();
    q.addEventListener('change', update);
    return () => q.removeEventListener('change', update);
  }, []);
  const ended = time >= finish;
  const requestTime = Math.min(time, recording.durationMs);
  useEffect(() => {
    if (!visible || paused || reduced || ended) return;
    let frame = 0,
      last = performance.now();
    const tick = (now: number) => {
      clock.current = Math.min(finish, clock.current + Math.max(0, now - last));
      last = now;
      setTime(clock.current);
      if (clock.current < finish) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, paused, reduced, ended]);
  const frame = actionFrame(schedule, time);
  const cost = recording.costs.filter((c) => c.ms <= requestTime).reduce((n, c) => n + c.cost, 0);
  return (
    <div ref={ref} className="recorded-demo">
      <div className="demo-top">
        <span className="eyebrow">LATEST BATCH · BEST BY FACE TURNS</span>
        <span>Recorded replay · no API calls · 1×</span>
      </div>
      <div className="comparison-stage">
        <Cube
          scramble={recording.scramble}
          alg={frame.alg}
          speed={1}
          instant
          onMoveProgress={(progress) =>
            setMoveProgress((old) =>
              old?.key === progress.key &&
              old.active === progress.active &&
              old.done === progress.done
                ? old
                : progress,
            )
          }
          transition={frame.transition}
        />
        {ended && <div className="result-stamp win">SOLVED</div>}
      </div>
      <ReplayRequest
        policy="skills"
        time={requestTime}
      />
      {frame.index >= 0 ? (
        <ReplayDecision
          policy="skills"
          index={frame.index}
          final={ended}
          settled={!frame.transition}
          moveProgress={moveProgress}
        />
      ) : (
        <div className="comparison-decision">
          <small>Waiting for JEV’s first move decision</small>
        </div>
      )}
      <div className="comparison-metrics">
        <div>
          <small>RECORDED TIME</small>
          <strong>
            {(requestTime / 1000).toFixed(1)}
            <span>s</span>
          </strong>
          <span>Full attempt: {(recording.attemptElapsedMs / 1000).toFixed(1)}s</span>
        </div>
        <div>
          <small>API COST SO FAR</small>
          <strong>${cost.toFixed(5)}</strong>
          <span>Total: ${recording.result.cost.toFixed(5)}</span>
        </div>
      </div>
      <div className="demo-transport">
        <button
          onClick={() => {
            if (ended) {
              clock.current = 0;
              setTime(0);
            }
            setReduced(false);
            setPaused(ended || reduced ? false : !paused);
          }}
        >
          {ended ? 'Restart replay' : paused || reduced ? 'Play' : 'Pause'}
        </button>
        <span>
          {frame.completed} / {recording.timeline.length} actions · {recording.result.turns} total
          face turns
        </span>
      </div>
      <p className="fine-print" style={{ padding: '0 20px' }}>
        Case 30 of 100: the fewest-turn success, selected after evaluation. The full batch solved
        98/100 with a median of 79 turns. This example took 59 turns and 128 requests; it is not the
        fastest solve or a typical result. Each action may execute several turns.
      </p>
      <details>
        <summary>Recording source and first request</summary>
        <p>
          {recording.selection} Timings come from saved request, response and action events.
          Playback starts at the first request and ends at the final action; the full-attempt time
          also includes surrounding local work. Source:{' '}
          <code>experiments/budget-round-v1/final-evaluation</code>, case{' '}
          <code>{recording.caseId}</code>.
        </p>
        <RequestView request={recording.firstRequest as import('../../lib/types').JevRequest} />
      </details>
    </div>
  );
}
