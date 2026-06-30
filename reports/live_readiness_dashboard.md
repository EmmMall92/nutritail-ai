# NutriTail Live Readiness Dashboard

Generated: 2026-06-30T13:44:17.246Z
Result: PASS

This dashboard summarizes live route, customer-flow, and chatbot QA evidence.
It is intentionally evidence-based: each row points to the authoritative report and command.

## Overall Status

- Suites checked: 7
- Suites passing: 7/7
- Total checks/cases/routes: 1372
- Passed: 1372
- Failed or needs review: 0
- Pass rate: 100.0%
- 95% readiness score: 95/100
- Minimum readiness score: 95/100
- Customer-ready core status: PASS
- Full OpenAI proof status: PENDING
- Core evidence score: 100.0% (blocks readiness)
- Advisory evidence score: 50.0% (non-blocking but needed for full OpenAI proof)
- Max report age: 48h
- Deploy freshness gate: reports must be newer than 2026-06-30T05:45:36.609Z
- Oldest source report: Public launch live routes (8.0h)
- Next stale report: Public launch live routes in 40.0h
- Advisory evidence suites: 2

## Readiness Evidence

| Suite | Layer | Source report | Command | Status | Checked | Passed | Failed/review | Last run | Age | Freshness note |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | --- | ---: | --- |
| Public launch live routes | homepage, auth pages, legal pages, SEO files, manifest, OpenGraph image | `reports/public_launch_live_route_smoke_qa.md` | `npm.cmd run qa:public-launch-live-routes` | PASS | 14 | 14 | 0 | 2026-06-30T05:45:38.489Z | 8.0h | - |
| Food V2 live routes | admin Food V2 pages + protected Food V2 APIs | `reports/food_v2_live_route_smoke_qa.md` | `npm.cmd run qa:food-v2-live-routes` | PASS | 10 | 10 | 0 | 2026-06-30T05:45:40.649Z | 8.0h | - |
| Account progress live routes | account pages, pet pages, printable reports, progress API guard | `reports/account_progress_live_route_smoke_qa.md` | `npm.cmd run qa:account-progress-live-routes` | PASS | 10 | 10 | 0 | 2026-06-30T12:16:40.182Z | 1.5h | - |
| Customer chatbot flow links | saved pet deep links, progress links, customer-facing copy guards | `reports/customer_chatbot_flow_links_qa.md` | `npm.cmd run qa:customer-chatbot-flow-links` | PASS | 229 | 229 | 0 | 2026-06-30T13:38:57.576Z | 5m | - |
| Vercel OpenAI production env | production OpenAI API key presence without exposing the secret | `reports/vercel_openai_env_qa.md` | `npm.cmd run qa:vercel-openai-env` | PASS | 2 | 2 | 0 | 2026-06-30T05:45:46.350Z | 8.0h | - |
| OpenAI food brand guard | answer-writer guard that blocks unlisted food brands from customer replies | `reports/openai_food_brand_guard_qa.md` | `npm.cmd run qa:openai-food-brand-guard` | PASS | 7 | 7 | 0 | 2026-06-30T13:31:16.040Z | 13m | - |
| Chatbot live QA dashboard | dog/cat recommendation live QA, intake QA, response contracts, customer UX | `reports/chatbot_live_qa_dashboard.md` | `npm.cmd run qa:chatbot-live-dashboard` | PASS | 1100 | 1100 | 0 | 2026-06-30T05:45:58.420Z | 8.0h | - |

## Advisory Evidence

These checks add confidence but do not block live readiness when skipped locally.

