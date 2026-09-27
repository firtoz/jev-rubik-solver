import { colors, facts, pieces } from '../lib/cube-observations';
import type { CubeData } from '../lib/types';

const palette: Record<string, string> = {
  white: '#edf0e7',
  yellow: '#e6d442',
  green: '#62ad6b',
  blue: '#638bd6',
  red: '#d76660',
  orange: '#dfa050',
};
const layouts: Record<string, string[]> = {
  U: ['UBL', 'UB', 'URB', 'UL', 'U', 'UR', 'ULF', 'UF', 'UFR'],
  D: ['DFL', 'DF', 'DRF', 'DL', 'D', 'DR', 'DLB', 'DB', 'DBR'],
  F: ['ULF', 'UF', 'UFR', 'FL', 'F', 'FR', 'DFL', 'DF', 'DRF'],
};
export function stageVisuals(state: CubeData) {
  const ps = pieces(state),
    f = facts(state);
  const definitions = [
    {
      key: 'daisy',
      label: 'Daisy',
      face: 'U',
      selected: ps.filter((p) => p.kind === 'edge' && p.position.includes('U')),
      match: (p: (typeof ps)[number]) => p.stickers.yellow === 'U',
      complete: f.daisy === 4,
      rule: 'Four yellow edge stickers face up around the white center. Corners and side-color alignment do not matter yet. This temporary pattern normally disappears when its petals move into the bottom cross.',
    },
    {
      key: 'cross',
      label: 'Yellow cross',
      face: 'D',
      selected: ps.filter((p) => p.kind === 'edge' && p.position.includes('D')),
      match: (p: (typeof ps)[number]) => p.solved,
      complete: f.cross,
      rule: 'All four bottom edges are in their home slots and oriented: yellow faces down, and each side color matches its center.',
    },
    {
      key: 'firstLayer',
      label: 'First layer',
      face: 'D',
      selected: ps.filter((p) => p.position.includes('D')),
      match: (p: (typeof ps)[number]) => p.solved,
      complete: f.firstLayer,
      rule: 'All eight bottom-layer pieces are in their home slots with every sticker correctly oriented.',
    },
    {
      key: 'middle',
      label: 'First two layers',
      face: 'F',
      selected: ps.filter((p) => !p.position.includes('U')),
      match: (p: (typeof ps)[number]) => p.solved,
      complete: f.middle,
      rule: 'All twelve lower-layer pieces are solved, including the four middle edges. The icon shows the front; the check covers every side.',
    },
    {
      key: 'topCross',
      label: 'White cross',
      face: 'U',
      selected: ps.filter((p) => p.kind === 'edge' && p.position.includes('U')),
      match: (p: (typeof ps)[number]) => p.stickers.white === 'U',
      complete: f.topCross,
      rule: 'All four top edges have white facing up. Their side colors do not have to be aligned yet.',
    },
    {
      key: 'topOriented',
      label: 'White corners',
      face: 'U',
      selected: ps.filter((p) => p.kind === 'corner' && p.position.includes('U')),
      match: (p: (typeof ps)[number]) => p.stickers.white === 'U',
      complete: f.topOriented,
      rule: 'All four top corners have white facing up. This flag checks corner orientation, not their final locations.',
    },
    {
      key: 'cornersPlaced',
      label: 'Corner locations',
      face: 'U',
      selected: ps.filter((p) => p.kind === 'corner'),
      match: (p: (typeof ps)[number]) => p.position === p.destination,
      complete: f.cornersPlaced,
      rule: 'All eight corners occupy their home slots. This flag checks locations only; orientation is a separate condition.',
    },
    {
      key: 'solved',
      label: 'Solved',
      face: 'U',
      selected: ps,
      match: (p: (typeof ps)[number]) => p.solved,
      complete: f.solved,
      rule: 'All twenty edges and corners are in their home slots and correctly oriented. The icon shows the top; the check covers the whole cube.',
    },
    {
      key: 'solvedPieces',
      label: 'Solved pieces',
      face: 'U',
      selected: ps,
      match: (p: (typeof ps)[number]) => p.solved,
      complete: f.solved,
      rule: 'Count of edges and corners in their correct home slots with correct sticker orientation.',
    },
  ];
  return definitions.map((d) => ({
    ...d,
    count: d.selected.filter(d.match).length,
    total: d.selected.length,
  }));
}

