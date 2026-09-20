import type { Event, CubeData } from '../lib/types';
import { StageFacts } from './StageFacts';

const stickerColors: Record<string, string> = {
  white: '#f1f3ea',
  yellow: '#e6d442',
  green: '#72ba74',
  blue: '#709bea',
  red: '#ea7972',
  orange: '#eba554',
};
const scalar = (value: unknown) => value === null || typeof value !== 'object';
function Value({ value }: { value: unknown }) {
  const text = value === '' ? '""' : String(value);
  const color = typeof value === 'string' ? stickerColors[value] : undefined;
  return (
    <span className="json-value">
      {color && <i className="sticker-dot" style={{ background: color }} />}
      {text}
    </span>
  );
}

/** Compact presentation of every recorded field; no inferred model reasoning. */
export function DataTree({
  value,
  depth = 0,
  cubeState,
}: {
  value: unknown;
  depth?: number;
  cubeState?: CubeData;
}) {
  if (scalar(value)) return <Value value={value} />;
  if (Array.isArray(value)) {
    if (!value.length) return <span className="json-literal">[]</span>;
    if (value.every(scalar))
      return (
        <div className="value-chips">
          {value.map((item, i) => (
            <span className="value-chip" key={i}>
              <Value value={item} />
            </span>
          ))}
        </div>
      );
    return (
      <div className="record-grid">
        {value.map((item, i) => (
          <article className="record-card" key={i}>
            <span className="record-number">{i + 1}</span>
            <DataTree value={item} depth={depth + 1} cubeState={cubeState} />
          </article>
        ))}
      </div>
    );
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (!entries.length) return <span className="json-literal">{'{}'}</span>;
  const flags = entries.filter(([, v]) => typeof v === 'boolean');
  const short = entries.filter(
    ([, v]) => scalar(v) && typeof v !== 'boolean' && String(v).length <= 65,
  );
  const text = entries.filter(
    ([, v]) => scalar(v) && typeof v !== 'boolean' && String(v).length > 65,
  );
  const nested = entries.filter(([, v]) => !scalar(v));
  return (
    <div className="data-view">
      {!!flags.length && (
        <div className="flag-chips">
          {flags.map(([key, enabled]) => (
            <span
              key={key}
              className={`flag-chip ${enabled ? 'is-true' : 'is-false'}`}
              title={`${key}: ${enabled}`}
              aria-label={`${key}: ${enabled}`}
            >
              <span aria-hidden="true">{enabled ? '✓' : '−'}</span> {key}
            </span>
          ))}
        </div>
      )}
      {!!short.length && (
        <div className="field-chips">
          {short.map(([key, child]) => (
            <div className="field-chip" key={key}>
              <span className="field-key">
                {stickerColors[key] && (
                  <i className="sticker-dot" style={{ background: stickerColors[key] }} />
                )}
                {key}
              </span>
              <Value value={child} />
            </div>
          ))}
        </div>
      )}
      {text.map(([key, child]) => (
        <div className="text-field" key={key}>
          <span className="field-key">{key}</span>
          <Value value={child} />
        </div>
      ))}
      {nested.map(([key, child]) => {
        if (key === 'completed' && cubeState)
          return (
            <div className="nested-field" key={key}>
              <div className="field-key nested-label">{key} · click a stage to see why</div>
              <StageFacts state={cubeState} values={child as Record<string, unknown>} />
            </div>
          );
        const complex = depth >= 2 && Object.values(child as object).some((v) => !scalar(v));
        return (
          <div className="nested-field" key={key}>
            {complex ? (
              <details>
                <summary>
                  {key} <span className="field-count">{Object.keys(child as object).length}</span>
                </summary>
                <DataTree value={child} depth={depth + 1} cubeState={cubeState} />
              </details>
            ) : (
              <>
                <div className="field-key nested-label">{key}</div>
                <DataTree value={child} depth={depth + 1} cubeState={cubeState} />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Rest({ value, except }: { value: Record<string, unknown>; except: string[] }) {
  const rest = Object.fromEntries(Object.entries(value).filter(([k]) => !except.includes(k)));
  return Object.keys(rest).length ? <DataTree value={rest} /> : null;
}

export function RequestInspector({
  events,
  selected,
  onSelect,
  throughEventId = null,
}: {
  events: Event[];
  selected: number | null;
  onSelect: (id: number) => void;
  throughEventId?: number | null;
}) {
  const exchanges = events
    .filter((e) => e.kind === 'request')
    .map((request) => {
      const related = events.filter((e) => e.payload.id === request.payload.id);
      const decision = related.find((e) => e.kind === 'decision');
      return {
        request,
        decision,
        failure: related.find((e) => ['request-error', 'invalid-response'].includes(e.kind)),
        id: decision?.id ?? request.id,
      };
    });
  const selectedEvent = events.find((e) => e.id === selected);
  const exchange =
    exchanges.find((e) => e.id === selected || e.request.id === selected) ??
    exchanges.filter((e) => selected === null || e.request.id <= selected).at(-1);
  if (!exchange)
    return (
      <div className="empty">No recorded JEV requests yet. Select a saved run or take a step.</div>
    );
  const { request } = exchange;
  const decision =
    exchange.decision && (throughEventId === null || exchange.decision.id <= throughEventId)
      ? exchange.decision
      : undefined;
  const failure =
    exchange.failure && (throughEventId === null || exchange.failure.id <= throughEventId)
      ? exchange.failure
      : undefined;
  const body = request.payload.request;
  const cubeState =
    events.filter((e) => e.kind === 'action' && e.id < request.id).at(-1)?.payload.after ??
    events.find((e) => e.kind === 'created')?.payload.state;
  const fullNative = decision?.payload.nativeResponse !== undefined;
  const response =
    decision?.payload.nativeResponse ?? decision?.payload.response ?? failure?.payload.raw;
  const hasResponse =
    !!decision || (failure && Object.prototype.hasOwnProperty.call(failure.payload, 'raw'));
  const structuredResponse =
    response !== null && typeof response === 'object' && !Array.isArray(response);
  const answers = response?.answers;
  return (
    <div className="request-inspector">
      <div className="exchange-picker">
        <label htmlFor="jev-exchange">Recorded JEV request</label>
        <select
          id="jev-exchange"
          value={exchange.id}
          onChange={(e) => onSelect(Number(e.target.value))}
        >
          {exchanges.map((e, i) => (
            <option key={e.request.id} value={e.id}>
              {i + 1}. {Object.keys(e.request.payload.request.questions).join(', ')} ·{' '}
              {e.decision ? 'response received' : e.failure ? 'failed' : 'pending'}
            </option>
          ))}
        </select>
        <p className="note">
          {new Date(request.createdAt).toLocaleString()} · Attempt {request.payload.attempt + 1}.
          Browsing recorded requests makes no API calls.
        </p>
      </div>
      <div className="exchange-columns">
        <section className="exchange-panel">
          <div className="eyebrow">SENT TO JEV</div>
          <h3>Complete request body</h3>
          <p className="note">POST /v1/systemone · Inputs and parameters only.</p>
          <Rest value={body} except={['state', 'questions']} />
          <details open className="exchange-section">
            <summary>State / context</summary>
            <DataTree value={body.state} cubeState={cubeState} />
          </details>
          <h4>Questions · {Object.keys(body.questions).length}</h4>
          {Object.entries(body.questions).map(([id, question]) => (
            <article className="question-card" key={id}>
              <h4>{id}</h4>
              <DataTree value={question} />
            </article>
          ))}
          <details className="raw-json">
            <summary>Raw request JSON</summary>
            <pre>{JSON.stringify(body, null, 2)}</pre>
          </details>
        </section>
        <section className="exchange-panel">
          <div className="eyebrow">RECEIVED FROM JEV</div>
          <h3>{fullNative ? 'Complete response body' : 'Recorded response'}</h3>
          {decision && !fullNative && (
            <p className="note">
              Historical capture: validated response fields were saved. Any additional provider
              fields were not retained in this older recording.
            </p>
          )}
          {hasResponse ? (
            structuredResponse ? (
              <>
                <Rest value={response} except={['answers', 'usage']} />
                {answers &&
                  Object.entries(answers).map(([id, answer]) => {
                    const a = answer as Record<string, any>;
                    return (
                      <article className="question-card" key={id}>
                        <h4>{id}</h4>
                        <Rest value={a} except={['probabilities', 'confidence']} />
                        {a.confidence !== undefined && (
                          <p className="provider-stat">
                            Provider confidence <strong>{String(a.confidence)}</strong>
                          </p>
                        )}
                        {a.probabilities && (
                          <>
                            <h5>Option probabilities</h5>
                            {Object.entries(a.probabilities).map(([option, probability]) => (
                              <div className="prob" key={option}>
                                <span>
                                  {option}
                                  {option === a.choice ? ' ✓' : ''}
                                </span>
                                <div>
                                  <i style={{ width: `${Number(probability) * 100}%` }} />
                                </div>
                                <b title={`${Number(probability) * 100}%`}>{String(probability)}</b>
                              </div>
                            ))}
                          </>
                        )}
                        <p className="note">
                          Confidence is the provider’s reported statistic, not a measured chance of
                          solving the cube.
                        </p>
                      </article>
                    );
                  })}
                {response.usage !== undefined && (
                  <div className="exchange-section">
                    <h4>Token usage</h4>
                    <DataTree value={response.usage} />
                  </div>
                )}
                <details className="raw-json">
                  <summary>Raw response JSON</summary>
                  <pre>{JSON.stringify(response, null, 2)}</pre>
                </details>
              </>
            ) : (
              <DataTree value={response} />
            )
          ) : (
            <p className="note">
              {failure
                ? 'No response body was retained for this request.'
                : 'Waiting for the response.'}
            </p>
          )}
          {failure && (
            <div className="exchange-section">
              <h4>Recorded failure</h4>
              <DataTree value={failure.payload} />
            </div>
          )}
          {decision && (
            <div className="exchange-section">
              <h4>Local measurements</h4>
              <p className="note">
                {Math.round(decision.payload.elapsedMs)} ms request round trip · $
                {decision.payload.cost.toFixed(6)} estimated spend. These measurements are added by
                the lab; network time and provider processing are not measured separately.
              </p>
            </div>
          )}
        </section>
      </div>
      {selectedEvent && !['request', 'decision'].includes(selectedEvent.kind) && (
        <details className="exchange-section">
          <summary>Selected {selectedEvent.kind} event</summary>
          <DataTree value={selectedEvent.payload} />
        </details>
      )}
    </div>
  );
}
