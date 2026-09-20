import { useEffect, useMemo, useRef, useState } from 'react';
import type { Event, Status } from '../lib/types';
import { recordedTimeline, frameAt, frameLabel, transitionAt } from '../lib/replay';

export function useRecordedPlayback(
  events: Event[],
  runId: string | undefined,
  selected: number | null,
  onSelect: (id: number | null) => void,
  runStatus?: Status,
) {
  const timeline = useMemo(() => recordedTimeline(events), [events]);
  const [recorded, setRecorded] = useState(false),
    [playing, setPlaying] = useState(false);
  const [delayed, setDelayed] = useState(false);
  const [elapsed, setElapsed] = useState(0),
    [rate, setRate] = useState(1);
  const position = useRef(0);
  const duration = timeline.at(-1)?.ms ?? 0;
  const actions = timeline.filter((f) => f.event.kind === 'action');
  const terminal = !!runStatus && ['solved', 'stopped', 'capped', 'error'].includes(runStatus);
  const availableEnd = delayed && !terminal ? (actions.at(-1)?.ms ?? 0) : duration;
  useEffect(() => {
    const followLive = runStatus === 'running';
    const start = followLive ? (actions.at(-2)?.ms ?? 0) : 0;
    setRecorded(followLive);
    setDelayed(followLive);
    setPlaying(false);
    setElapsed(start);
    position.current = start;
    onSelect(followLive ? (frameAt(timeline, start)?.event.id ?? 0) : null);
  }, [runId]);
  useEffect(() => {
    if (delayed && availableEnd > position.current) setPlaying(true);
  }, [delayed, availableEnd]);
  useEffect(() => {
    if (!playing) return;
    let handle = 0;
    const origin = performance.now(),
      start = position.current;
    const tick = () => {
      const ms = Math.min(
        availableEnd,
        start + (performance.now() - origin) * (delayed ? 1 : rate),
      );
      position.current = ms;
      setElapsed(ms);
      onSelect(frameAt(timeline, ms)?.event.id ?? 0);
      if (ms >= availableEnd) setPlaying(false);
      else handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [playing, rate, availableEnd, delayed, timeline, onSelect]);
  const select = (id: number | null) => {
    setDelayed(false);
    setPlaying(false);
    setRecorded(id !== null);
    onSelect(id);
    const ms = timeline.find((f) => f.event.id === id)?.ms ?? 0;
    position.current = ms;
    setElapsed(ms);
  };
  const seek = (ms: number) => {
    setDelayed(false);
    setPlaying(false);
    setRecorded(true);
    position.current = ms;
    setElapsed(ms);
    onSelect(frameAt(timeline, ms)?.event.id ?? 0);
  };
  const play = () => {
    setDelayed(false);
    if (!recorded || position.current >= duration) {
      position.current = 0;
      setElapsed(0);
      onSelect(0);
    }
    setRecorded(true);
    setPlaying(true);
  };
  const follow = () => {
    const start = actions.at(-2)?.ms ?? 0;
    position.current = start;
    setElapsed(start);
    onSelect(frameAt(timeline, start)?.event.id ?? 0);
    setRecorded(true);
    setDelayed(true);
    setPlaying(availableEnd > start);
  };
  const index = timeline.findIndex((f) => f.event.id === selected);
  const step = (direction: number) => {
    const next =
      direction > 0
        ? selected === null
          ? 0
          : index + 1
        : selected === null
          ? timeline.length - 1
          : index - 1;
    if (next < 0) seek(0);
    else if (next < timeline.length) select(timeline[next].event.id);
  };
  return {
    recorded,
    playing,
    delayed,
    caughtUp: delayed && terminal && elapsed >= duration,
    buffering: delayed && !playing && !terminal,
    canFollow: !!runId && !terminal,
    follow,
    elapsed,
    duration: delayed ? availableEnd : duration,
    rate,
    setRate,
    select,
    seek,
    play,
    pause: () => {
      setPlaying(false);
      setDelayed(false);
    },
    step,
    index,
    timeline,
    transition: recorded ? transitionAt(timeline, elapsed) : undefined,
    label: recorded
      ? frameLabel(timeline.find((f) => f.event.id === selected)?.event)
      : 'Live / latest state',
  };
}

export function PlaybackControls({ replay }: { replay: ReturnType<typeof useRecordedPlayback> }) {
  const r = replay;
  return (
    <div className="recorded-playback">
      <div className="playback-heading">
        <b>
          {r.caughtUp
            ? 'Completed · recorded timing'
            : r.delayed
              ? 'Live · one completed round behind'
              : 'Recorded timing'}
        </b>
        <span>
          {(r.elapsed / 1000).toFixed(2)} / {(r.duration / 1000).toFixed(2)} s
        </span>
      </div>
      <div className="playback-buttons">
        <button disabled={!r.canFollow || r.delayed} onClick={r.follow}>
          Follow live · 1 round delayed
        </button>
        <button
          disabled={!r.timeline.length || (r.recorded && r.index < 0)}
          onClick={() => r.step(-1)}
          aria-label="Previous recorded event"
        >
          ← Back
        </button>
        <button disabled={!r.timeline.length} onClick={r.playing ? r.pause : r.play}>
          {r.playing ? 'Pause replay' : '▶ Replay timing'}
        </button>
        <button
          disabled={!r.timeline.length || (r.recorded && r.index >= r.timeline.length - 1)}
          onClick={() => r.step(1)}
          aria-label="Next recorded event"
        >
          Next →
        </button>
        <label>
          Replay speed{' '}
          <select
            disabled={r.delayed}
            value={r.delayed ? 1 : r.rate}
            onChange={(e) => r.setRate(Number(e.target.value))}
          >
            <option value={1}>1× real time</option>
            <option value={2}>2×</option>
            <option value={4}>4×</option>
            <option value={10}>10×</option>
          </select>
        </label>
        {r.recorded && <button onClick={() => r.select(null)}>Live / latest</button>}
      </div>
      <input
        aria-label="Recorded elapsed time"
        type="range"
        min={0}
        max={Math.max(1, r.duration)}
        step={1}
        value={r.elapsed}
        disabled={!r.timeline.length}
        onChange={(e) => r.seek(Number(e.target.value))}
      />
      <p className="playback-event">{r.label}</p>
      {r.buffering && (
        <p className="note" role="status">
          Waiting for the next completed round to animate…
        </p>
      )}
      <p className="note">
        At 1×, each animation spans the recorded time between cube states and reaches the next state
        at its original timestamp. Requests and responses keep their original timing. Intermediate
        motion is interpolated for replay. Replay is free. Live follow buffers completed rounds,
        animates each over its measured duration, and waits if the next round is not ready.
      </p>
    </div>
  );
}
