# Chatbot Live QA Dashboard

Generated: 2026-06-30T05:39:18.029Z

This dashboard summarizes the current live recommendation QA evidence for NutriTail.
It points to the authoritative per-suite reports instead of duplicating every test case.

## Overall Status

- Live cases checked: 1100
- Passed: 1100
- Needs review: 0
- Pass rate: 100.0%
- Prompt encoding repairs applied: 0
- Prompt encoding issues after repair: 0
- Intake QA checked: 24
- Intake QA passed: 18
- Intake QA failed: 0
- Intake QA skipped checks: 6
- Intake QA skipped suites: 2
- Response contracts checked: 156
- Response contracts passed: 156
- Response contracts failed: 0
- Customer UX suites passing: 3/3
- Golden suite: PASS (21/21 checks run)
- Fixture/coverage evidence suites passing: 4/4

## Species Coverage

| Species | Checked | Passed | Needs review | Pass rate |
| --- | ---: | ---: | ---: | ---: |
| dog | 600 | 600 | 0 | 100.0% |
| cat | 500 | 500 | 0 | 100.0% |

## Suite Evidence

| Suite | Source report | Fixture | Checked | Passed | Needs review | Encoding repairs | Encoding issues | Runner | OpenAI extraction | Last run |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| Dog chatbot live QA 001-200 | `reports/dog_chatbot_200_live_cases.md` | `data/evals/chatbot-extra-cases-dog-001-100.json + data/evals/chatbot-dog-edge-cases-101-200.json` | 200 | 200 | 0 | 0 | 0 | `legacy live QA runner` | skipped | 2026-06-23T05:15:13.589Z |
| Dog chatbot live QA 201-600 | `reports/dog_chatbot_live_cases_201-600.md` | `data/evals/chatbot-extra-cases-dog-201-600.json` | 400 | 400 | 0 | 0 | 0 | `npm.cmd run qa:dog-chatbot-live-cases:201-600:chunks` | skipped | 2026-06-28T14:50:03.587Z |
| Cat chatbot live QA 001-500 | `reports/cat_chatbot_live_cases_1-500.md` | `data/evals/chatbot-extra-cases-cat-001-500.json` | 500 | 500 | 0 | 0 | 0 | `npm.cmd run qa:cat-chatbot-live-cases:500:chunks` | skipped | 2026-06-26T20:25:26.105Z |

## Intake Evidence

| Suite | Source report | Layer | Command | Status | Checked | Passed | Failed | Skipped | Last run |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| AI intake golden QA | `reports/ai_intake_golden_qa.md` | deterministic fallback + validation | `npm.cmd run qa:ai-intake` | completed | 18 | 18 | 0 | 0 | 2026-06-30T00:09:21.092Z |
| OpenAI intake smoke QA | `reports/openai_intake_smoke_qa.md` | OpenAI structured fact extraction | `npm.cmd run qa:openai-intake-smoke` | skipped | 5 | 0 | 0 | 5 | 2026-06-30T05:14:58.156Z |
| Account chatbot extract live route QA | `reports/account_chatbot_extract_live_route_qa.md` | authenticated live chatbot extraction route | `npm.cmd run qa:account-chatbot-extract-live-route` | skipped | 1 | 0 | 0 | 1 | 2026-06-30T05:14:57.630Z |

## Response Contract Evidence

| Suite | Source report | Layer | Command | Status | Checked | Passed | Failed | Contracts covered | Missing contracts | Last run |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | --- | --- | --- |
| Chatbot response contract audit | `reports/chatbot_response_contract_summary.md` | conversation safety + required answer structure | `npm.cmd run review:chatbot:responses` | PASS | 156 | 156 | 0 | compare, context_question, nutrition_reasoning, safety_escalation, transition_guidance | none | 2026-06-22T20:22:38.329Z |

## Customer UX Evidence

