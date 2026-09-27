# JEV request capability coverage

> Historical study note. Status, budgets and original commands describe this experiment at the time. See the [research index](README.md) for current code and available records.

“Measured” applies only to the listed fixtures, not all cube situations. Deterministic tests verify mechanics, input construction, and offline labels; live experiments measure model choices. The current v26 policy integrates the measured middle-extraction prompts and decomposed cross decisions. Historical sections below describe earlier experiment checkpoints.

| Request family | Current evidence | Remaining work |
|---|---|---|
| Goal | Small labelled probes and integration traces | Systematic distinct-case suite |
| Target + intention | Cross phase pipeline 20/20 development, 18/20 validation before alignment fix; replacement alignment question 16/16 exhaustive slot pairs | Fresh combined validation; broader stages and target selection |
| Reference | Broad 19/20 development, 20/20 held-out yaw; middle extraction 20/20 development + 20/20 fresh validation; cross extraction frame + operation 20/20 development + 20/20 validation | Broader case families and integration |
| Daisy lift | Mechanical fixtures and development traces | Isolated capability suite |
| Preparation | Small occupancy probes | Broader distinct-input suite |
| Clearance | Small occupancy probes | Broader distinct-input suite |
| Operation | Broad baseline 19/20 development, 18/20 validation; middle-extraction compact variant 20/20 development + 20/20 fresh validation; cross extraction frame + operation 20/20 + 20/20 | Broader cases and integration |
| Recovery | Recorded solve behaviour | Acceptable-action rubric and isolated suite |
| Primitive target / turn | Earlier trials | Independent capability suites |

Three of eight skill-policy families have systematic but partial coverage; five have insufficient isolated coverage. No family is comprehensively verified. Five narrowly scoped components pass their current suites: middle-extraction reference, middle-extraction operation, cross-lift reference/operation, cross alignment (16 abstract position pairs), and corner-orientation reference/operation (26 non-solved patterns). These are not five fully verified families.

## Latest integration checkpoints

The v22 model-owned-goal diagnostic batch solved three of four attempted cases, then failed on `R U2 F' L D`; the fifth assigned case was unattempted. v23 retried that failure and hit a repeated-state ceiling. Inspection showed that daisy-style lifts could undo solved bottom cross edges. v24 introduces independently mechanically tested cross-preserving skills; JEV still chooses reference and operation. Its focused cross-lift suite passed 20/20 development and 20/20 validation. Full integration and 95/100 held-out acceptance remain unproven.

New evidence is stored in `experiments/operation-*`, `experiments/cross-phase-v1-*`, `experiments/cross-alignment-exhaustive-v1`, and `experiments/cross-lifts-v1-*`. Cross-phase validation failures informed the alignment replacement, so the old validation set is retired for that change. The 16/16 alignment result is an exhaustive tiny geometric question, not a fresh full-cube validation set.

## Reference selection: reference-v1

Ten templates cover all eight stages: daisy side-facing edge; cross alignment; corner insertion/extraction; middle insertion/extraction; white edge line; Sune orientation; corner pair; and final edge cycle. Each appears in two development yaw orientations and two held-out yaw orientations. All 40 cube states are distinct. This is an orientation-transfer test, not validation on independent case families.

The exact live reference request is captured after supplying a known target and intention. Labels are computed only in the evaluator from geometric constraints in each frame. Multiple correct frames are accepted. Last-layer labels are additionally verified by executing the documented skill offline. No labels or simulated outcomes are included in JEV requests.

| Variant | Development | Held-out orientations |
|---|---:|---:|
| Current | 19/20 | 20/20 |
| Explicit field checklist | 19/20 | Not run |
| Concise options | 19/20 | 19/20 |
| Concise options + checklist | 19/20 | Not run |

Current wording missed one middle-edge extraction case: it selected F instead of R, consistent with attending to the destination instead of the current slot. Both concise variants fixed that case but failed a corner-pair frame; concise also failed a corner-pair case in validation. Retain current wording and pause on this plateau. No production change or full solves were run.

