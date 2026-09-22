# First recognition-to-action integration

Six fixed diagnostic attempts, three paired starting configurations. Original supplied-fact goal selection compared with frozen regional recognition → progress → goal chain. Existing measured skill policy retained downstream facts and algorithm menus. No retries or recovery in either arm. This is an early-stage integration, not a reproduction of the full frozen v26 benchmark. Original eight-goal menu maps top-* to last-layer for endpoint scoring; regional has six goals. Thus this is a replacement feasibility comparison, not an isolated causal comparison of prompt decomposition.

Limits: 60 requests, 200 face turns, 120 seconds per attempt; batch conservative pre-dispatch cost ceiling $0.10, plus the shared $5 durable ledger. No manual intervention. Policy abstentions count as failed attempts. Experimental run version blocks normal runner step execution. Exact source snapshots, requests, responses, actions and independently replayed final states are saved locally.

| Setup | Supplied facts | Regional |
| --- | --- | --- |
| R | Valid last-layer handoff, 41 requests, 26 turns | Abstained, 38 requests, 9 turns |
| R U R' | Solved, 18 requests, 13 turns | Abstained, 5 requests, 0 turns |
| F' U' F U R U R' U' | Solved, 5 requests, 8 turns | Solved, 7 requests, 8 turns |

Total 114 requests, estimated $0.008074206. Pricing checked 2026-09-21 at https://docs.typesafe.ai/models: jev-1.13.0 $0.042/M input tokens, output free. No retries, errors from provider or limit terminations. Six attempts, baseline task success 3/3, regional 1/3. Small selected cases, not a reliability estimate.

## Failure analysis

- Cross repair: first regional request falsely judged Dedges=yes, leading to cross=yes and premature first-layer goal.
- Corner repair: recognized cross=yes, firstLayer=no correctly, yet goal=cross. Existing policy returned done and abstained rather than executing a move. We did not replace its answer.
- Cross repair later built four daisy petals, but selected daisy again. All candidate daisy targets were complete, so the existing policy abstained. The unchanged early-goal evaluator accepts daisy or cross whenever cross=false; this is too coarse to capture the completed-daisy transition. Saved goalCorrect values follow that old criterion and should not be treated as executable-action validity. We keep them unchanged and record the defect here.

Next experiment should test raw-sticker recognition of incomplete/full daisies and partial transfers, then goal selection with real model assessments. Include contradictions after correct recognition. These failures are now development evidence, not held-out cases. No further API calls were made after the fixed six attempts.

Offline reproduction:

```sh
bun test tests/progress-integration.test.ts tests/progress-goal.test.ts
bun scripts/summarize-progress-integration.ts
```

Live runner: `bun scripts/request-eval/progress-integration.ts`. It charges the shared ledger and refuses to overwrite a started study. Results are in results.json and SQLite immutable events; started.json records limits, fixtures and initial budget; source.json preserves all relevant prompts/mechanics. No production solver changes.
