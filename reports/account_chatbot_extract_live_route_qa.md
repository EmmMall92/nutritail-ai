# Account Chatbot Extract Live Route QA

Generated: 2026-06-30T13:50:32.122Z
Site: https://nutritail.ai
Status: skipped

This advisory smoke test verifies the authenticated live route used for OpenAI-backed chatbot intake extraction.
It never writes cookies, tokens, or extracted raw secrets to the report.

## Summary

- Routes checked: 1
- Passed: 0
- Failed: 0
- Skipped: 1
- Auth cookie source: missing

No authenticated cookie was available locally, so this test was skipped safely. To run it, set NUTRITAIL_QA_AUTH_COOKIE directly or set NUTRITAIL_QA_AUTH_COOKIE_FILE to a local ignored file containing the Cookie header. Do not commit or print the cookie.

## Results

| Route | Method | Status | Result | Source | Time | Notes |
| --- | --- | ---: | --- | --- | ---: | --- |
| /api/account/chatbot/extract-intake | POST | error | skip | - | 0ms | Set NUTRITAIL_QA_AUTH_COOKIE or NUTRITAIL_QA_AUTH_COOKIE_FILE to run this against an authenticated live account session. |