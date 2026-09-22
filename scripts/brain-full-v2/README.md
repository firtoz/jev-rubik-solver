# Full policy candidate v2

This candidate differs from v1 only in the global goal request: a single coherent eight-goal reference with compact measured facts replaces the conflicting inherited teaching. It retains early v3 routines and the audited historical later-stage teaching. Historical solve scores are not reused as evidence.

- `run.ts`: four development starts, two reused short scrambles and two new random-state starts. Exclusive start marker. Caps 500 calls/1000 turns/10 minutes per attempt and 1000 calls/$0.12 for the batch.
- `validation.ts`: allowed only after four solved development runs. Checks the exact recursive policy-source digest against development, then creates ten unique random-state starts, excluding both full development datasets. Caps remain 500/1000/10 minutes, with 2500 calls/$0.20 for the batch. No retries.
- `audit.ts [experiment-directory]`: independently reconstructs each initial cube from its scramble, replays all recorded actions and checks every before/after state and final solved status.

These batches are development and validation, not the 100-state final test. Validation failures used for changes must retire the set. The final acceptance evaluation must freeze the policy before generating 100 new random states, preserve all attempts and independently verify every solve. The global $9 ledger cap includes unsettled reservations.

Code computes observations and executes chosen routines. The model chooses all goals, targets, situation/intention labels, reference frames and operations. A repeated-state observation can trigger a model recovery question; code never chooses the recovery answer. Case-conditioned runtime outcome simulation is absent. Fixed routine teaching and spatial/count facts remain explicit assistance.

`verify.ts [experiment-directory] [--partial]` additionally verifies the recursive frozen-source digest and current sources, unique starts, standard face-turn counting, request-event/ledger agreement and all attempt ceilings. Partial mode checks completed rows only and explicitly reports missing attempts; it cannot establish acceptance.

`final.ts` is prepared for the final 100-state evaluation. It requires a complete 10/10 independent validation report and unchanged policy digest. It creates new random-state starts, excluding known fixture hashes and full development/validation starts. Four workers evaluate independent cubes without retries. Exact per-run records live in `random-N.json`, with a small summary in `results.json`; all native exchanges are also immutable database events. Batch limits are 50,000 calls and $3, within the global $9 reservation-aware cap. Budget-capped or failed attempts stay in the denominator. The final verifier must report all 100 attempts present and at least 95 solved; no prompt edits during evaluation.
