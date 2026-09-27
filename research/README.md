# Evidence and reproduction

Only the grouped-menu solver is runnable in this repository. Earlier implementations and one-off study runners have been retired. Their summaries remain in the article, `docs/research/` and `notes.md`.

## Final records

- `evidence/grouped-menu/`: latest final evaluation, 98/100 solves within 100 face turns.
- `evidence/full-menu/`: historical comparison, 97/100 on a separate fresh set.
- `results.json.gz`: losslessly compressed exact requests, responses, states, actions and unsuccessful attempts.
- `fixtures.json`: starting scrambles and hashes, kept outside policy inputs.
- `report.json`, `completion.json`, `verification.json`: original outcome accounting.
- `manifest.json`: original evaluation metadata. Embedded historical source copies are omitted from the public manifest to avoid maintaining retired implementations. Original source paths/hashes in metadata describe the experiment before repository reorganisation.

Read compressed records with Bun's `node:zlib` or `gzip -dc`. The article's smaller replay assets live in `src/lib/article-*.json` and `public/recordings/article-best-flow.json`.

## Offline verification

```sh
bun run verify:recordings
```

This reconstructs the 100 latest starting cubes, feeds saved answers through the active policy, checks exact request bodies and validated native responses, applies every recorded action, and checks final states and turn ceilings. It makes no provider calls and needs no private database. It preserves abstentions and capped/interrupted attempts.

The original verification additionally compared wire events with a private SQLite ledger, frozen sources and earlier dataset hashes. Those historical reports are retained; the public verifier cannot independently establish that a fixture was unseen by every prior private experiment.

Archived research paths in older notes identify the original workspace, not commands supported by this checkout. In the author's local workspace, the complete original experiment archive remains under ignored `.data/cleanup-backup/`. It is intentionally absent from a public release.

## New experiments

Use fresh labelled development cases, then freeze a candidate before generating new held-out cases. Do not tune on these final fixtures and report another evaluation on the same set as unseen. A changed prompt requires a new policy version and new evidence, not editing historical answers.

No live study runs automatically. The CLI requires `--live`. The website uses saved recordings only.
