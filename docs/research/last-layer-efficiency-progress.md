# Last-layer efficiency experiment

The candidate adds seven standard corner-orientation routines and Ua, Ub, H and Z edge permutations, from the CubeSkills four-look last-layer reference. Fixed outer-face equivalents are mechanically verified. This supplies more learned algorithms; JEV still selects the case and reference from observations, and code does no live matching or outcome ranking.

| Test | Structured fields | Short sentences |
|---|---:|---:|
| Development, distinct states | 19/19 | 19/19 |
| Development input tokens | 40,803 | 40,821 |
| Frozen validation | 20/20 | Not run |

The token difference is negligible. Structured won the predeclared tie-break, without a demonstrated quality advantage.

The fixture domain covers all 27 legal upper-corner orientations and 12 even upper-edge permutations, including completed stages. Target stage and prerequisites are supplied. Each answer is scored by executing the selected routine and verifying completion and prerequisite preservation. Exact requests, native responses, source snapshots and independent replay verification are in `experiments/last-layer-efficiency-v1/`. Total isolated screen cost: $0.005241852, 58 requests.

These are component results. They do not establish full-solve reliability, performance on wrong stage selections, or arbitrary handoffs. The next four full-cube development attempts combine this vocabulary with the sequential F2L preparation candidate, on the same starts as earlier preserved comparisons. The 95/100 under 100 turns acceptance target remains unproven.

## Full development comparison

Four verified attempts produced two solves within 100 turns, versus the saved earlier 0/4 on identical starts.

| Start | Outcome | Executed turns | Requests | Seconds |
|---|---|---:|---:|---:|
| 1 | Capped before final permutation | 93 | 162 | 89.0 |
| 2 | Capped before final permutation | 90 | 138 | 77.4 |
| 3 | Solved | 75 | 161 | 91.5 |
| 4 | Solved | 95 | 141 | 83.3 |

Offline checks show the two capped attempts' selected final routines would solve at 104 and 101 turns. Those moves were not executed and both attempts remain failures. Full comparison cost $0.019858104; total project commitment $8.037678222. All four trajectories passed independent source/request/response/mechanics replay.

This is a four-start development comparison with combined changes and stochastic decisions, not a 50% population reliability estimate. Next work is to inspect the 12-turn top-cross cases and F2L's 34–41 turns for avoidable work, then test focused improvements. The 95/100 held-out target remains unmet.
