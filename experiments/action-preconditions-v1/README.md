# Explicit action preconditions

Isolated component experiment, not cube-solving acceptance.

Three forms each scored 20/20 transfer and 20/20 landing cases in development. Rule and criteria forms use one call per case; check-then-choice uses two. The frozen single-call rule form, selected by accuracy then requests then cost, passed 20/20 transfer and 20/20 landing on fresh disjoint validation cubes.

Total: 200 requests, $0.005167764, no retries or provider errors. Limits were 260 calls/$0.04, including reservations. Shared cumulative project cap remains $9.

The evaluator supplies earlier target, reference and routine decisions for isolation. Observations include sticker directions, side-center equality and current petal occupancy. Required-free slots are metadata from the selected fixed routine. The model selects insert/align or execute/clear/lower. No moves are executed in this study. The runtime policy does not receive expected answers, scramble history or predicted action outcomes. All landing fixtures concern one required slot; multi-slot routines are untested here.

## Reproduction

- `bun test tests/action-preconditions.test.ts`: mechanics, identity, observation and payload-boundary verification, no model calls.
- `bun scripts/preconditions/export.ts`: export exact request/native-response recordings, no calls.
- `bun scripts/preconditions/run.ts prepare`: create 40 development and 40 validation fixtures (refuses to overwrite).
- `bun scripts/preconditions/run.ts development`: three variants in parallel, at most three active calls.
- `bun scripts/preconditions/run.ts validation`: frozen selected wording per family on fresh cases.

Start markers prevent repeated paid phases. Policy hash is checked before execution. Preserve old study records rather than deleting markers to rerun. The manifest and source copies record the original configuration. Native immutable exchanges and reservations also remain in SQLite.

See `/request-flow` → Action preconditions for the exact calls and `notes.md` for interpretations and next integration hypothesis. Historical 99/100 full-cube performance belongs to another policy.
