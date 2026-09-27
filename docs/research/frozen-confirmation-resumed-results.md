# Frozen confirmation with HTTP recovery

> Historical study note. Status, budgets and original commands describe this experiment at the time. See the [research index](README.md) for current code and available records.

**94/100 cubes independently verified solved.** The 95/100 sample target was missed.

The user amended the transport rule after the original batch: HTTP errors may be retried and are not solver failures. The original no-retry snapshot remains preserved as 62 solves and 38 HTTP interruptions. We resumed the same interrupted cubes, with the same policy, cached successful answers and completed moves. No fresh replacement scrambles or tactical retries were introduced. Transport-unresolved cubes remain in the 100-case accounting and are not presumed solved.

## Outcomes

- solved: 94
- attempt limit: 6

| Cube | Outcome | Recorded reason |
|---|---|---|
| random-55 | attempt limit | Error: Execution cancelled |
| random-79 | attempt limit | Error: Attempt cap |
| random-80 | attempt limit | Error: Execution cancelled |
| random-81 | attempt limit | Error: Execution cancelled |
| random-87 | attempt limit | Error: Execution cancelled |
| random-95 | attempt limit | Error: Execution cancelled |

All six stops concern the cumulative time allowance, not request or turn ceilings. Five pending calls were cancelled at the deadline; one stopped at 585.479 seconds because its next retry delay would exceed the allowance. These are unresolved cubes, not evidence that the policy could never solve them.

## Budget and transport

Total commitment: **$1.189312 of $1.25**, comprising **$0.963520 estimated usage** and **$0.225792 unresolved reservations**. The recovery phase added $0.365832 commitment. All original and resumed calls remain in the same ledger. The [cost breakdown](frozen-confirmation-resumed-costs.md) includes stages, request types, recovery questions and separate earlier studies.

The original provider errors reported overload. Recovery used one worker, up to three transport attempts per request and 15/30-second backoff. Cumulative ceilings remained 500 requests and 1,000 face turns per cube. Ten minutes includes original and resumed active execution plus retry backoff, excluding the offline interruption between phases. This timing amendment is disclosed; these results are not a ten-minute uninterrupted wall-clock benchmark. Retained reservations are conservative commitments, not confirmed provider charges.

## Verification and assistance

All 100 records passed independent cube reconstruction, solved-state checking, exact request/controller replay and selected-routine execution checks. The resume audit checks original run IDs, starting states, successful response prefixes and completed actions were preserved. Request snapshot differences: 0. Policy dependency sources remain frozen. Offline commands: `bun scripts/brain-teaching-confirmation-v1/verify-resume.ts`, `bun scripts/brain-teaching-confirmation-v1/costs.ts experiments/brain-teaching-confirmation-v1-http-resume`, `bun scripts/brain-teaching-confirmation-v1/summarize-resume.ts`.

Code supplies measured observations and executes JEV-selected routines. JEV chooses goals, targets, frames, preparations, routines and recovery. Assistance still includes explicit goal criteria, fixed beginner algorithms, four middle-layer examples and other-stage case guidance. There is no tactical correction, simulated-outcome ranking or solver fallback. This measures the frozen system with that assistance, not independent discovery of cube-solving algorithms.

The earlier 94 solves and six budget stops remain [separate](full-teaching-integration-results.md), as does the [original no-retry snapshot](frozen-confirmation-results.md). No earlier outcomes were replaced. Full records: results.json (archived: `experiments/brain-teaching-confirmation-v1-http-resume/results.json`).

## What this tells us

Transport availability and policy ability need separate diagnostics. A provider interruption supplies no evidence about the action the model would have selected. Resuming the exact pending request preserves successful work, but a transport-unresolved cube still cannot be called solved. This evaluation does not establish how the interrupted cubes would perform with unlimited time or retries.
