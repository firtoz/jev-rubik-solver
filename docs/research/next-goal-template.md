# Next goal template

Draft for the next `/goal`; saving this does not start paid experiments or change the active goal or budget enforcement.

Budget reference: [latest reconciliation](../experiments/budget-round-v1/costs.json). Estimated provider credit is $0.885848362, not a live balance. After preserving $0.10, estimated usable credit is $0.785848362. Refresh the ledger before starting; never treat this allowance as additional to that remaining credit.

```text
Improve the frozen 98/100 JEV Rubik candidate, prioritising its
remaining decision failures and unnecessary requests while keeping
successful solves within 100 face turns.

Use at most $0.78 additional API commitment from the new starting
ledger snapshot, or the remaining previously authorised allowance,
whichever is smaller. Also stop before estimated or observed provider
credit would fall below $0.10. Reconcile usage since the last balance
reference before dispatch. Count settled charges and new reservations,
including retries. Preserve all old uncertain reservations.
Do not spend merely to exhaust the allowance.

First finish the previous round's report and completion audit offline.
Keep the historical 97/100 incumbent and frozen 98/100 candidate
separate. The newer result used fewer median turns and less estimated
cost, but more requests and longer median execution time. Different
test sets do not establish a reliability improvement.

1. Diagnose and test the weakest decisions in isolation.
   Start with daisy reference selection and F2L extraction preparation.
   Use recorded failures to form hypotheses, then retire that final
   set from future held-out evaluation. Build varied legal cases with
   acceptable answers kept outside requests. Distinguish recognition,
   preparation, routine coverage and recovery failures.

2. Compare at most three variants per round on identical stage-entry
   states. Change one main factor at a time. Predeclare advancement
   gates for completion, turns, requests, latency and cost. After two
   unhelpful rounds, change the hypothesis or stop that line of work.
   Prefer clearer player-style observations and useful short memory.
   Test request consolidation only where dependencies permit it.

3. Freeze promising variants and validate on fresh cases. Check that
   improvements survive complete stages and small paired full solves.
   Promote only with evidence of useful improvement and no observed
   reliability regression; disclose uncertainty in small samples.

4. Initially reserve $0.45 for final evaluation. Before seeing outcomes,
   use measured cost to fix an affordable fresh sample size, aiming
   for 100. Keep the best supported policy unchanged throughout it.
   Preserve every case, abstention and cap. If nothing improves,
   retain the frozen candidate and report that result instead.

Responsibility boundary:
Code measures the cube, supplies factual memory, maps reference frames
and executes documented routines. JEV chooses goals, targets, frames,
preparation, routines and recovery. Static teaching and learned
algorithms are allowed and must be disclosed. No solution search,
candidate-outcome ranking, tactical correction or solver fallback.

Limits: pinned jev-1.13.0; 100 face turns, 500 HTTP attempts and ten
minutes per full solve. Half turns count as one; undo and repeated
moves count. At most two concurrent live evaluations. Retry transient
transport failures with bounded backoff, at most three total attempts
per request, within all limits. Report unresolved transport failures
separately from model errors; keep their cases visible in accounting.
Reserve cost before every dispatch. Verify current pricing first.

Maintain notes.md with hypotheses, changes, measured evidence,
representative requests and answers, failed approaches, assistance
boundaries and qualified lessons for the article. Link full records.

Finish with a verified comparison: solve rate, turn distribution,
requests, latency, tokens and cost; retained and rejected changes;
best, median and worst cases; failures and next useful experiment;
settled spending, reservations and estimated remaining credit.
Do not claim 95/100 from a smaller sample or call an estimated balance
a live provider reading. Keep all historical results intact.
```
