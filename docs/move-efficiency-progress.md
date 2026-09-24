# Progress toward 100-turn solves

Baseline: 0/100 within 100 turns in the prior confirmation. Its 94 complete solves averaged 176.5 turns. That set is now diagnostic material and will not be reused as a fresh final test.

## Offline stage audit

Means cover the 94 completed solves. All 100 original records were reconstructed; incomplete trajectories remain in the JSON. Returns to a prior physical state can span stage boundaries. Raw regression counts include coincidental upper-layer structures and must not be read as preservation failures.

| Stage | Mean turns | Maximum | Returns to prior states |
|---|---:|---:|---:|
| daisy | 9.9 | 23 | 4 |
| cross | 6.4 | 8 | 0 |
| first-layer | 33.9 | 91 | 7 |
| middle-layer | 49.0 | 85 | 0 |
| top-cross | 7.2 | 12 | 0 |
| top-orientation | 16.3 | 21 | 0 |
| top-corners | 31.7 | 159 | 87 |
| top-edges | 22.1 | 66 | 38 |

## Corner experiments

Round1 single-request structured/player/effects-only forms passed 1/12, 2/12 and 1/12 development cases. Round2 separated recognition from action: model-recognition completed 12/12 stages but only 7/12 within tight case move ceilings; measured recognition completed 11/12, 4/12 within ceilings. All 148 model pair-color judgements were correct. Remaining errors included U' followed by U2 instead of U. Different outputs on identical downstream inputs prevent attributing the apparent arm difference to recognition source.

Round3 tried conditional intention/reference/destination questions with a separate turn question. Both letter/word variants passed 0/12: intention selection failed before alignment was reached. Round4 made the numeric pair-count prerequisites explicit. Both batched and separate questions passed 12/12 development cases. The batched form used fewer calls, was frozen, and passed all 12 untouched validation cases.

Development and validation jointly cover all 24 oriented upper-corner permutations, with parity-compatible upper edges. Correct done recognition and preservation of lower layers/orientation are required. Case ceilings are 1, 15 or 29 turns. Labels and evaluator mechanics never enter requests. The first screen cost $0.009195648; the separate alignment diagnostic, including validation, cost $0.006911352. No transport errors in either.

Assistance remains substantial: code measures pair colors/counts, and static criteria teach when to align versus permute and where a T-perm's matching pair belongs. JEV chooses intention, reference, destination and turn. No state-specific recommendation, action simulation or tactical repair. Round2 changed both decomposition and rule placement, so causal claims about either alone are unwarranted.

## Paired full solves

Four new random-state scrambles, identical starts for old and candidate policies. Only the model-selected top-corners branch changes. Both arms make live independent calls, so earlier trajectories can diverge. They have identical 100-turn, 500-request and 10-minute active limits. A complete routine that would cross the turn limit is not executed. All capped attempts stay in the results.

| Pair | Controller | Outcome | Turns | Requests | Executed stage turns |
|---|---|---|---:|---:|---|
| pair-1 | baseline | capped | 99 | 160 | daisy: 7; cross: 7; first-layer: 34; middle-layer: 51 |
| pair-1 | candidate | capped | 98 | 161 | daisy: 7; cross: 7; first-layer: 26; middle-layer: 36; top-orientation: 21; top-corners: 1 |
| pair-2 | baseline | capped | 94 | 140 | daisy: 11; cross: 7; first-layer: 13; middle-layer: 51; top-cross: 12 |
| pair-2 | candidate | capped | 94 | 140 | daisy: 11; cross: 7; first-layer: 13; middle-layer: 51; top-cross: 12 |
| pair-3 | baseline | capped | 96 | 189 | daisy: 12; cross: 7; first-layer: 33; middle-layer: 44 |
| pair-3 | candidate | capped | 100 | 147 | daisy: 13; cross: 6; first-layer: 13; middle-layer: 42; top-orientation: 14; top-corners: 1; top-edges: 11 |
| pair-4 | baseline | capped | 93 | 157 | daisy: 8; cross: 7; first-layer: 35; middle-layer: 43 |
| pair-4 | candidate | capped | 97 | 150 | daisy: 8; cross: 7; first-layer: 25; middle-layer: 51; top-cross: 6 |

Project commitment at verification: $7.958221, including reservations, below $9. This small comparison does not establish 95/100 reliability. See exact requests, frozen sources and independent replay outputs in experiments/efficiency-v1/. Existing solver and original outcomes are unchanged.

Offline verification: bun test tests/efficiency-corners.test.ts; bun scripts/efficiency-v1/verify-screen.ts; bun scripts/efficiency-v1/verify-paired.ts. Do not rerun live screens for verification.
