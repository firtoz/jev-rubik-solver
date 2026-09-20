# JEV request capability coverage

“Measured” applies only to the listed fixtures, not all cube situations. Deterministic tests verify mechanics, input construction, and offline labels; live experiments measure model choices. Production prompts are unchanged by these experiments.

| Request family | Evidence so far | Remaining work |
|---|---|---|
| Goal | Small labelled goal probes | Systematic 20-case development/validation suite |
| Target + intention | Cross-stage combined/separated request comparisons | Broader stages and target-selection coverage |
| Cross intention, direction-first candidate | 20/20 development, 20/20 fresh validation; wording-only control 19/20 | Integrate only after downstream components are measured |
| Reference | Current request 19/20 development, 20/20 held-out-orientation validation | Resolve middle-extraction failure; expand case families |
| Daisy lift | Earlier mechanical fixtures and live development traces | Isolated capability suite |
| Preparation / clearance | Earlier small occupancy probes | Broader distinct-input suite |
| Operation | Earlier narrow fixtures and solve traces | Next broad request-level suite with supplied correct inputs |
| Recovery | Recorded solve behaviour | Define acceptable-action rubric and isolated cases |
| Primitive target / turn | Earlier development trials | Independent capability suites |

## Reference selection: reference-v1

Ten templates cover all eight stages: daisy side-facing edge; cross alignment; corner insertion/extraction; middle insertion/extraction; white edge line; Sune orientation; corner pair; and final edge cycle. Each appears in two development yaw orientations and two held-out yaw orientations. All 40 cube states are distinct. This is an orientation-transfer test, not validation on independent case families.

The exact live reference request is captured after supplying a known target and intention. Labels are computed only in the evaluator from geometric constraints in each frame. Multiple correct frames are accepted. Last-layer labels are additionally verified by executing the documented skill offline. No labels or simulated outcomes are included in JEV requests.

| Variant | Development | Held-out orientations |
|---|---:|---:|
| Current | 19/20 | 20/20 |
| Explicit field checklist | 19/20 | Not run |
| Concise options | 19/20 | 19/20 |
| Concise options + checklist | 19/20 | Not run |

Current wording missed one middle-edge extraction case: it selected F instead of R, consistent with attending to the destination instead of the current slot. Both concise variants fixed that case but failed a corner-pair frame; concise also failed a corner-pair case in validation. Retain current wording and pause on this plateau. No production change or full solves were run.

Coverage gaps include daisy bottom lifts, cross extraction, white-edge dots/elbows, and other last-layer patterns. The next focused experiment should contrast current position and destination in middle-edge extraction before marking reference selection green. Operation selection can then be tested with supplied correct reference frames.

120 live calls; $0.011307408. Per-stage counts, exact failures and frozen sources are saved in `experiments/reference-v1-decision.json` and the associated development/validation directories. If validation failures inform future variants, retire that validation set.