| Suite | Source report | Layer | Command | Result | Last run |
| --- | --- | --- | --- | --- | --- |
| Customer-facing recommendation QA | `reports/customer_facing_recommendation_qa.md` | customer food shortlist language + card flow | `npm.cmd run qa:chatbot-customer-recommendations` | PASS | 2026-06-30T00:14:15.462Z |
| Customer UX copy contract QA | `reports/customer_ux_copy_contract_qa.md` | account/chatbot copy leakage guard | `npm.cmd run qa:customer-ux-copy` | PASS | 2026-06-30T00:09:10.850Z |
| Sensitive recommendation smoke QA | `reports/chatbot_sensitive_recommendation_smoke.md` | large-breed puppy, senior, renal, urinary, allergy/preference, and live dog/cat recommendation smoke | `npm.cmd run qa:chatbot-sensitive-recommendations` | PASS | 2026-06-29T11:12:17.037Z |

## Golden Suite Evidence

| Suite | Source report | Layer | Command | Mode | Result | Checks run | Passed | Failed | Last run |
| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | --- |
| Chatbot golden suite fast | `reports/chatbot_golden_suite.md` | current fast regression gate for intake, customer UX, Food V2 ranking, dog live smoke, dog 201-600 smoke, and cat live cases | `npm.cmd run qa:chatbot-golden-suite:fast` | fast | PASS | 21/21 | 21 | 0 | 2026-06-30T00:14:15.492Z |

## Fixture And Coverage Evidence

| Suite | Source report | Layer | Command | Result | Checked | Issues | Last run |
| --- | --- | --- | --- | --- | ---: | ---: | --- |
| Dog 201-600 fixture integrity | `reports/dog_201_600_fixture_integrity.md` | UTF-8 prompt integrity + sequential dog QA fixture | `npm.cmd run qa:dog-201-600-fixture` | PASS | 400 | 0 | 2026-06-23T06:22:21.757Z |
| Dog 201-600 coverage audit | `reports/dog_201_600_coverage_audit.md` | dog scenario balance across growth, sterilised, allergy, senior, GI, renal, urinary, value, premium, and safety cases | `npm.cmd run audit:dog-201-600-coverage` | PASS | 400 | 0 | 2026-06-30T00:09:25.719Z |
| Cat 001-500 fixture integrity | `reports/cat_case_fixture_integrity.md` | UTF-8 prompt integrity + sequential cat QA fixture | `npm.cmd run qa:cat-case-fixture` | PASS | 500 | 0 | 2026-06-23T06:16:55.533Z |
| Cat 001-500 coverage audit | `reports/cat_chatbot_coverage_audit.md` | cat scenario balance across growth, urinary, renal, senior, allergy, weight, and safety cases | `npm.cmd run audit:cat-chatbot-coverage` | PASS | 500 | 0 | 2026-06-30T00:09:26.510Z |

## Current Interpretation

- Dog coverage is proven across 600 live recommendation scenarios.
- Cat coverage is proven across 500 live recommendation scenarios.
- The live suites currently show no review cases.
- OpenAI fact extraction is tracked separately from the large live recommendation suites so cost, auth, and deterministic ranking quality stay easy to reason about.
- Response contracts are tracked separately so safety, context-question, comparison, nutrition-reasoning, and transition-guidance expectations remain visible.
- Customer-facing UX checks protect against backend labels, raw scores, confusing recommendation flows, and high-risk recommendation regressions leaking into the customer experience.
- The fast golden suite shows the current PR-level regression gate, including the latest live dog/cat smoke checks.
- Fixture integrity, coverage audits, and live encoding checks protect the large Greek dog/cat QA batches from encoding drift and scenario imbalance before live tests run.

## Next QA Gaps

- Run `npm.cmd run qa:openai-intake-smoke` in an environment with `OPENAI_API_KEY` or `NUTRITAIL_QA_OPENAI_API_KEY_FILE` enabled to prove OpenAI fact extraction separately from deterministic recommendation quality.
- Run `npm.cmd run qa:account-chatbot-extract-live-route` with `NUTRITAIL_QA_AUTH_COOKIE` or `NUTRITAIL_QA_AUTH_COOKIE_FILE` set to prove the authenticated live chatbot extraction route end to end without committing or printing the cookie.
- Keep adding real customer-style cases when new foods or new clinical rules are introduced.
- When recommendation ranking changes, rerun the affected dog/cat suite before merge.

