# Separated routine, precondition and setup decisions

20 development action cycles: 15 passed. 20 fresh cycles: 15 passed. 126 requests, $0.004540998; no provider retries/errors. The 19/20 gate failed, so zero trajectory integrations were attempted. Source and model-facing static motor metadata are frozen in sources.json. Cost ceiling was $0.08 / 400 requests within the project $9 cap.

Development reused the earlier 20 boundary cases (old code/player 10/20). Fresh validation excludes both prior boundary sets by state hash. These controlled fixtures are not full random-state solve tests.

The model chooses goal, conditional target, situation, reference, routine, precondition decision and setup. Code supplies factual color matches, current slot occupancy, solved bottom slots and frame conversions. The fixed routine catalogue lists starting conditions and sequence effects. Those effects were built offline once, independently of current states, and tested in every yaw frame. Runtime code neither simulates candidate moves nor ranks/replaces model choices.

The offline scorer executes the chosen action and accepts useful lifts, transfer, alignment, staging or clearance for the selected routine while preserving protected pieces. It does not demand shortest moves. Intermediate misclassification still fails a complete chain even if the action was useful. The original development-3 scorer error on target=none is preserved; the corrected scorer treats it as a failed abstention without changing the result denominator.

Fresh failures: three premature cross goals, two incorrect situation labels (one also abstained on clearance). Development included both an incorrectly rejected feasible clearance and a correctly rejected impossible clearance for a poorly chosen routine. See notes.md for next hypotheses.

Run `bun test tests/brain-early.test.ts` and `bun scripts/brain-early/export.ts` for free verification/replay. Paid phases use `bun scripts/brain-early/run.ts development|validation|integration`; start markers prevent duplicates and the failed validation gate blocks integration. `prepare` refuses to overwrite an existing study. Do not delete markers or retired results to repeat calls.
