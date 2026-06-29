# Account Chatbot Extract Live Route QA

Generated: 2026-06-29T09:03:32.717Z
Site: https://nutritail.ai
Status: skipped

This advisory smoke test verifies the authenticated live route used for OpenAI-backed chatbot intake extraction.
It never writes cookies, tokens, or extracted raw secrets to the report.

## Summary

- Routes checked: 1
- Passed: 0
- Failed: 0
- Skipped: 1

No authenticated cookie was available locally, so this test was skipped safely. Production route availability is still covered by account live-route smoke tests.

## Results

| Route | Method | Status | Result | Source | Time | Notes |
| --- | --- | ---: | --- | --- | ---: | --- |
| /api/account/chatbot/extract-intake | POST | error | skip | - | 0ms | Set NUTRITAIL_QA_AUTH_COOKIE to run this against an authenticated live account session. |