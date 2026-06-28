# NutriTail Post-Deploy Readiness

Generated: 2026-06-28T22:18:49.200Z
Result: PASS

This report is the quick post-deploy command summary for the live NutriTail surface.
It refreshes the core route, Food V2, account, OpenAI env, and readiness evidence after a production deploy.

## Summary

- Commands checked: 5
- Passed: 5
- Failed or needs review: 0
- Chatbot dashboard refreshed in this run: no

## Commands

| Step | Command | Status | Duration |
| --- | --- | --- | ---: |
| Public launch live routes | `npm.cmd run qa:public-launch-live-routes` | PASS | 1.6s |
| Food V2 live routes | `npm.cmd run qa:food-v2-live-routes` | PASS | 2.2s |
| Account progress live routes | `npm.cmd run qa:account-progress-live-routes` | PASS | 2.6s |
| Vercel OpenAI production env | `npm.cmd run qa:vercel-openai-env` | PASS | 3.1s |
| Live readiness dashboard | `npm.cmd run qa:live-readiness-dashboard` | PASS | 0.4s |

## Notes

- Run with `--refresh-chatbot` or `NUTRITAIL_QA_REFRESH_CHATBOT=1` when the deploy touches chatbot recommendation logic.
- The live readiness dashboard remains the authoritative rollup; this report records the post-deploy command sequence.
- The OpenAI env check confirms encrypted Production env presence without pulling or printing the secret.

