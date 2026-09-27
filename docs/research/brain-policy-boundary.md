# Decision ownership in JEV brain v3

> Historical study note. Status, budgets and original commands describe this experiment at the time. See the [research index](README.md) for current code and available records.

The cube is a test of a model following a learned procedure. Fixed beginner algorithms are substantial, explicit assistance. Code executes their turns, while JEV decides when and how to use them.

| Layer | Supplied by code | Chosen by JEV |
| --- | --- | --- |
| Goal | Current completion flags, uncollected yellow-edge count, recent actions, fixed eight-goal definitions | Current goal |
| Target and situation | Pieces in the chosen goal's fixed vocabulary, current positions and sticker directions | Target, situation or intention |
| Reference | Current geometry expressed in four coordinate frames | Reference front |
| Routine | Fixed sequence catalogue with purposes, starting conditions and affected slots | Routine or explicit reconsideration |
| Preparation | Current sticker alignment and landing occupancy | Execute, align, clear or lower; then any required setup turn |
| Pending plan | Earlier model-selected target, reference, routine and setup; fixed routine requirements | Resume the plan or reconsider it |
| Recovery | Repeated-state observation, previous actions and results | Continue, change target or undo |
| Execution | Translate the selected frame and faithfully apply the sequence | No extra tactical choice is inserted by code |

The terminal solved-state predicate stops execution. It does not select a solving action. Completed pieces remain in the goal's target menu; an explicit model retarget decision can exclude its earlier target.

## Source review

- `scripts/brain-full-v3/policy.ts` follows the model's goal and assembles dependent questions. It maps an explicit model `resume` answer to the model's earlier routine. There is no current-state condition that silently chooses resume.
- `scripts/goal-contract/policy.ts` supplies measurements and fixed goal definitions. The old direct-cross meaning is absent from the active goal question.
- `scripts/brain-early-v3/policy.ts` asks for target, situation/reference, routine, precondition and setup decisions. Routine requirements come from the fixed `routine-reference.json`, calculated independently of the current cube.
- `scripts/plan-memory/check.ts` asks JEV to compare the current context with remembered requirements. Code supplies the fields, not their applicability verdict.
- `src/server/measured-policy.ts` and `src/server/skill-policy.ts` handle later stages with fixed teaching. Menu routing follows model-selected goals and intentions. Reference views rename current coordinates without applying candidate moves.
- `src/lib/cube.ts` provides geometry, counts, completion facts, reference translation and move execution. Its legacy `stage()` classifier is not called by this candidate.

No active decision module imports the offline evaluator or a solver. Candidate outcomes are never searched or ranked during solving. Library scrambling can use a solver before evaluation, but the scramble and any solution are absent from policy requests. Only resulting state and subsequent solving history are supplied.

## Failure behavior and audit

A wrong model goal, frame, routine or commitment is followed without a tactical repair. Provider failures and malformed answers can fail an attempt. Transport retries repeat the identical request at most once for specified transient failures; they do not compare multiple valid model answers. Every network attempt counts toward the request limit and has a cost reservation.

`verify.ts` reconstructs the starting cube and every executed state independently with cubing, checks the selected frame and routine against recorded JEV answers, checks pending-plan provenance, and verifies final piece identities/orientations. It checks frozen source content, pinned model, request-ledger agreement, limits and interactive-runner interference. `freshness.ts` compares canonical starting states against saved fixtures and all other runs' starting scrambles.

These audits support the recorded execution and ownership boundary. They do not establish a universal claim about model reasoning or guarantee future provider availability. The 100-case outcome is reported separately under `experiments/brain-full-v3-final`, with all failures retained. See `notes.md` for failed approaches and the evidence behind each change.
