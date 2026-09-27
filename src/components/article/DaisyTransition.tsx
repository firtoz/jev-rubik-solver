import integration from '../../lib/daisy-integration.json';
import data from '../../lib/daisy-transition.json';
import { RequestView, FieldValue } from './RequestView';
import type { JevRequest } from '../../lib/types';
const names: Record<string, string> = {
  direct: 'Direct from face grids',
  regions: 'Full-grid checks, then goal',
  focused: 'Focused sticker checks, then goal',
  gold: 'Correct checks supplied (diagnostic)',
  'checks-only': 'Checks with explicit option rules',
  'counts-plain': 'Checks → counts → goal',
  'counts-rule': 'Checks → counts → explicit option rules',
};
export function DaisyTransition() {
  return (
    <div className="reasoning-experiments">
      <div className="eyebrow">REPAIRING THE TEST / KNOWING WHEN TO MOVE ON</div>
      <h3>A complete daisy is a reason to change goals</h3>
      <p>
        The integration failure showed that “cross incomplete” was too broad a description. We built
        20 legal cases with five each showing an incomplete daisy, a full daisy, a partial transfer
        and a complete cross with unfinished corners. For this exercise we explicitly taught the
        daisy-first method. Other methods can solve these cubes, but the test measures whether JEV
        follows this particular progression.
      </p>
      <p>
        The first request can inspect eight conditions: four U edge stickers that might be yellow
        petals, and four D edges whose two stickers might already match their destination. The
        focused variant receives literal sticker colors copied from those fixed locations. Code
        supplies no match flags or counts.
      </p>
      <div className="test-table">
        <table>
          <thead>
            <tr>
              <th>First development round</th>
              <th>Correct goals</th>
              <th>Correct checks</th>
            </tr>
          </thead>
          <tbody>
            {data.first.map((r) => (
              <tr key={r.variant}>
                <td>{names[r.variant]}</td>
                <td>{r.correct}/20</td>
                <td>
                  {r.recognitionFields === null ? 'Not measured' : `${r.recognitionFields}/160`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Both recognition variants got every sticker check right. The next decision still failed
        often, and supplying correct checks directly did little better. That told us to investigate
        the handoff instead of spending more calls on recognition.
      </p>
      <h4>Ask JEV to form the summary the decision needs</h4>
      <p>
        We reused the recorded checks and compared three ways to ask the next question. Explicit
        conditions on the goal options scored 18/20. Adding a request where JEV counted the petals
        and solved bottom edges scored 20/20 with either of two goal wordings. Both counts were
        correct on every development case.
      </p>
      <div className="test-fixture">
        <strong>Sticker colors → eight yes/no checks → two counts → goal</strong>
        <p>
          A partial transfer might have two petals and two solved bottom edges. All four yellow
          edges are accounted for, so continue transferring. Four solved bottom edges means move to
          corners. If some edges are still missing from those two groups, gather petals.
        </p>
      </div>
      <p>
        JEV performs the counting and chooses the goal. Code passes its answers unchanged. We
        selected the shorter count-based wording and kept the cheaper checks-only version as a
        comparator.
      </p>
      <div className="test-table">
        <table>
          <thead>
            <tr>
              <th>Fresh validation, full chain</th>
              <th>Correct goals</th>
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
        The full count-based chain passed all 20 fresh cases, including all 160 sticker checks and
        both counts in every case. The checks-only version made two premature transfer choices on
        incomplete daisies. No answers were repaired.
      </p>
      <details>
        <summary>Recorded partial-transfer example: every request and response</summary>
        {data.example.exchanges.map((e: any, i: number) => (
          <div key={i}>
            <h4>Request {i + 1}</h4>
            <RequestView request={e.request as JevRequest} />
            <h4>Native response</h4>
            <FieldValue value={e.nativeResponse} />
          </div>
        ))}
      </details>
      <p>
        This experiment suggests a useful design question: what small summary would a person use to
        make this decision? Here, two counts were more effective than eight correct flags. In the
        earlier experiment, removing the original grids hurt goal selection. Context reduction needs
        to be tested for each handoff.
      </p>
      <p>
        The fresh states share controlled families with development. Incomplete-daisy cases cover
        two or three petals, and the study stops at the cross-to-corners handoff. It does not cover
        every scrambled state or establish full solving reliability. The bounded integration below
        tests the component with actual moves.
      </p>
      <p className="fine-print">
        {data.requests} calls, estimated ${data.cost.toFixed(5)}, no retries or moves. The second
        development round reused earlier model checks; fresh validation ran recognition again. The
        table data and recorded example are in <code>src/lib/daisy-transition.json</code>. The
        original experiment directories are identified in the research notebook.
      </p>
      <h4>Then we let it make moves</h4>
      <p>
        We froze the count-based chain and tried four development starting states: an incomplete
        daisy, a full daisy, a partial transfer and the earlier failed R setup. The existing target
        and algorithm questions remained in place. Each attempt had at most 60 requests, 200 face
        turns and two minutes, without retries or recovery.
      </p>
      <div className="test-table">
        <table>
          <thead>
            <tr>
              <th>Start</th>
              <th>Cross result</th>
              <th>Requests</th>
              <th>Turns</th>
            </tr>
          </thead>
          <tbody>
            {integration.rows.map((r) => (
              <tr key={r.caseId}>
                <td>{r.caseId.replaceAll('-', ' ')}</td>
                <td>{r.crossComplete ? 'Verified complete' : 'Request cap, incomplete'}</td>
                <td>{r.requests}</td>
                <td>{r.turns}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        All 20 goal decisions and their sticker checks and counts matched the independently audited
        states. The incomplete-daisy run built four petals, switched to cross work and transferred
        two edges. It reached the cap while choosing its next action. We kept that attempt in the
        denominator: three of four completed within the limit.
      </p>
      <p>
        The R setup incidentally ended with the whole cube solved, verified by replay. JEV selected
        the first-layer handoff from this limited menu, so this does not test whether it recognised
        a solved cube. The other successful attempts completed the cross only.
      </p>
      <p>
        The result supports the repaired transition on these trajectories. It also shows why request
        cost, latency and execution limits belong in integration tests. We stopped the incomplete
        attempt at its limit. Whether more requests would finish it was still unknown. The
        downstream target and algorithm questions retained their earlier teaching.
      </p>
      <p className="fine-print">
        This integration added {integration.requests} requests and an estimated $
        {integration.cost.toFixed(5)}. Every final state was independently replayed from the initial
        setup. These reused development cases are diagnostic, not a fresh reliability evaluation.
        Records: <code>src/lib/daisy-integration.json</code>.
      </p>
    </div>
  );
}
