# Completion audit | 2026-09-20

> Historical study note. Status, budgets and original commands describe this experiment at the time. See the [research index](README.md) for current code and available records.

The v26 skill policy meets the requested 95/100 autonomous full-cube acceptance target at 99/100. This closes the solve-capability goal; it does not claim optimal request count or universal correctness of each component.

| Requirement | Inspected evidence |
|---|---|
| JEV owns goals and moves; code routes observations | `runner.ts` asks the fixed complete goal menu before each action; `measured-policy.ts` and `cross-intention.ts` route model answers. Goal/measured-policy tests explicitly preserve wrong answers instead of correcting them. |
| Decompose, measure, repair failed questions | `docs/request-coverage.md` and preserved labelled request-evaluation fixtures, variants and validation results. v25 failures were retired before v26 fixes. |
| Complete cube mechanics and static skills | Cubing.js authoritative state; cube, cross-skill and orientation-strategy tests cover identities, inverses, frame mapping, documented effects and preservation. |
| Shared UI/CLI backend, immutable records, durable limits | Runner/store/API source and server tests cover concurrent leases, stale/duplicate commands, immutable events, pause/resume, restart, malformed responses, cancellation, rate limits and budget reservations. |
| Held-out acceptance and failure denominator | `experiments/v26-final-100.json`: 100 assigned/completed, 99 successes, one counted HTTP 503. `v26-final-audit.json` independently replay-checks all actions, final states, autonomy and ceilings. |
| Matched primitive comparison | `experiments/v26-primitive-comparison.json`: same first three initial states and limits, skills 3/3, primitive 0/3; sample limitation explicit. |
| Browser preview and inspector | Local browser smoke: 3D cube rendered, completed 99/100 benchmark and comparison displayed, saved v26 solve selected, request shown before response, full response with confidence/probabilities/usage visible. |
| Recorded timing, forward/back and free replay | Browser replay progressed from request at 0.02 s to response at 0.84 s, then through final state at 58.27 s at 10× speed; solved cube visually confirmed; Back returned to last response. Request count stayed 50,919 with no active paid runs. Replay/inspector unit tests verify timing and response hiding. |
| Server-only credential | Actual configured credential scanned against all built client assets: absent. Native response and credential-redaction tests pass. Laya is only read for credential fallback. |
| Frozen policy preservation | Current files compared with frozen source snapshot: only `store.ts` differs, by the event lookup index already installed during evaluation. No model policy changes after freeze. |
| Local quality gates | 50 tests pass (4,073 assertions), typecheck passes, production build passes. |

Final settled usage $3.976974078 plus $0.005376 uncertain reservations remains below the $5 cap. Browser verification made no paid calls. Minimum request depth, broader isolated component coverage and larger primitive comparisons remain optional future research, not established results.
