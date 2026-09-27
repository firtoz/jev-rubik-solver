import { useEffect, useId, useRef, useState } from 'react';

const speeds = [0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8];
const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

export function PlaybackControls({
  time,
  finish,
  playing,
  speed,
  onToggle,
  onRestart,
  onSeek,
  onSpeed,
}: {
  time: number;
  finish: number;
  playing: boolean;
  speed: number;
  onToggle: () => void;
  onRestart: () => void;
  onSeek: (time: number) => void;
  onSpeed: (speed: number) => void;
}) {
  const [speedOpen, setSpeedOpen] = useState(false);
  const speedRoot = useRef<HTMLDivElement>(null);
  const speedButton = useRef<HTMLButtonElement>(null);
  const speedSlider = useRef<HTMLInputElement>(null);
  const speedId = useId();
  useEffect(() => {
    if (!speedOpen) return;
    speedSlider.current?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => {
      if (!speedRoot.current?.contains(event.target as Node)) setSpeedOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSpeedOpen(false);
        speedButton.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [speedOpen]);
  return (
    <div className="replay-controls" aria-label="Replay controls">
      <div className="replay-control-buttons">
        <button
          type="button"
          onClick={onToggle}
          aria-label={playing ? 'Pause replay' : 'Play replay'}
          title={playing ? 'Pause' : 'Play'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {playing ? <path d="M8 5v14M16 5v14" /> : <path d="m8 5 11 7-11 7Z" />}
          </svg>
        </button>
        <button type="button" onClick={onRestart} aria-label="Restart replay" title="Restart">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 10a8 8 0 1 1 1 7M4 4v6h6" />
          </svg>
        </button>
      </div>
      <div className="replay-seek">
        <input
          type="range"
          min={0}
          max={finish}
          step={1}
          value={time}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Replay position"
          aria-valuetext={`${formatTime(time)} of ${formatTime(finish)}`}
        />
        <span>
          {formatTime(time)} / {formatTime(finish)} <small>recorded timeline</small>
        </span>
      </div>
      <div
        className="replay-speed"
        ref={speedRoot}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setSpeedOpen(false);
        }}
      >
        <button
          className="replay-speed-trigger"
          type="button"
          ref={speedButton}
          aria-label={`Playback speed: ${speed}×`}
          title="Playback speed"
          aria-expanded={speedOpen}
          aria-controls={speedId}
          onClick={() => setSpeedOpen((open) => !open)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 17a9 9 0 1 1 16 0M12 13l4-5" />
            <circle cx="12" cy="13" r="1.5" />
          </svg>
          <span>{speed}×</span>
          <svg className="speed-chevron" viewBox="0 0 16 16" aria-hidden="true">
            <path d={speedOpen ? 'm4 6 4 4 4-4' : 'm4 10 4-4 4 4'} />
          </svg>
        </button>
        {speedOpen && (
          <div
            className="replay-speed-popover"
            id={speedId}
            role="group"
            aria-label="Playback speed settings"
          >
            <span className="speed-heading">Speed</span>
            <output className="speed-value" htmlFor={`${speedId}-slider`}>
              {speed}×
            </output>
            <div className="speed-slider-wrap">
              <input
                id={`${speedId}-slider`}
                ref={speedSlider}
                type="range"
                min="0"
                max={speeds.length - 1}
                step="1"
                value={speeds.indexOf(speed)}
                aria-label="Playback speed"
                aria-orientation="vertical"
                aria-valuetext={`${speed} times normal speed`}
                onChange={(event) => onSpeed(speeds[Number(event.target.value)])}
              />
              <div className="speed-scale" aria-hidden="true">
                <span>8×</span>
                <span>1×</span>
                <span>¼×</span>
              </div>
            </div>
            <button type="button" className="speed-reset" onClick={() => onSpeed(1)}>
              Normal · 1×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
