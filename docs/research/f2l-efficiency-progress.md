# F2L efficiency experiment

The old controller solves corners and middle edges separately. This candidate teaches 41 fixed F2L cases that solve a corner and its matching edge together. JEV still selects the target, reference frame, preparation and routine. Code measures sticker directions and executes the selected turns.

The extra routine vocabulary is substantial assistance. This is a method change, not evidence that JEV discovered shorter algorithms or gained reasoning ability. The source is the [CubeSkills F2L reference](https://www.cubeskills.com/uploads/pdf/tutorials/f2l.pdf); all cases, reference transforms and preserved slots are checked mechanically offline. No library case matching or outcome search runs inside the policy.

| Evaluation | Result | Meaning |
|---|---|---|
| Flat 41-option routine recognition, development | 20/20 | Canonical pair already prepared |
| Group then routine, development | 20/20 | Same cases, twice the requests but fewer tokens |
| Frozen flat recognition, validation | 20/21 | One incorrect reconsider response |
| Autonomous F2L, development | 5/6 | One preparation error before routine selection |
| Frozen autonomous F2L, validation | 6/6 | 30–39 turns, 28–36 requests, 17.4–21.6 seconds |

The autonomous cases start with a completed cross and are generated from varied inverse F2L routines. They are not uniformly random full cubes. Validation preserved the cross and all previously solved lower pieces. The development failure remains in the record: JEV tried to insert while the target edge was still trapped in another slot, then correctly found no matching insertion reference. There was no code repair or tactical retry.

Recognition cost $0.006963558; autonomous stage tests cost $0.014564466. Exact inputs, native responses, fixture generation histories, frozen sources and replay verification are in `experiments/f2l-efficiency-v1/`.

Four full-solve development comparisons finished on the same scrambles as the saved baseline: 0/4 solved within 100 turns. Two stopped at 95 turns before final edge permutation, one at 92 before corner placement, and one abstained at 20 after choosing a routine while its target edge was still trapped in another slot. All four were independently replayed and verified. Baseline recordings remain unchanged. Initial state is controlled; service timing and stochastic answers are not. Full integration cost $0.018698232. The 95/100 objective remains unmet.

A focused preparation screen scored baseline 27/32, positions-only literal-slot criteria 28/32, and a semantic layer/position-flags revision 20/32. None passed the 31/32 development gate; validation stays unused and no revision is promoted. The failed semantic form consistently abstained on wrong-bottom-slot corners. These scores support changing the decision structure rather than assuming more derived observations always help. Exact comparisons and their $0.002405424 cost are recorded in the preparation folders.

Offline checks: `bun test tests/f2l-library.test.ts`, `bun scripts/f2l-efficiency-v1/verify.ts`, and `bun scripts/f2l-efficiency-v1/verify-integration.ts validation`. Live screen scripts must not be used as offline checks.

A different preparation architecture passed 32/32 development and 32/32 previously unused position cases. It asks about corner extraction, edge extraction, corner alignment, then final preparation sequentially. Code follows the model's answers even when incorrect. This covers the finite position domain, with target and frame supplied, rather than the whole solver. It used 139 requests and $0.002370396. Exact replay and evaluator-label verification: `bun scripts/f2l-efficiency-v1/verify-preparation-sequential.ts`. Both failed earlier wording experiments remain recorded. Splitting decisions adds calls and changes wording; the experiment does not isolate decomposition as the sole cause.

The sequential controller then completed all six original development starts, compared with the saved original 5/6. Turns were 26, 28, 13, 32, 45 and 22; elapsed time 16.8–38.0 seconds. The previously failed start completed in 45 turns. No cross breaks or solved lower-piece regressions occurred. Replay verification passed all six; 309 requests cost $0.009355500. This supports a preparation reliability candidate but does not demonstrate reduced moves or full-cube success. Records: `integration-sequential-development/`. Total project commitment after this round: $8.012578266 including reservations.
