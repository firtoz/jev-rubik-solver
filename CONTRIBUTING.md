# Contributing

Install Bun, run `bun install --frozen-lockfile`, then `bun run check`. Tests use a temporary SQLite database and block live provider requests. A provider key is not needed for verification.

Keep prompts and code/model responsibilities explicit. Code may measure facts, transform coordinates, execute a JEV-selected routine and score a result. It must not silently choose a matching case, rank predicted outcomes or repair a tactical mistake.

Changes to active prompts must update the policy version and be evaluated separately. The recorded-request verifier deliberately detects prompt drift. Do not change historical responses or fixtures to make a new prompt pass. Keep failures in the denominator; label subsets and selected best cases.

For UI changes, check the article and request flow at narrow and wide widths. Do not put keys or server-only configuration in browser components.

Use a small labelled offline test first. Any live study needs an explicit budget and output directory, and a fresh held-out set if earlier failures informed tuning. Do not run paid evaluations in CI.

Historical notes describe retired implementations and original paths. New documentation should point to `src/solver` and current commands.
