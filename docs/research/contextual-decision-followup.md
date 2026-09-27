# Contextual decisions and top-cross recognition

This follow-up tests whether fewer, more contextual requests can preserve the reliability of the frozen 97/100 solver. It also investigates a concrete pattern-recognition mistake from a capped solve. The original policy and recordings are unchanged. Its final set is now retired from future holdout use because we examined failures for tuning.

## Extraction: combining decisions did not work well enough

The existing chain first checks whether a corner or edge needs extraction, then selects the occupied slot and direction. The alternatives either choose directly from the routine menu or recognise the situation before choosing. All use the same eight fixed routines. Code supplies two measured positions and executes the model choice; expected outcomes stay in the evaluator.

Twenty distinct legal position combinations cover corner-only, edge-only, both-trapped and no-extraction cases. Labels allow multiple valid routines. Fresh validation cases were prepared but deliberately not used because development performance was inadequate.

| Form | First wording | One revision | Requests in revised batch |
| --- | --- | --- | --- |
| Existing chain | 20/20 | 20/20 | 67 |
| One contextual decision | 1/20 | 10/20 | 20 |
| Recognise, then act | 5/20 | 9/20 | 35 |

The first menu described general routine effects. The revision put explicit applicability into each option. That helped, but did not justify promotion. For corner DLB and edge UF, the acceptable extraction is B-reverse. The first direct version chose F-forward; the two-step version recognised free-corner but then returned continue. A correct intermediate answer did not guarantee a correct downstream action.

These results do not prove JEV cannot make contextual decisions. They show these two formulations are weaker than the existing chain on this finite fixture domain. No further wording round or expensive full-solve test was run for them. Both rounds together used 240 HTTP attempts and $0.006569430.

## Top cross: describe spatial relationships explicitly

One capped recording had white-up edges UR and UL but JEV selected elbow. The experiment keeps the existing reference and operation questions and changes only the recognition question:

```text
Input: whiteUpPositions, measured from the cube

Recognise the pattern made by white-up EDGE stickers only.
UF is front, UR right, UB back, UL left.
Ignore corners and side sticker colors.

line: UF with UB, or UR with UL.
elbow: UF with UR, UR with UB, UB with UL, or UL with UF.
dot: No white-up edges.
```

JEV still chooses the pattern, reference orientation and routine. Code does not classify the shape. The explicit position pairs are additional static teaching, not a prediction for the current state. No routines were added.

| Form | Development completion | Validation completion |
| --- | --- | --- |
| Existing full observations | 6/7 | 7/7 |
| Focused observations, original definitions | 6/7 | Not advanced |
| Focused observations, explicit position pairs | 7/7 | 7/7 |

The explicit version used six turns for each line/elbow and twelve for the dot, in both phases. Baseline validation needed twelve turns for one line. The test covers all seven non-complete orientation patterns. Validation uses different legal top permutations and corner orientations, but the same seven pattern families. It does not establish a success rate over all full cubes. Both phases used 144 attempts and $0.009205980.

Four fresh paired full-solve comparisons finished and independently replayed:

| Start | Baseline | Candidate |
| --- | --- | --- |
| 1 | Capped at85 | Solved79 |
| 2 | Solved93 | Solved80 |
| 3 | Solved90 | Capped at95 |
| 4 | Solved79 | Solved80 |

Both solved3/4. Capped counts are executed turns before a selected routine would exceed100, not solution lengths. Candidate top-cross took6,6,12,6 turns; baseline took12,18,0,0. Zero means F2L had already left the top cross oriented. Earlier trajectories differed despite identical starting scrambles, so total savings cannot all be attributed to the new question. On start2 both policies spent9/7/39 turns in daisy/cross/F2L, followed by18 versus6 in top-cross; matching stage costs alone still do not prove identical entry states.

The candidate's failed start spent29 daisy turns and8 cross turns before later work. This reinforces the distinction between a well-performing component and whole-solver reliability. Retain explicit recognition as a component candidate; do not replace the97/100 frozen incumbent or claim an improved overall success rate from3/4.

Integration used1,190 HTTP attempts and$0.038855544. Total follow-up:1,574 attempts/$0.054630954, below the authorised$0.15. Project commitment$8.787338406 includes reservations, leaving$0.212661594 under$9. All study processes finished. No further live calls are scheduled. Three added mechanics/boundary/integration-shape tests passed (196 assertions), along with TypeScript checking.

Next useful experiment, if pursued: compare whole-stage outcomes from identical saved stage-entry states to separate local effects from upstream variation. For global turn count, early-stage repeats and F2L abstention remain distinct targets. Avoid another large reliability run until an integrated change has stronger evidence.

## Records and reproduction

- Extraction: `experiments/contextual-extraction-v1` and `contextual-extraction-v2`, with exact requests, responses, sources and mechanical labels.
- Failure trace: `experiments/contextual-extraction-v1/failure-audit.json`.
- Top-cross stages: `experiments/top-cross-context-v1`.
- Paired integration: `experiments/top-cross-context-v1/full-integration`.
- Offline verification: `bun scripts/contextual-extraction-v1/verify.ts development`, equivalent v2 command, and `bun scripts/top-cross-context-v1/verify.ts development` / `validation`.

A useful article lesson: reducing the number of questions can reduce latency while sharply reducing accuracy. First establish what the model can recognise reliably. Clear spatial definitions can help without asking code to choose the action, but that teaching must be disclosed as assistance.
