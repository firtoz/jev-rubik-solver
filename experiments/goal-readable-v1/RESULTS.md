# Goal observation readability comparison

Both structured fields and equivalent English sentences scored **64/64**. Keep the current fields for this step: there was no measured accuracy benefit from prose, and prose used 9.1% more input tokens.

| Format | Batch A | Batch B | Input tokens | Median latency | Estimated cost |
|---|---|---|---|---|---|
| Current fields | 32/32 | 32/32 | 48,888 | 422 ms | $0.002053 |
| English sentences | 32/32 | 32/32 | 53,328 | 423 ms | $0.002240 |

128 calls, no errors, no retries. Total committed: **$0.004293072**. Both forms answered every paired case correctly. Timings are descriptive measurements of single calls under bounded concurrency, not evidence of a speed difference.

## What changed

Only state serialization. The same completion facts, counts and memory were rendered as sentences, retaining field names in parentheses. Model, instructions, eight goal choices and their definitions were unchanged. Numeric cubing.js piece arrays are not sent in this request in either form. No extra observations, hints, recommendations or candidate outcomes were added.

## Representative exact input/output

Current request state:

```json
{
  "completed": {
    "daisy": 4,
    "cross": false,
    "firstLayer": false,
    "middle": false,
    "topCross": false,
    "topOriented": false,
    "cornersPlaced": false,
    "solved": false,
    "solvedPieces": 3
  },
  "uncollectedYellowEdges": 0,
  "previousGoal": "daisy",
  "recentActions": [
    "U"
  ]
}
```

Equivalent English state:

```text
There are 4 yellow-up edge petals around the top center (completed.daisy).
The yellow bottom cross (completed.cross) is not complete.
The bottom layer (completed.firstLayer) is not complete.
The middle layer (completed.middle) is not complete.
The white top cross (completed.topCross) is not complete.
The white top face orientation (completed.topOriented) is not complete.
The placement of all corners (completed.cornersPlaced) is not complete.
The whole cube (completed.solved) is not complete.
3 edges and corners are in their home slots with correct orientation (completed.solvedPieces).
0 yellow edges are neither yellow-up petals nor solved bottom edges (uncollectedYellowEdges).
The previous goal (previousGoal) is "daisy".
The most recent actions, in order (recentActions), are ["U"].
```

Both returned `goal = cross`. Full unchanged teaching and native probability/confidence responses are preserved in [summary.json](summary.json); every exchange is in [results.json](results.json).

## Interpretation and limits

The facts already name concepts that matter to the task, such as a completed cross. English sentences did not add information. A plausible explanation for the tie is that both formats make matching those facts to the explicit goal rules easy. This experiment does not identify an internal model reasoning mechanism.

These are 64 distinct legal cube states from existing goal-contract fixtures, balanced across eight goals, not a new held-out set or a random full-solve sample. They collapse to 63 distinct observation-plus-memory inputs. Earlier goal development used these states. Both forms were frozen before this comparison and neither was revised. Previous goals and one-turn memories are synthetic context stress tests. Accuracy has reached the ceiling of this suite, so it cannot establish equivalence on harder inputs or finer error rates.

## Practical decision

Keep the verified solver unchanged. Explain the compact data visually for people. Use readable names and useful abstractions in model requests; do not assume full prose is more helpful than structured fields. If investigating readability further, test a harder spatial or routine-selection question where mistakes still occur, keeping the information and teaching fixed.

## Reproduction

Offline checks: `bun test tests/goal-readable.test.ts`.
Recompute summary without calls: `bun scripts/goal-readable/summarize.ts`.
The paid runner has an exclusive start marker and refuses accidental reruns. Fixtures, protocol, frozen formatting policy, complete provider exchanges and ledger costs are preserved in this directory. The original solver and 100/100 final-test records were not changed.
