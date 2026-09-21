import type { JevRequest } from '../../lib/types';
const label = (key: string) => key.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ');
const summary = (value: any): string =>
  value === null
    ? 'None'
    : Array.isArray(value)
      ? `${value.length} items`
      : typeof value === 'object'
        ? `${Object.keys(value).length} fields`
        : String(value);
export function FieldValue({ value }: { value: any }) {
  if (value === null || typeof value !== 'object')
    return (
      <span className={typeof value === 'boolean' ? `field-boolean ${value ? 'yes' : 'no'}` : ''}>
        {value === null
          ? 'None'
          : typeof value === 'boolean'
            ? value
              ? 'Yes'
              : 'No'
            : String(value)}
      </span>
    );
  if (Array.isArray(value))
    return value.length ? (
      <div className="field-items">
        {value.map((item, i) =>
          typeof item === 'object' && item !== null ? (
            <details key={i}>
              <summary>
                {item.piece ?? item.position ?? `Item ${i + 1}`}{' '}
                {item.position && item.piece ? `at ${item.position}` : ''}
                <span>{item.destination ? `Home: ${item.destination}` : summary(item)}</span>
              </summary>
              <FieldValue value={item} />
            </details>
          ) : (
            <span className="field-item" key={i}>
              <FieldValue value={item} />
            </span>
          ),
        )}
      </div>
    ) : (
      <span>No items</span>
    );
  return (
    <dl className="field-list">
      {Object.entries(value).map(([key, child]) => (
        <div key={key}>
          <dt>
            {label(key)}
            <code>{key}</code>
          </dt>
          <dd>
            {child !== null && typeof child === 'object' ? (
              <details>
                <summary>Explore {summary(child)}</summary>
                <FieldValue value={child} />
              </details>
            ) : (
              <FieldValue value={child} />
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
export function RequestView({ request }: { request: JevRequest }) {
  const entries = Object.entries(request.questions);
  return (
    <div className="request-view">
      <div className="request-heading">
        <div>
          <small>REQUEST BODY</small>
          <h4>
            {entries.length === 1 ? label(entries[0][0]) : `${entries.length} related questions`}
          </h4>
        </div>
        <code>{request.model}</code>
      </div>
      <details className="request-section">
        <summary>
          <b>01</b>
          <span>
            Observations<small>The facts this request receives</small>
          </span>
        </summary>
        <FieldValue value={request.state} />
      </details>
      <details className="request-section" open>
        <summary>
          <b>02</b>
          <span>
            Questions and choices<small>Instructions and every available answer</small>
          </span>
        </summary>
        {entries.map(([name, q]) => (
          <div className="question-block" key={name}>
            <h4>
              {label(name)} <code>{name}</code>
            </h4>
            <div className="question-instructions">
              <small>INSTRUCTIONS</small>
              <FieldValue value={q.instructions} />
            </div>
            <details>
              <summary>{Object.keys(q.criteria).length} available choices</summary>
              <dl className="choice-list">
                {Object.entries(q.criteria).map(([key, text]) => (
                  <div key={key}>
                    <dt>
                      <code>{key}</code>
                    </dt>
                    <dd>{text}</dd>
                  </div>
                ))}
              </dl>
            </details>
            <p className="field-type">Answer format: {q.type}</p>
          </div>
        ))}
      </details>
      <details className="request-section">
        <summary>
          <b>03</b>
          <span>
            Complete JSON<small>All input fields, unchanged</small>
          </span>
        </summary>
        <pre>{JSON.stringify(request, null, 2)}</pre>
      </details>
    </div>
  );
}
export function ExchangeList({ answers }: { answers: any[] }) {
  return (
    <div className="exchange-list">
      {answers.map((a, i) => (
        <details key={i} className="exchange-entry">
          <summary>
            <span className="exchange-index">{String(i + 1).padStart(2, '0')}</span>
            <span>
              {Object.entries(a.response.answers)
                .map(([q, r]: any) => `${label(q)} → ${r.choice}`)
                .join(' · ')}
              <small>{Math.round(a.elapsedMs)} ms · recorded exchange</small>
            </span>
          </summary>
          <div className="exchange-content">
            <h4>JEV’s answer</h4>
            {Object.entries(a.response.answers).map(([q, r]: any) => (
              <div className="answer-result" key={q}>
                <div>
                  <strong>{r.choice}</strong>
                  <span>
                    {label(q)} · provider confidence {r.confidence}
                  </span>
                </div>
                <details>
                  <summary>Option probabilities</summary>
                  {Object.entries(r.probabilities).map(([name, p]: any) => (
                    <div className="article-probability" key={name}>
                      <span>{name}</span>
                      <meter min={0} max={1} value={p} aria-label={name + ' probability'} />
                      <span>{(p * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </details>
              </div>
            ))}
            <p className="fine-print">
              Provider confidence describes this answer. Solve success is measured separately.
            </p>
            <RequestView request={a.request} />
            <details>
              <summary>Full native response</summary>
              <FieldValue value={a.nativeResponse} />
              <pre>{JSON.stringify(a.nativeResponse, null, 2)}</pre>
            </details>
          </div>
        </details>
      ))}
    </div>
  );
}
