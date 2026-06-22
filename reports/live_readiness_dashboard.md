# NutriTail Live Readiness Dashboard

Generated: 2026-06-22T20:49:45.836Z
Result: PASS

This dashboard summarizes live route, customer-flow, and chatbot QA evidence.
It is intentionally evidence-based: each row points to the authoritative report and command.

## Overall Status

- Suites checked: 4
- Suites passing: 4/4
- Total checks/cases/routes: 1198
- Passed: 1198
- Failed or needs review: 0
- Pass rate: 100.0%

## Readiness Evidence

| Suite | Layer | Source report | Command | Status | Checked | Passed | Failed/review | Last run |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | --- |
| Food V2 live routes | admin Food V2 pages + protected Food V2 APIs | `reports/food_v2_live_route_smoke_qa.md` | `npm.cmd run qa:food-v2-live-routes` | PASS | 10 | 10 | 0 | 2026-06-22T20:49:32.093Z |
| Account progress live routes | account pages, pet pages, printable reports, progress API guard | `reports/account_progress_live_route_smoke_qa.md` | `npm.cmd run qa:account-progress-live-routes` | PASS | 10 | 10 | 0 | 2026-06-22T20:38:26.955Z |
| Customer chatbot flow links | saved pet deep links, progress links, customer-facing copy guards | `reports/customer_chatbot_flow_links_qa.md` | `npm.cmd run qa:customer-chatbot-flow-links` | PASS | 78 | 78 | 0 | 2026-06-22T20:49:41.345Z |
| Chatbot live QA dashboard | dog/cat recommendation live QA, intake QA, response contracts, customer UX | `reports/chatbot_live_qa_dashboard.md` | `npm.cmd run qa:chatbot-live-dashboard` | PASS | 1100 | 1100 | 0 | 2026-06-22T20:49:41.323Z |

## Chatbot Evidence Details

- Live recommendation cases: 1100/1100
- Recommendation cases needing review: 0
- Response contract failures: 0
- Customer UX suites: 2/2
- Fixture integrity suites: 1/1

## Interpretation

- Food V2 and account route smoke checks prove key live pages and protected APIs are deployed.
- Customer flow link QA protects saved-pet, progress-check, report, and chatbot navigation behavior.
- Chatbot live QA protects dog/cat recommendation behavior separately from route availability.
- Fixture integrity protects the large Greek cat QA batch before live cat tests run.

## Next Live Checks

- Rerun this dashboard after each deploy that touches account, chatbot, Food V2, or report routes.
- If a route report is older than the current deploy, rerun the source command before relying on it.
- When OpenAI settings change, rerun `npm.cmd run qa:openai-intake-smoke` in an environment with `OPENAI_API_KEY`.

