# Frozen confirmation evaluation

User-authorized separate evaluation of the unchanged examples-based full solver. Prior 94/100 and six budget stops remain in their original dataset and report. No old attempts are resumed or replaced.

Paid launch (exclusive start marker, run only once):

```
bun scripts/brain-teaching-confirmation-v1/evaluate.ts
```

100 new full random-state scrambles; acceptance at least 95 independently verified autonomous solves. Separate $1.25 ledger cap; global $9 cap. Each attempt: 500 requests, 1,000 face turns, 10 minutes. Four concurrent workers, no retries or tuning. Stop at either budget boundary and retain capped cases in the denominator.

Every previous frozen source is checked before dispatch. The unchanged policy is imported directly. The new runner differs in dataset/ledger bookkeeping, budget allowance and request snapshotting. Cloning request data preserves the same wire input while preventing subsequent array mutations from changing its saved representation.

Offline audits:

```
bun scripts/brain-full-v3/freshness.ts experiments/brain-teaching-confirmation-v1
bun scripts/brain-teaching-confirmation-v1/verify.ts
bun scripts/brain-teaching-confirmation-v1/summarize.ts
bun scripts/brain-teaching-confirmation-v1/costs.ts
```

The verifier supports `--partial` for interim records; full acceptance requires all 100 terminal records. The summarizer writes a new report at docs/frozen-confirmation-results.md and does not overwrite the earlier result. See the original integration README for the assistance boundary and full request sequence. Fixed algorithms, explicit goal criteria, four middle-layer examples and other-stage teaching remain disclosed assistance. No simulated-outcome ranking, tactical correction or solver fallback is added.

The offline cost report reconciles stage and request-family totals against the SQLite ledger. It writes docs/frozen-confirmation-costs.md after all attempts finish, separating settled estimates from reservations and this study from earlier ledger groups. `costs.ts --partial` writes only an interim JSON breakdown.
