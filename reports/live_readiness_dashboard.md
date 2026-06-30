# NutriTail Live Readiness Dashboard

Generated: 2026-06-30T05:28:38.932Z
Result: PASS

This dashboard summarizes live route, customer-flow, and chatbot QA evidence.
It is intentionally evidence-based: each row points to the authoritative report and command.

## Overall Status

- Suites checked: 6
- Suites passing: 6/6
- Total checks/cases/routes: 1356
- Passed: 1356
- Failed or needs review: 0
- Pass rate: 100.0%
- 95% readiness score: 95/100
- Minimum readiness score: 95/100
- Core evidence score: 100.0% (blocks readiness)
- Advisory evidence score: 50.0% (non-blocking but needed for full OpenAI proof)
- Max report age: 48h
- Deploy freshness gate: not configured
- Oldest source report: Public launch live routes (5.4h)
- Next stale report: Public launch live routes in 42.6h
- Advisory evidence suites: 2

## Readiness Evidence

| Suite | Layer | Source report | Command | Status | Checked | Passed | Failed/review | Last run | Age | Freshness note |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | --- | ---: | --- |
| Public launch live routes | homepage, auth pages, legal pages, SEO files, manifest, OpenGraph image | `reports/public_launch_live_route_smoke_qa.md` | `npm.cmd run qa:public-launch-live-routes` | PASS | 14 | 14 | 0 | 2026-06-30T00:04:14.572Z | 5.4h | - |
| Food V2 live routes | admin Food V2 pages + protected Food V2 APIs | `reports/food_v2_live_route_smoke_qa.md` | `npm.cmd run qa:food-v2-live-routes` | PASS | 10 | 10 | 0 | 2026-06-30T00:04:18.999Z | 5.4h | - |
| Account progress live routes | account pages, pet pages, printable reports, progress API guard | `reports/account_progress_live_route_smoke_qa.md` | `npm.cmd run qa:account-progress-live-routes` | PASS | 10 | 10 | 0 | 2026-06-30T00:04:23.857Z | 5.4h | - |
| Customer chatbot flow links | saved pet deep links, progress links, customer-facing copy guards | `reports/customer_chatbot_flow_links_qa.md` | `npm.cmd run qa:customer-chatbot-flow-links` | PASS | 220 | 220 | 0 | 2026-06-30T00:10:40.732Z | 5.3h | - |
| Vercel OpenAI production env | production OpenAI API key presence without exposing the secret | `reports/vercel_openai_env_qa.md` | `npm.cmd run qa:vercel-openai-env` | PASS | 2 | 2 | 0 | 2026-06-30T00:04:27.519Z | 5.4h | - |
| Chatbot live QA dashboard | dog/cat recommendation live QA, intake QA, response contracts, customer UX | `reports/chatbot_live_qa_dashboard.md` | `npm.cmd run qa:chatbot-live-dashboard` | PASS | 1100 | 1100 | 0 | 2026-06-30T05:24:49.604Z | 4m | - |

## Advisory Evidence

These checks add confidence but do not block live readiness when skipped locally.

| Suite | Layer | Source report | Command | Status | Checked | Passed | Failed | Skipped | Last run | Age | Freshness note | Note |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | ---: | --- | --- |
| OpenAI intake smoke | structured pet-fact extraction through OpenAI when a key is available | `reports/openai_intake_smoke_qa.md` | `npm.cmd run qa:openai-intake-smoke` | SKIPPED | 5 | 0 | 0 | 5 | 2026-06-30T05:14:58.156Z | 14m | - | OPENAI_API_KEY or NUTRITAIL_QA_OPENAI_API_KEY_FILE was not available in this QA environment; production env is checked separately. |
| Account chatbot extract live route | authenticated live chatbot intake extraction endpoint | `reports/account_chatbot_extract_live_route_qa.md` | `npm.cmd run qa:account-chatbot-extract-live-route` | SKIPPED | 1 | 0 | 0 | 1 | 2026-06-30T05:14:57.630Z | 14m | - | NUTRITAIL_QA_AUTH_COOKIE or NUTRITAIL_QA_AUTH_COOKIE_FILE was not available; provide an authenticated account cookie for full live endpoint verification without committing or printing it. |

## Advisory Refresh Priority

These checks are non-blocking, but they show the next best QA evidence to refresh when the needed key or auth cookie is available.

| Priority | Suite | Status | Age | Time until stale | Source report | Command |
| ---: | --- | --- | ---: | ---: | --- | --- |
| 1 | Account chatbot extract live route | SKIPPED | 14m | 47.8h | `reports/account_chatbot_extract_live_route_qa.md` | `npm.cmd run qa:account-chatbot-extract-live-route` |
| 2 | OpenAI intake smoke | SKIPPED | 14m | 47.8h | `reports/openai_intake_smoke_qa.md` | `npm.cmd run qa:openai-intake-smoke` |

## Refresh Priority

| Priority | Suite | Age | Time until stale | Source report |
| ---: | --- | ---: | ---: | --- |
| 1 | Public launch live routes | 5.4h | 42.6h | `reports/public_launch_live_route_smoke_qa.md` |
| 2 | Food V2 live routes | 5.4h | 42.6h | `reports/food_v2_live_route_smoke_qa.md` |
| 3 | Account progress live routes | 5.4h | 42.6h | `reports/account_progress_live_route_smoke_qa.md` |

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
- The readiness score weights blocking core evidence at 90% and advisory OpenAI/authenticated-route evidence at 10%. Skipped advisory checks count as partial evidence because the route and secret-handling code are present, but the live credentialed smoke was not executed in this environment.

## Next Live Checks

- Rerun this dashboard after each deploy that touches account, chatbot, Food V2, or report routes.
- Refresh first: Public launch live routes (npm.cmd run qa:public-launch-live-routes).
- Reports older than 48h are marked STALE and block readiness until rerun.
- Set `NUTRITAIL_QA_DEPLOYED_AT` to the production deploy timestamp to require reports generated after that deploy.
- If a report is older than the current deploy, rerun the source command before relying on it.
- When OpenAI settings change, rerun `npm.cmd run qa:openai-intake-smoke` in an environment with `OPENAI_API_KEY` or `NUTRITAIL_QA_OPENAI_API_KEY_FILE`.
- If the readiness score falls below 95/100, this script exits non-zero even when individual core suites are passing.

