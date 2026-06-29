# NutriTail Post-Deploy Readiness

Generated: 2026-06-29T23:38:45.908Z
Result: PASS

This report is the quick post-deploy command summary for the live NutriTail surface.
It refreshes the core route, Food V2, account, OpenAI env, and readiness evidence after a production deploy.

## Summary

- Commands checked: 6
- Passed: 6
- Failed or needs review: 0
- Chatbot QA refreshed in this run: no
- Customer chatbot flow refreshed in this run: yes
- Deploy freshness gate used: no
- Freshness source reports refreshed: no

## Commands

| Step | Command | Status | Duration |
| --- | --- | --- | ---: |
| Public launch live routes | `npm.cmd run qa:public-launch-live-routes` | PASS | 6.5s |
| Food V2 live routes | `npm.cmd run qa:food-v2-live-routes` | PASS | 4.3s |
| Account progress live routes | `npm.cmd run qa:account-progress-live-routes` | PASS | 4.7s |
| Customer chatbot flow links | `npm.cmd run qa:customer-chatbot-flow-links` | PASS | 0.5s |
| Vercel OpenAI production env | `npm.cmd run qa:vercel-openai-env` | PASS | 3.0s |
| Live readiness dashboard | `npm.cmd run qa:live-readiness-dashboard` | PASS | 0.4s |

## Notes

- Run with `--refresh-chatbot` or `NUTRITAIL_QA_REFRESH_CHATBOT=1` when the deploy touches chatbot recommendation logic; this runs the fast golden suite and sensitive recommendation smoke before refreshing the chatbot QA dashboard.
- Customer chatbot flow links run by default because saved-pet navigation, scrolling, language, and customer-facing copy are production-critical.
- Run with `--deploy-freshness` or set `NUTRITAIL_QA_DEPLOY_FRESHNESS=1` to require the live readiness dashboard reports to be newer than the start of this post-deploy run.
- Use `--deployed-at=<ISO timestamp>` or `NUTRITAIL_QA_DEPLOYED_AT=<ISO timestamp>` when you know the exact production deploy time.
- The live readiness dashboard remains the authoritative rollup; this report records the post-deploy command sequence.
- The OpenAI env check confirms encrypted Production env presence without pulling or printing the secret.

