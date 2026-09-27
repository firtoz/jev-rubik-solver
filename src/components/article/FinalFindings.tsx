import { Link } from '@tanstack/react-router';

export function ReaderOrientation() {
  return (
    <>
      <div className="article-reader-context">
        <div>
          <h3>The model</h3>
          <p>
            <a href="https://docs.typesafe.ai/api">JEV is TypeSafe's decision model</a>. We send a
            description of the current situation, a question and named options with instructions.
            Its <code>choice</code> response contains a selected option and probabilities. Our
            program uses that answer to build the next request or execute an action.
          </p>
          <p>
            “Teaching” here means writing those observations, instructions and options. We used the
            same hosted model, jev-1.13.0, throughout; we did not train its weights.
          </p>
        </div>
        <div>
          <h3>The puzzle</h3>
          <p>
            A 3×3 cube has edges with two stickers and corners with three. A piece is solved when
            its colors match the surrounding centers. Turning a face moves several pieces at once,
            so placing one piece can disturb earlier work.
          </p>
          <p>
            In cubing, an <em>algorithm</em> is a memorised sequence of turns. We call these
            routines. A request can select a whole routine, while our move limit counts every face
            turn inside it.
          </p>
        </div>
      </div>
      <details className="article-primer">
        <summary>Cube notation and the solving stages used here</summary>
        <p>
          <code>U D F B R L</code> mean up, down, front, back, right and left. A letter is a
          clockwise quarter turn viewed directly at that face; a prime reverses it; <code>2</code>{' '}
          means a half turn. <code>U' F' U F</code> is four face turns. We count half turns as one
          too, using the half-turn metric (HTM).
        </p>
        <p>
          Our fixed frame has yellow on the bottom and white on top. This color choice does not
          change the puzzle. A reference front changes how a routine's notation is mapped onto the
          cube, independently of the camera.
        </p>
        <dl className="article-glossary">
          <div>
            <dt>Daisy and cross</dt>
            <dd>
              Gather yellow edge stickers around the white top center as petals, then transfer them
              to a yellow bottom cross with side colors aligned. The daisy is a preparation step; it
              is not a solved layer.
            </dd>
          </div>
          <div>
            <dt>F2L: first two layers</dt>
            <dd>
              Solve each bottom corner together with its matching middle-layer edge. Four such pairs
              complete the bottom two layers.
            </dd>
          </div>
          <div>
            <dt>Last-layer orientation</dt>
            <dd>
              Turn the white stickers upward, first edges and then corners. Their side colors may
              still be misplaced. This solver orients edges and corners in separate steps, rather
              than using the full one-look OLL (orientation of the last layer) method.
            </dd>
          </div>
          <div>
            <dt>PLL: permutation of the last layer</dt>
            <dd>
              Move the oriented top pieces to their correct positions while restoring the lower
              layers. The supplied library includes complete PLL routines.
            </dd>
          </div>
        </dl>
        <p>
          This is a hybrid teaching method: beginner-style cross preparation, supplied F2L routines
          and last-layer algorithms. It is not a model inventing CFOP, an optimal solver or a
          speedcubing benchmark.{' '}
          <a href="https://www.rubiks.com/solution-guides">Rubik's beginner guides</a> introduce the
          puzzle and a simpler layer-by-layer method.
        </p>
      </details>
    </>
  );
}

