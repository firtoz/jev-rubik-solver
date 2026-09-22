# Daisy-to-cross transition study

Fixed model jev-1.13.0. Scope: follow a supplied daisy-first beginner method, with three available goals on every case. Cross-complete cases have unfinished corners. This is neither an optimal-action test nor the complete eight-goal policy. No moves, retries, answer voting, candidate simulation or response correction.

20 development cases, five each: incomplete daisy (two/three petals), four-petal daisy, partial transfer (remaining petals plus correctly solved bottom edges total four), cross complete. Twenty validation states exclude every development hash but share controlled generator families. Offline piece mechanics independently verify grid-based labels and all eight checks. Expected answers and scrambles are excluded from live recognition requests.

| First development round | Goals | Checks | Calls |
| --- | --- | --- | --- |
| Direct grids | 12/20 | n/a | 20 |
| Full grids → checks → goal | 11/20 | 160/160 | 40 |
| Focused literal cells → checks → goal | 13/20 | 160/160 | 40 |
| Golden checks supplied to goal (isolated diagnostic) | 12/20 | supplied | 20 |

The focused input copies fixed U sticker colors and fixed D/side sticker pairs. Code does not compare colors. Model-produced yes/no checks are passed unchanged into later calls. The gold variant deliberately supplies offline labels and is never counted as recognition success.

Second development round in ../daisy-decision-development reuses the actual saved focused-model checks. Recognition was not repeated. Checks-only with explicit option rules scored 18/20 (20 calls). Model counts followed by the short goal options scored 20/20 (40 calls). Model counts followed by explicit option rules also scored 20/20 (40 calls). Both counts were correct for every case. Selected counts-plain by equal accuracy, equal requests and lower token cost. The three variants change context and instructions together; this does not isolate the effect of counting alone.

Frozen fresh validation in ../daisy-decision-validation:

| Complete pipeline | Goals | Recognition | Counts | Calls |
| --- | --- | --- | --- | --- |
| Direct | 13/20 | n/a | n/a | 20 |
| Focused checks → explicit goal rules | 18/20 | 160/160 | not requested | 40 |
| Focused checks → JEV counts → goal | 20/20 | 160/160 | 40/40 | 60 |

Checks-only validation failures 4 and 5: incomplete daisy, actual cross, expected daisy. The count-based chain did not fail these cases. No validation tuning. All attempts are in the denominator, no provider failures. Study stopped after validation.

Total 340 requests, estimated $0.0121674 at the project ledger rate $0.042/M input tokens (provider pricing verified 2026-09-21). Requests conservatively reserve 64k-token maximum cost before dispatch. At most three workers in each executed batch. All runs have immutable SQLite request/response records as well as JSON results; source.ts freezes each round. Original fixtures and labels are preserved.

## Interpretation

The preceding integration exposed an inadequate goal label. This study explicitly recognizes full and partially transferred daisies. It suggests useful summaries matter: correct flags were not enough, while model-produced counts plus the reference passed the small validation set. No broad reliability claim, no inference of hidden model reasoning. Next: bounded integration, with JEV choosing routing and no code-generated case labels. The old solver remains unchanged.

## Reproduction

Offline:

```sh
bun test tests/daisy-transition.test.ts
bun scripts/summarize-daisy-transition.ts
```

Historical live commands (charge shared budget; existing started directories are protected):

```sh
bun scripts/request-eval/daisy-transition.ts --variants=direct,regions,focused,gold
bun scripts/request-eval/daisy-decision.ts
bun scripts/request-eval/daisy-decision.ts --validation --variants=direct,checks-only,counts-plain
```

The second command depends on the actual first-round focused responses. Validation generates new legal states and reruns the full chain. Source snapshots and fixtures are saved alongside results. Article summary is generated from saved records.
