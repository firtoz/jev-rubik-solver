import { useEffect, useState } from 'react';
import { RequestView } from './article/RequestView';
import type { JevRequest, JevResponse } from '../lib/types';
import { requestLink, type ReplayPolicy } from '../lib/replay-requests';
type RecordEntry = {
  round: number;
  step: number;
  startMs: number;
  endMs: number;
  elapsedMs: number | null;
  cost: number | null;
  request: JevRequest;
  response: JevResponse | null;
  error?: { status: number | null; message: string };
};
export function RequestPermalink({
  policy,
  round,
  step,
}: {
  policy: ReplayPolicy;
  round: number;
  step: number;
}) {
  const [records, setRecords] = useState<RecordEntry[]>();
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setRecords(undefined);
    setError('');
    fetch(`${import.meta.env.BASE_URL}recordings/${policy}-requests.json`, {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw Error('Could not load this recording.');
        return r.json();
      })
      .then(setRecords)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      });
    return () => controller.abort();
  }, [policy]);
  const index = records?.findIndex((row) => row.round === round && row.step === step) ?? -1;
  const record = records?.[index];
  return (
    <main className="field-guide request-permalink">
      <p className="eyebrow">
        {policy === 'skills' ? 'Grouped-menu solver' : 'Single turns'} · saved recording
      </p>
      <h1>
        Round {round} · Request {step}
      </h1>
      {!record ? (
        <p role="status">
          {error || (records ? 'No request matches this link.' : 'Loading saved request…')}
        </p>
      ) : (
        <>
          <nav className="request-record-nav" aria-label="Recorded requests">
            {index > 0 && (
              <a
                href={requestLink(policy, records![index - 1].round - 1, records![index - 1].step)}
              >
                Previous request
              </a>
            )}
            {index < records!.length - 1 && (
              <a
                href={requestLink(policy, records![index + 1].round - 1, records![index + 1].step)}
              >
                Next request
              </a>
            )}
          </nav>
          <p>
            {Object.keys(record.request.questions).join(' · ')} ·{' '}
            {record.elapsedMs === null
              ? 'Timing unavailable'
              : `${Math.round(record.elapsedMs)} ms`}{' '}
            · no API calls
          </p>
          <section>
            <h2>What we sent</h2>
            <RequestView request={record.request} />
            <details>
              <summary>Complete request JSON</summary>
              <pre>{JSON.stringify(record.request, null, 2)}</pre>
            </details>
          </section>
          <section>
            <h2>What JEV returned</h2>
            {record.error ? (
              <p>
                This transport attempt failed
                {record.error.status ? ` (HTTP ${record.error.status})` : ''}. No model decision was
                recorded.
              </p>
            ) : (
              Object.entries(record.response?.answers ?? {}).map(([name, answer]) => (
                <div className="saved-answer" key={name}>
                  <h3>
                    {name}: {answer.choice}
                  </h3>
                  <p>
                    Provider confidence:{' '}
                    {answer.confidence == null
                      ? 'not supplied'
                      : `${Math.round(answer.confidence * 100)}%`}
                  </p>
                  {Object.entries(answer.probabilities ?? {})
                    .sort(([, a], [, b]) => b - a)
                    .map(([option, p]) => (
                      <div className="article-probability" key={option}>
                        <span>{option}</span>
                        <meter min={0} max={1} value={p} />
                        <span>{Math.round(p * 100)}%</span>
                      </div>
                    ))}
                </div>
              ))
            )}
            <details>
              <summary>Complete recorded response JSON</summary>
              <pre>{JSON.stringify(record.response ?? record.error, null, 2)}</pre>
            </details>
          </section>
        </>
      )}
    </main>
  );
}
