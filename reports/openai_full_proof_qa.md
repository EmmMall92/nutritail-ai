# OpenAI Full Proof QA

Generated: 2026-06-30T14:17:13.302Z
Status: PENDING

This report summarizes the two pieces of evidence required before NutriTail can call OpenAI proof fully complete.
It does not write OpenAI keys, cookies, tokens, raw secrets, or extracted secret values.

## Summary

- Checks required: 2
- Passed: 0
- Pending: 2
- Review: 0
- Full OpenAI proof: PENDING

## Evidence

| Check | Status | Checked | Passed | Failed | Skipped | Source report | Last run | Note |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- |
| OpenAI intake smoke | PENDING | 5 | 0 | 0 | 5 | `reports/openai_intake_smoke_qa.md` | 2026-06-30T14:14:23.075Z | Set OPENAI_API_KEY or NUTRITAIL_QA_OPENAI_API_KEY_FILE to a local ignored key file. |
| Authenticated chatbot extract live route | PENDING | 1 | 0 | 0 | 1 | `reports/account_chatbot_extract_live_route_qa.md` | 2026-06-30T14:14:23.447Z | Set NUTRITAIL_QA_AUTH_COOKIE or NUTRITAIL_QA_AUTH_COOKIE_FILE to a local ignored file containing an authenticated QA account Cookie header. |

## How To Make This PASS

1. Put the OpenAI key in a local ignored secret source, for example `NUTRITAIL_QA_OPENAI_API_KEY_FILE`, or export `OPENAI_API_KEY` only for the shell session.
2. Put an authenticated NutriTail account Cookie header in a local ignored file and set `NUTRITAIL_QA_AUTH_COOKIE_FILE`.
3. Run `npm.cmd run qa:openai-full-proof`.
4. Do not commit, print, paste, or screenshot the key or cookie.

OpenAI still remains limited to fact extraction and final human wording. Food ranking, exclusions, medical safety and nutrient truth stay in NutriTail deterministic code.

