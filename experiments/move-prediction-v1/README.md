# Single-turn prediction, development v1

A 20-request live probe of jev-1.13.0 without beginner algorithms, explicit slot-transition tables, solver suggestions or outcome ranking. One request per unique input, no retries. This is a development measurement, not a reliability evaluation.

Each request supplies one observed physical piece, its current slot and colored sticker directions, a tracked sticker and a proposed face turn. Two choice questions independently predict the resulting position and sticker direction. Static instructions explain face notation, outside-view clockwise turns and layer membership. Expected answers are computed offline with cubing.js and never sent to JEV. No move is actually executed in the run.

The suite contains six one-turn states, seven five-turn setups and seven ten-turn setups; all 20 resulting states are unique. Every one of the 18 turns appears. Ten cases use edges, ten use corners; four are unaffected-layer controls. These are generated setups, not uniform random-state scrambles. Piece names identify home slots and may be a source of confusion.

| Cases | Position correct | Sticker correct | Both correct |
|---|---:|---:|---:|
| All 20 | 8/20 | 12/20 | 4/20 |
| 16 affected pieces | 6/16 | 8/16 | 2/16 |
| 4 unaffected pieces | 2/4 | 4/4 | 2/4 |

20 requests, no transport errors. Recorded estimated cost: $0.000686322.

Example: for a corner currently at URB and proposed D2, JEV selected DBR rather than leaving it at URB, although it correctly kept its white sticker pointing up. This indicates a layer-membership or identity-tracking failure before more difficult planning can be assessed. Other cases get position right and direction wrong. Native responses do not reveal why the mistakes happened.

No full solves were attempted after these results. The next proposed experiment is to separate layer-membership recognition from rotation prediction, use explicit coordinate observations and neutral piece identifiers, and compare variants on these development cases before using fresh validation cases. Code should not correct intermediate model answers or supply calculated successor positions. This tests geometric reasoning, not yet action selection or goal planning.

`fixtures.json` preserves every exact request and offline label. `results.json` preserves native responses, latency, usage, costs and per-field scores. `started.json` records the initial budget and model. Immutable provider events are also in the local SQLite database.

Offline preparation: `bun scripts/request-eval/move-prediction.ts`

Live execution: append `--live`. This version refuses a second live run once `started.json` exists; use a new suite version for further experiments. Tests: `bun test tests/move-prediction.test.ts`.
