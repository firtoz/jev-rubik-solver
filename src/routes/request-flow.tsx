import { VerifiedFlow } from '../components/VerifiedFlow';
import brainRecordings from '../lib/brain-early.json';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import recordings from '../lib/flow-recordings.json';
import { PreconditionFlow } from '../components/PreconditionFlow';
import { BoundaryFlow } from '../components/BoundaryFlow';
import '../flow.css';
export const Route = createFileRoute('/request-flow')({
  component: FlowViewer,
  head: () => ({ meta: [{ title: 'JEV inputs → outputs' }] }),
});
const runs = recordings.runs as any[];
const names: Record<string, string> = {
  petal1: 'Read stickers',
  petal: 'Count edges',
  goal: 'Choose goal',
  target: 'Choose target',
  phase: 'Choose phase',
  alignment: 'Check alignment',
  reference: 'Choose reference',
  lift: 'Choose lift',
  preparation: 'Prepare',
  clearance: 'Clear slot',
  operation: 'Choose operation',
};
const choices = (e: any) =>
  Object.fromEntries(Object.entries(e.response.answers).map(([k, a]: any) => [k, a.choice]));
function connection(e: any, next: any, step: any) {
  const k = Object.keys(e.request.questions)[0],
    a = choices(e);
  if (!next && !step.decision && step.goal !== 'first-layer')
    return {
      label:
        'Request cap reached. This answer was recorded, but no next request or action followed.',
      value: a,
    };
  if (k === 'petal1')
    return { label: 'Copy choices into state.checks', value: next?.request.state.checks };
  if (k === 'petal')
    return { label: 'Copy counts into state.modelCounts', value: next?.request.state.modelCounts };
  if (k === 'goal')
    return {
      label: next
        ? 'Set stage; code adds piece facts for this goal'
        : 'Code verifies cross; stop this experiment',
      value: a.goal,
    };
  if (k === 'target')
    return {
      label: 'Select this piece’s facts; use its intention if supplied',
      value: {
        target: a.target,
        ...(a['intent_' + a.target] ? { intent: a['intent_' + a.target] } : {}),
      },
    };
  if (k === 'phase')
    return {
      label: a.phase === 'transfer' ? 'Transfer → ask alignment' : 'Use phase as intention',
      value: a.phase,
    };
  if (k === 'alignment') return { label: 'Pass choice as intent', value: a.alignment };
  if (k === 'reference') return { label: 'Code selects this coordinate view', value: a.reference };
  if (k === 'lift')
    return {
      label: 'Code looks up landing slots for this routine',
      value: { lift: a.lift, mustBeFree: next?.request.state.mustBeFree },
    };
  if (k === 'preparation')
    return {
      label: next ? 'Clear → ask for a setup turn' : 'Execute chosen preparation/routine',
      value: a.preparation,
    };
  return {
    label: 'Code translates chosen routine into fixed-face moves',
    value: step.decision?.alg ?? a[k],
  };
}
function Json({ value }: { value: any }) {
  return <pre>{JSON.stringify(value, null, 2)}</pre>;
}
function FlowViewer() {
  const [view, setView] = useState('fresh');
  return (
    <>
      <div className="board board-controls">
        <label>
          Recording{' '}
          <select
            aria-label="Recording study"
            value={view}
            onChange={(e) => setView(e.target.value)}
          >
            <option value="fresh">Fresh random solve · viewer check</option>
            <option value="verified">Verified brain v3: complete solve</option>
            <option value="brain">Earlier separated action cycles</option>
            <option value="preconditions">Action preconditions</option>
            <option value="boundary">Observation boundaries</option>
            <option value="original">Earlier daisy integration</option>
          </select>
        </label>
        <Link to="/how-it-works">Article</Link>
      </div>
      {view === 'fresh' ? <VerifiedFlow key="fresh" recordingUrl="/recordings/brain-v3-fresh-flow.json"/> : view === 'verified' ? <VerifiedFlow key="verified"/> : view === 'brain' ? (
        <main className="board">
          <h1>Observe → choose routine → check → act</h1>
          <PreconditionFlow key="brain" recordings={brainRecordings} executed />
        </main>
      ) : view === 'preconditions' ? (
        <main className="board">
          <h1>Observe → check preconditions → decide</h1>
          <PreconditionFlow key="preconditions" />
        </main>
      ) : view === 'boundary' ? (
        <main className="board">
          <h1>Inputs → outputs → next request</h1>
          <BoundaryFlow />
        </main>
      ) : (
        <LegacyFlowViewer />
      )}
    </>
  );
}
function LegacyFlowViewer() {
  const [ri, setRun] = useState(1),
    [si, setStep] = useState(0);
  const run = runs[ri],
    step = run.steps[si];
  return (
    <main className="board">
      <header>
        <strong>JEV: inputs → outputs → next request</strong>
        <Link to="/how-it-works">Article</Link>
      </header>
      <p>Real recording. No API calls. Scroll sideways to follow one decision cycle.</p>
      <div className="board-controls">
        <label>
          Case{' '}
          <select
            aria-label="Case"
            value={ri}
            onChange={(e) => {
              setRun(Number(e.target.value));
              setStep(0);
            }}
          >
            {runs.map((r, i) => (
              <option key={r.id} value={i}>
                {r.id} ({r.outcome})
              </option>
            ))}
          </select>
        </label>
        <label>
          Cycle{' '}
          <select aria-label="Cycle" value={si} onChange={(e) => setStep(Number(e.target.value))}>
            {run.steps.map((s: any, i: number) => (
              <option key={i} value={i}>
                {i + 1} / {run.steps.length}:{' '}
                {s.decision?.alg ?? (s.goal === 'first-layer' ? 'cross handoff' : 'capped')}
              </option>
            ))}
          </select>
        </label>
        <button disabled={si === 0} onClick={() => setStep(si - 1)}>
          ← Previous cycle
        </button>
        <button disabled={si === run.steps.length - 1} onClick={() => setStep(si + 1)}>
          Next cycle →
        </button>
      </div>
      <p className="board-note">
        First three calls: JEV reads colors, counts and chooses a goal. Later calls still receive
        code-derived piece facts and a fixed routine library. Each box is one API call; questions
        inside it run independently. Confidence/probabilities are recorded, not passed forward.
      </p>
      <div
        className="board-canvas"
        key={`${ri}-${si}`}
        tabIndex={0}
        aria-label="Request chain, scroll horizontally"
      >
        <section className="board-card board-code">
          <h2>Code: observe cube</h2>
          <p>Copy colors from fixed grid cells. No comparisons or counts yet.</p>
          <details>
            <summary>Source face grids</summary>
            <Json value={step.faces} />
          </details>
          <p>Every cycle starts from the state left by the previous move.</p>
        </section>
        <div className="board-arrow">→</div>
        {step.exchanges.map((e: any, i: number) => {
          const k = Object.keys(e.request.questions)[0],
            wire = connection(e, step.exchanges[i + 1], step);
          return (
            <div className="board-pair" key={e.id}>
              <section className="board-card">
                <h2>
                  {i + 1}. {names[k] ?? k}
                </h2>
                <small>
                  {e.request.model} · {Math.round(e.elapsedMs)} ms
                </small>
                <h3>
                  INPUT <code>state</code>
                </h3>
                <Json value={e.request.state} />
                <details>
                  <summary>
                    Question wording + every option ({Object.keys(e.request.questions).length}{' '}
                    questions)
                  </summary>
                  <Json value={e.request.questions} />
                </details>
                <h3>
                  OUTPUT <code>answers.*.choice</code>
                </h3>
                <Json value={choices(e)} />
                <details>
                  <summary>Full response: probabilities, confidence, usage</summary>
                  <Json value={e.response} />
                </details>
                <details>
                  <summary>Complete request body</summary>
                  <Json value={e.request} />
                </details>
              </section>
              <div className="board-wire">
                <span>→</span>
                <p>{wire.label}</p>
                {wire.value !== undefined && <Json value={wire.value} />}
                <small>
                  {step.exchanges[i + 1]
                    ? 'Next input is shown in the next box.'
                    : 'End of recorded calls for this cycle.'}
                </small>
              </div>
            </div>
          );
        })}
        <section className="board-card board-code">
          <h2>
            Code:{' '}
            {step.decision
              ? 'apply move'
              : step.goal === 'first-layer'
                ? 'verify cross'
                : 'stop at cap'}
          </h2>
          <Json
            value={
              step.decision
                ? {
                    target: step.decision.target,
                    reference: step.decision.front,
                    routine: step.decision.skill,
                    moves: step.decision.alg,
                  }
                : {
                    reason:
                      step.goal === 'first-layer'
                        ? 'JEV chose first-layer; cross independently checked.'
                        : 'Request cap reached. No move executed.',
                  }
            }
          />
          <p>
            {step.decision
              ? 'cubing.js applies these moves. The next cycle observes the resulting state.'
              : 'No continuation is invented.'}
          </p>
          <details>
            <summary>Exact execution record and resulting state</summary>
            <Json value={{ decision: step.decision, after: step.after }} />
          </details>
        </section>
      </div>
      <p className="board-note">
        Inputs and native responses are unchanged, with no headers or keys. The arrows describe code
        wiring, not model reasoning. Source: {recordings.source}; run {run.runId}.
      </p>
    </main>
  );
}