function FaceIcon({
  state,
  stage,
  goal = false,
}: {
  state: CubeData;
  stage: ReturnType<typeof stageVisuals>[number];
  goal?: boolean;
}) {
  const ps = pieces(state);
  return (
    <svg
      className="stage-face"
      viewBox="0 0 34 34"
      role="img"
      aria-label={`${goal ? 'Goal' : 'Recorded'} ${stage.face} face for ${stage.label}`}
    >
      {layouts[stage.face].map((position, i) => {
        const p = ps.find((p) => p.position === position),
          center = position.length === 1;
        const relevant = center || stage.selected.some((p) => p.position === position);
        const actualColor = center
          ? colors[stage.face]
          : Object.entries(p?.stickers ?? {}).find(([, face]) => face === stage.face)?.[0];
        const color = goal
          ? stage.key === 'daisy' && !center
            ? 'yellow'
            : colors[stage.face]
          : actualColor;
        const matches = p && stage.match(p);
        return (
          <rect
            key={position}
            x={(i % 3) * 11 + 1}
            y={Math.floor(i / 3) * 11 + 1}
            width={9}
            height={9}
            rx={1.3}
            fill={palette[color || ''] || '#44503a'}
            opacity={relevant ? 1 : 0.18}
            stroke={!goal && relevant && !center ? (matches ? '#b9f58b' : '#172010') : 'none'}
            strokeWidth={1.1}
          >
            <title>{`${position}: ${color || 'unknown'}${!goal && p && relevant ? `; ${matches ? 'matches' : 'does not match'} this stage condition` : ''}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}

export function StageFacts({
  state,
  values,
}: {
  state: CubeData;
  values: Record<string, unknown>;
}) {
  const stages = stageVisuals(state);
  return (
    <div className="stage-facts">
      {stages
        .filter((s) => s.key in values)
        .map((s) => (
          <details className={`stage-fact ${s.complete ? 'stage-complete' : ''}`} key={s.key}>
            <summary aria-label={`${s.key}: ${String(values[s.key])}; ${s.count} of ${s.total}`}>
              <FaceIcon state={state} stage={s} />
              <span>
                <b>{s.label}</b>
                <small>{s.key}</small>
              </span>
              <strong>
                {s.count}/{s.total}
                <small>{s.complete ? '✓ complete' : 'incomplete'}</small>
              </strong>
            </summary>
            <div className="stage-explanation">
              <p>{s.rule}</p>
              <p className="note">Recorded value sent to JEV: {String(values[s.key])}.</p>
              <div className="stage-example">
                <span>
                  <FaceIcon state={state} stage={s} /> Recorded {s.face} face
                </span>
                {!['cornersPlaced', 'solvedPieces'].includes(s.key) && (
                  <span>
                    <FaceIcon state={state} stage={s} goal /> Goal pattern
                  </span>
                )}
              </div>
              <p className="note">
                {s.face === 'U'
                  ? 'Top view: back at the top, front at the bottom.'
                  : s.face === 'D'
                    ? 'Bottom view: front at the top.'
                    : 'Front view: up at the top.'}{' '}
                These are facts at the request timestamp, not the interpolated animation.
              </p>
              <div className="flag-chips">
                {s.selected.map((p) => (
                  <span
                    key={p.position}
                    className={`flag-chip ${s.match(p) ? 'is-true' : 'is-false'}`}
                    title={`${p.position}: ${JSON.stringify(p.stickers)}; home ${p.destination}`}
                  >
                    {s.match(p) ? '✓' : '−'} {p.position}
                    {!s.match(p) &&
                    (s.key === 'daisy' || s.key === 'topCross' || s.key === 'topOriented')
                      ? `: ${Object.entries(p.stickers).find(([, face]) => face === 'U')?.[0]} up`
                      : !s.match(p)
                        ? ` ← ${p.piece}`
                        : ''}
                  </span>
                ))}
              </div>
            </div>
          </details>
        ))}
      {Object.entries(values)
        .filter(([key]) => !stages.some((s) => s.key === key))
        .map(([key, value]) => (
          <span className="field-chip" key={key}>
            {key}: {JSON.stringify(value)}
          </span>
        ))}
    </div>
  );
}
