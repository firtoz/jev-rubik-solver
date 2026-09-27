import { createFileRoute, Link } from '@tanstack/react-router';
import { lazy, useEffect } from 'react';
import { NearViewport, LazyDetails } from '../components/article/Deferred';
const RecordedComparison = lazy(() => import('../components/article/RecordedComparison'));
import {
  FinalApproach,
  FinalResults,
  FinalAppendix,
  ReaderOrientation,
} from '../components/article/FinalFindings';
const ObservationBoundary = lazy(() =>
  import('../components/article/ObservationBoundary').then((m) => ({
    default: m.ObservationBoundary,
  })),
);
const DaisyTransition = lazy(() =>
  import('../components/article/DaisyTransition').then((m) => ({ default: m.DaisyTransition })),
);
const ProgressIntegration = lazy(() =>
  import('../components/article/ProgressIntegration').then((m) => ({
    default: m.ProgressIntegration,
  })),
);
const ProgressGoalExperiment = lazy(() =>
  import('../components/article/ProgressGoalExperiment').then((m) => ({
    default: m.ProgressGoalExperiment,
  })),
);
const FirstLayerExperiment = lazy(() =>
  import('../components/article/FirstLayerExperiment').then((m) => ({
    default: m.FirstLayerExperiment,
  })),
);
const ReasoningExperiments = lazy(() =>
  import('../components/article/ReasoningExperiments').then((m) => ({
    default: m.ReasoningExperiments,
  })),
);
const TestingStory = lazy(() =>
  import('../components/article/TestingStory').then((m) => ({ default: m.TestingStory })),
);
export const Route = createFileRoute('/how-it-works')({
  component: Article,
  head: () => ({ meta: [{ title: 'Teaching JEV to solve a cube | An interactive field guide' }] }),
});
function Article() {
  useEffect(() => {
    const reveal = () => {
      const anchor = window.location.hash.slice(1);
      const target =
        document.getElementById(anchor) ??
        (anchor === 'observation-boundaries' ? document.getElementById('recognition') : null);
      if (!target) return;
      let node: HTMLElement | null = target;
      while (node) {
        if (node instanceof HTMLDetailsElement) node.open = true;
        node = node.parentElement;
      }
      requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    };
    reveal();
    window.addEventListener('hashchange', reveal);
    return () => window.removeEventListener('hashchange', reveal);
  }, []);
  return (
    <main className="field-guide">
      <header>
        <Link className="brand" to="/">
          J<span>▧</span>V <b>/</b> CUBE LAB
        </Link>
        <nav>
          <a href="#reproduce">Try it locally</a>
          <Link to="/request-flow">Inspect the requests</Link>
        </nav>
      </header>
      <article>
        <section className="article-hero">
          <div className="eyebrow">FIELD NOTES / 001 · INTERACTIVE RESEARCH</div>
          <h1>
            Teaching JEV to solve
            <br />a <em>Rubik’s cube.</em>
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
              We gave JEV a reference of cube algorithms and asked it to decide when and how to use
              them. After testing and revising the questions, it solved 98 of 100 fresh cubes within
              100 face turns. This article follows the approach we kept, the mistakes that shaped it
              and the cost of making many small decisions.
            </p>
          </div>
          <div className="article-stats">
            <div>
              <strong>98 / 100</strong>
              <span>fresh cubes solved within 100 face turns</span>
            </div>
            <div>
              <strong>$0.408</strong>
              <span>estimated API cost + reservations for 100 attempts</span>
            </div>
            <div>
              <strong>JEV 1.13.0</strong>
              <span>same hosted model throughout</span>
            </div>
          </div>
        </section>
        <div className="article-layout">
          <aside className="article-toc">
            <span>THE EXPERIMENT</span>
            {[
              ['start', '01 / Why routines helped'],
              ['decompose', '02 / The final approach'],
              ['measure', '03 / Results and tradeoffs'],
              ['beyond', '04 / Applying the method'],
              ['appendix', 'Appendix / Details and evidence'],
            ].map(([id, title]) => (
              <a key={id} href={'#' + id}>
                {title}
              </a>
            ))}
          </aside>
          <div className="article-body">
            <section id="start">
              <div className="eyebrow">01 / CHOOSING INDIVIDUAL TURNS</div>
              <h2>From a turn choice to a solving method</h2>
              <ReaderOrientation />
              <p>
                We started by giving JEV the cube state and asking which move to make. That question
                left a lot for the model to work out. It had to decide which part of the cube to
                solve first and how to move the right pieces into place, while keeping track of what
                it had already solved.
              </p>
              <p>
                Our single-turn solver chose among the 18 standard face turns, with separate
                questions about goals and targets. On three early full scrambles, it hit the
                500-request limit without solving any of them. The replay compares that approach
                with our final routine-based solver from the same starting cube.
              </p>
              <NearViewport>
                <RecordedComparison />
              </NearViewport>
              <div className="article-note">
                <b>What the cube is teaching us</b>
                <p>
                  Cube solving gives us a known method to break into smaller decisions, and we can
                  check every result. We wanted to find out how much context and teaching JEV needed
                  at each step. That makes the cube a useful example for designing other workflows,
                  even though an ordinary cube solver would finish it more efficiently.
                </p>
                <p>
                  The same approach could be useful for a support assistant investigating a delayed
                  order. It might first determine whether the delay happened before dispatch or in
                  transit, then use that answer to choose which records to check and what action to
                  suggest. We could test those decisions on labelled support cases before letting
                  the assistant handle a whole investigation. That application would need its own
                  evidence.
                </p>
              </div>
            </section>
            <section id="decompose">
              <div className="eyebrow">02 / THE APPROACH WE KEPT</div>
              <h2>Give JEV the decisions a player would make</h2>
              <FinalApproach />
            </section>
            <section id="measure">
              <div className="eyebrow">03 / WHAT THE EVIDENCE SUPPORTS</div>
              <h2>98 solves, with some tradeoffs</h2>
              <FinalResults />
            </section>
            <section id="beyond">
              <div className="eyebrow">04 / BEYOND THE CUBE</div>
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
                Start by writing down what a skilled person needs to notice and decide. Use code for
                the facts you can calculate, then test whether the model can use those facts to
                choose an action. The cube study gives us a way to investigate that question in
                another task. It cannot tell us the answer in advance.
              </p>
              <a className="article-cta" href="#reproduce">
                Try the solver locally
              </a>
            </section>
            <section id="appendix" className="article-appendix">
              <div className="eyebrow">APPENDIX / THE EVIDENCE BEHIND THE STORY</div>
              <h2>Prompts, experiments and reproduction</h2>
              <p>
                These sections provide the experimental record. “Policy” means the complete decision
                procedure: observations, questions, routines and the code connecting them. The
                version names below identify our code and prompts. Every experiment used the same
                JEV model. Older study runners have been retired. Their summaries and selected
                examples remain here; the final evaluation records are included in the repository.
              </p>
              <div className="article-table-wrap">
                <table className="article-results-table">
                  <caption>Which system does each result describe?</caption>
                  <thead>
                    <tr>
                      <th>System</th>
                      <th>What distinguishes it</th>
                      <th>Recorded result</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th>Beginner routines (v26)</th>
                      <td>
                        Separate corner and middle-edge steps. Retained here as a historical
                        comparison.
                      </td>
                      <td>99/100; 1,000-turn cap</td>
                    </tr>
                    <tr>
                      <th>Observation and memory experiments (brain v3)</th>
                      <td>
                        Reliable measured facts and model checks of remembered plans. Covered in
                        appendix D.
                      </td>
                      <td>100/100; 1,000-turn cap</td>
                    </tr>
                    <tr>
                      <th>Full-menu solver</th>
                      <td>F2L pairs and complete PLL routines, with the full F2L menu.</td>
                      <td>97/100; 100-turn cap</td>
                    </tr>
                    <tr>
                      <th>Grouped-menu solver</th>
                      <td>JEV chooses the F2L family first; refined cross preparation.</td>
                      <td>98/100; 100-turn cap</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                Each row has its own evaluation sample. A higher score under a looser move limit is
                not evidence of a better solver. The older 99/100 report counted one HTTP 503 as a
                failure; later studies retry transient transport failures and report unresolved ones
                separately.
              </p>
              <LazyDetails
                id="appendix-final"
                title="A. Grouped-menu solver: measurements, failures and verification"
              >
                <FinalAppendix />
              </LazyDetails>
              <LazyDetails
                id="appendix-history"
                title="B. Earlier component tests and full-solve results"
              >
                <div className="appendix-content">
                  <p>
                    These tests concern the earlier beginner-routine solver (internal version v26).
                    It solved corners and middle edges separately and allowed up to 1,000 turns.
                    These numbers are separate from the final 100-turn evaluation.
                  </p>
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
                      <h3>Beginner-routine solver</h3>
                      <p>
                        100 newly generated random-state scrambles, with the beginner-routine method
                        fixed before testing. One HTTP 503 remains counted as failure.
                      </p>
                    </div>
                  </div>
                  <p>
                    At this point, five narrowly scoped components had passed their suites. Other
                    request families had only limited individual coverage. The full-cube test
                    measured whether the connected process could finish, including after mistakes it
                    recovered from.
                  </p>
                  <p>
                    An earlier final test produced six failures in 36 attempts, leaving 30
                    successful solves. At that point it could no longer reach the 95/100 target. We
                    kept those results, used the failures to improve the questions and generated a
                    fresh set for the next final test.
                  </p>
                  <p>
                    The v26 test used 30.48 million input tokens across 16,896 requests, for an
                    estimated $1.28. The extra calls were cheap enough for this experiment, but the
                    mean active time was 76.46 seconds per attempt. We used the $0.042 per million
                    input-token rate checked on 20 September 2026. Check current pricing before
                    running your own evaluation.
                  </p>
                </div>
              </LazyDetails>
              <LazyDetails id="reasoning" title="C. What happened when we removed some teaching">
                <div className="appendix-content">
                  <ReasoningExperiments />
                </div>
              </LazyDetails>
              <LazyDetails
                id="recognition"
                title="D. Recognition, observation boundaries and the DOOM comparison"
              >
                <div className="appendix-content">
                  <p>
                    The experiments below are in chronological order. Each result uses the rules and
                    limits stated in its section. Budgets and proposed next steps describe what we
                    were considering at that time.
                  </p>
                  <FirstLayerExperiment />
                  <ProgressGoalExperiment />
                  <ProgressIntegration />
                  <DaisyTransition />
                  <ObservationBoundary />
                </div>
              </LazyDetails>
              <details id="reproduce">
                <summary>E. Run it yourself</summary>
                <div className="appendix-content">
                  <h3>Explore the recordings</h3>
                  <p>
                    The website plays saved recordings and shows their requests and responses. You
                    can run it without an API key. Install <a href="https://bun.sh/">Bun</a>, then
                    get the source and start the app:
                  </p>
                  <pre>
                    {
                      'git clone https://github.com/firtoz/jev-rubik-solver.git\ncd jev-rubik-solver\nbun install\nbun run dev'
                    }
                  </pre>
                  <p>
                    Open http://127.0.0.1:3000. To replay all 100 final attempts through the current
                    solver without calling JEV:
                  </p>
                  <pre>bun run verify:recordings</pre>
                  <section id="playground">
                    <h3>Try it with your own cube, locally</h3>
                    <p>
                      The command-line script uses the same grouped-menu policy as the featured
                      recording. Supply a move sequence starting from a solved cube.
                    </p>
                    <pre>{`cp .env.example .env
# Set TYPESAFE_API_KEY and RUBIK_BUDGET_USD in your local .env
bun run lab status
bun run lab solve "R U R' U'" --live`}</pre>
                    <p>
                      Only the last command makes paid requests. The <code>--live</code> flag opts
                      into a real solve. It prints the result, face turns, request count, cost and
                      elapsed time.
                    </p>
                    <p>
                      <code>scripts/lab.ts</code> runs the solver in <code>src/solver/</code>. Exact
                      exchanges and the cumulative cost ledger stay in the local <code>.data/</code>{' '}
                      directory. Keep that ledger between runs so previous spending remains counted.
                    </p>
                    <p>
                      The default cumulative budget is $1. Each attempt allows 100 face turns, 500
                      HTTP attempts and ten minutes of active execution. Set a budget and check
                      provider pricing before running. Keep failed or capped attempts in any results
                      you report.
                    </p>
                    <p>
                      See{' '}
                      <a href="https://github.com/firtoz/jev-rubik-solver/blob/main/README.md">
                        README
                      </a>{' '}
                      for setup,{' '}
                      <a href="https://github.com/firtoz/jev-rubik-solver/blob/main/docs/architecture.md">
                        architecture guide
                      </a>{' '}
                      for the code/model boundary and{' '}
                      <a href="https://github.com/firtoz/jev-rubik-solver/blob/main/research/README.md">
                        evidence guide
                      </a>{' '}
                      for reproducing the evaluation. New experiments should keep separate results
                      and fresh test cases.
                    </p>
                  </section>
                  <div className="source-links">
                    <a href="https://docs.typesafe.ai/api">JEV API</a>
                    <a href="https://docs.typesafe.ai/models">Model pricing</a>
                    <a href="https://docs.typesafe.ai/confidence">Confidence semantics</a>
                  </div>
                </div>
              </details>
            </section>
          </div>
        </div>
      </article>
      <footer>JEV / CUBE LAB · Experiment notes and interactive examples.</footer>
    </main>
  );
}
