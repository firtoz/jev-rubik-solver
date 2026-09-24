# Full-cube integration of the examples-based middle policy

**94/100 held-out full random-state scrambles solved autonomously.** The target was 95/100. The target remains unmet; all failures and budget-capped attempts remain in the denominator.

The preliminary gate passed 10/10. One development version was used; no final-test tuning or retries were performed. Both batches used the same frozen source digest. The original proven solver remains unchanged. Only the middle-layer policy was substituted.

## Scope and assistance

JEV chooses goals, targets, preparation, frames, fixed routines and recovery. Code supplies reliable measurements, routes on JEV answers and executes its selected moves. It does not rank simulated outcomes, correct tactical mistakes or use a solver fallback. Scramble generation is outside the solving policy.

The new middle sequence uses four contrast examples and generic routine effects. The other stages still use the original explicit applicability teaching, fixed algorithms and model-confirmed pending plans. This is not a less-assisted replacement for every stage, an independently discovered cube strategy or proof of a globally minimal prompt.

## Results and limits

- Final outcome categories: solved: 94; study budget: 6.
- Successful attempts: 111–271 requests, 110–285 face turns, 67646–191518ms elapsed.
- Limits: 500 requests, 1,000 face turns, 10 minutes per attempt; four concurrent attempts; zero retries.
- Total study commitment: $0.99497244 of $1, including reservations. Project commitment: $6.69967187 of $9.
- Freshness: 100 unique starting states, no overlap with archived fixtures or prior recorded starts. This is a finite sampled evaluation, not a guarantee of population reliability.

## Preserved failures

| Start | Category | Last selected goal | Requests |
|---|---|---|---:|
|random-95|study budget|top-edges|220|
|random-96|study budget|first-layer|60|
|random-97|study budget|cross|42|
|random-98|study budget|none|0|
|random-99|study budget|none|0|
|random-100|study budget|none|0|

The budget check includes reservations for in-flight requests. Some reservations settled to smaller actual charges after attempts had already been capped, leaving a small unused balance. Capped attempts were not restarted. Three budget-capped attempts had dispatched calls; three had not started. No terminal provider or solving error was recorded. The six capped cases remain in the planned denominator, so this is not a 95/100 acceptance pass.

## Verification and records

The verifier reconstructs cubes from recorded scrambles and actions using cubing, independently checks raw solved predicates, replays the exact request sequence using native answers, checks chosen routine execution and pending-plan provenance, and audits ledger counts and interactive intervention. The full source snapshot is preserved in sources.json. Freshness is independently reconstructed against fixture archives and prior run starts.

A pre-existing mutable request-array defect can change a later in-memory snapshot after dispatch. Immutable SQLite dispatch events preserve the actual request. The verifier exports those authoritative copies to wire-requests.json and reports every drift without overwriting the original record. No solver choices were repaired.

Commands: `bun scripts/brain-teaching-full-v1/verify.ts experiments/brain-teaching-full-v1-final`, `bun scripts/brain-full-v3/freshness.ts experiments/brain-teaching-full-v1-final`, and `bun scripts/brain-teaching-full-v1/summarize.ts experiments/brain-teaching-full-v1-final`. These are offline audits and do not call JEV. Full per-run requests, responses, actions, timing, failures and usage are in [the final records](../experiments/brain-teaching-full-v1-final/results.json). Teaching development and its earlier failures are documented in [the middle-layer report](minimum-teaching-results.md).

## Article implications

The progression matters: test an isolated decision, then autonomous stage completion, then integration with the surrounding controller. The earlier 38/40 decision score coexisted with 2/10 stage solves. A focused representation and four explicit contrasts subsequently passed 39/40 decisions and 10/10 stage solves, earning this full-cube test.

This integration measures whether that substitution works in context. Different samples and simultaneous representation/wording changes do not isolate a causal benefit. Other stages retain substantial teaching. Further capability claims need their own controlled tests, not a reinterpretation of this result.
