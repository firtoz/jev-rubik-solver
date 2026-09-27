import example from '../../lib/routine-example.json';
const colors: Record<string, string> = {
  white: '#f3f3ed',
  yellow: '#f4d542',
  green: '#42a46a',
  blue: '#5689d6',
  red: '#e06962',
  orange: '#f0a04b',
};
function Diagram({ after }: { after: boolean }) {
  const net = after ? example.after : example.before;
  const selected = after ? ['DRF', 'FR'] : ['UFR', 'UF'];
  return (
    <svg
      viewBox="0 0 300 320"
      role="img"
      aria-label={
        after
          ? 'Corner and edge inserted into the front-right slot'
          : 'Target corner at UFR and edge at UF, outlined in dark blue'
      }
    >
      {(['U', 'F', 'R'] as const).map((face) => (
        <g
          key={face}
          transform={
            face === 'U'
              ? 'matrix(.9 .45 -.9 .45 150 22.5)'
              : face === 'F'
                ? 'matrix(.9 .45 0 1 15 90)'
                : 'matrix(.9 -.45 0 1 150 157.5)'
          }
        >
          {net[face].map((sticker, i) => (
            <g key={i}>
              <rect
                x={(i % 3) * 50}
                y={Math.floor(i / 3) * 50}
                width="48"
                height="48"
                rx="3"
                fill={colors[sticker.color]}
                opacity={selected.includes(sticker.position) ? 1 : 0.4}
                stroke="#151b26"
                strokeWidth="2"
              />
              {selected.includes(sticker.position) && (
                <rect
                  x={(i % 3) * 50 + 5}
                  y={Math.floor(i / 3) * 50 + 5}
                  width="38"
                  height="38"
                  rx="2"
                  fill="none"
                  stroke="#182846"
                  strokeWidth="4"
                />
              )}
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}
export function RoutineExample() {
  return (
    <figure className="routine-example">
      <div className="routine-example-pair">
        <div>
          <h4>Before: pair in the top layer</h4>
          <Diagram after={false} />
          <p>
            Corner <code>UFR</code> · edge <code>UF</code>
          </p>
        </div>
        <div className="routine-example-arrow">
          <code>{example.alg}</code>
          <svg viewBox="0 0 48 24" aria-label="Apply the routine">
            <path d="M3 12h40M35 4l8 8-8 8" />
          </svg>
        </div>
        <div>
          <h4>After: pair in its home slot</h4>
          <Diagram after />
          <p>
            Corner <code>DRF</code> · edge <code>FR</code>
          </p>
        </div>
      </div>
      <figcaption>
        Outlines follow the yellow–green–red corner and green–red edge. The other bottom-layer
        pieces return to their original positions. This is a supplied reference case, not a new JEV
        response.
      </figcaption>
    </figure>
  );
}
