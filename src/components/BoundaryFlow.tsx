import { useState } from 'react';
import data from '../lib/observation-boundary.json';
const json = (value: unknown) => <pre>{JSON.stringify(value, null, 2)}</pre>;
export function BoundaryFlow() {
  const [phaseIndex, setPhase] = useState(0),
    [rowIndex, setRow] = useState(0);
  const phases = data.phases as any[];
  const phase = phases[phaseIndex],
    row = phase?.rows[rowIndex];
  if (!row) return <p>No recorded exchanges yet.</p>;
  return (
    <>
      <p>Observation-boundary experiment. Saved requests only; viewing this page spends nothing.</p>
      <div className="board-controls">
        <label>
          Round{' '}
          <select
            aria-label="Experiment round"
            value={phaseIndex}
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
          Case / variant{' '}
          <select
            aria-label="Boundary case"
            value={rowIndex}
            onChange={(e) => setRow(Number(e.target.value))}
          >
            {phase.rows.map((r: any, i: number) => (
              <option key={r.runId} value={i}>
                {r.caseId}: {r.variant} ({r.score?.chain ? 'pass' : r.error ? 'error' : 'fail'})
              </option>
            ))}
          </select>
        </label>
      </div>
      {row.replayedFrom && (
        <p>
          Action-only revision. Earlier answers were replayed from run {row.replayedFrom}. Only the
          new action call is shown here; choose development to inspect its source chain.
        </p>
      )}
      <p>
        {row.variant.startsWith('code/')
          ? 'Code measures color matches.'
          : 'JEV identifies color matches.'}{' '}
        Code counts the flags in both arms. JEV chooses the goal, target, reference and routine.
      </p>
      <div className="board-canvas" tabIndex={0} aria-label="Observation boundary request chain">
        <section className="board-card board-code">
          <h2>Code: observe</h2>
          <p>
            Copy piece positions and sticker directions. Include last two actions and current
            target.
          </p>
          <details>
            <summary>Field provenance</summary>
            {json(
              row.result?.provenance ?? {
                observation: 'mechanics',
                checks: row.variant.split('/')[0],
                counts: 'code aggregation',
              },
            )}
          </details>
          <details>
            <summary>Source cube state</summary>
            {json(row.before)}
          </details>
        </section>
        <div className="board-arrow">→</div>
        {row.exchanges.map((e: any, i: number) => {
          const keys = Object.keys(e.request.questions),
            first = keys[0];
          const name = first.startsWith('petal_')
            ? 'Recognise stickers'
            : first === 'goal'
              ? 'Goal + conditional targets'
              : first === 'situation'
                ? 'Situation + reference'
                : 'Routine';
          const output = Object.fromEntries(
            Object.entries(e.response.answers).map(([k, a]: any) => [k, a.choice]),
          );
          const wire = first.startsWith('petal_')
            ? 'Copy flags unchanged. Code counts yes values.'
            : first === 'goal'
              ? 'Use selected goal and its conditional target. Ignore the other target answer.'
              : first === 'situation'
                ? 'Copy situation and reference. Code renames coordinates to this reference.'
                : 'Look up selected routine and map its moves to fixed faces.';
          return (
            <div className="board-pair" key={e.id}>
              <section className="board-card">
                <h2>
                  {i + 1}. {name}
                </h2>
                <small>
                  {e.request.model} · {Math.round(e.elapsedMs)} ms · ${e.cost.toFixed(6)}
                </small>
                <h3>INPUT: state</h3>
                {json(e.request.state)}
                <details>
                  <summary>Questions and all options ({keys.length})</summary>
                  {json(e.request.questions)}
                </details>
                <h3>OUTPUT: choices</h3>
                {json(output)}
                <details>
                  <summary>Full native response, confidence, probabilities and usage</summary>
                  {json(e.response)}
                </details>
                <details>
                  <summary>Exact full request body</summary>
                  {json(e.request)}
                </details>
              </section>
              <div className="board-wire">
                <span>→</span>
                <p>{wire}</p>
                {json(output)}
                <small>
                  {i + 1 < row.exchanges.length
                    ? 'The next box shows the exact resulting input.'
                    : 'End of recorded requests.'}
                </small>
              </div>
            </div>
          );
        })}
        <section className="board-card board-code">
          <h2>Execution and scoring</h2>
          {json({
            goal: row.result?.plan?.goal,
            target: row.result?.target,
            operation: row.result?.operation,
            moves: row.result?.alg,
            error: row.error,
          })}
          <p>
            Offline scoring never enters a request. A component pass does not establish an
            autonomous solve.
          </p>
          {json(row.score)}
          <details>
            <summary>Resulting cube</summary>
            {json(row.result?.after)}
          </details>
        </section>
      </div>
      <p className="board-note">
        Source: {data.source}. Run {row.runId}. No invented model reasoning or missing continuation.
      </p>
    </>
  );
}
