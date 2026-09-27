# Research notes

These notes record the experiments as they happened. Their status updates, budget figures and proposed next steps belong to that point in the study. The study is complete, and none of these notes schedules further API calls.

The current solver is in `src/solver/`. Start with the [final results](budget-round-results.md), the [architecture guide](../architecture.md) or the [evidence and offline verification guide](../../research/README.md).

## Reading order

- **Original beginner method:** [request evaluation](request-evaluation.md), [component coverage](request-coverage.md), [99/100 result](results.md) and [completion audit](completion-audit.md). This evaluation allowed 1,000 turns.
- **Reducing assistance:** [turn prediction](reasoning-experiments.md), [decision ownership](brain-policy-boundary.md), [minimum teaching](minimum-teaching-results.md) and [plateau findings](less-help-goal-status.md).
- **Longer confirmation runs:** [full teaching integration](full-teaching-integration-results.md), [confirmation results](frozen-confirmation-results.md), [cost breakdown](frozen-confirmation-costs.md), [resumed results](frozen-confirmation-resumed-results.md) and [resumed cost breakdown](frozen-confirmation-resumed-costs.md).
- **Fewer than 100 turns:** [stage diagnosis](move-efficiency-progress.md), [F2L](f2l-efficiency-progress.md), [extraction](extraction-efficiency-progress.md), [alignment](alignment-efficiency-progress.md), [top cross](top-cross-efficiency-progress.md), [last layer](last-layer-efficiency-progress.md), [diagonal corners](diagonal-corners-progress.md) and [full PLL](full-pll-progress.md).
- **Final refinements:** [daisy preparation](daisy-efficiency-progress.md), [protecting solved edges](protected-landing-progress.md), [contextual decisions](contextual-decision-followup.md), [grouped F2L](f2l-recognition-v2-progress.md), [budget-round progress](budget-round-progress.md), [audit](budget-round-audit.md) and [98/100 results](budget-round-results.md).
- **Article and future ideas:** [editorial review](article-reader-review.md) and an [unused follow-up proposal](next-goal-template.md).

## Available records

The two final evaluations are included under [`research/evidence/`](../../research/evidence/). Smaller JSON files in [`src/lib/`](../../src/lib/) supply the article tables and selected request examples. The [notebook](../../notes.md) collects lessons across experiments, with a separate [detailed chronology](notebook-archive.md).

Paths beginning with `experiments/` and most experiment-specific `scripts/` paths refer to the original workspace. Those files were removed from the current tree when the repository was prepared for release. They are identified as archived paths here, rather than offered as working download links or current commands. Earlier Git history retains many of those files, but running retired code is outside the supported setup.

To replay the current solver against all 100 saved final attempts without an API key:

```sh
bun run verify:recordings
```

This checks how the current code uses recorded responses. It does not rerun the hosted model or predict how often a new live evaluation would succeed.
