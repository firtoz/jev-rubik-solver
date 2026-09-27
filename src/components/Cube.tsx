import { useEffect, useRef, useState } from 'react';
import type { TwistyPlayer, ExperimentalMillisecondTimestamp } from 'cubing/twisty';
import type { RecordedTransition } from '../lib/replay';
export type CubeMoveProgress = { key: number; active: number; done: number };
export function Cube({
  scramble,
  alg,
  speed,
  instant = false,
  hideControls = false,
  transition,
  onMoveProgress,
}: {
  scramble: string;
  alg: string;
  speed: number;
  instant?: boolean;
  hideControls?: boolean;
  transition?: RecordedTransition;
  onMoveProgress?: (progress: CubeMoveProgress) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    player = useRef<TwistyPlayer | null>(null),
    previous = useRef('');
  const latest = useRef({ alg, speed, instant, transition });
  latest.current = { alg, speed, instant, transition };
  const moveCallback = useRef(onMoveProgress);
  moveCallback.current = onMoveProgress;
  const timedRange = useRef<{
    key: number;
    end: number;
    moves: { start: number; end: number }[];
  } | null>(null);
  const reportMoves = (range: NonNullable<typeof timedRange.current>, progress: number) => {
    const timestamp = range.end * progress;
    moveCallback.current?.({
      key: range.key,
      done: range.moves.filter((move) => move.end <= timestamp).length,
      active:
        progress >= 1
          ? -1
          : range.moves.findIndex((move) => move.start <= timestamp && timestamp < move.end),
    });
  };
  const [generation, setGeneration] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => {
    let disposed = false;
    import('cubing/twisty')
      .then(({ TwistyPlayer }) => {
        if (disposed) return;
        const p = new TwistyPlayer({
          puzzle: '3x3x3',
          experimentalSetupAlg: scramble,
          alg: latest.current.alg,
          background: 'none',
          controlPanel: latest.current.instant || hideControls ? 'none' : 'bottom-row',
          backView: 'top-right',
          hintFacelets: 'none',
          tempoScale: latest.current.speed,
        });
        p.style.width = '100%';
        p.style.height = '100%';
        host.current?.replaceChildren(p);
        player.current = p;
        previous.current = latest.current.alg;
        p.jumpToEnd();
        setGeneration((n) => n + 1);
      })
      .catch(() =>
        setError(
          '3D preview could not load. The recorded cube state is available in the inspector.',
        ),
      );
    return () => {
      disposed = true;
      player.current?.remove();
      player.current = null;
    };
  }, [scramble]);
  useEffect(() => {
    const p = player.current;
    timedRange.current = null;
    if (!p || !transition) return;
    let cancelled = false;
    p.pause();
    p.experimentalSetupAlg = [scramble, transition.beforeAlg].filter(Boolean).join(' ');
    p.alg = transition.alg;
    p.timestamp = 0 as ExperimentalMillisecondTimestamp;
    void Promise.all([p.experimentalModel.timeRange.get(), p.experimentalModel.indexer.get()]).then(
      ([range, indexer]) => {
        if (cancelled || player.current !== p || latest.current.transition?.key !== transition.key)
          return;
        timedRange.current = {
          key: transition.key,
          end: range.end,
          moves: Array.from({ length: indexer.numAnimatedLeaves() }, (_, i) => {
            const index = i as Parameters<typeof indexer.indexToMoveStartTimestamp>[0];
            const start = indexer.indexToMoveStartTimestamp(index);
            return { start, end: start + indexer.moveDuration(index) };
          }),
        };
        reportMoves(timedRange.current, latest.current.transition.progress);
        p.timestamp = (range.end *
          latest.current.transition.progress) as ExperimentalMillisecondTimestamp;
      },
    );
    return () => {
      cancelled = true;
    };
  }, [transition?.key, scramble, generation]);
  useEffect(() => {
    const range = timedRange.current;
    if (player.current && transition && range?.key === transition.key) {
      reportMoves(range, transition.progress);
      player.current.timestamp = (range.end *
        transition.progress) as ExperimentalMillisecondTimestamp;
    }
  }, [transition?.progress, transition?.key, generation]);
  useEffect(() => {
    const p = player.current;
    if (!p || transition) return;
    let cancelled = false;
    const before = previous.current;
    previous.current = alg;
    void (async () => {
      const range = await p.experimentalModel.timeRange.get();
      if (cancelled || player.current !== p) return;
      p.pause();
      p.experimentalSetupAlg = scramble;
      p.alg = alg;
      if (!instant && alg.startsWith(before) && alg !== before) {
        p.timestamp = range.end;
        p.play();
      } else p.jumpToEnd();
    })();
    return () => {
      cancelled = true;
    };
  }, [alg, instant, transition?.key, generation, scramble]);
  useEffect(() => {
    if (player.current)
      player.current.controlPanel = instant || hideControls ? 'none' : 'bottom-row';
  }, [instant, hideControls]);
  useEffect(() => {
    if (player.current) player.current.tempoScale = speed;
  }, [speed]);
  return (
    <div className="cube" ref={host}>
      {error || <span className="loading">Loading cube…</span>}
    </div>
  );
}
