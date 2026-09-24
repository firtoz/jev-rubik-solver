# Full solver with examples-based middle-layer policy

Experimental copy of `brain-full-v3/policy.ts`. The only policy change is a branch on JEV's `middle-layer` goal answer. It invokes the frozen `teaching-study-v2` examples policy. Other branches and their teaching remain unchanged. A retarget recovery answer adds an instruction to the middle target question; it does not select a replacement target.

## Request sequence

1. Existing full goal request: measured structures, memory and explicit goal prerequisites. JEV selects the goal.
2. For middle layer, scene request: eight non-bottom edges, centers, previous target and last two actions. JEV selects one of four middle edges.
3. Independent sticker/center comparisons, each answered by JEV.
4. Current layer and side-sticker comparisons go into intention selection. Four static contrasts teach align versus insert and done versus extract.
5. JEV's intention routes to setup destination and U turn, insertion front and routine, extraction routine, or leave. Code executes the selected fixed sequence without repair.
6. Observe again and ask the full goal request. Repeated-state recovery is explicitly chosen by JEV using the unchanged original recovery question.

This is an assisted controller. Accurate geometry, solved flags, fixed algorithms, universal move effects, explicit applicability examples and the original other-stage teaching are all supplied expertise. Code does not rank future outcomes or supply recommended actions. Offline test labels and scramble-generator search stay outside the solving requests.

## Paid evaluation

```
bun scripts/brain-teaching-full-v1/evaluate.ts validation
bun scripts/brain-teaching-full-v1/evaluate.ts final
```

Exclusive start markers prevent accidental repeat spending. Final evaluation requires complete independent verification of at least 9/10 ten-start solves and unchanged frozen sources. It uses 100 new full random-state starts and requires 95/100. All failures remain counted. Any test used for tuning must be retired. At most two development rounds total; a revised round needs a separate version and new data.

Shared study cap $1 across `brain-teaching-full-*` ledger entries; global cap $9. Each request conservatively reserves the 64k-token ceiling. At most four workers. No automatic retries. Every attempt is limited to 500 requests, 1000 face turns and 10 minutes. If budget exhausts, retain capped rows, including unstarted attempts capped before their first request, in the denominator. Do not claim acceptance from a partial result.

## Offline checks

```
bun scripts/brain-full-v3/freshness.ts experiments/brain-teaching-full-v1-validation
bun scripts/brain-teaching-full-v1/verify.ts experiments/brain-teaching-full-v1-validation
```

Use the final directory for final checks. Verification reconstructs cube states independently from recorded scrambles and moves, checks raw solved predicates, replays requests and decisions with saved model answers, confirms selected routines, detects interactive intervention and checks usage/limits. Partial verification is diagnostic only. Model credentials remain server-side.
