# Focused recognition and model reconsideration

Frozen early-stage candidate, separate from the historical full solver.

| Evaluation | Result |
| --- | --- |
| Reused development action cycles | 19/20 |
| Fresh action cycles | 20/20 |
| Four bounded cross trajectories | 3/4 |
| Total calls | 262 |
| Total estimated USD | 0.009004968 |

The capped trajectory spent all 60 requests. Its recorded moves contain one bad U clearance followed by recovery. It had not finished the cross. Do not exclude it from the denominator or extend it retroactively.

`integration-audit.json` independently replays every executed sequence with cubing and checks the four fixed bottom edge coordinates. Offline per-cycle scores diagnose the bad clearance; they never select live moves.

Reproduce the read-only audit: `bun scripts/brain-early-v2/audit.ts`.
Inspect exact component requests in `/request-flow`, source “Separated action cycles”, v2 phases. Full trajectory exchanges are in `integration-results.json`.

Frozen teaching sources and digest are recorded in `sources.json` and `manifest.json`. Fresh fixtures exclude prior boundary and v1 validation states. The original policy and all failed attempts remain preserved. Five component fixtures per set test handoff, so these scores are not representative full-scramble solve rates.
