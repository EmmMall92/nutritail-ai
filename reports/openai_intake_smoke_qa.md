# OpenAI Intake Smoke QA

Generated: 2026-06-23T04:53:28.004Z
Status: skipped

No usable `OPENAI_API_KEY` was available in the QA environment.
This is expected in CI unless the secret is intentionally enabled there.

The deterministic fallback intake QA still runs separately through `npm.cmd run qa:ai-intake`.