Coverage gaps include daisy bottom lifts, cross extraction, white-edge dots/elbows, and other last-layer patterns. The next focused experiment should contrast current position and destination in middle-edge extraction before marking reference selection green. Operation selection can then be tested with supplied correct reference frames.

120 live calls; $0.011307408. Per-stage counts, exact failures and frozen sources are saved in `experiments/reference-v1-decision.json` and the associated development/validation directories. If validation failures inform future variants, retire that validation set.


## Middle-edge extraction: extraction-reference-v1

The targeted suite has 20 development and 20 fresh validation states, with five targets in each current middle slot. All targets occupy a slot different from their destination. Legal insertion/extraction sequences preserve the completed first layer; each labelled reference is independently checked by applying an extraction and verifying that the target reaches U without disturbing that first layer. One historical development failure is intentionally retained; all other old reference states and cross-split duplicates are excluded.

| Variant | Development | Fresh validation |
|---|---:|---:|
| Current reference request | 16/20 | 13/20 |
| Explicit current-slot mapping | 20/20 | 20/20 |
| Read position, then use full reference views | 5/20 | Not run |
| Read position, then choose from that observation only | 19/20 | Not run |

Every position observation was correct in both sequential variants. The full-view sequential variant nevertheless selected F in all 20 cases. More decomposition did not automatically improve decisions.

The winning request states the same fixed geometric rule in every case: current FR→front F, BR→R, BL→B, FL→L. This rule supplies reference-frame knowledge; JEV still reads the observation and selects the frame. Code does not compute the selected answer. The candidate is scoped to middle-layer extraction and is now integrated by measured-policy.ts; other stages retain their own reference instructions.

Keep `slot-rule` as the next experimental seed. Next evaluate operation selection with verified target, intention and reference inputs. Current-position-equals-destination cases, other reference stages, and integration error propagation remain outside this focused result.

160 calls, $0.011156124. All 44 deterministic tests and typecheck passed. No full solves or background runs were started. Results and source snapshots are under `experiments/extraction-reference-v1-*`.

## Corner orientation: orientation-v1 (v25)

The v24 retry (`9f03bd10-c759-40d1-8a95-796de06a6d3c`) completed the cross and lower two layers, then repeated a top-orientation state and hit the diagnostic stop: 130 requests, 118 turns, $0.01051533. JEV alternated Sune and inverse Sune in a two-white-up pattern; existing instructions only explained the one-white-up finishing cases.

The revised reference request contains only the white-up count and four coordinate views mapping corner positions to white sticker directions. It teaches a fixed beginner repeated-Sune staging rule: zero white-up corners → white L at ULF; one → white U at ULF; two → white F at ULF. JEV chooses the frame, then independently selects the operation. Code does not inspect the pattern to choose either answer or simulate candidate outcomes.

The offline fixture generator enumerates all 27 corner-orientation patterns reachable with lower layers and top edges oriented. All 26 non-solved patterns passed live reference + operation probes (52 requests, $0.001751568). Target/intent were supplied offline. This is exhaustive orientation-pattern coverage for the compact observation, not a whole-cube or goal-selection test. A deterministic test verifies every frame permitted by the static rules converges in at most three Sune applications and preserves the lower layers/top cross. Full v25 integration is a separate measurement.

Evidence: `experiments/orientation-v1-development/`, `tests/orientation-strategy.test.ts`; full local suite: 49 passed, typecheck passed.

The v25 diagnostic integration batch `d74bc402-2e1b-4483-b896-069a1a63e66e` solved all five development cases: 478 requests, 522 face turns, $0.038786958. These are short/stage-specific scrambles, not a full random-state reliability evaluation. Fresh random-state development cases are the next check.

