import data from '../../lib/first-layer-experiment.json';
import { RequestView, FieldValue } from './RequestView';
import type { JevRequest } from '../../lib/types';
const names: Record<string, string> = {
  direct: 'Direct question',
  checklist: 'Checks and conclusion in one request',
  sequential: 'Checks, then a dependent conclusion',
  'direct:scope': 'Direct, with explicit inspection scope',
  'direct:counterexample': 'Direct, look for a counterexample',
  'sequential:scope': 'Sequential, with explicit scope',
  'sequential:counterexample': 'Sequential, look for a counterexample',
};
export function FirstLayerExperiment() {
  return (
    <div className="reasoning-experiments">
      <div className="eyebrow">RECOGNITION EXPERIMENT / WHAT HAS THE PLAYER ALREADY SOLVED?</div>
      <h3>Recognise the layer before choosing a move</h3>
      <p>
        Predicting every turn was a detour from our intended solving strategy. A practiced player
        can recognise a situation and apply a learned routine. We kept the beginner reference and
        asked a more useful question: could JEV recognise a complete first layer from sticker
        colors, without code supplying the completion flag?
      </p>
      <p>
        Every approach received the same six face grids, center colors and definition of a complete
        bottom layer. There were no solved-piece counts, case labels or recommended goals. The 20
        development cubes included 10 complete layers and 10 incomplete ones: four uniform bottom
        faces with mismatched sides, three nearly complete layers and three scrambled cases. All
        configurations were legal.
      </p>
      <h4>One question, or a sequence?</h4>
      <div className="test-table">
        <table>
          <thead>
            <tr>
              <th>Approach</th>
              <th>Correct</th>
              <th>Requests</th>
            </tr>
          </thead>
          <tbody>
            {data.round1.map((r) => (
              <tr key={r.variant}>
                <td>{names[r.variant]}</td>
                <td>{r.correct}/20</td>
                <td>{r.requests}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        The checklist version correctly assessed all five regions in all 20 cases, but its overall
        answer was wrong in eight. Its questions were placed together, without passing their answers
        into the conclusion. In the sequential version, a second request explicitly received the
        five model answers and decided whether all the conditions held. That version passed all 20
        cases.
      </p>
      <div className="test-fixture">
        <small>ACTUAL RECORDED CHECKLIST RESPONSE</small>
        <p>Bottom face: yes. Front row: yes. Right row: yes. Back row: yes. Left row: yes.</p>
        <p>
          <strong>Overall complete: no.</strong> The correct overall answer was yes. We can observe
          the inconsistency in the response; it does not tell us why JEV produced it.
        </p>
        <details>
          <summary>Exact example input and native response</summary>
          <RequestView request={data.example.request as JevRequest} />
          <h4>Native response</h4>
          <FieldValue value={data.example.response} />
          <details>
            <summary>Response JSON</summary>
            <pre>{JSON.stringify(data.example.response, null, 2)}</pre>
          </details>
        </details>
      </div>
      <h4>Vary the top two, then check fresh cubes</h4>
      <p>
        We kept the sequential and direct approaches, and tested each original wording plus two
        variations on the same development set. One variation emphasised finding a mismatch; the
        other emphasised which cells to inspect and which to ignore. Three bounded workers ran these
        candidates in parallel, with no retries or answer voting.
      </p>
      <div className="test-table">
        <table>
          <thead>
            <tr>
              <th>Second-round wording</th>
              <th>Correct</th>
              <th>Requests</th>
            </tr>
          </thead>
          <tbody>
            {data.round2.map((r) => (
              <tr key={r.variant}>
                <td>{names[r.variant]}</td>
                <td>{r.correct}/20</td>
                <td>{r.requests}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Explicit scope brought the direct question up to 19/20. The original sequential wording
        retained 20/20, and its longer variations added no accuracy. We froze the sequential winner
        and the cheaper direct comparator before checking another 20 unique cubes, balanced between
        complete and incomplete layers.
      </p>
      <div className="test-table">
        <table>
          <thead>
            <tr>
              <th>Fresh validation</th>
              <th>Correct</th>
              <th>Requests</th>
            </tr>
          </thead>
          <tbody>
            {data.validation.map((r) => (
              <tr key={r.variant}>
                <td>{names[r.variant]}</td>
                <td>{r.correct}/20</td>
                <td>{r.requests}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Both passed all 20 validation cases. The states came from controlled legal setups and could
        share patterns with development, so the result supports recognition within those families.
        Full solving was a separate question.
      </p>
      <h4>What this teaches us about the request design</h4>
      <p>
        Make the inspection scope precise before adding more calls. When a conclusion depends on
        earlier answers, pass those actual answers into a later request. More questions in one
        request do not by themselves create that dependency. Both the sequential version and a
        cheaper direct question passed this small validation set.
      </p>
      <p>
        We followed this with a recognition-to-goal experiment, described below. We kept
        code-measured completion facts in the working solver during that experiment.
      </p>
      <p className="fine-print">
        This tournament used {data.totalRequests} live requests and an estimated $
        {data.cost.toFixed(5)}. Every failed case and native response was preserved. The recorded
        99/100 solver result belongs to the earlier policy.
      </p>
      <details>
        <summary>Data behind this experiment</summary>
        <p>
          The displayed results are in{' '}
          <a href="https://github.com/firtoz/jev-rubik-solver/blob/main/src/lib/first-layer-experiment.json">
            first-layer-experiment.json
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
