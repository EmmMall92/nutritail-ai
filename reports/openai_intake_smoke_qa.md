# OpenAI Intake Smoke QA

Generated: 2026-06-28T12:17:57.888Z
Status: skipped

No usable `OPENAI_API_KEY` was available in the QA environment.
This is expected in CI unless the secret is intentionally enabled there.

The smoke fixture still validates clean Greek prompts and the same fact-extraction prompt contract used by the app.
The deterministic fallback intake QA still runs separately through `npm.cmd run qa:ai-intake`.
