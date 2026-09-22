# Observation-boundary comparison

Completed on 2026-09-21. The production solver was not changed.

| Round | Variant | Complete chains | Live requests | Input tokens | Estimated cost | Summed API seconds |
|---|---|---:|---:|---:|---:|---:|
| development | code/structured | 10/20 | 48 | 109470 | $0.004597740 | 21.51 |
| development | code/player | 10/20 | 48 | 104864 | $0.004404288 | 21.30 |
| development | jev/structured | 9/20 | 68 | 133369 | $0.005601498 | 29.97 |
| development | jev/player | 10/20 | 68 | 126843 | $0.005327406 | 29.34 |
| revision | code/player | 9/20 | 14 | 75610 | $0.003175620 | 8.18 |
| revision | jev/player | 11/20 | 14 | 75608 | $0.003175536 | 6.63 |
| validation | code/player | 12/20 | 50 | 110935 | $0.004659270 | 23.44 |
| validation | jev/player | 8/20 | 70 | 132905 | $0.005582010 | 32.67 |

Total: **380 requests, $0.036523368**. Caps: 400 requests/$0.05, including uncertain reservations. Zero retries, errors or new uncertain reservations. No integration attempts: both variants missed 19/20.

## Interpretation

Both validation arms passed 20/20 goal, target, situation and reference decisions. Routine correctness was 12/20 (code) and 10/20 (JEV), including five no-action handoffs. Recognition was 16/20 in the JEV arm. Full action-bearing chains passed 7/15 and 3/15. Complete-chain accuracy requires every assessed stage to be correct, even if a recognition mistake did not affect the final action.

The revision replayed saved upstream answers and made only 28 new action calls across 40 records. It canonicalised slot spelling and emphasised the selected target; it was not adopted because the code arm regressed by one while the JEV arm gained one. The fresh validation therefore evaluates the frozen original wording, including its known slot-spelling limitation. These small differences are not causal proof about either change.

The fixed action menu contains 52 setup/routine combinations, three U-only moves and abstention. A next experiment could explicitly assess alignment and landing occupancy before routine selection, but that hypothesis has not been tested here.

## Assistance and validity

- Literal piece positions, sticker directions and frame mappings come from cubing mechanics. IDs are stable identities, not current positions.
- Code arm computes petal/bottom checks; JEV arm reports them. Both count flags in code. Incorrect model flags are retained.
- The model selects goals, targets, situations, frames and fixed routines. Code does not match the case to a routine or rank action outcomes.
- The offline evaluator enumerates acceptable actions to label fixtures. It is never imported by the policy. Labels are not in API bodies.
- Fixtures are controlled and filtered to ensure eligible targets have an available routine. They are not an unbiased sample of all legal cube states.
- Twenty development and twenty validation states are disjoint by cube hash. Five per set are cross handoffs. Memory fields were empty in these isolated cases, so memory utility is untested.
- Sum of individual request latencies is not parallel batch wall-clock time. Confidence remains a native model statistic.

## Reproduction

Run `bun test tests/observation-boundary.test.ts` and `bun scripts/observation-boundary/export.ts` for free verification/replay. Live driver commands are `prepare`, `development`, optional `revision`, `validation`, gated `integration`, and read-only `status` under `bun scripts/observation-boundary/run.ts`. Existing start markers reject repeated phases; do not delete old evidence to rerun. Export is allowlisted and includes exact native responses without credentials or headers.

The policy source and initial driver/evaluator snapshots are preserved here. `run-final-source.ts` records the completed driver with the bounded revision workflow. Original and revised policy hashes are in the manifest, revision marker and selection record. SQLite holds immutable provider events and the reservation ledger. JSON files retain all completed and failed case records.

Research sources and transferable lessons are in ../../notes.md. Exact flows are visible at /request-flow; article summary is at /how-it-works#observation-boundaries.
