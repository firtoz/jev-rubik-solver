# JEV brain policy v3

Code measures the cube and applies selected face turns. JEV chooses goals, targets, situations, reference frames, routines, preparations and recovery. Fixed beginner routines are explicit learned motor assistance. No runtime outcome search, solver fallback or case-to-algorithm matching is used.

The addition over v2 is a pending-plan commitment: after JEV selects and executes a clearance, the next routine decision asks JEV whether its previous plan still applies. Only a new explicit `resume` answer selects that remembered routine. `reconsider` asks for a new routine. Invalid answers are followed, never tactically corrected by code.

Transport permits at most one identical-request retry for 429/529 or a request timeout/network failure, only before the overall attempt deadline. Each dispatch rechecks and consumes request and budget allowances. Uncertain reservations remain in the ledger.

Recorded studies:

- `experiments/brain-full-v3`: four development solves, including the known-loop cube. Diagnostic, not held-out acceptance.
- `experiments/brain-full-v3-validation`: ten fresh random-state solves, independently verified.
- `experiments/brain-full-v3-final`: the separate 100-state final evaluation. Inspect current results and verification before claiming acceptance.

Paid commands (exclusive start markers prevent overwriting datasets):

```
bun scripts/brain-full-v3/run.ts
bun scripts/brain-full-v3/evaluate.ts validation
bun scripts/brain-full-v3/evaluate.ts final
```

Each later phase requires the preceding complete independent verification and unchanged policy digest. All solving attempts use 500 requests, 1000 turns and ten minutes. Validation allows 2500 requests/$0.20; final allows 50,000/$3. Global cap: $9 including reservations. At most four independent attempts run together.

Read-only audit:

```
bun scripts/brain-full-v3/verify.ts experiments/brain-full-v3-final --partial
bun scripts/brain-full-v3/verify.ts experiments/brain-full-v3-final
```

Partial verification cannot establish acceptance. Full verification must include all 100 starts and at least 95 solves. Requests/native responses, states, timings, choices, pending-plan provenance and retry records remain in per-run files and immutable SQLite events. Scramble generation is isolated from the policy; only resulting state and subsequent solving actions reach JEV. Credentials remain in the existing server-side environment mechanism.
