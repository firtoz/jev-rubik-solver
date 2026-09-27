# Security

The website is read-only: it serves article content and saved recordings, with no JEV request endpoints. It needs no provider credentials. Development and production scripts bind to localhost by default.

Store `TYPESAFE_API_KEY` only in a local environment variable or ignored `.env`. The local CLI sends it to TypeSafe; it is not included in request/response records or browser bundles. Cube observations and teaching material are sent to the provider during explicit CLI live runs.

The local `.data/` directory contains the SQLite ledger and may contain private research backups. Never publish it. The release exporter uses an explicit file allowlist and excludes Git history. It does not publish anything.

If you discover a credential exposure, revoke the credential before sharing a report. Contact the repository maintainer privately and omit secret values from issues and attachments.
