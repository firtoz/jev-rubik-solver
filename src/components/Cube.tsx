import { useEffect, useRef, useState } from 'react';
import type { TwistyPlayer, ExperimentalMillisecondTimestamp } from 'cubing/twisty';
import type { RecordedTransition } from '../lib/replay';
export function Cube({
  scramble,
  alg,
  speed,
  instant = false,
  hideControls = false,
  transition,
}: {
  scramble: string;
  alg: string;
  speed: number;
  instant?: boolean;
  hideControls?: boolean;
  transition?: RecordedTransition;
}) {
  const host = useRef<HTMLDivElement>(null),
    player = useRef<TwistyPlayer | null>(null),
    previous = useRef('');
  const latest = useRef({ alg, speed, instant, transition });
  latest.current = { alg, speed, instant, transition };
  const timedRange = useRef<{ key: number; end: number } | null>(null);
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
    void p.experimentalModel.timeRange.get().then((range) => {
      if (cancelled || player.current !== p || latest.current.transition?.key !== transition.key)
        return;
      timedRange.current = { key: transition.key, end: range.end };
      p.timestamp = (range.end *
        latest.current.transition.progress) as ExperimentalMillisecondTimestamp;
    });
    return () => {
      cancelled = true;
    };
  }, [transition?.key, scramble, generation]);
  useEffect(() => {
    const range = timedRange.current;
    if (player.current && transition && range?.key === transition.key)
      player.current.timestamp = (range.end *
        transition.progress) as ExperimentalMillisecondTimestamp;
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
