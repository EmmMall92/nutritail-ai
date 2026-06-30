# OpenAI Intake Smoke QA

Generated: 2026-06-30T05:14:58.156Z
Status: skipped

No usable `OPENAI_API_KEY` was available in the QA environment.
This is expected in CI unless the secret is intentionally enabled there.
You can also set `NUTRITAIL_QA_OPENAI_API_KEY_FILE` to a local ignored file containing the key. The key value is never written to this report.

## Summary

- Cases checked: 5
- Passed: 0
- Failed: 0
- Skipped: 5
- OpenAI key source: missing

The smoke fixture validates clean Greek prompts, the same NutriTail fact-extraction prompt contract, and the same intake validation layer used by the app.
The deterministic fallback intake QA still runs separately through `npm.cmd run qa:ai-intake`.
