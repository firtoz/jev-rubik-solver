# Budget round: 98 of 100 cubes solved within 100 turns

The selected experimental policy combines protected daisy preparation with grouped F2L recognition. It solved **98 of 100 fresh random-state cubes**, with two model abstentions, no turn/request/time caps and no unresolved transport failures. All 100 trajectories were independently replayed, including the two failures. This completes the experiment; no further spending is needed for this round.

## Comparison

These are separate frozen test sets, not a paired final comparison. The one-solve difference does not establish higher population reliability. Both results meet the empirical 95/100 target.

| Metric | Historical incumbent | New candidate |
| --- | ---: | ---: |
| Solved / planned | 97 / 100 | 98 / 100 |
| Abstained / capped | 2 / 1 | 2 / 0 |
| Successful turns, min / median / max | 49 / 81 / 98 | 59 / 79 / 94 |
| Successful elapsed seconds, min / median / max | 49.042 / 100.099 / 190.118 | 57.861 / 125.030 / 346.540 |
| HTTP attempts, including retries | 12,731 | 13,616 |
| Evaluation commitment, including uncertain reservations | $0.426329484 | $0.408440214 |

The new evaluation cost about 4.2% less, used 7.0% more requests and had 24.9% longer median elapsed time. It is a supported cost/turn candidate, not a universal improvement. Timing includes local persistence and host load as well as provider response time; the runner writes growing records after every exchange. We have not isolated the cause of the slowdown. Final request latency was median 437 ms and p95 1,007 ms. There were 9,660,767 input tokens across 13,615 successful exchanges.

[New report](../experiments/budget-round-v1/final-evaluation/report.json), [full replay verification](../experiments/budget-round-v1/final-evaluation/verification.json), [historical report](../experiments/full-pll-v1/final100/report.json).

## What earned inclusion

**Protected preparation:** JEV checks landing occupancy and chooses preparation while preserving completed bottom edges. Static routine descriptions include affected slots and turn counts. On eight fresh paired cross-stage starts, both policies completed all eight; the candidate used 101 versus 150 turns, but 516 versus 483 requests and about 4.9% more cost. This is a substantial local move saving with an explicit request tradeoff. [Evidence](../experiments/early-preparation-v2/stage-validation/report.json).

**Grouped F2L recognition:** JEV recognises the corner family, then chooses from that family's routines using both pieces. All 41 canonical cases passed across development and coverage validation. This is finite library coverage, not unseen-family generalisation. Eight fresh paired stage starts all completed, using 146 versus 155 turns and 20.7% fewer tokens, but 238 versus 230 requests. Four paired full solves had identical move totals and about 6.4% lower cost. [Stage evidence](../experiments/f2l-recognition-v2/stage-validation/verification.json), [full comparison](../experiments/f2l-recognition-v2/full-integration/report.json).

The combined candidate passed its predeclared four-pair gate: 4/4 solves versus 3/4, 306 versus 307 executed turns, 526 versus 546 requests and $0.01565 versus $0.01796. On the three pairs both solved, the candidate used nine more turns. The aggregate advantage is not uniform. [Combined gate](../experiments/budget-round-v1/full-integration/report.json).

## What did not earn inclusion

Daisy wording variants improved some isolated classification scores but did not improve eight complete cross-stage trajectories: both used 111 turns and 440 requests; revised wording cost 4.7% more. We stopped after two wording rounds and changed the hypothesis to preparation. Repeated finite-domain focus inputs were repeatability checks, even where their underlying cubes differed. [Evidence](../experiments/daisy-focus-v2/stage-development/report.json).

Earlier top-cross definitions improved controlled line/elbow recognition, but their paired full comparison did not establish an integration gain. Earlier attempts to merge extraction decisions also performed worse than the sequential baseline. Neither change entered this candidate. Those studies predate this round's spending baseline. [Prior diagnosis](contextual-decision-followup.md).

## The two failures

**final-38, daisy, stopped after two turns.** The focus input was `currentPosition: DF, yellowDirection: D`. The teaching says to use the other position letter as the reference front, so the answer is F. JEV initially answered F, then answered R to the identical request after a preparation turn. That wrong reference propagated into the next request; JEV reconsidered and abstained. This is reference recognition instability, not lack of a lifting routine. Earlier rejected wording is not retrospectively proven effective by this failure.

**final-84, F2L, stopped after ten turns.** In the selected local frame, the corner was at UFR and the edge at BR. The extraction request explicitly lists BR under `extract-edge`, but JEV chose `continue` (0.43 probability versus 0.40 for extraction; provider confidence 0.14). It then incorrectly allowed routine selection. The corner family UFR-R was recognised correctly, and the routine selector appropriately answered `reconsider` because the edge had not been extracted. This is a preparation failure, not a gap in the canonical F2L routine library.

