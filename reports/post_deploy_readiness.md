# NutriTail Post-Deploy Readiness

Generated: 2026-06-29T11:24:34.189Z
Result: PASS

This report is the quick post-deploy command summary for the live NutriTail surface.
It refreshes the core route, Food V2, account, OpenAI env, and readiness evidence after a production deploy.

## Summary

- Commands checked: 8
- Passed: 8
- Failed or needs review: 0
- Chatbot QA refreshed in this run: yes

## Commands

| Step | Command | Status | Duration |
| --- | --- | --- | ---: |
| Public launch live routes | `npm.cmd run qa:public-launch-live-routes` | PASS | 5.3s |
| Food V2 live routes | `npm.cmd run qa:food-v2-live-routes` | PASS | 4.3s |
| Account progress live routes | `npm.cmd run qa:account-progress-live-routes` | PASS | 5.0s |
| Vercel OpenAI production env | `npm.cmd run qa:vercel-openai-env` | PASS | 3.2s |
| Chatbot golden suite fast | `npm.cmd run qa:chatbot-golden-suite:fast` | PASS | 111.7s |
| Chatbot sensitive recommendation smoke | `npm.cmd run qa:chatbot-sensitive-recommendations` | PASS | 117.3s |
| Chatbot live QA dashboard | `npm.cmd run qa:chatbot-live-dashboard` | PASS | 0.4s |
| Live readiness dashboard | `npm.cmd run qa:live-readiness-dashboard` | PASS | 0.4s |

## Notes

- Run with `--refresh-chatbot` or `NUTRITAIL_QA_REFRESH_CHATBOT=1` when the deploy touches chatbot recommendation logic; this runs the fast golden suite and sensitive recommendation smoke before refreshing the chatbot QA dashboard.
- The live readiness dashboard remains the authoritative rollup; this report records the post-deploy command sequence.
- The OpenAI env check confirms encrypted Production env presence without pulling or printing the secret.

