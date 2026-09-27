import preconditions from '../../lib/action-preconditions-summary.json';
import { Link } from '@tanstack/react-router';
import study from '../../lib/observation-boundary-summary.json';
export function ObservationBoundary() {
  const phases = study.phases as any[];
  return (
    <section id="observation-boundaries">
      <h3>How much observation work belongs in code?</h3>
      <p>
        We compared two versions of the same early-stage policy. One measures sticker matches in
        code. The other asks JEV to recognise those matches. Both count the resulting flags in code,
        then ask the same questions about goals, targets, situations and routines.
      </p>
      <p>
        This follows a useful distinction in{' '}
        <a href="https://docs.typesafe.ai/model-jaggedness/jev-1.13">TypeSafe’s guidance</a>:
        deterministic computation can stay in code while the model handles contextual decisions.
        Their <a href="https://docs.typesafe.ai/demos/smart-home">smart-home example</a> also
        batches independent conditional questions. We tried that here by asking for a goal and a
        target for each possible goal in one request. Only the target for JEV’s chosen goal is used.
      </p>
      <p>
        The{' '}
        <a href="https://typesafe.ai/blog/introducing-system-one-models-and-jev">
          official DOOM announcement
        </a>{' '}
        describes structured text observations, but we did not find its exact published prompts. A{' '}
        <a href="https://github.com/AmoghCreator/doom-jev/tree/main/agent">
          separate community implementation
        </a>{' '}
        exposes its inputs and includes automatic aiming and firing. It illustrates an assistance
        boundary; it is not evidence that JEV handles every decision in the official demo.
      </p>
      <h4>What we measured</h4>
      <p>
        Twenty development states covered zero or one petal, other incomplete daisies, full daisies,
        partial transfers and completed crosses. We compared structured fields with equivalent short
        descriptions. Acceptable answers stayed in the offline evaluator. A full-chain pass requires
        correct recognition, goal, target, situation, reference and a useful action, or a correct
        cross-completion handoff.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Round</th>
              <th>Observations / wording</th>
              <th>Full chains</th>
              <th>Requests</th>
              <th>Estimated cost</th>
            </tr>
          </thead>
          <tbody>
            {phases.flatMap((p) =>
              p.summary.map((s: any) => (
                <tr key={`${p.phase}-${s.variant}`}>
                  <td>{p.phase}</td>
                  <td>{s.variant}</td>
                  <td>
                    {s.correct}/{s.cases}
                  </td>
                  <td>{s.requests}</td>
                  <td>${s.cost.toFixed(5)}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
      <p>
        The first round’s conditional target questions scored 20/20 in three variants and 19/20 in
        the fourth. Full decision chains scored only 9–10/20. Many failures came later: JEV
        recognised the target’s situation but chose an unsuitable routine or abstained.
      </p>
      <p>
        For example, in development case 10 all variants selected a petal for cross transfer and
        recognised its current side. They then chose a half-turn before its side sticker matched the
        center. A correct description of the situation did not guarantee correct use of the routine.
      </p>
      <p>
        One action-only revision used canonical slot names and placed the selected target directly
        beside the question. Saved earlier answers were reused without correction. Code/player moved
        from 10/20 to 9/20; JEV/player moved from 10/20 to 11/20. We kept the original candidates
        under the rule requiring neither arm to regress. This does not establish that canonical
        naming is harmful: the revision changed several details and the sample is small. Its
        formatting fix remains useful for future work.
      </p>
      <p>
        Fresh validation scored 12/20 complete chains with code-measured observations and 8/20 with
        JEV recognition. Both got all goals, selected targets, situations and reference choices
        right. Routine selection remained the bottleneck, and the recognition arm also made errors
        in four cases. Both missed the 19/20 gate, so no integration runs were started. The entire
        study used 380 live requests and cost about $0.0365. The historical solver’s 99/100 result
        belongs to a different policy.
      </p>
      <p>
        The next question to test is whether JEV can explicitly check alignment or landing occupancy
        before choosing a routine. That would add a dependent call where these failures occurred. It
        is a hypothesis for another experiment, not a demonstrated improvement.
      </p>
      <h4>Follow-up: ask about the precondition explicitly</h4>
      <p>
        We supplied the earlier target, reference and routine, then tested the missing decision on
        its own. Twenty cases asked whether a yellow-up petal was aligned for transfer. Another
        twenty asked whether the selected lift could run, needed a landing slot cleared, or needed
        its top-layer target lowered first. Code supplied current color matches and slot occupancy.
        JEV chose the next intention.
      </p>
      <p>
        All three prompt forms passed both development suites: rules with short options, explicit
        conditions on the options, and a two-call readiness check followed by a decision. The extra
        readiness call added no accuracy in these cases. We froze the cheaper single-call rule form.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Fresh validation</th>
              <th>Correct decisions</th>
              <th>Requests</th>
            </tr>
          </thead>
          <tbody>
            {preconditions.phases
              .filter((p) => p.phase === 'validation')
              .flatMap((p) =>
                p.summary.map((s: any) => (
                  <tr key={s.family}>
                    <td>
                      {s.family === 'transfer' ? 'Transfer alignment' : 'Landing preparation'}
                    </td>
                    <td>
                      {s.correct}/{s.cases}
                    </td>
                    <td>{s.requests}</td>
                  </tr>
                )),
              )}
          </tbody>
        </table>
      </div>
      <p>
        This study used 200 requests and cost $0.00517. It supports these isolated checks, with the
        prior decisions supplied. It does not yet establish correct setup turns, routine selection
        or complete solves. The next integration must feed in JEV’s actual earlier choices and
        execute the resulting actions without correction. All tested landing routines require one
        free slot; routines with multiple landing requirements remain outside this result.
      </p>
      <h4>Then connect those checks to real model choices</h4>
      <p>
        The next candidate selected a routine separately from its setup. Its fixed reference also
        listed the bottom slots each routine disturbs, so JEV could compare that with observed
        solved edges. The code still did no runtime move search or tactical correction.
      </p>
      <p>
        Complete action cycles passed 15/20 development cases, compared with 10/20 for the earlier
        code-observation candidate on those same states. A fresh, disjoint validation set also
        scored 15/20. That validation set differs from the earlier boundary comparison, so the two
        validation percentages are not a paired comparison. This round used 126 requests and cost
        $0.00454.
      </p>
      <p>
        Three fresh failures chose cross transfer before all yellow edges were gathered or solved.
        Two had incorrect situation labels; one still made a useful move. This shows why we keep
        separate scores for intermediate descriptions and actual progress. The 19/20 gate was not
        met, so no multi-step integration runs started.
      </p>
      <p>
        A development example exposed another distinction: two free top slots were opposite each
        other, but the chosen routine needed adjacent slots. No U turn could fix that. JEV correctly
        abstained at setup selection. The next policy needs JEV-directed reconsideration of the
        routine, rather than code silently switching algorithms. A different case had a valid
        clearing turn that JEV missed. Those are different failures and need different tests.
      </p>
      <h3>Testing repeated decisions</h3>
      <p>
        The next revision exposed the uncollected-edge count, focused recognition on the selected
        piece, and let JEV reconsider a blocked routine. It passed 19/20 development cases and
        20/20 fresh action-cycle cases. In four short trajectories, three completed the cross;
        the fourth exhausted its 60 requests. Independent replay confirmed all recorded states.
      </p>
      <p>
        In the capped run, JEV correctly selected the empty UF slot, then chose a quarter turn
        to move it to the opposite UB slot. That required a half turn. It recovered on the next
        cycle, but repeated observations and preparation decisions consumed the request allowance.
        This round used 262 calls and cost $0.00900. These results cover early-stage decisions,
        not full-cube reliability. A focused follow-up checked all twelve distinct top-slot
        transfers. Arrow-cycle notation passed 10/12; plain direction descriptions passed 12/12,
        for $0.00043 across both forms. Both arrow-notation errors confused opposite slots with
        neighbouring slots. One call per pair does not establish repeatability; the larger
        policy still needs a fresh test with the new wording.
      </p>
      <h3>When the pieces disagree about a goal</h3>
      <p>
        With the direction wording, a new set passed 19/20 action cases and all four cross
        trajectories finished. One required 67 requests under a larger 120-request cap, so this
        is not a controlled comparison with the previous round.
      </p>
      <p>
        Connecting that controller to the full goal selector exposed a teaching conflict.
        The older reference allowed direct cross solving; the new cross controller only transferred
        petals. In all four development starts, JEV eventually chose cross with no petal to transfer
        and stopped. Those 59 calls cost $0.00275. The next experiment tests consistent goal
        definitions before attempting more full solves. Shared labels need to mean the same thing
        in every part of the process.
      </p>
      <p>
        Replacing those definitions resolved the isolated goal test: both compact facts and
        detailed face observations passed 32/32 development states, four per goal. The compact
        form used 54% fewer input tokens and then passed 32/32 different validation states.
        These are constructed goal-selection cases. Full solves still need to test whether
        the decisions work together over time.
      </p>
      <p>
        The corrected full policy then solved all four development starts: two short scrambles
        and two full random-state scrambles. They took 115 to 226 requests each and cost $0.04274
        together. Independent replay checked every move and final cube. The next ten fresh random-state
        validation attempts produced nine solves and one HTTP 529 failure. That failure remains
        in the denominator. A fresh follow-up keeps the prompts unchanged and permits one
        identical-request retry for rate limits or overload, with both attempts counted.
        The required 95/100 reliability remains untested.
      </p>
      <p>
        The bounded-retry follow-up also finished at 9/10. Its failure was a request timeout,
        which that retry rule did not cover. Before the timeout, the cube had repeated a state:
        JEV cleared space for one routine, then chose a different routine and cleared the space
        back again. Remembering the last moves had lost the purpose of those moves. The next
        component experiment will give JEV its own pending plan as memory and test whether it
        completes the setup before changing approach. The final 100-cube test remains gated.
      </p>
      <h3>Remembering a plan can introduce a new mistake</h3>
      <p>
        Giving JEV its pending routine improved prepared-action selection from 12/20 to 19/20
        on development situations. But the memory prompt then failed all six checks where the
        remembered routine no longer matched the piece. It copied the old action. We did not
        adopt that prompt.
      </p>
      <p>
        A separate resume-or-reconsider question compared the remembered plan with current
        conditions. It passed 24/24 new component cases, including changed targets, reference
        frames, positions, sticker directions and protected pieces. The integration now requires
        an explicit JEV commitment before resuming a routine. The known-loop cube then solved: JEV resumed the staging routine after its setup,
        instead of switching routines and clearing back again. All four development starts
        solved and replay-verified, costing $0.0391. The frozen policy then solved and replay-verified 10/10 fresh validation cubes,
        costing $0.10235. The frozen policy then solved 100/100 fresh full random-state cubes,
        independently replay-verified within all limits. Median solve time was 76 seconds,
        with 174 requests and 160 face turns. The final test committed $1.015, including
        reservations for two uncertain requests that were retried. The two earlier 9/10
        results remain in the record. This measures one held-out set with supplied beginner
        routines and reliable code observations; future success is not guaranteed.
      </p>
      <p>
        The fixtures were filtered to have usable routines for eligible targets. Five cases per set
        require a cross handoff rather than an action. These are controlled component tests, not a
        representative full-scramble solve rate. Memory is present in the interface but its
        usefulness was not isolated in this experiment.
      </p>
      <p>
        <Link to="/request-flow">
          Inspect the exact requests and responses in the whiteboard viewer →
        </Link>
      </p>
      <details>
        <summary>Reproduce this study and interpret the assistance</summary>
        <p>
          Use Bun from the repository root. Saved results are under{' '}
          <code>experiments/observation-boundary-v1</code>. The policy module has no access to the
          evaluator. The offline evaluator may inspect candidate outcomes to establish acceptable
          labels, but those outcomes never enter a live request.
        </p>
        <p className="fine-print">Historical experiment. Its runners have been retired; the measured findings remain here. See docs/research for the notebook and bun run verify:recordings for the current solver.</p>
        <p>
          Existing study markers prevent accidental reruns. The shared ledger limited this experiment
          to 400 requests and $0.05 including outstanding reservations, within the project’s $
          {'5'}
          ceiling. At most four calls run concurrently and failed requests are not retried. Preserve
          the existing results when designing a new study.
        </p>
      </details>
    </section>
  );
}
