# NutriTail Post-Deploy Readiness

Generated: 2026-06-30T13:57:59.787Z
Result: PASS

This report is the quick post-deploy command summary for the live NutriTail surface.
It refreshes the core route, Food V2, account, OpenAI env, and readiness evidence after a production deploy.

## Summary

- Commands checked: 12
- Passed: 10
- Skipped: 2
- Failed or needs review: 0
- Chatbot QA refreshed in this run: yes
- Customer chatbot flow refreshed in this run: yes
- Deploy freshness gate used: 2026-06-30T13:50:00.306Z
- Freshness source reports refreshed: yes
- Live readiness result: PASS
- Live readiness score: 95/100
- Minimum readiness score: 95/100
- Core evidence score: 100.0% (blocks readiness)
- Advisory evidence score: 50.0% (non-blocking but needed for full OpenAI proof)
- Live readiness generated: 2026-06-30T13:57:59.760Z

## Commands

| Step | Command | Status | Duration |
| --- | --- | --- | ---: |
| Public launch live routes | `npm.cmd run qa:public-launch-live-routes` | PASS | 7.0s |
| Food V2 live routes | `npm.cmd run qa:food-v2-live-routes` | PASS | 4.2s |
| Account progress live routes | `npm.cmd run qa:account-progress-live-routes` | PASS | 5.1s |
| Customer chatbot flow links | `npm.cmd run qa:customer-chatbot-flow-links` | PASS | 0.5s |
| Vercel OpenAI production env | `npm.cmd run qa:vercel-openai-env` | PASS | 13.1s |
| OpenAI intake smoke | `npm.cmd run qa:openai-intake-smoke` | SKIP | 0.9s |
| OpenAI food brand guard | `npm.cmd run qa:openai-food-brand-guard` | PASS | 0.7s |
| Account chatbot extract live route | `npm.cmd run qa:account-chatbot-extract-live-route` | SKIP | 0.4s |
| Chatbot golden suite fast | `npm.cmd run qa:chatbot-golden-suite:fast` | PASS | 323.5s |
| Chatbot sensitive recommendation smoke | `npm.cmd run qa:chatbot-sensitive-recommendations` | PASS | 123.4s |
| Chatbot live QA dashboard | `npm.cmd run qa:chatbot-live-dashboard` | PASS | 0.4s |
| Live readiness dashboard | `npm.cmd run qa:live-readiness-dashboard` | PASS | 0.4s |

## Notes

- Run with `--refresh-chatbot` or `NUTRITAIL_QA_REFRESH_CHATBOT=1` when the deploy touches chatbot recommendation logic; this runs the fast golden suite and sensitive recommendation smoke before refreshing the chatbot QA dashboard.
- Customer chatbot flow links run by default because saved-pet navigation, scrolling, language, and customer-facing copy are production-critical.
- Long chatbot suites stream their output while they run, so post-deploy checks should show progress instead of appearing silent.
- Run with `--deploy-freshness` or set `NUTRITAIL_QA_DEPLOY_FRESHNESS=1` to require the live readiness dashboard reports to be newer than the start of this post-deploy run.
- Use `--deployed-at=<ISO timestamp>` or `NUTRITAIL_QA_DEPLOYED_AT=<ISO timestamp>` when you know the exact production deploy time.
- The live readiness dashboard remains the authoritative rollup; this report records the post-deploy command sequence.
- The OpenAI env check confirms encrypted Production env presence without pulling or printing the secret.
- Skipped checks are non-blocking local evidence gaps, usually because local credentials such as `OPENAI_API_KEY` or an authenticated cookie are intentionally unavailable.

