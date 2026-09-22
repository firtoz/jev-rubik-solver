import { PROJECT_BUDGET_CAP } from '../lib/budget';
import { ObservationBoundary } from '../components/article/ObservationBoundary';
import { DaisyTransition } from '../components/article/DaisyTransition';
import { ProgressIntegration } from '../components/article/ProgressIntegration';
import { ProgressGoalExperiment } from '../components/article/ProgressGoalExperiment';
import { FirstLayerExperiment } from '../components/article/FirstLayerExperiment';
import { ReasoningExperiments } from '../components/article/ReasoningExperiments';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState, useRef } from 'react';
import { Cube } from '../components/Cube';
import { RequestView, ExchangeList } from '../components/article/RequestView';
import { ComparisonDemo, LayerStory } from '../components/article/ScrollDemo';
import { TestingStory } from '../components/article/TestingStory';
import { articleCreate, articleRead, articleAdvance, articleEvidence } from '../server/api';
import { parseScramble } from '../lib/cube';
export const Route = createFileRoute('/how-it-works')({
  component: Article,
  head: () => ({ meta: [{ title: 'Teaching JEV to solve a cube | An interactive field guide' }] }),
});
const layers = [
  [
    '01',
    'Choose a goal',
    'Six faces, completion facts, recent moves and the fixed beginner reference.',
    'A goal such as cross or middle-layer.',
    'The goal determines which observations and static vocabulary the next question receives.',
  ],
  [
    '02',
    'Choose a target',
    'Pieces relevant to that goal, including completed pieces, and the previous target.',
    'A piece identity, or whole for a top-layer pattern.',
    'Only the selected piece supplies the next focused observation.',
  ],
  [
    '03',
    'Name the intention',
    'Position, sticker directions and factual progress for the chosen piece.',
    'Extract, align, insert or another goal-specific intention.',
    'Cross first asks phase, then alignment if needed. Middle-layer intention is a separate request. Some other goals batch target and intentions.',
  ],
  [
    '04',
    'Choose a reference',
    'Four coordinate views or a compact current-slot observation, plus a fixed frame rule.',
    'F, R, B or L as the reference front.',
    'The next request receives the chosen local view. Only the coordinate names change at this point. The cube stays in place.',
  ],
  [
    '05',
    'Choose an operation',
    'Local target facts, selected intention and the static skill descriptions.',
    'One setup turn or beginner algorithm.',
    'Daisy branches through lift, preparation and, if required, clearance. The exact path depends on JEV’s earlier answers.',
  ],
  [
    '06',
    'Apply and observe',
    'The selected algorithm and reference orientation.',
    'A new cube state, factual changes and a solved check.',
    'Code executes the move with cubing.js. The next round begins with JEV choosing a goal again.',
  ],
];
function Article() {
  const [evidence, setEvidence] = useState<any[]>([]);
  const [configuration, setConfiguration] = useState("R U R' U'"),
    [session, setSession] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [turning, setTurning] = useState(false);
  const turnTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(turnTimer.current), []);
  useEffect(() => {
    articleEvidence()
      .then((x) => setEvidence(JSON.parse(x)))
      .catch((e) => setError(String(e)));
    const id = localStorage.getItem('rubik-article');
    if (id)
      articleRead({ data: { id } })
        .then((x) => {
          const saved = JSON.parse(x);
          setSession(saved);
          setConfiguration(saved.run.scramble);
        })
        .catch(() => localStorage.removeItem('rubik-article'));
  }, []);
  async function perform(fn: () => Promise<string>) {
    setBusy(true);
    setError('');
    try {
      const s = JSON.parse(await fn());
      setSession(s);

      localStorage.setItem('rubik-article', s.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  let previewConfiguration = '';
  try {
    previewConfiguration = parseScramble(configuration);
  } catch {}
  const request = session?.request;
  function edit(value: string) {
    setConfiguration(value);
    setSession(null);

    localStorage.removeItem('rubik-article');
  }
  return (
    <main className="field-guide">
      <header>
        <Link className="brand" to="/">
          J<span>▧</span>V <b>/</b> CUBE LAB
        </Link>
        <nav>
          <Link to="/">Open the lab ↗</Link>
          <a href="#playground">Try the layers ↓</a>
        </nav>
      </header>
      <article>
        <section className="article-hero">
          <div className="eyebrow">FIELD NOTES / 001 · INTERACTIVE RESEARCH</div>
          <h1>
            How to teach JEV
            <br />
            to solve a <em>complex problem.</em>
          </h1>
          <div className="hero-bottom">
            <div className="hero-cube-slot" aria-hidden="true">
              <div className="hero-cube">
                {(
                  [
                    ['G', 'white'],
                    ['O', 'orange'],
                    ['A', 'blue'],
                    ['L', 'green'],
                    ['arrow', 'yellow'],
                    ['A', 'red'],
                    ['C', 'red'],
                    ['T', 'white'],
                    ['!', 'green'],
                  ] as const
                ).map(([glyph, color], i) => (
                  <span key={i} data-color={color}>
                    {glyph === 'arrow' ? (
                      <svg viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M13.22 4.78a.75.75 0 0 1 1.06 0l7.25 7.25a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 1 1-1.06-1.06l5.97-5.97H3.75a.75.75 0 0 1 0-1.5h15.44l-5.97-5.97a.75.75 0 0 1 0-1.06Z"
                        />
                      </svg>
                    ) : (
                      glyph
                    )}
                  </span>
                ))}
              </div>
            </div>
            <p>
              We wanted to see whether JEV could solve a Rubik’s cube using a fixed beginner reference and reliable observations. This
              article follows the experiments that got it working, and lets you try the same
              requests on a cube of your own.
            </p>
          </div>
          <div className="article-stats">
            <div>
              <strong>100 / 100</strong>
              <span>unseen cubes solved by the frozen brain v3 policy</span>
            </div>
            <div>
              <strong>$1.015</strong>
              <span>committed for the brain v3 final evaluation</span>
            </div>
            <div>
              <strong>JEV 1.13.0</strong>
              <span>fixed hosted model, no training</span>
            </div>
          </div>
        </section>
        <div className="article-layout">
          <aside className="article-toc">
            <span>THE EXPERIMENT</span>
            {[
              ['start', '01 / Choosing individual turns'],
              ['decompose', '02 / A smaller decision'],
              ['measure', '03 / Testing the parts'],
              ['reasoning', 'Follow-up / Fewer supplied rules'],
              ['recognition', 'Experiment / Recognizing progress'],
              ['playground', '04 / Inside the pipeline'],
              ['reproduce', '05 / Make it reproducible'],
              ['beyond', '06 / Beyond the cube'],
            ].map(([id, title]) => (
              <a key={id} href={'#' + id}>
                {title}
              </a>
            ))}
          </aside>
          <div className="article-body">
            <section id="start">
              <div className="eyebrow">01 / CHOOSING INDIVIDUAL TURNS</div>
              <h2>Asking JEV for the next move</h2>
              <p>
                We started by giving JEV the cube state and asking which move to make. That question
                left a lot for the model to work out. It had to decide which part of the cube to
                solve first and how to move the right pieces into place, while keeping track of what
                it had already solved.
              </p>
              <p>
                We later tested a policy that chose individual face turns, with separate questions
                to help it choose a goal and a target. On three full scrambles, it used all 500
                requests allowed per attempt without solving any of them. Below, a fresh matched
                recording compares both policies on another shared scramble.
              </p>
              {evidence.length > 0 && <ComparisonDemo recordings={evidence} />}
              <div className="article-note">
                <b>Why not use a cube solver?</b>
                <p>
                  An ordinary cube solver would be a much easier way to solve the puzzle. We chose
                  the cube because we could check every move and see exactly where JEV struggled. We
                  gave it a reference of beginner algorithms and asked it to choose when and how to
                  use them. The code executes those choices without consulting a solver.
                </p>
              </div>
            </section>
            <section id="decompose">
              <div className="eyebrow">02 / A SMALLER DECISION</div>
              <h2>Breaking the task into smaller questions</h2>
              <p>
                Breaking the question into smaller decisions helped. For example, an edge trapped in
                the middle layer needs to be extracted from its current slot. JEV sometimes chose a
                reference frame based on where that edge belonged instead. A focused question about
                its current slot, with an explicit frame-mapping rule, passed all 20 fresh
                validation cases. We then used that answer to construct the operation question.
              </p>
              <div className="layer-stories">
                {layers.map((layer, index) => (
                  <LayerStory key={layer[0]} layer={layer} index={index} />
                ))}
              </div>
              <p>
                The number of requests depends on JEV’s answers. Some choices can share a call,
                while others need the previous answer before their input can be built. Code handles
                that routing and the coordinate conversions. JEV chooses the goal and moves. In
                autonomous runs, repeated states or stalled progress trigger another question asking
                whether to continue, undo the previous action or change target.
              </p>
            </section>
            <section id="measure">
              <div className="eyebrow">03 / TESTING THE PARTS</div>
              <h2>How we tested the questions</h2>
              <TestingStory />
              <div className="evidence-grid">
                <div>
                  <strong>20 / 20</strong>
                  <h3>Middle extraction</h3>
                  <p>
                    Fresh validation for the reference question and the operation question, each
                    tested in isolation.
                  </p>
                </div>
                <div>
                  <strong>26 / 26</strong>
                  <h3>Corner orientation</h3>
                  <p>
                    All non-solved orientation patterns in the compact fixture domain. Earlier
                    layers were supplied.
                  </p>
                </div>
                <div>
                  <strong>99 / 100</strong>
                  <h3>The earlier v26 system</h3>
                  <p>
                    Fresh full random-state scrambles, frozen v26 policy. One HTTP 503 remains
                    counted as failure.
                  </p>
                </div>
              </div>
              <p>
                The component results cover specific kinds of decisions. Five narrowly scoped
                components passed their suites, and several other request families still need
                broader isolated testing. The full-cube test measures whether the whole process
                eventually solves the cube, including any mistakes it recovers from. JEV also
                returns a confidence value for each answer, but we have not calibrated that value
                against solve success.
              </p>
              <p>
                An earlier final test produced six failures in 36 attempts, leaving 30 successful
                solves. At that point it could no longer reach the 95/100 target. We kept those
                results, used the failures to improve the questions and generated a fresh set for
                the next final test.
              </p>
              <p>
                That v26 test cost $1.28 for 30.48 million input tokens across 16,896
                requests. That made the extra questions affordable for this experiment. Waiting for
                them was more noticeable, with a mean active time of 76.46 seconds per attempt. We
                used the $0.042 per million input-token rate checked on 20 September 2026. Check
                current pricing before running your own evaluation.
              </p>
            </section>
            <section id="reasoning">
              <ReasoningExperiments />
            </section>
            <section id="recognition">
              <FirstLayerExperiment />
              <ProgressGoalExperiment />
              <ProgressIntegration />
              <DaisyTransition />
              <ObservationBoundary />
              <p><Link to="/request-flow">Explore every request, response and handoff in the recorded pipeline →</Link></p>
            </section>
            <section id="playground">
              <div className="eyebrow">04 / INSIDE THE PIPELINE</div>
              <h2>Try it with your own cube</h2>
              <p>This playground and the recorded comparison use the earlier v26 policy. The brain v3 evaluation is documented separately above.</p>
              <p>
                Set up a cube with the face-turn buttons or enter a move sequence. You can drag the
                preview to look around it. The directions used in requests stay fixed, with white on
                U, yellow on D and green on F, regardless of the camera angle.
              </p>
              <div className="playground">
                <div className="playground-cube">
                  <div className="cube-control-stage">
                    <Cube
                      scramble=""
                      alg={
                        session
                          ? [session.run.scramble, ...session.run.history].join(' ')
                          : previewConfiguration
                      }
                      speed={2}
                      hideControls
                    />
                    {(['U', 'L', 'F', 'R', 'B', 'D'] as const).map((face) => (
                      <div key={face} className={'face-control face-' + face}>
                        <span>
                          {
                            { U: 'Top', L: 'Left', F: 'Front', R: 'Right', B: 'Back', D: 'Bottom' }[
                              face
                            ]
                          }{' '}
                          <b>{face}</b>
                        </span>
                        <div>
                          {[
                            ['', '↻', 'clockwise'],
                            ["'", '↺', 'counterclockwise'],
                            ['2', '½', 'half turn'],
                          ].map(([suffix, icon, direction]) => (
                            <button
                              key={suffix}
                              disabled={busy || turning}
                              aria-label={face + ' ' + direction}
                              title={face + suffix + ' · viewed directly at this face'}
                              onClick={() => {
                                setTurning(true);
                                clearTimeout(turnTimer.current);
                                turnTimer.current = setTimeout(() => setTurning(false), 650);
                                edit(
                                  [
                                    session
                                      ? session.run.scramble + ' ' + session.run.history.join(' ')
                                      : configuration,
                                    face + suffix,
                                  ]
                                    .filter(Boolean)
                                    .join(' '),
                                );
                              }}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="fine-print">
                    Arrows turn the named face clockwise or counterclockwise as viewed directly at
                    that face. Controls stay in the fixed cube frame when you orbit the camera. ½
                    makes a half turn.
                  </p>
                  <div className="small-controls">
                    <button disabled={busy} onClick={() => edit('')}>
                      Reset solved
                    </button>
                    <button
                      disabled={busy}
                      onClick={() =>
                        edit(
                          (session
                            ? session.run.scramble + ' ' + session.run.history.join(' ')
                            : configuration
                          )
                            .trim()
                            .split(/\s+/)
                            .slice(0, -1)
                            .join(' '),
                        )
                      }
                    >
                      Remove last setup turn
                    </button>
                    <button disabled={busy} onClick={() => edit('U')}>
                      One turn away
                    </button>
                    <button disabled={busy} onClick={() => edit("R U R' U' F2 D L2")}>
                      Mixed setup
                    </button>
                  </div>
                  <label htmlFor="article-config">Setup sequence (up to 100 face turns)</label>
                  <textarea
                    id="article-config"
                    disabled={busy}
                    value={configuration}
                    onChange={(e) => edit(e.target.value)}
                    placeholder="R U R' U'"
                  />
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={() =>
                      perform(() => articleCreate({ data: { scramble: configuration } }))
                    }
                  >
                    Prepare these inputs · free
                  </button>
                </div>
                <div className="playground-console">
                  <span className="eyebrow">LIVE POLICY WORKBENCH</span>
                  <h3>
                    {session?.solved
                      ? 'Solved!'
                      : request
                        ? Object.keys(request.questions).join(' + ')
                        : session?.action
                          ? 'Ready to apply'
                          : 'Start with a configuration'}
                  </h3>
                  <p>
                    {session?.solved
                      ? 'Every piece now matches its fixed center. No further requests are needed. Your complete round history is preserved below.'
                      : session?.action
                        ? 'The model has finished this round. Inspect its selected operation, then apply it when you are ready.'
                        : session
                          ? 'The exact next request is below. Each click sends only that request. The model’s outputs appear in the handoff history below.'
                          : 'Preparing creates a saved manual session and constructs the first request. It does not call JEV.'}
                  </p>
                  {session && (
                    <>
                      <div className="console-stats">
                        <span>{session.run.requests} requests</span>
                        <span>${session.run.cost.toFixed(5)} this session</span>
                        <span>${session.budget.usage.toFixed(4)} / ${session.budget.cap} project</span>
                      </div>
                      <div className="small-controls">
                        <button
                          className="primary"
                          disabled={busy || !request || !session.budget.configured}
                          onClick={() =>
                            perform(() =>
                              articleAdvance({
                                data: {
                                  id: session.id,
                                  revision: session.revision,
                                  command: crypto.randomUUID(),
                                  action: 'ask',
                                },
                              }),
                            )
                          }
                        >
                          {busy ? 'Working…' : 'Run this layer · paid'}
                        </button>
                        <button
                          disabled={busy || !session.action}
                          onClick={() =>
                            perform(() =>
                              articleAdvance({
                                data: {
                                  id: session.id,
                                  revision: session.revision,
                                  command: crypto.randomUUID(),
                                  action: 'apply',
                                },
                              }),
                            )
                          }
                        >
                          Apply chosen move · free
                        </button>
                      </div>
                      {session.action && (
                        <div className="chosen-move">
                          <small>JEV’S SELECTED OPERATION</small>
                          <h3>{session.action.skill}</h3>
                          <code>{session.action.alg}</code>
                          <p>
                            Target {session.action.target} · reference {session.action.front}. Apply
                            it to observe the next state and begin another round.
                          </p>
                        </div>
                      )}
                      {session.error && (
                        <p role="alert" className="article-error">
                          {session.error}. No replacement move has been chosen by code. Edit the
                          configuration to start a new investigation.
                        </p>
                      )}
                      {request && <RequestView request={request} />}
                      <p className="fine-print">
                        Your manual move applications are recorded separately from autonomous
                        benchmarks. One request per click, no automatic retries. The existing
                        project-wide ${PROJECT_BUDGET_CAP} cap still applies. This workbench exposes goal and skill
                        layers. Autonomous recovery is available in the main lab.
                      </p>
                    </>
                  )}
                  {error && (
                    <p role="alert" className="article-error">
                      {error}
                    </p>
                  )}
                </div>
              </div>
              {session?.answers.length > 0 && (
                <div className="round-history">
                  <h3>This round’s decisions</h3>
                  <p>Open a step to inspect its answer and the exact request that led to it.</p>
                  <ExchangeList answers={session.answers} />
                </div>
              )}
              {session?.archive.length > 0 && (
                <div className="round-history">
                  <h3>Applied rounds</h3>
                  {session.archive.map((answers: any[], i: number) => (
                    <details key={i}>
                      <summary>
                        Round {i + 1}
                        <span>{answers.length} requests · applied</span>
                      </summary>
                      <ExchangeList answers={answers} />
                    </details>
                  ))}
                </div>
              )}
            </section>
            <section id="reproduce">
              <div className="eyebrow">05 / MAKE IT REPRODUCIBLE</div>
              <h2>Reproducing the experiment</h2>
              <ol className="recipe">
                <li>
                  <b>Run the local project.</b>
                  <p>
                    The app uses Bun with TanStack Start, SQLite and cubing.js. Install the
                    dependencies and set TYPESAFE_API_KEY on the server before starting it. Keep
                    that key out of browser environment variables.
                  </p>
                  <pre>
                    bun install{'\n'}bun run dev{'\n'}bun test{'\n'}bun run typecheck
                  </pre>
                </li>
                <li>
                  <b>Measure one question.</b>
                  <p>
                    The fixture generators and request-eval scripts let you test individual
                    questions. Keep separate development and validation sets, and save the exchanges
                    with their expected answers and source versions. The suite details and known
                    gaps are documented in docs/request-coverage.md.
                  </p>
                </li>
                <li>
                  <b>Integrate, then freeze.</b>
                  <p>
                    Once small integration runs are working, freeze the prompts and skill
                    descriptions along with the code. Generate 100 new random-state scrambles for
                    the final test. JEV should receive the resulting cube states, with no access to
                    the scramble sequences or the evaluator’s expected answers.
                  </p>
                  <pre>
                    bun run lab generate final-test 100{'\n'}bun scripts/evaluate.ts begin
                    .data/final-test.json{'\n'}bun scripts/evaluate.ts batch BENCHMARK_ID
                  </pre>
                </li>
                <li>
                  <b>Count every assigned attempt.</b>
                  <p>
                    Stop each attempt at 500 requests, 1,000 face turns or ten minutes, whichever
                    comes first. Keep failed and capped attempts in the results. Verify successes by
                    replaying the recorded moves. If you use failures to make changes, the next
                    evaluation needs a fresh test set.
                  </p>
                  <pre>bun scripts/audit-evaluation.ts</pre>
                </li>
              </ol>
              <p>
                Replays use saved records and cost nothing. The evaluation commands call JEV and
                charge against the project budget. You can find the procedure and results in README,
                docs/results.md, docs/request-coverage.md and experiments/. Keep the local .data
                directory too, since it contains the full request/response history and frozen source
                snapshots.
              </p>
              <div className="source-links">
                <a href="https://docs.typesafe.ai/api">JEV API ↗</a>
                <a href="https://docs.typesafe.ai/models">Model pricing ↗</a>
                <a href="https://docs.typesafe.ai/confidence">Confidence semantics ↗</a>
                <a href="https://www.rubiks.com/solution-guides">Beginner reference ↗</a>
              </div>
            </section>
            <section id="beyond">
              <div className="eyebrow">06 / BEYOND THE CUBE</div>
              <h2>Using this approach for other tasks</h2>
              <p>
                This approach may also help with tasks where a model has to make several related
                choices. A document-routing system, for example, could first identify the document
                type and then choose a destination using the fields relevant to that type. Each
                question would have its own test cases, followed by tests of the complete routing
                process.
              </p>
              <div className="transfer-grid">
                <div>
                  <span>01</span>
                  <h3>Separate facts from choices</h3>
                  <p>
                    Use code for facts you can calculate reliably, such as whether required fields
                    are present. Give those facts to the model when it needs to choose what to do
                    next.
                  </p>
                </div>
                <div>
                  <span>02</span>
                  <h3>Label local decisions</h3>
                  <p>
                    Work out which choices are acceptable for each test case. Allow more than one
                    correct answer where appropriate, and use varied inputs to find the question’s
                    weak spots.
                  </p>
                </div>
                <div>
                  <span>03</span>
                  <h3>Measure the whole loop</h3>
                  <p>
                    Try the complete workflow as well. A wrong answer early on can change every
                    later request, so record where failures begin and whether the system recovers.
                    Measure cost and latency alongside success.
                  </p>
                </div>
                <div>
                  <span>04</span>
                  <h3>Merge only with evidence</h3>
                  <p>
                    After the workflow is reliable, try combining adjacent questions in one request.
                    Compare the new version on fresh cases before replacing the version that already
                    works.
                  </p>
                </div>
              </div>
              <p>
                JEV had the beginner method written into its instructions throughout this
                experiment. We were testing how well it could apply that knowledge. The saved
                requests show where it needed more focused information, and give us a starting point
                for testing whether some of those questions can now be combined.
              </p>
              <Link className="article-cta" to="/">
                Explore the complete lab ↗
              </Link>
            </section>
          </div>
        </div>
      </article>
      <footer>JEV / CUBE LAB · Experiment notes and interactive examples.</footer>
    </main>
  );
}
