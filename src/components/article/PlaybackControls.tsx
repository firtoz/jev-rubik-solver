const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

export function PlaybackControls({ time, finish, playing, speed, onToggle, onRestart, onSeek, onSpeed }: {
  time: number; finish: number; playing: boolean; speed: number;
  onToggle: () => void; onRestart: () => void;
  onSeek: (time: number) => void; onSpeed: (speed: number) => void;
}) {
  return <div className="replay-controls" aria-label="Replay controls">
    <div className="replay-control-buttons">
      <button type="button" onClick={onToggle} aria-label={playing ? 'Pause replay' : 'Play replay'} title={playing ? 'Pause' : 'Play'}>
        <svg viewBox="0 0 24 24" aria-hidden="true">{playing ? <path d="M8 5v14M16 5v14" /> : <path d="m8 5 11 7-11 7Z" />}</svg>
      </button>
      <button type="button" onClick={onRestart} aria-label="Restart replay" title="Restart">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6" /></svg>
      </button>
    </div>
    <div className="replay-seek">
      <input type="range" min={0} max={finish} step={1} value={time} onChange={e => onSeek(Number(e.target.value))} aria-label="Replay position" aria-valuetext={`${formatTime(time)} of ${formatTime(finish)}`} />
      <span>{formatTime(time)} / {formatTime(finish)} <small>recorded timeline</small></span>
    </div>
    <label className="replay-speed">Speed
      <select value={speed} onChange={e => onSpeed(Number(e.target.value))} aria-label="Playback speed">
        {[0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8].map(value => <option key={value} value={value}>{value}×</option>)}
      </select>
    </label>
  </div>;
}
