import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  getLab,
  getDetail,
  newRun,
  stepRun,
  setControl,
  generateScramble,
  stopAllRuns,
} from '../server/api';
import { Cube } from '../components/Cube';
import { RequestInspector } from '../components/RequestInspector';
import { PlaybackControls, useRecordedPlayback } from '../components/PlaybackControls';
import { VERSION, type Run, type Event, type Decision, type Policy } from '../lib/types';
export const Route = createFileRoute('/')({ component: Lab });
function Lab() {
  const [runs, setRuns] = useState<Run[]>([]),
    [run, setRun] = useState<Run | null>(null),
    [events, setEvents] = useState<Event[]>([]),
    [budget, setBudget] = useState<any>(null),
    [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [activity, setActivity] = useState(0);
  const [scramble, setScramble] = useState("R U R' U'"),
    [policy, setPolicy] = useState<Policy>('skills'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [speed, setSpeed] = useState(1),
    [selected, setSelectedRaw] = useState<number | null>(null),
    [tab, setTab] = useState('decisions');
  const replay = useRecordedPlayback(events, run?.id, selected, setSelectedRaw, run?.status);
  const setSelected = replay.select;
  async function refresh() {
    const d = await getLab();
    setRuns(d.runs);
    setBudget(d.budget);
    setActivity(d.activity);
    setBenchmarks(d.benchmarks);
  }
  async function select(id: string) {
    const d = await getDetail({ data: { id, after: 0 } });
    setRun(d.run);
    setEvents(d.events);
    setSelected(null);
    localStorage.setItem('rubik-run', id);
  }
  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    refresh().catch((e) => setError(String(e)));
    const id = localStorage.getItem('rubik-run');
    if (id) select(id).catch(() => localStorage.removeItem('rubik-run'));
    const timer = setInterval(() => refresh().catch(() => {}), 2000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!run) return;
    let disposed = false;
    const timer = setInterval(async () => {
      try {
        const d = await getDetail({ data: { id: run.id, after: events.at(-1)?.id || 0 } });
        if (!disposed) {
          setRun(d.run);
          if (d.events.length)
            setEvents((old) => [
              ...old,
              ...d.events.filter((e) => !old.some((x) => x.id === e.id)),
            ]);
        }
      } catch {}
    }, 1200);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, [run?.id, events.at(-1)?.id]);
  const decisions = events.filter((e) => e.kind === 'decision');
  const inspected = events.find((e) => e.id === selected);
  const latest = (
    inspected?.kind === 'decision'
      ? inspected
      : decisions.filter((e) => selected === null || e.id <= selected).at(-1)
  )?.payload as Decision | undefined;
  const actions = events.filter((e) => e.kind === 'action');
  const visibleActions = selected === null ? actions : actions.filter((e) => e.id <= selected);
  const playbackAlg = visibleActions.map((e) => e.payload.alg).join(' ');
  const finished = run && ['solved', 'stopped', 'capped', 'error'].includes(run.status);
  const evaluation = benchmarks.find(
    (b) => b.split === 'final-test' && b.version?.startsWith(VERSION + '/'),
  );
  const evaluationMetrics = evaluation?.summary?.skills;
  return (
    <main>
      <header>
        <a className="brand" href="/">
          J<span>▧</span>V <b>/</b> CUBE LAB
        </a>
        <div className="header-meta">
          <a href="/how-it-works" style={{ color: '#cbed9b', textDecoration: 'none' }}>
            How it works ↗
          </a>
          <span className="dot" /> JEV 1.13.0 <span className="pill">EXPERIMENT 001</span>
        </div>
      </header>
      <section className="intro">
        <div>
          <div className="eyebrow">DECISIONS, MADE VISIBLE</div>
          <h1>
            A little intelligence.
            <br />
            <span>A lot of possibilities.</span>
          </h1>
          <p>
            Watch JEV work through a cube. Inspect every choice, see what changes, and find out
            where intuition reaches its limits.
          </p>
        </div>
        <div className="budget">
          <small>ESTIMATED API USAGE</small>
          <strong>
            {budget ? `$${budget.usage.toFixed(4)}` : 'Not set'} <span>/ {budget ? `$${budget.cap}` : '…'}</span>
          </strong>
          <div className="meter">
            <i style={{ width: `${Math.max(1, ((budget?.reservedAndSpent || 0) / (budget?.cap || 1)) * 100)}%` }} />
          </div>
          <small>
            {!budget
              ? 'Checking connection…'
              : budget.configured
                ? `${budget.attempts.toLocaleString()} live requests · $${budget.reserved.toFixed(4)} reserved`
                : 'API key not configured'}
          </small>
          <small aria-live="polite">
            {activity
              ? `${activity} active paid run${activity === 1 ? '' : 's'}`
              : 'No active paid runs · polling and replay are free'}
          </small>
          {activity > 0 && (
            <button
              onClick={() =>
                act(async () => {
                  await stopAllRuns();
                  await refresh();
                })
              }
            >
              Stop all paid runs
            </button>
          )}
        </div>
      </section>
      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}
      <div className="workspace">
        <section className="panel stage-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">LIVE WORKSPACE</span>
              <h2>
                {selected !== null
                  ? 'Recorded state'
                  : run
                    ? run.stage.replaceAll('-', ' ')
                    : 'Your next experiment'}
              </h2>
            </div>
            <span className={`status ${run?.status === 'solved' ? 'success' : ''}`}>
              {selected !== null ? 'Replay' : run?.status || 'Ready'}
            </span>
          </div>
          <Cube
            scramble={run?.scramble || ''}
            alg={playbackAlg}
            speed={speed}
            instant={replay.recorded}
            transition={replay.transition}
          />
          <div className="cube-caption">
            <span>Drag to orbit · Yellow bottom / white top</span>
            <label>
              Move animation{' '}
              <select
                disabled={replay.recorded}
                value={speed}
                onChange={(e) => setSpeed(+e.target.value)}
              >
                <option value={0.5}>0.5×</option>
                <option value={1}>1×</option>
                <option value={2}>2×</option>
                <option value={4}>4×</option>
              </select>
            </label>
          </div>
          <PlaybackControls replay={replay} />
          <div className="metrics">
            <div>
              <strong>{run?.turns || 0}</strong>
              <small>FACE TURNS</small>
            </div>
            <div>
              <strong>{run?.requests || 0}</strong>
              <small>API REQUESTS</small>
            </div>
            <div>
              <strong>{((run?.activeMs || 0) / 1000).toFixed(1)}s</strong>
              <small>ACTIVE TIME</small>
            </div>
            <div>
              <strong>{run?.target || 'Not set'}</strong>
              <small>TARGET</small>
            </div>
          </div>
          {run?.reason && <p className="run-reason">{run.reason}</p>}
          {run?.split === 'article-manual' && (
            <p className="note">
              This is a manual teaching session.{' '}
              <a href="/how-it-works">Continue in How it works ↗</a>
            </p>
          )}
          <div className="controls">
            <button
              className="primary"
              disabled={!run || busy || !!finished || run.status === 'running'}
              onClick={() =>
                act(async () => {
                  setSelected(null);
                  setRun(await setControl({ data: { id: run!.id, action: 'start' } }));
                  replay.follow();
                })
              }
            >
              ▶ Run JEV
            </button>
            <button
              disabled={!run || busy || !!finished || run.status === 'running'}
              onClick={() =>
                act(async () => {
                  setSelected(null);
                  setRun(
                    await stepRun({
                      data: { id: run!.id, revision: run!.revision, command: crypto.randomUUID() },
                    }),
                  );
                })
              }
            >
              {busy ? 'Thinking…' : 'Step →'}
            </button>
            <button
              disabled={!run || !!finished}
              onClick={() =>
                act(async () =>
                  setRun(await setControl({ data: { id: run!.id, action: 'pause' } })),
                )
              }
            >
              Pause
            </button>
            <button
              disabled={!run || !!finished}
              onClick={() =>
                act(async () => setRun(await setControl({ data: { id: run!.id, action: 'stop' } })))
              }
            >
              Stop
            </button>
          </div>
        </section>
        <aside className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">SET UP A RUN</span>
              <h2>Give it a scramble.</h2>
            </div>
            <span className="tiny-cube">◇</span>
          </div>
          <label className="field-label">POLICY</label>
          <div className="policy">
            <button
              className={policy === 'skills' ? 'chosen' : ''}
              onClick={() => setPolicy('skills')}
            >
              Skill library<small>Targets, setups, algorithms</small>
            </button>
            <button
              className={policy === 'primitive' ? 'chosen' : ''}
              onClick={() => setPolicy('primitive')}
            >
              Primitive turns<small>18 possible face turns</small>
            </button>
          </div>
          <label className="field-label" htmlFor="scramble">
            SCRAMBLE
          </label>
          <textarea
            id="scramble"
            value={scramble}
            onChange={(e) => setScramble(e.target.value)}
            spellCheck={false}
          />
          <div className="scramble-actions">
            <button
              disabled={busy}
              onClick={() => act(async () => setScramble(await generateScramble()))}
            >
              ⤨ Random state
            </button>
            <button
              className="primary"
              disabled={busy || run?.status === 'running'}
              onClick={() =>
                act(async () => {
                  const r = await newRun({ data: { scramble, policy } });
                  await select(r.id);
                })
              }
            >
              Create run ↗
            </button>
          </div>
          <p className="note">
            JEV sees the cube’s current pieces and stickers. The scramble itself stays out of its
            requests.
          </p>
          <div className="divider" />
          <div className="eyebrow">
            {evaluation?.accepted ? 'HELD-OUT RESULT' : 'RESEARCH TARGET'}
          </div>
          <div className="target-number">
            {evaluation?.accepted ? evaluationMetrics.solved : 95}
            <span>/100</span>
          </div>
          <p className="note">
            Unseen full scrambles, solved autonomously.
            <br />
            {evaluation?.accepted
              ? `Verified on this frozen 100-case test · ${evaluation.version}.`
              : 'Acceptance requires a complete frozen evaluation.'}
          </p>
          {evaluationMetrics && (
            <p className="note" aria-live="polite">
              {evaluationMetrics.solved} solved / {evaluationMetrics.completed} completed ·{' '}
              {evaluationMetrics.assigned} assigned · {evaluation.status}
            </p>
          )}
          <div className="limits">500 requests · 1,000 turns · 10 minutes</div>
        </aside>
      </div>
      <section className="panel trace">
        <div className="panel-head">
          <div>
            <span className="eyebrow">UNDER THE HOOD</span>
            <h2>Decision trail</h2>
          </div>
          <div className="tabs">
            {['decisions', 'observation', 'inspector', 'runs', 'benchmarks'].map((t) => (
              <button className={tab === t ? 'active' : ''} key={t} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
        {tab === 'decisions' && (
          <div className="trace-grid">
            <div className="timeline">
              {!events.length && (
                <div className="empty">
                  Create a run and take the first step.
                  <br />
                  <small>Every question and action will appear here.</small>
                </div>
              )}
              {events
                .filter((e) => ['decision', 'action', 'halt', 'recovery'].includes(e.kind))
                .map((e) => (
                  <button
                    key={e.id}
                    className={selected === e.id ? 'event selected' : 'event'}
                    onClick={() => setSelected(e.id)}
                  >
                    <span className="event-id">{String(e.id).padStart(3, '0')}</span>
                    <span>
                      <b>
                        {e.kind === 'decision'
                          ? Object.keys(e.payload.response.answers)[0]
                          : e.kind}
                      </b>
                      <small>
                        {e.kind === 'decision'
                          ? Object.values(e.payload.response.answers)
                              .map((a: any) => a.choice)
                              .join(', ')
                          : e.payload.alg || e.payload.reason || e.payload.choice}
                      </small>
                    </span>
                    <span>↗</span>
                  </button>
                ))}
              {selected !== null && (
                <button className="live-link" onClick={() => setSelected(null)}>
                  Return to live state →
                </button>
              )}
            </div>
            <div className="distribution">
              {latest ? (
                Object.entries(latest.response.answers).map(([key, a]) => (
                  <div key={key}>
                    <div className="distribution-title">
                      <h3>
                        {key}: <span>{a.choice}</span>
                      </h3>
                      <b>
                        {(a.confidence * 100).toFixed(1)}%<small>PROVIDER CONFIDENCE</small>
                      </b>
                    </div>
                    {Object.entries(a.probabilities)
                      .sort((a, b) => b[1] - a[1])
                      .map(([option, p]) => (
                        <div className="prob" key={option}>
                          <span>{option}</span>
                          <div>
                            <i style={{ width: `${p * 100}%` }} />
                          </div>
                          <b>{(p * 100).toFixed(1)}%</b>
                        </div>
                      ))}
                    <p className="note">
                      {Math.round(latest.elapsedMs)} ms ·{' '}
                      {latest.response.usage.input_tokens.toLocaleString()} input tokens · $
                      {latest.cost.toFixed(6)}
                      <br />
                      Confidence describes this choice distribution, not the chance of solving the
                      cube.
                    </p>
                  </div>
                ))
              ) : (
                <div className="empty">
                  No model decisions yet.
                  <br />
                  <small>Probabilities will come directly from JEV.</small>
                </div>
              )}
            </div>
          </div>
        )}
        {tab === 'observation' && (
          <div className="observation">
            <h3>What JEV was told</h3>
            <p className="note">
              The selected decision’s actual observation. Spatial descriptions are computed facts;
              skill applicability and action choice belong to JEV.
            </p>
            {latest ? (
              <>
                <h3>{String((latest.request.state as any).goal || '')}</h3>
                {(latest.request.state as any).target && (
                  <pre>{JSON.stringify((latest.request.state as any).target, null, 2)}</pre>
                )}
                <details>
                  <summary>Complete observation</summary>
                  <pre>{JSON.stringify(latest.request.state, null, 2)}</pre>
                </details>
              </>
            ) : (
              <p className="note">Take a step to inspect its observation.</p>
            )}
          </div>
        )}
        {tab === 'inspector' && (
          <RequestInspector
            events={events}
            selected={selected}
            onSelect={setSelected}
            throughEventId={replay.recorded ? selected : null}
          />
        )}
        {tab === 'runs' && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Created</th>
                  <th>Policy</th>
                  <th>Status</th>
                  <th>Turns</th>
                  <th>Requests</th>
                  <th>Spend</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                    <td>{r.policy}</td>
                    <td>{r.status}</td>
                    <td>{r.turns}</td>
                    <td>{r.requests}</td>
                    <td>${r.cost.toFixed(5)}</td>
                    <td>
                      <button onClick={() => act(() => select(r.id))}>Replay</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === 'benchmarks' && (
          <div>
            {benchmarks.length ? (
              benchmarks.map((b) => (
                <div className="benchmark" key={b.id}>
                  <h3>{b.name || b.id}</h3>
                  <p className="note">
                    {b.split} · {b.version} · {b.status}
                  </p>
                  {b.retirementReason && <p className="note">{b.retirementReason}</p>}
                  <div className="comparison">
                    {(b.policies || ['skills', 'primitive']).map((p: string) => {
                      const rs = runs.filter((r) => r.benchmarkId === b.id && r.policy === p);
                      const measured = b.summary?.[p];
                      return (
                        <div key={p}>
                          <b>{p}</b>
                          <strong>
                            {measured?.solved ?? rs.filter((r) => r.status === 'solved').length}/
                            {b.cases?.length || 0}
                          </strong>
                          <small>
                            solved / assigned ·{' '}
                            {measured?.requests ?? rs.reduce((n, r) => n + r.requests, 0)} requests
                          </small>
                          {measured && (
                            <small>
                              {measured.completed} completed attempts ·{' '}
                              {Math.max(
                                0,
                                (measured.assigned ?? b.cases?.length ?? 0) - measured.completed,
                              )}{' '}
                              remaining
                            </small>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <pre>{JSON.stringify(b.summary || {}, null, 2)}</pre>
                </div>
              ))
            ) : (
              <div className="empty">
                No benchmark results yet. Run <code>bun run lab compare</code> to compare policies.
              </div>
            )}
          </div>
        )}
      </section>
      <footer>
        <span>JEV / CUBE LAB</span>
        <span>Code measures the cube. JEV chooses goals and moves.</span>
        <span>Local experiment · {VERSION}</span>
      </footer>
    </main>
  );
}
