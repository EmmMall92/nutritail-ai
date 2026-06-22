# Chatbot Live QA Dashboard

Generated: 2026-06-22T20:04:16.693Z

This dashboard summarizes the current live recommendation QA evidence for NutriTail.
It points to the authoritative per-suite reports instead of duplicating every test case.

## Overall Status

- Live cases checked: 1100
- Passed: 1100
- Needs review: 0
- Pass rate: 100.0%

## Species Coverage

| Species | Checked | Passed | Needs review | Pass rate |
| --- | ---: | ---: | ---: | ---: |
| dog | 600 | 600 | 0 | 100.0% |
| cat | 500 | 500 | 0 | 100.0% |

## Suite Evidence

| Suite | Source report | Fixture | Checked | Passed | Needs review | Runner | OpenAI extraction | Last run |
| --- | --- | --- | ---: | ---: | ---: | --- | --- | --- |
| Dog chatbot live QA 001-200 | `reports/dog_chatbot_200_live_cases.md` | `data/evals/chatbot-extra-cases-dog-001-100.json + data/evals/chatbot-dog-edge-cases-101-200.json` | 200 | 200 | 0 | `legacy live QA runner` | skipped | 2026-06-21T19:59:08.489Z |
| Dog chatbot live QA 201-600 | `reports/dog_chatbot_live_cases_201-600.md` | `data/evals/chatbot-extra-cases-dog-201-600.json` | 400 | 400 | 0 | `npm.cmd run qa:dog-chatbot-live-cases:201-600:chunks` | skipped | 2026-06-22T19:35:07.060Z |
| Cat chatbot live QA 001-500 | `reports/cat_chatbot_live_cases_1-500.md` | `data/evals/chatbot-extra-cases-cat-001-500.json` | 500 | 500 | 0 | `npm.cmd run qa:cat-chatbot-live-cases:500:chunks` | not recorded | 2026-06-22T19:59:07.279Z |

## Current Interpretation

- Dog coverage is proven across 600 live recommendation scenarios.
- Cat coverage is proven across 500 live recommendation scenarios.
- The live suites currently show no review cases.
- OpenAI fact extraction is not the main proof in these live suites; they primarily validate Food V2 retrieval, deterministic ranking, safety guards, and recommendation availability.

## Next QA Gaps

- Add a smaller live suite where OpenAI extraction is explicitly enabled, so we prove the full hybrid flow separately from deterministic recommendation quality.
- Keep adding real customer-style cases when new foods or new clinical rules are introduced.
- When recommendation ranking changes, rerun the affected dog/cat suite before merge.

