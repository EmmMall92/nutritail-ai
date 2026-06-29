# NutriTail Live Readiness Dashboard

Generated: 2026-06-29T23:56:38.137Z
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
- Max report age: 48h
- Deploy freshness gate: not configured
- Oldest source report: Chatbot live QA dashboard (1.1h)
- Next stale report: Chatbot live QA dashboard in 46.9h
- Advisory evidence suites: 2

## Readiness Evidence

| Suite | Layer | Source report | Command | Status | Checked | Passed | Failed/review | Last run | Age | Freshness note |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | --- | ---: | --- |
| Public launch live routes | homepage, auth pages, legal pages, SEO files, manifest, OpenGraph image | `reports/public_launch_live_route_smoke_qa.md` | `npm.cmd run qa:public-launch-live-routes` | PASS | 14 | 14 | 0 | 2026-06-29T23:56:30.109Z | 0m | - |
| Food V2 live routes | admin Food V2 pages + protected Food V2 APIs | `reports/food_v2_live_route_smoke_qa.md` | `npm.cmd run qa:food-v2-live-routes` | PASS | 10 | 10 | 0 | 2026-06-29T23:56:32.006Z | 0m | - |
| Account progress live routes | account pages, pet pages, printable reports, progress API guard | `reports/account_progress_live_route_smoke_qa.md` | `npm.cmd run qa:account-progress-live-routes` | PASS | 10 | 10 | 0 | 2026-06-29T23:56:34.356Z | 0m | - |
| Customer chatbot flow links | saved pet deep links, progress links, customer-facing copy guards | `reports/customer_chatbot_flow_links_qa.md` | `npm.cmd run qa:customer-chatbot-flow-links` | PASS | 220 | 220 | 0 | 2026-06-29T23:56:34.778Z | 0m | - |
| Vercel OpenAI production env | production OpenAI API key presence without exposing the secret | `reports/vercel_openai_env_qa.md` | `npm.cmd run qa:vercel-openai-env` | PASS | 2 | 2 | 0 | 2026-06-29T23:56:37.700Z | 0m | - |
| Chatbot live QA dashboard | dog/cat recommendation live QA, intake QA, response contracts, customer UX | `reports/chatbot_live_qa_dashboard.md` | `npm.cmd run qa:chatbot-live-dashboard` | PASS | 1100 | 1100 | 0 | 2026-06-29T22:51:13.045Z | 1.1h | - |

## Advisory Evidence

These checks add confidence but do not block live readiness when skipped locally.

| Suite | Layer | Source report | Command | Status | Checked | Passed | Failed | Skipped | Last run | Age | Freshness note | Note |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | ---: | --- | --- |
| OpenAI intake smoke | structured pet-fact extraction through OpenAI when a key is available | `reports/openai_intake_smoke_qa.md` | `npm.cmd run qa:openai-intake-smoke` | SKIPPED | 5 | 0 | 0 | 5 | 2026-06-29T23:52:19.473Z | 4m | - | OPENAI_API_KEY was not available in this QA environment; production env is checked separately. |
| Account chatbot extract live route | authenticated live chatbot intake extraction endpoint | `reports/account_chatbot_extract_live_route_qa.md` | `npm.cmd run qa:account-chatbot-extract-live-route` | SKIPPED | 1 | 0 | 0 | 1 | 2026-06-29T09:03:32.717Z | 14.9h | - | NUTRITAIL_QA_AUTH_COOKIE was not available; provide an authenticated account cookie for full live endpoint verification. |

## Advisory Refresh Priority

These checks are non-blocking, but they show the next best QA evidence to refresh when the needed key or auth cookie is available.

| Priority | Suite | Status | Age | Time until stale | Source report | Command |
| ---: | --- | --- | ---: | ---: | --- | --- |
| 1 | Account chatbot extract live route | SKIPPED | 14.9h | 33.1h | `reports/account_chatbot_extract_live_route_qa.md` | `npm.cmd run qa:account-chatbot-extract-live-route` |
| 2 | OpenAI intake smoke | SKIPPED | 4m | 47.9h | `reports/openai_intake_smoke_qa.md` | `npm.cmd run qa:openai-intake-smoke` |

## Refresh Priority

| Priority | Suite | Age | Time until stale | Source report |
| ---: | --- | ---: | ---: | --- |
| 1 | Chatbot live QA dashboard | 1.1h | 46.9h | `reports/chatbot_live_qa_dashboard.md` |
| 2 | Public launch live routes | 0m | 48.0h | `reports/public_launch_live_route_smoke_qa.md` |
| 3 | Food V2 live routes | 0m | 48.0h | `reports/food_v2_live_route_smoke_qa.md` |

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

## Next Live Checks

- Rerun this dashboard after each deploy that touches account, chatbot, Food V2, or report routes.
- Refresh first: Chatbot live QA dashboard (npm.cmd run qa:chatbot-live-dashboard).
- Reports older than 48h are marked STALE and block readiness until rerun.
- Set `NUTRITAIL_QA_DEPLOYED_AT` to the production deploy timestamp to require reports generated after that deploy.
- If a report is older than the current deploy, rerun the source command before relying on it.
- When OpenAI settings change, rerun `npm.cmd run qa:openai-intake-smoke` in an environment with `OPENAI_API_KEY`.

