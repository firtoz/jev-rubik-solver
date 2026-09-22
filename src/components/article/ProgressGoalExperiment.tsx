import data from '../../lib/progress-goal-experiment.json';
import { RequestView, FieldValue } from './RequestView';
import type { JevRequest } from '../../lib/types';

export function ProgressGoalExperiment() {
  return (
    <div className="reasoning-experiments">
      <div className="eyebrow">FOLLOW-UP / FROM RECOGNITION TO A GOAL</div>
      <h3>Let JEV describe the progress, then choose what to work on</h3>
      <p>
        Recognizing one complete layer worked well. We expanded the task to four checkpoints: the
        bottom cross, the first layer, the lower two layers and the whole cube. JEV then chose a
        goal using the beginner progression. All six goal options remained available on every case.
      </p>
      <p>
        We used 20 development cubes, with five needing cross work, five needing bottom corners,
        five needing middle edges and five ready for the last layer. Both direct and decomposed
        approaches received face grids and the same teaching reference. Expected answers stayed in
        the evaluator.
      </p>
      <h4>The first decomposition still struggled</h4>
      <p>
        Direct goal selection scored 8/20. Asking about the four checkpoints first scored 7/20. We
        found a defect in our instructions: one independent question referred to a definition
        supplied in another question. Making each question self-contained raised the chain to 14/20.
        A scope-focused direct variant scored 7/20.
      </p>
      <p>
        We then split recognition further. The first request checked 19 specific regions, such as
        the four edge cells on D and the bottom row of F. A second request received those answers
        and assessed the four checkpoints. A third received those assessments alongside the original
        grids and chose a goal.
      </p>
      <div className="test-fixture">
        <strong>Six face grids → 19 region checks → four progress assessments → one goal</strong>
        <p>
          Every arrow between requests passes actual JEV answers forward. Code never repairs an
          answer or chooses the goal.
        </p>
      </div>
      <p>
        This version chose 17/20 development goals correctly and got 79/80 progress assessments
        right. Two wrong goals followed completely correct progress assessments, so we tested that
        handoff separately.
      </p>
      <h4>Should the next question keep the original evidence?</h4>
      <p>
        We reused the 20 recorded progress assessments, including the mistake, and reran only goal
        selection. Keeping the grids scored 18/20. Removing them scored 16/20. Removing the grids
        and shortening the reference scored 14/20. The change from 17 to 18 for the unchanged
        baseline is repeat-call variation, not a prompt improvement.
      </p>
      <p>
        We kept the original grids in the selected pipeline and froze it before fresh validation.
      </p>
      <div className="test-table">
        <table>
          <thead>
            <tr>
              <th>Fresh validation</th>
              <th>Correct goals</th>
              <th>Requests</th>
            </tr>
          </thead>
          <tbody>
            {data.validation.map((r) => (
              <tr key={r.variant}>
                <td>
                  {r.variant === 'direct'
                    ? 'Direct goal selection'
                    : 'Region checks → progress → goal'}
                </td>
                <td>{r.goalCorrect}/20</td>
                <td>{r.requests}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h4>The remaining failure is useful</h4>
      <p>
        On validation case 5, D’s left edge sticker was blue while its center was yellow. JEV
        answered that all four D edge stickers matched. The next request accepted that observation
        and reported a complete cross. Goal selection then chose first-layer corners, although the
        cross still needed work.
      </p>
      <details>
        <summary>Inspect all three recorded requests and responses</summary>
        {data.example.exchanges.map((e, i) => (
          <div key={i}>
            <h4>
              Request {i + 1}: {['Inspect regions', 'Assess progress', 'Choose goal'][i]}
            </h4>
            <RequestView request={e.request as unknown as JevRequest} />
            <h4>Native response</h4>
            <FieldValue value={e.response} />
            <details>
              <summary>Response JSON</summary>
              <pre>{JSON.stringify(e.response, null, 2)}</pre>
            </details>
          </div>
        ))}
      </details>
      <h4>What we would reuse elsewhere</h4>
      <p>
        Give each independent question its own complete definition. Break difficult judgments into
        observable checks, then pass their answers explicitly into the next decision. Keep the
        source evidence available when testing whether summaries alone are sufficient. Measure each
        boundary: a correct description can still lead to a wrong choice.
      </p>
      <p>
        These 20 fresh states came from the same controlled families as development. There were no
        fully solved cases, and “last layer” was a handoff rather than a choice among its
        algorithms. This establishes a promising early-goal component. The running solver still uses
        its earlier completion facts. The first integration using these uncorrected observations
        is described below.
      </p>
      <p className="fine-print">
        This study used {data.requests} requests and an estimated ${data.cost.toFixed(5)}, including
        development, the isolated handoff comparison and validation. No cube moves were executed.
        The earlier 99/100 solve result belongs to a different policy.
      </p>
      <details>
        <summary>Reproduce the study</summary>
        <p>
          Saved fixtures, source snapshots and complete exchanges are under{' '}
          <code>experiments/progress-goal-development/</code>,{' '}
          <code>experiments/progress-goal-handoff/</code> and{' '}
          <code>experiments/progress-goal-validation/</code>. The development README lists live
          commands and their cost boundaries.
        </p>
        <pre>bun test tests/progress-goal.test.ts{'\n'}bun scripts/summarize-progress-goal.ts</pre>
        <p>These commands run offline checks and regenerate this article’s results.</p>
      </details>
    </div>
  );
}