export function FinalApproach() {
  return (
    <>
      <p>
        We got further by asking what a practiced player would notice. A player can recognise a
        trapped edge, remember which pair they are working on and execute a familiar algorithm. They
        do not need to invent a solution one face turn at a time.
      </p>
      <p>
        We gave JEV that routine vocabulary and reliable measurements. Its job was to decide which
        routine applied, how to prepare for it and when to change course. This is substantial
        teaching, and part of what made the result possible.
      </p>
      <ol className="article-decision-path">
        <li>
          <b>Measure the current cube.</b>
          <p>
            Code reports piece locations, sticker directions and completed structures in a fixed
            frame. JEV never receives the scramble history.
          </p>
        </li>
        <li>
          <b>Choose what to work on.</b>
          <p>
            JEV selects a goal and a target from the observations, with the previous target and
            recent actions as memory.
          </p>
        </li>
        <li>
          <b>Recognise and prepare.</b>
          <p>
            JEV chooses which face to treat as front for the routine. It decides whether to lift a
            trapped piece into the top layer (extract it), line it up, or clear the slot it will
            move into. Those answers become inputs to the next question.
          </p>
        </li>
        <li>
          <b>Choose a familiar routine.</b>
          <p>
            JEV matches the observed situation to supplied algorithms. For the first two layers
            (F2L), it first recognises the corner’s location and orientation. That selects a smaller
            group of routines; JEV then examines both the corner and its matching edge to choose
            one.
          </p>
        </li>
        <li>
          <b>Execute and look again.</b>
          <p>
            Code applies the selected moves and measures the result. Repeated states can trigger a
            JEV recovery decision. Incorrect choices are recorded rather than repaired by code.
          </p>
        </li>
      </ol>
      <div className="article-note">
        <b>A routine choice in miniature</b>
        <p>
          Suppose the chosen corner and edge are both in the top layer, ready to be inserted as a
          pair. Code reports their positions and sticker directions. JEV first identifies the corner
          family, then compares the pair with the routine descriptions in that family.
        </p>
        <p>
          For one supplied reference case, the matching routine is <code>U' F' U F</code>. The
          response names that routine; code retrieves its four turns and applies them in the chosen
          frame. The routine restores the cross and other pairs at the end, though pieces move
          during execution.
        </p>
        <p className="fine-print">
          Illustrative library case, not a quoted model explanation. Exact reference: corner UFR
          with its down-color sticker facing R; edge UF with its front-color sticker facing F. In
          plain terms, the corner is at top-front-right and the edge at top-front. Their colors
          matter as well as their positions.
        </p>
      </div>
      <p>
        This is a sketch of the loop, not five fixed API calls. Independent questions can share a
        request; a question that needs a previous answer must wait. Some choices remain simple rule
        checks that ordinary code could perform. We left these with JEV to measure where the
        decision chain succeeds or breaks; that is an experimental choice, not a recommendation to
        put every predicate behind an API. The measured capability is applying a supplied method
        across many decisions. The analogy to a player describes how we organised the task; it does
        not establish human-like reasoning inside the model.
      </p>
      <div className="article-note">
        <b>What stayed in code</b>
        <p>
          Cube mechanics, factual observations, coordinate conversions, execution and scoring. The
          solving policy has no search, no ranking of simulated outcomes and no solver fallback. We
          supply routines for first-two-layer pairs and last-layer permutation (PLL). JEV chooses
          when and how to use them. The code does not select the matching case for it.
        </p>
      </div>
      <p>
        <Link to="/request-flow">
          Inspect a recorded round's observations, questions and answers
        </Link>
        . The viewer identifies its recording; it is not a replay of every case in the final
        evaluation.
      </p>
    </>
  );
}

