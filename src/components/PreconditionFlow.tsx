import { useState } from 'react';
import defaults from '../lib/action-preconditions.json';
const json = (v: unknown) => <pre>{JSON.stringify(v, null, 2)}</pre>;
export function PreconditionFlow({
  recordings = defaults,
  executed = false,
}: {
  recordings?: { source: string; phases: any[] };
  executed?: boolean;
}) {
  const [pi, setPhase] = useState(0),
    [ri, setRow] = useState(0);
  const phases = recordings.phases as any[],
    phase = phases[pi],
    row = phase?.rows[ri];
  if (!row) return <p>No recordings.</p>;
  return (
    <>
      <p>
        {executed
          ? 'Recorded action cycles. JEV chose the goal, target, frame, routine and setup. Moves were executed and scored offline.'
          : 'Isolated alignment and landing checks. Earlier target, frame and routine are supplied for this test.'}{' '}
        No API calls on this page.
      </p>
      <div className="board-controls">
        <label>
          Round{' '}
          <select
            aria-label="Precondition round"
            value={pi}
            onChange={(e) => {
              setPhase(Number(e.target.value));
              setRow(0);
            }}
          >
            {phases.map((p, i) => (
              <option key={p.phase} value={i}>
                {p.phase}
              </option>
            ))}
          </select>
        </label>
        <label>
          Case{' '}
          <select
            aria-label="Precondition case"
            value={ri}
            onChange={(e) => setRow(Number(e.target.value))}
          >
            {phase.rows.map((r: any, i: number) => (
              <option key={r.runId} value={i}>
                {r.caseId}: {r.family}, {r.variant} ({r.correct ? 'pass' : 'fail'})
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="board-canvas" tabIndex={0} aria-label="Precondition request chain">
        <section className="board-card board-code">
          <h2>Code: observation</h2>
          <p>
            Current piece position, sticker directions, center matches and petal occupancy. Landing
            requirements come from the fixed selected routine, not a search over moves.
          </p>
          <p>The expected decision stays in the offline evaluator.</p>
        </section>
        <div className="board-arrow">→</div>
        {row.exchanges.map((e: any, i: number) => (
          <div className="board-pair" key={e.id}>
            <section className="board-card">
              <h2>
                {i + 1}. {Object.keys(e.request.questions).join(', ')}
              </h2>
              <small>
                {Math.round(e.elapsedMs)} ms · ${e.cost.toFixed(6)}
              </small>
              <h3>INPUT: state</h3>
              {json(e.request.state)}
              <h3>Question and choices</h3>
              {json(e.request.questions)}
              <h3>OUTPUT</h3>
              {json(
                Object.fromEntries(
                  Object.entries(e.response.answers).map(([k, a]: any) => [k, a.choice]),
                ),
              )}
              <details>
                <summary>Exact request body</summary>
                {json(e.request)}
              </details>
              <details>
                <summary>Native response, confidence, probabilities and usage</summary>
                {json(e.response)}
              </details>
            </section>
            <div className="board-wire">
              <span>→</span>
              <p>
                {i + 1 < row.exchanges.length
                  ? executed
                    ? 'Route using the recorded JEV choices. The next box shows the exact next input, including any fixed-reference lookup or coordinate conversion.'
                    : 'Copy readiness answer unchanged into previousModelReady.'
                  : executed
                    ? 'Translate the chosen routine/setup to fixed-frame moves and execute it without tactical correction.'
                    : 'Record the decision. This component test executes no moves.'}
              </p>
            </div>
          </div>
        ))}
        <section className="board-card board-code">
          <h2>Offline score</h2>
          {json({
            expected: row.expected,
            actual: row.actual,
            correct: row.correct,
            error: row.error,
          })}
          {executed && (
            <details>
              <summary>Before and after cube states</summary>
              {json({ before: row.before, after: row.after })}
            </details>
          )}
          <p>
            A correct precondition decision does not establish that JEV will choose and execute the
            right routine in a full run.
          </p>
        </section>
      </div>
      <p className="board-note">
        {recordings.source}; run {row.runId}. Exact payloads, without transport headers or keys.
      </p>
    </>
  );
}
