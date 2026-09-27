import data from '../../lib/reasoning-experiments.json';
export function ReasoningExperiments() {
  return (
    <div className="reasoning-experiments">
      <div className="eyebrow">FOLLOW-UP EXPERIMENT / FEWER SUPPLIED SOLVING RULES</div>
      <h3>What can JEV work out without the algorithm menu?</h3>
      <p>
        The earlier v26 99/100 result used a reference of beginner algorithms. JEV chose when and
        how to apply them. The side-by-side recording also gives the two policies different action
        menus, so it cannot tell us how much of the improvement came from splitting the questions
        up.
      </p>
      <p>
        We first tested whether JEV could predict what a turn would do to an individual piece. Code
        supplied its current position and the proposed turn. No beginner move sequences or
        calculated successor positions entered these requests.
      </p>
      <div className="test-fixture">
        <small>ONE REQUEST IN THE FIRST PROBE</small>
        <p>
          A corner is currently at URB, touching the top, right and back faces. The proposed turn is
          D2, a half turn of the bottom face. Where will the corner be afterward?
        </p>
        <p>
          <strong>Expected: URB. JEV chose: DBR.</strong> It predicted a position change for a piece
          outside the turned layer. This gave us a specific recognition question to test separately.
        </p>
      </div>
      <h4>How we compared prompt variants</h4>
      <ol className="experiment-method">
        <li>
          <strong>Keep a baseline.</strong> Define one measurable question, prepare 20 different
          inputs and calculate acceptable answers offline. Keep those answers out of every request.
        </li>
        <li>
          <strong>Compare nearby variants.</strong> Run three or four wordings on the same cases,
          with bounded parallel workers. Keep observations, answer choices and scoring fixed within
          the comparison.
        </li>
        <li>
          <strong>Carry forward useful gains.</strong> Keep the strongest wording as the next seed.
          We required at least two additional correct answers out of 20 to continue a wording
          change. That was a screening threshold; a gain still needed to hold up on fresh cases.
        </li>
        <li>
          <strong>Stop repeating an unhelpful idea.</strong> After two rounds without that gain,
          pause the wording search and try a different representation or a smaller question.
          Preserve regressions and failures in the log.
        </li>
        <li>
          <strong>Check fresh cases.</strong> Freeze the selected wording and test new inputs. Only
          a component that holds up there is a candidate for integration. Reusing development cases
          helps comparison but can also overfit them.
        </li>
      </ol>
      <h4>Results for each representation</h4>
      <div className="test-table">
        <table>
          <thead>
            <tr>
              <th>Representation</th>
              <th>Position</th>
              <th>Sticker direction</th>
            </tr>
          </thead>
          <tbody>
            {data.representations.map((r) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td>{r.position} / 20</td>
                <td>{'sticker' in r ? `${r.sticker} / 20` : 'Not tested'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        The separate layer-membership question scored 20/20 in the development batches. Full
        rotation prediction was much weaker. Giving JEV a generic rotation formula did not help. A
        face diagram improved position prediction, so we used that as the seed for a controlled
        wording search. The diagram experiment tests position only; it cannot establish
        sticker-orientation accuracy.
      </p>
      <h4>The parallel wording rounds</h4>
      <div className="test-table">
        <table>
          <thead>
            <tr>
              <th>Round</th>
              <th>Wording</th>
              <th>Correct position</th>
            </tr>
          </thead>
          <tbody>
            {data.rounds.flatMap((round) =>
              round.results.map((r) => (
                <tr key={`${round.round}-${r.variant}`}>
                  <td>{round.round}</td>
                  <td>
                    {r.variant === 'baseline'
                      ? 'Retained diagram baseline'
                      : round.round === 1
                        ? r.variant === 'paper'
                          ? 'Rotating paper analogy'
                          : 'Clock-face analogy'
                        : r.variant === 'paper'
                          ? 'Separate horizontal and vertical reasoning'
                          : 'Check piece type and direction'}
                  </td>
                  <td>
                    {r.correct} / {r.total}
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
      {data.validation && (
        <p>
          <strong>Fresh validation:</strong> layer membership {data.validation.membership}/20; final
          position {data.validation.position}/20. The two questions ran sequentially, and the second
          received JEV’s actual first answer without correction.
        </p>
      )}
      <p>
        Neither wording round improved on the retained baseline by two cases, so we stopped that
        search. Layer membership passed all 20 fresh cases. Position prediction passed only 16,
        leaving too many errors to rely on it for a whole solve. We then changed direction:
        recognise the current situation and select a learned routine, as described below.
      </p>
      <p>
        Each variant received one call per case. We ran independent cases in parallel to reduce
        evaluation time. We never used repeated calls to vote on a move during solving.
      </p>
      <details>
        <summary>Data behind this experiment</summary>
        <p>
          The displayed results are in{' '}
          <a href="https://github.com/firtoz/jev-rubik-solver/blob/main/src/lib/reasoning-experiments.json">
            reasoning-experiments.json
          </a>
          . The{' '}
          <a href="https://github.com/firtoz/jev-rubik-solver/blob/main/notes.md">
            research notebook
          </a>{' '}
          records the changes and their limits. These older study runners have been retired. For the
          current solver, see <a href="#reproduce">local setup and offline verification</a>.
        </p>
      </details>
    </div>
  );
}
