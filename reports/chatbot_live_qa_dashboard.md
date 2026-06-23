# Chatbot Live QA Dashboard

Generated: 2026-06-23T06:04:50.118Z

This dashboard summarizes the current live recommendation QA evidence for NutriTail.
It points to the authoritative per-suite reports instead of duplicating every test case.

## Overall Status

- Live cases checked: 1100
- Passed: 1100
- Needs review: 0
- Pass rate: 100.0%
- Prompt encoding repairs applied: 0
- Prompt encoding issues after repair: 0
- Intake QA checked: 18
- Intake QA passed: 18
- Intake QA failed: 0
- Intake QA skipped suites: 1
- Response contracts checked: 156
- Response contracts passed: 156
- Response contracts failed: 0
- Customer UX suites passing: 2/2
- Fixture integrity suites passing: 2/2

## Species Coverage

| Species | Checked | Passed | Needs review | Pass rate |
| --- | ---: | ---: | ---: | ---: |
| dog | 600 | 600 | 0 | 100.0% |
| cat | 500 | 500 | 0 | 100.0% |

## Suite Evidence

| Suite | Source report | Fixture | Checked | Passed | Needs review | Encoding repairs | Encoding issues | Runner | OpenAI extraction | Last run |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| Dog chatbot live QA 001-200 | `reports/dog_chatbot_200_live_cases.md` | `data/evals/chatbot-extra-cases-dog-001-100.json + data/evals/chatbot-dog-edge-cases-101-200.json` | 200 | 200 | 0 | 0 | 0 | `legacy live QA runner` | skipped | 2026-06-23T05:15:13.589Z |
| Dog chatbot live QA 201-600 | `reports/dog_chatbot_live_cases_201-600.md` | `data/evals/chatbot-extra-cases-dog-201-600.json` | 400 | 400 | 0 | 0 | 0 | `npm.cmd run qa:dog-chatbot-live-cases:201-600:chunks` | skipped | 2026-06-23T05:45:19.897Z |
| Cat chatbot live QA 001-500 | `reports/cat_chatbot_live_cases_1-500.md` | `data/evals/chatbot-extra-cases-cat-001-500.json` | 500 | 500 | 0 | 0 | 0 | `npm.cmd run qa:cat-chatbot-live-cases:500:chunks` | skipped | 2026-06-23T05:59:43.118Z |

## Intake Evidence

| Suite | Source report | Layer | Command | Status | Checked | Passed | Failed | Last run |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | --- |
| AI intake golden QA | `reports/ai_intake_golden_qa.md` | deterministic fallback + validation | `npm.cmd run qa:ai-intake` | completed | 18 | 18 | 0 | 2026-06-22T20:14:50.935Z |
| OpenAI intake smoke QA | `reports/openai_intake_smoke_qa.md` | OpenAI structured fact extraction | `npm.cmd run qa:openai-intake-smoke` | skipped | 0 | 0 | 0 | 2026-06-23T04:53:28.004Z |

## Response Contract Evidence

| Suite | Source report | Layer | Command | Status | Checked | Passed | Failed | Contracts covered | Missing contracts | Last run |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | --- | --- | --- |
| Chatbot response contract audit | `reports/chatbot_response_contract_summary.md` | conversation safety + required answer structure | `npm.cmd run review:chatbot:responses` | PASS | 156 | 156 | 0 | compare, context_question, nutrition_reasoning, safety_escalation, transition_guidance | none | 2026-06-22T20:22:38.329Z |

## Customer UX Evidence

| Suite | Source report | Layer | Command | Result | Last run |
| --- | --- | --- | --- | --- | --- |
| Customer-facing recommendation QA | `reports/customer_facing_recommendation_qa.md` | customer food shortlist language + card flow | `npm.cmd run qa:chatbot-customer-recommendations` | PASS | 2026-06-22T20:26:11.057Z |
| Customer UX copy contract QA | `reports/customer_ux_copy_contract_qa.md` | account/chatbot copy leakage guard | `npm.cmd run qa:customer-ux-copy` | PASS | 2026-06-22T20:26:11.701Z |

## Fixture Integrity Evidence

| Suite | Source report | Layer | Command | Result | Checked | Issues | Last run |
| --- | --- | --- | --- | --- | ---: | ---: | --- |
| Dog 201-600 fixture integrity | `reports/dog_201_600_fixture_integrity.md` | UTF-8 prompt integrity + sequential dog QA fixture | `npm.cmd run qa:dog-201-600-fixture` | PASS | 400 | 0 | 2026-06-23T05:20:15.410Z |
| Cat 001-500 fixture integrity | `reports/cat_case_fixture_integrity.md` | UTF-8 prompt integrity + sequential cat QA fixture | `npm.cmd run qa:cat-case-fixture` | PASS | 500 | 0 | 2026-06-23T05:20:15.448Z |

## Current Interpretation

- Dog coverage is proven across 600 live recommendation scenarios.
- Cat coverage is proven across 500 live recommendation scenarios.
- The live suites currently show no review cases.
- OpenAI fact extraction is tracked separately from the large live recommendation suites so cost, auth, and deterministic ranking quality stay easy to reason about.
- Response contracts are tracked separately so safety, context-question, comparison, nutrition-reasoning, and transition-guidance expectations remain visible.
- Customer-facing UX checks protect against backend labels, raw scores, and confusing recommendation flows leaking into the customer experience.
- Fixture integrity and live encoding checks protect the large Greek dog/cat QA batches from encoding drift before live tests run.

## Next QA Gaps

- Run `npm.cmd run qa:openai-intake-smoke` in an environment with `OPENAI_API_KEY` enabled to prove live OpenAI fact extraction separately from deterministic recommendation quality.
- Keep adding real customer-style cases when new foods or new clinical rules are introduced.
- When recommendation ranking changes, rerun the affected dog/cat suite before merge.