export function FinalResults() {
  return (
    <>
      <p>
        We tested questions on varied labelled situations, compared a few variants on the same
        inputs, then tested complete stages from identical starting states. Promising changes had to
        survive small paired full solves before a final test on 100 new random-state cubes. “Frozen”
        means the prompts, routine library and code were fixed before that test; expected answers
        stayed in the evaluator, outside model requests.
      </p>
      <p>
        To measure our last changes, we compared two versions of the routine-based solver.{' '}
        <b>Full-menu solver</b> asks JEV to select an F2L routine from the whole library.{' '}
        <b>Grouped-menu solver</b> first asks for the corner family, then shows that family’s
        routines. It also refines early preparation with explicit landing-space protection and
        routine turn costs. Both supply algorithms and let JEV choose actions; neither is the
        single-turn approach shown above.
      </p>
      <div className="article-table-wrap">
        <table className="article-results-table">
          <caption>Two routine-based solvers, each tested on 100 fresh cubes</caption>
          <thead>
            <tr>
              <th scope="col">Measure</th>
              <th scope="col">Full-menu solver</th>
              <th scope="col">Grouped-menu solver</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Solved</th>
              <td>97 / 100</td>
              <td>98 / 100</td>
            </tr>
            <tr>
              <th scope="row">Median turns, successful solves</th>
              <td>81</td>
              <td>79</td>
            </tr>
            <tr>
              <th scope="row">Median elapsed time, successful solves</th>
              <td>100 s</td>
              <td>125 s</td>
            </tr>
            <tr>
              <th scope="row">API calls, all 100 attempts</th>
              <td>12,731</td>
              <td>13,616</td>
            </tr>
            <tr>
              <th scope="row">Estimated API cost + reservations</th>
              <td>$0.426</td>
              <td>$0.408</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The grouped-menu solver used fewer median turns and cost less, but made more requests and
        took longer. These were separate test sets, so 98 versus 97 does not establish higher
        underlying reliability. Every recorded move sequence was replayed to check the result. Both
        tests allowed at most 100 face turns per cube, counting each half turn as one. Table costs
        cover all 100 attempts and include a small allowance retained for uncertain failed requests,
        explained in the appendix.
      </p>
      <p>
        Two changes earned their place: asking JEV to prepare a free destination for a yellow edge
        reduced cross-building moves; splitting F2L recognition reduced input tokens, the text units
        billed by the API. Better wording sometimes made an isolated question more accurate without
        changing the completed solve. Combining several decisions into one request also lost
        accuracy in our extraction tests.
      </p>
      <p>
        The grouped-menu solver stopped twice: it chose the wrong reference face once and failed to
        extract a trapped edge once. It abstained rather than returning a usable move sequence. A
        transient HTTP failure was retried successfully. All cases remain in the results. Confidence
        values are provider-reported statistics; we have not calibrated them as probabilities of
        solving a cube.
      </p>
      <p>
        <a href="#appendix-final">
          See the limits, failures and full cost accounting in the appendix.
        </a>
      </p>
    </>
  );
}