The subsequent v25 full random-state development batch `53ebeb9d-f1ff-469b-945c-066ad66324f3` solved 4/4 independently replay-verified cases (585 requests, 591 turns, $0.048153504). None reached the diagnostic ceilings. Total project settled usage after the batch was $1.887842250, plus $0.002688 retained uncertain reservation. Next: frozen validation with full acceptance limits; then a separate fresh 100-case final test if supported.

## Frozen v25 validation and final evaluation

Fresh full random-state validation `00761d84-ca98-46cb-9718-55b87fc5e2b6` completed at 8/8 autonomous, independently replay-verified solves. Fixed limits: 500 requests, 1,000 turns, 10 minutes per run. Aggregate: 1,332 requests, 1,429 turns, 2,588,560 input tokens, $0.10871952; 8 recovery decisions. Results are preserved in `experiments/v25-frozen-validation.json`. No prompt changes were made during validation.

The unchanged source is now assigned to a separate 100-case held-out evaluation `b0153e76-5ec2-46ee-b3f3-31004824d8b0`, dataset `final-test-40ec353f-0fca-44b7-953d-5cea61a93e6b`. It is incomplete; no acceptance claim yet. Run four-case batches with `bun scripts/evaluate.ts batch b0153e76-5ec2-46ee-b3f3-31004824d8b0`. Do not modify frozen policy/evaluator sources while this evaluation remains active. More than five failures retires the test as futile; preserve failures and unattempted counts. If results inform tuning, use a new held-out dataset afterward.

## v25 held-out failure and v26 focused repairs

Evaluation `b0153e76-5ec2-46ee-b3f3-31004824d8b0` retired after 36 attempts: 30 solved, 6 failed, 64 unattempted; 95/100 became impossible. All six failures remain in the denominator. Cost $0.460935804. Full manifest/results are preserved in `experiments/v25-retired-final.json`. This dataset is now development material and must never be reused for a final claim.

Failure inspection found three cross-lift operation abstentions (all local FR/yellow F), two top-orientation operation abstentions (zero white-up corners, otherwise correct frame), and one middle intention incorrectly reporting done for a flipped edge occupying its home slot. The old Sune option described only the finishing case despite instructions allowing preparation; cross lift criteria also left matching less explicit.

v26 makes cross-lift option starting conditions explicit and sends only current local position/yellow direction, aligns the Sune option with the repeated-Sune staging rules, and canonicalizes corner-map ordering. Development component regressions passed 26/26 orientation patterns and 20/20 cross lifts. This reuses earlier fixtures; do not describe it as fresh validation. The six exact retired failure states initially passed 5/6, isolating the middle intention error. Middle assessment now asks target first, then intention using solved/currentLayer/sideStickersMatchingCenters only; JEV still selects both. Full one-action regression then passed 6/6 (`experiments/abstention-regressions-v26-middle/`). These are component regressions with supplied goals, not six autonomous full solves. Fresh full validation is next before any new held-out final test.

## Frozen v26 validation and new final test

Fresh v26 full validation `8d7e7a7c-f37a-4d2a-820a-6d54e6f91d64` passed 8/8 autonomous replay-verified solves: 1,274 requests, 1,156 turns, 2,289,308 input tokens, $0.096150936, four recovery decisions. Saved in `experiments/v26-frozen-validation.json`. All 50 local tests, typecheck and build pass.

The unchanged v26 policy is now frozen in evaluation `6f780b2b-6782-42c5-a5c1-77b04902e94e`, with fresh 100-case dataset `final-test-a40f55d2-97c4-447b-825d-fb9f7d9de03c`. Continue via `bun scripts/evaluate.ts batch 6f780b2b-6782-42c5-a5c1-77b04902e94e`. Do not alter frozen policy/evaluator sources until complete or retired. Same limits, denominator and >5-failure futility rule apply. This test is now complete: **99/100 autonomous replay-verified solves**. The one failure was HTTP 503, retained in the denominator. See [final results](results.md). Earlier incomplete-status statements in this document describe historical checkpoints.