[Exact selected requests, parsed answers and native responses](../experiments/budget-round-v1/final-evaluation/failure-audit.json). Expected answers in this audit were never supplied to the live model. No tactical correction was made. These failures are now development evidence for any subsequent tuning; retire this test set before that tuning and generate fresh final cases.

A single HTTP 503 occurred in final-98, action index 19. Its bounded retry succeeded and the cube solved. It is not a model failure. The uncertain $0.002688 reservation remains in the ledger.

## Representative outcomes

These are examples selected by turn count, not three typical timing profiles. The median-turn example is one of several 79-turn solves.

| Case | Turns | Requests | Elapsed | Commitment |
| --- | ---: | ---: | ---: | ---: |
| Fewest turns: final-30 | 59 | 128 | 92.662 s | $0.003734388 |
| Median turns: final-67 | 79 | 135 | 146.753 s | $0.004050018 |
| Most successful turns: final-71 | 94 | 132 | 143.993 s | $0.004031622 |
| Longest successful elapsed time: final-97 | 78 | 134 | 346.540 s | $0.004075050 |

## Where the budget went

Starting project commitment was $8.787338406. This round added **$0.599520684**, consisting of $0.596832684 settled usage estimates and $0.002688 retained uncertain reservation. Development and integration cost $0.191080470; the final evaluation cost $0.408440214. The $0.50 evaluation reserve was respected.

The final evaluation's largest request families by settled cost were goal selection ($0.07059), routine selection ($0.06330), conditional early targets ($0.04649), preparation ($0.04517) and F2L targets ($0.03764). Preparation alone made 2,637 calls. Smaller requests can reduce tokens while adding latency and independent opportunities for error. [Complete study ledger](../experiments/budget-round-v1/costs.json) and [request-family breakdown](../experiments/budget-round-v1/final-evaluation/report.json).

Final project commitment is **$9.386859090**, including historical reservations. The estimated provider balance is **$0.885848362**, not a live reading. With the $0.10 buffer, **$0.785848362** of conservative authorised allowance remains. Unused allowance is not a reason to run more tests. Existing stricter enforcement at $9.672707452 was sufficient for this round and has not been raised to the maximum authorised ceiling.

## Assistance and interpretation

The model is taught a substantial solving method and has fixed algorithms available as learned routines. Code supplies positions, sticker directions, completion facts, affected-slot metadata, reference transformations and execution. JEV chooses goals, targets, frames, preparation, routines and recovery. The new early policy adds explicit protection/turn-count teaching. Grouping narrows the menu solely using JEV's own answer. Wrong answers pass downstream unchanged; no code search, simulated outcome ranking, automatic case matching or solver fallback was added.

This demonstrates instructed recognition and decision sequencing in a heavily structured environment. It does not demonstrate discovering cube-solving algorithms or general reasoning competence across arbitrary problems. Nor does it establish that every request benefits from a model: some remaining questions are simple predicate checks.

For the article: evaluate the whole decision path as well as isolated questions. More accurate labels may have no action benefit; extra recognition can save money while increasing calls; an apparently missing routine can actually be an earlier preparation error. Matched stage entries help distinguish these explanations. Treat each as evidence from this task, not a universal prompting rule.

## Next useful experiment

Use fresh varied cases to test reference selection and trapped-edge preparation, then test a model-directed recovery from `reconsider`. Compare the incumbent prompt with at most two alternatives, holding observations and routines constant. Separately profile persistence overhead offline before attributing slower full-run timings to JEV. Request consolidation should be tested only where questions do not require sibling answers. The saved [next goal template](next-goal-template.md) describes this future scope; it has not started.

## Reproduce the checks without API calls

```sh
bun scripts/budget-round-v1/verify-final.ts
bun scripts/budget-round-v1/report-final.ts
bun scripts/budget-round-v1/costs.ts
bun test scripts/full-pll-v1/boundary.test.ts tests/f2l-grouped-controller.test.ts tests/f2l-library.test.ts tests/f2l-preparation-sequential.test.ts tests/extraction-efficiency.test.ts scripts/protected-landing-v1/boundary.test.ts
bun run typecheck
```

The verifier uses the local ledger/event database and retained records. It checks the frozen source closure, unique held-out starting states, exact wire requests, native/parsed answers, decision replay, physical transformations, final solved states and execution ceilings. Final checks passed: 100 trajectories, 16 tests with 3,541 assertions, and TypeScript. The paid final runner must not be rerun into this completed directory.