export function FinalAppendix() {
  return (
    <div className="appendix-content">
      <h3>Grouped-menu solver: evaluation protocol</h3>
      <p>
        The grouped-menu solver at <code>src/solver/policy.ts</code> combines
        protected early preparation and grouped F2L recognition. Its white-edge orientation,
        white-corner orientation and PLL decisions are unchanged from the full-menu solver. These
        are the later solving stages defined in the notation guide. The model is fixed at
        jev-1.13.0. Each attempt allows 100 face turns, 500 HTTP attempts and ten minutes, with two
        concurrent attempts. A half turn counts as one; repeats and undo moves count too.
      </p>
      <p>
        The sample size was fixed at 100 before outcomes, using measured costs and a $0.50
        evaluation reserve. New starting states were checked against previous recorded scrambles. No
        prompt changes or replacement cases were allowed during the test. Result: 98 solves, two
        abstentions, no capped attempts and no unresolved transport failures.
      </p>
      <div className="article-table-wrap">
        <table className="article-results-table">
          <caption>Successful final solves: ranges and median</caption>
          <thead>
            <tr>
              <th>Measure</th>
              <th>Minimum</th>
              <th>Median</th>
              <th>Maximum</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Face turns</th>
              <td>59</td>
              <td>79</td>
              <td>94</td>
            </tr>
            <tr>
              <th>Requests</th>
              <td>93</td>
              <td>138</td>
              <td>183</td>
            </tr>
            <tr>
              <th>Elapsed seconds</th>
              <td>57.861</td>
              <td>125.030</td>
              <td>346.540</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        These extremes are not necessarily the same cases. Elapsed time includes local persistence
        and host load as well as provider calls. The runner writes growing records after each
        exchange; we have not isolated the cause of its slower final timings. Individual request
        latency was median 437 ms and p95 1,007 ms.
      </p>
      <h3>What the controlled comparisons showed</h3>
      <ul>
        <li>
          <b>Protected preparation:</b> the unchanged full-menu solver and the preparation variant
          both completed eight paired cross-stage starts. Each pair began from exactly the same cube
          state. Turns fell from 150 to 101, while requests rose from 483 to 516. Static teaching
          includes affected slots, landing requirements and routine turn counts.
        </li>
        <li>
          <b>Grouped F2L:</b> all 41 canonical cases passed across development and coverage
          validation. Both the full-menu and grouped-menu F2L variants completed eight fresh paired
          stages. Grouping used 146 versus 155 turns and 20.7% fewer input tokens. Requests rose
          from 230 to 238. Canonical coverage is not unseen-family validation.
        </li>
        <li>
          <b>Daisy wording:</b> after two rounds, isolated labels improved but eight complete stages
          still used the same 111 turns and 440 requests, at 4.7% higher cost. We did not promote
          it.
        </li>
        <li>
          <b>Combined integration:</b> the combined grouped-menu and preparation variant solved four
          of four paired starts versus three of four for the full-menu solver, with lower aggregate
          cost. On the three jointly solved starts it used nine more turns. The benefit was not
          uniform.
        </li>
        <li>
          <b>Top-cross recognition:</b> explicit definitions of adjacent versus opposite white top
          edges helped controlled cases but did not establish a full-solve gain. This alternative
          stayed out of the grouped-menu solver.
        </li>
      </ul>
      <h3>Where the final chains broke</h3>
      <div className="article-failure-example">
        <b>Case 38: choosing the reference face</b>
        <pre>
          {
            'Input: currentPosition = DF, yellowDirection = D\nTeaching: when yellow faces U or D, use the other position letter.\nExpected: F\nJEV: R'
          }
        </pre>
        <p>
          An earlier identical request returned F. After the wrong reference propagated, JEV
          reconsidered and abstained after two turns. Code did not correct the frame.
        </p>
      </div>
      <div className="article-failure-example">
        <b>Case 84: deciding whether to extract</b>
        <pre>
          {
            'Input: edgePosition = BR, precedingDecisions = [continue]\nOptions: extract-edge for BR / BL / FL; continue for UF / UR / UB / UL / FR\nExpected: extract-edge\nJEV: continue'
          }
        </pre>
        <p>
          JEV then allowed routine selection, but the edge was still trapped. Corner-family
          recognition was correct and the routine selector appropriately abstained. The failure
          began in preparation, not in missing routine coverage. Provider confidence on the missed
          extraction was 0.14; this single example does not validate a confidence-based retry
          policy.
        </p>
      </div>
      <p>
        These failures are now available for diagnosis. Any tuning based on them requires a fresh
        final test set. Exact requests and native answers are preserved in{' '}
        <code>research/evidence/grouped-menu/failure-audit.json</code>.
      </p>
      <h3>Cost and transport accounting</h3>
      <p>
        The final evaluation used 9,660,767 input tokens across 13,615 successful exchanges. At the
        recorded $0.042 per million input tokens, settled usage was $0.405752214. One HTTP 503 in
        case 98 succeeded on retry; its uncertain $0.002688 reservation remains, bringing commitment
        to $0.408440214. Bounded retries count toward every request, time and budget limit.
      </p>
      <p>
        The last development and evaluation round committed $0.599520684 in total. Cumulative
        project commitment at its end was $9.386859090, including historical reservations. A
        reservation is a conservative allowance for a dispatched request, not a confirmed provider
        charge. These are historical ledger figures, not a live account balance. Check current
        pricing before spending.
      </p>
      <p>
        Goal selection cost about $0.07059 of the final evaluation, routine selection $0.06330,
        conditional early targets $0.04649 and preparation $0.04517. Preparation made 2,637 calls.
        Cheap tokens do not make a long chain fast or immune to mistakes.
      </p>
      <h3>Records and offline verification</h3>
      <p>
        The detailed report is <code>docs/research/budget-round-results.md</code>. Fixtures,
        exact exchanges, completion accounting and replay results are under{' '}
        <code>research/evidence/grouped-menu/</code>. The public verifier needs no local SQLite ledger. The historical 97/100 result remains in{' '}
        <code>research/evidence/full-menu/</code>.
      </p>
      <pre>
        {
          'bun run verify:recordings\nbun run check'
        }
      </pre>
      <p>
        These commands make no model calls. The public verifier checks fixture uniqueness, recorded requests and native answers,
        policy replay, physical transformations and execution ceilings. Historical source-freeze
        and held-out checks are retained in the evaluation report.
        All 100 trajectories passed, along with 16 relevant boundary/mechanics tests containing
        3,541 assertions. The older evaluation runners have been retired; these records remain immutable evidence.
      </p>
    </div>
  );
}
