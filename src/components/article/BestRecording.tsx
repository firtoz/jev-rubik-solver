import { useEffect, useRef, useState } from 'react';
import recording from '../../lib/article-best-recording.json';
import { actionSchedule, actionFrame } from '../../lib/article-replay';
import { ReplayRequest } from './ReplayRequest';
import { ReplayDecision } from './ReplayDecision';
import { Cube, type CubeMoveProgress } from '../Cube';
import { useInView } from './ScrollDemo';
import { RequestView } from './RequestView';
import { PlaybackControls } from './PlaybackControls';

const schedule = actionSchedule(recording.timeline);
const finish = schedule.at(-1)!.end;
export function BestRecording() {
  const [moveProgress, setMoveProgress] = useState<CubeMoveProgress>();
  const { ref, visible } = useInView(500);
  const [time, setTime] = useState(0),
    [paused, setPaused] = useState(false),
    [reduced, setReduced] = useState(true);
  const [speed, setSpeed] = useState(3);
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
      clock.current = Math.min(finish, clock.current + Math.max(0, now - last) * speed);
      last = now;
      setTime(clock.current);
      if (clock.current < finish) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, paused, reduced, ended, speed]);
  const frame = actionFrame(schedule, time);
  const cost = recording.costs.filter((c) => c.ms <= requestTime).reduce((n, c) => n + c.cost, 0);
  return (
    <div ref={ref} className="recorded-demo">
      <div className="demo-top">
        <span className="eyebrow">LATEST BATCH · BEST BY FACE TURNS</span>
        <span>Recorded replay · no API calls · {speed}×</span>
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
      <ReplayRequest policy="skills" time={requestTime} />
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
          <small>Waiting for the first recorded move</small>
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
          <small>ESTIMATED COST</small>
          <strong>${cost.toFixed(5)}</strong>
          <span>Total: ${recording.result.cost.toFixed(5)}</span>
        </div>
      </div>
      <PlaybackControls time={time} finish={finish} playing={visible && !paused && !reduced && !ended} speed={speed}
        onSpeed={setSpeed}
        onSeek={value => { clock.current = value; setTime(value); }}
        onRestart={() => { clock.current = 0; setTime(0); setPaused(false); setReduced(false); }}
        onToggle={() => {
          if (ended) { clock.current = 0; setTime(0); }
          setPaused(ended || reduced ? false : !paused); setReduced(false);
        }} />
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
          also includes surrounding local work. Source: <code>research/evidence/grouped-menu/</code>
          , case <code>{recording.caseId}</code>.
        </p>
        <RequestView request={recording.firstRequest as import('../../lib/types').JevRequest} />
      </details>
    </div>
  );
}