| Suite | Layer | Source report | Command | Status | Checked | Passed | Failed | Skipped | Last run | Age | Freshness note | Note |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | ---: | --- | --- |
| OpenAI intake smoke | structured pet-fact extraction through OpenAI when a key is available | `reports/openai_intake_smoke_qa.md` | `npm.cmd run qa:openai-intake-smoke` | SKIPPED | 5 | 0 | 0 | 5 | 2026-06-30T05:45:47.234Z | 8.0h | - | OPENAI_API_KEY or NUTRITAIL_QA_OPENAI_API_KEY_FILE was not available in this QA environment; production env is checked separately. |
| Account chatbot extract live route | authenticated live chatbot intake extraction endpoint | `reports/account_chatbot_extract_live_route_qa.md` | `npm.cmd run qa:account-chatbot-extract-live-route` | SKIPPED | 1 | 0 | 0 | 1 | 2026-06-30T05:45:47.639Z | 8.0h | - | NUTRITAIL_QA_AUTH_COOKIE or NUTRITAIL_QA_AUTH_COOKIE_FILE was not available; provide an authenticated account cookie for full live endpoint verification without committing or printing it. |

## Advisory Refresh Priority

These checks are non-blocking, but they show the next best QA evidence to refresh when the needed key or auth cookie is available.

| Priority | Suite | Status | Age | Time until stale | Source report | Command |
| ---: | --- | --- | ---: | ---: | --- | --- |
| 1 | OpenAI intake smoke | SKIPPED | 8.0h | 40.0h | `reports/openai_intake_smoke_qa.md` | `npm.cmd run qa:openai-intake-smoke` |
| 2 | Account chatbot extract live route | SKIPPED | 8.0h | 40.0h | `reports/account_chatbot_extract_live_route_qa.md` | `npm.cmd run qa:account-chatbot-extract-live-route` |

## Refresh Priority

| Priority | Suite | Age | Time until stale | Source report |
| ---: | --- | ---: | ---: | --- |
| 1 | Public launch live routes | 8.0h | 40.0h | `reports/public_launch_live_route_smoke_qa.md` |
| 2 | Food V2 live routes | 8.0h | 40.0h | `reports/food_v2_live_route_smoke_qa.md` |
| 3 | Vercel OpenAI production env | 8.0h | 40.0h | `reports/vercel_openai_env_qa.md` |

## Chatbot Evidence Details

- Live recommendation cases: 1100/1100
- Recommendation cases needing review: 0
- Intake QA: 18/24
- Intake QA failures: 0
- Intake QA skipped suites: 2
- Prompt encoding repairs applied: 0
- Prompt encoding issues after repair: 0
- Response contract failures: 0
- Customer UX suites: 3/3
- Fixture/coverage evidence suites: 4/4

## Interpretation

- Food V2 and account route smoke checks prove key live pages and protected APIs are deployed.
- Customer flow link QA protects saved-pet, progress-check, report, and chatbot navigation behavior.
- Chatbot live QA protects dog/cat recommendation behavior separately from route availability.
- Intake QA is visible separately so OpenAI smoke skips or failures do not hide behind recommendation totals.
- Fixture integrity, coverage audits, and live encoding checks protect the large Greek dog/cat QA batches before live tests run.
- Customer-ready core status is PASS. Full OpenAI proof status is PENDING; it becomes PASS only after the OpenAI intake smoke and authenticated chatbot extract route both run successfully.
- The readiness score weights blocking core evidence at 90% and advisory OpenAI/authenticated-route evidence at 10%. Skipped advisory checks count as partial evidence because the route and secret-handling code are present, but the live credentialed smoke was not executed in this environment.

## Next Live Checks

- Rerun this dashboard after each deploy that touches account, chatbot, Food V2, or report routes.
- Refresh first: Public launch live routes (npm.cmd run qa:public-launch-live-routes).
- Reports older than 48h are marked STALE and block readiness until rerun.
- Set `NUTRITAIL_QA_DEPLOYED_AT` to the production deploy timestamp to require reports generated after that deploy.
- If a report is older than the current deploy, rerun the source command before relying on it.
- When OpenAI settings change, rerun `npm.cmd run qa:openai-intake-smoke` in an environment with `OPENAI_API_KEY` or `NUTRITAIL_QA_OPENAI_API_KEY_FILE`.
- If the readiness score falls below 95/100, this script exits non-zero even when individual core suites are passing.

