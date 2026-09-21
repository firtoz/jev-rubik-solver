# Frozen v26 results

The model-owned skill policy solved **99 of 100 unseen full random-state cubes** under the fixed limits of 500 requests, 1,000 face turns and ten minutes per attempt. This exceeds the experiment's 95/100 acceptance target. The single HTTP 503 failure counts as a failure, without replacement. This is measured performance on one held-out set, not a guarantee about future cubes or individual decisions.

JEV selects the goal, target, intention, reference, setup and operation from static beginner instructions. Code builds factual observations, routes model answers and executes the selected moves. No solving search or outcome-ranked candidate selection is used. Earlier failed final sets were retired before tuning; v26 used a fresh 100-state set after 8/8 fresh validation solves.

The final evaluation used 16,896 requests, 15,859 face turns, 30,476,226 input tokens and 67 recovery decisions, costing $1.280001492. Mean active time was 76.46 seconds per attempt; request latency p50 was 276 ms and p95 777 ms. These are observed timings in this local environment. A database index was installed after 60 attempts to speed event retrieval; no policy, prompt, state or limit changed. The index is now included in database initialization for future installations.

A separate comparison used the first three manifest cases, selected independently of outcomes, with identical ceilings:

| Policy | Solved | Requests | Face turns | Input tokens | Active time | Recovery decisions |
|---|---:|---:|---:|---:|---:|---:|
| Skills | 3/3 | 547 | 555 | 995,035 | 234.60 s | 2 |
| Primitive turns | 0/3 | 1,500 | 460 | 3,310,572 | 526.77 s | 113 |

All three primitive attempts hit the request limit. This tiny comparison is diagnostic, not a reliable population estimate. Total project settled usage after the comparison was $3.976974078, with $0.005376 retained for uncertain outcomes, against the $5 cap. No further live experiments are needed to establish the stated skill-policy acceptance result.

The offline final audit replayed all 3,617 actions from 100 distinct initial states, checked every before/after state and final saved state, verified turn counts and execution ceilings, checked model pinning/native response capture, and confirmed no manual-control events. It found 99 solved states. Source snapshots and full request/response events remain in the local SQLite database and `.data/configs`.

Evidence:

- [Full final manifest and results](../experiments/v26-final-100.json)
- [Offline audit](../experiments/v26-final-audit.json); rerun with `bun scripts/audit-evaluation.ts`
- [Matched comparison](../experiments/v26-primitive-comparison.json)
- [Validation](../experiments/v26-frozen-validation.json)
- [Component coverage and historical failures](request-coverage.md)

Reducing request layers is a future optimization requiring fresh validation. The current result does not establish a minimum number of model requests.
