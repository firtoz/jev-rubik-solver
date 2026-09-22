# Frozen daisy-chain integration

Four predeclared diagnostic development starts: the first incomplete-daisy, full-daisy and partial-transfer fixtures from daisy-transition-development, plus R from the earlier failed integration. These are reused cases, not held-out reliability tests.

JEV inspects literal sticker colors, produces eight checks, counts petals and correctly solved bottom edges, then chooses daisy/cross/first-layer using the frozen counts-plain design. Code passes answers unchanged. Existing measured skill target, intention, reference and operation requests remain assisted as before. Completion flags in those downstream requests were not removed. Code applies chosen algorithms with cubing.js; no search, automatic case matching or answer repair was added.

The model's first-layer choice is a cross-completion claim. Independently check it against cubing mechanics and stop. The menu deliberately has no whole-cube solved choice. No automatic stop on true cross completion bypasses this model claim. Every final state was replayed independently from the starting setup plus recorded actions.

| Start | Outcome | Requests | Face turns | Active seconds |
| --- | --- | --- | --- | --- |
| Incomplete daisy | Capped, cross incomplete | 60 | 7 | 22.071 |
| Full daisy | Verified cross complete | 35 | 4 | 13.125 |
| Partial transfer | Verified cross complete | 27 | 3 | 10.580 |
| Earlier R failure | Verified cross complete | 18 | 2 | 6.505 |

**3/4 completed within the fixed limit.** All 20 completed goal decisions, eight-check bundles and two-count bundles matched independent offline scoring. The capped trajectory made seven actions, built the full daisy and transferred two edges, then reached its 60th request while selecting action eight. It remains incomplete. No cap extension, retry, recovery, manual intervention, provider error or false handoff occurred. R also incidentally solved the full cube, but the model chose first-layer: this is not a solved-state recognition result.

Total 140 requests, estimated **$0.00646443** at the current ledger rate ($0.042/M input tokens, last verified 2026-09-21). Per attempt: 60 requests, 200 turns, 120 seconds. Batch ceiling $0.05, checked conservatively against spent/reserved ledger change plus a full 64k-token reservation before each dispatch. Global $5 ledger also enforced. Source/config/fixtures frozen in source.json and started.json; full exchanges and immutable SQLite events in results.json and .data/lab.sqlite. Distinct run version prevents normal UI runner from advancing these experimental runs.

## Next experiment

A separately capped continuation of the incomplete trajectory would distinguish insufficient execution budget from later failure. Preserve this original capped result. Only after that should we connect more stages. No prompt changes are justified by these correct goal decisions alone. The current production solver was not changed.

## Reproduction

Offline audit and article data:

```sh
bun test tests/daisy-transition.test.ts
bun scripts/summarize-daisy-integration.ts
```

Historical live command: `bun scripts/request-eval/daisy-integration.ts`. It charges the ledger and refuses to overwrite this started study. Scoring uses facts only offline and on final model claims; it never chooses a runtime goal. Policy abstentions or caps would remain failures in the four-case denominator.
