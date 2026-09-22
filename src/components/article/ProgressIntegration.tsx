import data from '../../lib/progress-integration.json';
export function ProgressIntegration() {
  return (
    <div className="reasoning-experiments">
      <div className="eyebrow">INTEGRATION / WHAT HAPPENS AFTER A MOVE?</div>
      <h3>The first small integration found gaps in our tests</h3>
      <p>
        We connected the frozen recognition chain to the existing target and algorithm questions.
        Three legal setups needed cross, corner or middle-edge repair. Each ran with both the
        original goal policy and the new chain, with a ceiling of 60 requests, 200 turns and two
        minutes. Both arms used the same skill executor, without recovery or retries. We stopped at
        a verified solved cube or a model-selected last-layer handoff.
      </p>
      <div className="test-table">
        <table>
          <thead>
            <tr>
              <th>Starting task</th>
              <th>Goal policy</th>
              <th>Result</th>
              <th>Requests</th>
              <th>Turns</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.caseId + r.variant}>
                <td>{r.caseId.replace('-', ' ')}</td>
                <td>{r.variant === 'regional' ? 'JEV recognition' : 'Supplied facts'}</td>
                <td>
                  {r.outcome === 'handoff'
                    ? 'Lower layers complete'
                    : r.outcome === 'solved'
                      ? 'Cube solved'
                      : 'Stopped: policy abstained'}
                </td>
                <td>{r.requests}</td>
                <td>{r.turns}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        The original policy completed all three tasks. The new chain solved the middle-edge case,
        but failed the other two. Every final state was independently replayed from the starting
        cube and recorded moves.
      </p>
      <h4>Three different problems appeared</h4>
      <ul>
        <li>
          On the cross-repair cube, a region check incorrectly said the D edge stickers matched. JEV
          concluded that the cross was complete and started working on corners too early.
        </li>
        <li>
          On the corner-repair cube, recognition correctly reported a complete cross. Goal selection
          still chose cross work. The existing skill policy abstained because that target was
          already complete.
        </li>
        <li>
          The cross-repair run later built a complete daisy, then chose daisy again. Our reference
          and scoring had allowed either daisy or cross whenever the bottom cross was incomplete.
          They omitted the completed-daisy transition. The skill policy again abstained.
        </li>
      </ul>
      <p>
        That last failure changes how we interpret the earlier 19/20. It measured agreement with a
        coarse goal label, which did not capture every condition needed to make progress. We
        preserved that result and its original labels, and recorded the missing condition
        separately.
      </p>
      <p>
        The next component test should include incomplete daisies, completed daisies and partial
        transfers. JEV needs to recognize those situations from stickers and choose whether to keep
        building or transfer an edge. We also need cases where the goal contradicts an otherwise
        correct progress assessment. Those failed states now belong to development; any later
        validation must use fresh ones.
      </p>
      <p className="fine-print">
        Six attempts, {data.requests} requests, estimated ${data.cost.toFixed(5)}. These are
        diagnostic cases, not a reliability estimate. Downstream piece facts and algorithm
        assistance remain in place. Saved sources, full exchanges and failures:{' '}
        <code>experiments/progress-integration-v1/</code>. The running solver is unchanged.
      </p>
    </div>
  );
}
