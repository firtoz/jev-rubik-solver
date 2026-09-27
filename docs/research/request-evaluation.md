# Request-level wording experiments

> Historical study note. Status, budgets and original commands describe this experiment at the time. See the [research index](README.md) for current code and available records.

The unit of evaluation is one real JEV request, not an entire solve. Use **20 distinct cube inputs**, one live call per input per wording variant. Compare up to four variants on identical states, context, question keys and option menus. Do not repeat identical calls as a substitute for case diversity.

The first experiment covers the production cross-stage assessment request: target selection plus four independent edge-intention questions. Capture the actual request builder without calling JEV or executing an action. Accept any unfinished target; score all four intention answers against offline labels. Also report the operational result (chosen target and that target's intention), since unused intention answers can fail without affecting the next action.

Development includes 15 single-turn states, the observed sideways-edge failure, and four fixed-seed five/ten-turn scrambles. Twenty separate fixed-seed five/ten-turn states form validation. A pure U turn leaves the yellow cross finished, so it is inappropriate for this cross-assessment request; include it in a goal or last-layer request suite instead. Reject duplicate states and inappropriate fixtures before spending.

Golden answers live only in the evaluator. For insert/alignment labels, independently verify the labelled relationship using cubing.js transformations offline. The solver never imports scoring code or receives labels, scramble history, fixture IDs, candidate outcome scores, or simulated solutions. Accept several answers when the request permits several valid choices. Ambiguous strategic/recovery cases need an explicit rubric rather than a fictional unique optimum.

## Iteration and stopping

1. Freeze cases, accepted answers, requests, sources and selection rule before calling JEV.
2. Evaluate the incumbent and three wording variants with interleaved ordering.
3. Rank whole-request exact-match accuracy; inspect per-case and chosen-target results. An equal score is a plateau, not an improvement. Twenty cases give a coarse development estimate, not a statistical reliability claim.
4. Use an improving variant as the next development seed. Compare new variants on the same development cases, recording all generations rather than hiding failed candidates.
5. Stop on a plateau/regression, request error, or cost ceiling. Validate the selected seed against the incumbent once on the separate validation set. If validation informs another revision, retire that set first.
6. Report results and pause for user decisions. Do not automatically launch full-cube evaluations or change the production policy merely because a development variant wins.

Each invocation has no automatic retries, four concurrent calls at most, an exclusive lock against accidental reruns, a fixed request count and an additional $0.15 spend/reservation ceiling. The shared $5 project cap still applies. Interruptions finish only in-flight requests. Failed calls remain failures; unattempted cases are explicitly counted.

Raw requests/responses stay in immutable SQLite events. `experiments/<id>-<split>/frozen.json` holds the frozen design; `results.json` contains per-case choices, errors, confidence, usage, latency and aggregates. Confidence is never substituted for measured accuracy. No HTML report is generated.

```sh
bun scripts/request-eval/run.ts                  # offline preview and fixture checks
bun scripts/request-eval/run.ts --live           # 20 cases × 4 variants = 80 calls
# After selecting a seed on development:
bun scripts/request-eval/run.ts --validation --variants=baseline,SEED --live
```

Other request suites should use the same pattern: goal (multiple acceptable strategies), reference (valid frame constraints), operation (the stated local objective and preservation requirements), daisy preparation/clearance (exact occupancy conditions), primitive turn (explicit short local objectives). Recovery cannot always be assigned a unique ideal answer from one state.

The initial `assessment-wording-v1` repetition experiment was interrupted after the user clarified that inputs should differ. It is retained as an abandoned consistency experiment and must not be pooled with distinct-state accuracy results.

## First distinct-input result

`assessment-unique-v1`: incumbent, literal-fields and ordered-checklist each scored 20/20 development requests; compact-table scored 19/20. On 20 separate validation states, incumbent and checklist tied at 18/20 whole-request correctness. The chosen-target-and-intention metric was 18/20 versus 19/20 respectively. This is insufficient to promote a new wording: failures moved to different cases and checklist also used slightly more tokens. Stop on this plateau and retain the production wording.

Incumbent validation errors confused sideways yellow edges with ready-to-insert petals. Checklist errors instead called yellow-up, unaligned petals extraction cases. A useful next experiment is to separate target selection and target-only intention classification, and include recorded solve context rather than only fresh observations. If these validation errors guide that revision, retire this validation set and generate a new one.

The corrected experiment made 120 live requests and cost $0.012192348. The abandoned repetition batch made 379 requests and cost $0.038724756 before interruption; those results are not pooled into accuracy estimates. All API work is now stopped. No production prompt change or full-solve evaluation was launched.

## Separate-target experiment

`separate-assessment-v1` compares combined assessment against sequential target→intention requests: same full observation, selected-piece-only observation, and selected-piece-only with an ordered checklist. Each split intention question uses the target actually chosen by JEV; code does not substitute a golden target. All variants are scored on the same operational target/intention pair, not a differing number of auxiliary answers.

Twenty development states included one actual failure with recorded recent actions and previous target, plus distinct controlled five/ten-turn states, some with two subsequent applied actions. Twenty fresh validation states used a different seed and excluded all previous suite states. Synthetic recent actions are factual transformations, not claimed prior model decisions. Golden labels remain entirely offline.

All four development variants scored 19/20. Every one failed the recorded DR-at-UR case with yellow facing R: it is directly above home but not yellow-up. The combined and full-split versions said align; focused and checklist versions said insert. Validation scored combined 20/20, focused split 19/20. The focused split took about 599 ms per decision pair versus 326 ms combined in this sample, with nearly identical token cost. No prompt or policy was promoted. The experiment paused after this plateau/regression.

Total: 200 live API requests, $0.013192494. No full-solve runs were launched. The next useful probe would test observed sticker-direction recognition before action-category selection, including contrasting positions, orientations and recent history.

```sh
bun scripts/request-eval/run-separate.ts # offline preview; existing live recordings are locked
```

## Recognition before intention

`recognition-v1` isolates intention for a fixed target per case; target selection is not being evaluated. It reuses the prior 20 development states and generates 20 fresh validation states excluding prior validation positions. Development includes 14 extraction, three insertion and three alignment targets.

Direct intention scored 19/20 development and 20/20 validation. Asking JEV only for the observed yellow sticker direction first, then passing its actual answer into the intention request, scored 20/20 on both. All direction observations were correct. Asking for four facts also scored 20/20 intentions on development, but made observation errors on two cases and cost more. Feeding only the four model-reported facts into the final request scored 19/20.

Because recognition variants also included an explicit sideways-sticker reminder, a wording-only control tested that same reminder without the preceding observation call. It remained at 19/20 and missed the same recorded failure. This supports direction-first as the next experimental seed, although the sample is small and measures a single request type rather than autonomous solves.

The recurring failure: DR at UR with yellow facing R is above home but needs extraction/reorientation. Direct intention and wording-only control incorrectly chose insertion. Direction-first correctly reported R, then chose extraction. Code did not correct the reported direction or choose the intention.

Total including the control: 220 calls, $0.007092582. Production is unchanged; work paused after the comparison. Frozen manifests, full native records and the seed decision are saved under `experiments/recognition-*`. A small end-to-end development comparison is the next integration check; no full-scramble reliability claim follows from this result.
