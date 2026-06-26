# Cat Chatbot Live Cases 001-500

Site: https://nutritail.ai
Run date: 2026-06-26T20:25:26.105Z
Runner: `npm.cmd run qa:cat-chatbot-live-cases:500:chunks`
OpenAI extraction: skipped
Result: 500/500 passed, 0 review

This QA checks the live Food V2 recommendation endpoint with cat scenarios from
`data/evals/chatbot-extra-cases-cat-001-500.json`.

The batch is executed in chunks so a slow live API call cannot block the entire
run without identifying the affected range.

## Summary

- Cases checked: 500
- Passed: 500
- Needs review: 0
- Prompt encoding repairs applied: 0
- Prompt encoding issues after repair: 0

## Chunk Results

| Chunk | Checked | Passed | Needs review | Encoding repairs | Encoding issues |
| --- | ---: | ---: | ---: | ---: | ---: |
| 001-025 | 25 | 25 | 0 | 0 | 0 |
| 026-050 | 25 | 25 | 0 | 0 | 0 |
| 051-075 | 25 | 25 | 0 | 0 | 0 |
| 076-100 | 25 | 25 | 0 | 0 | 0 |
| 101-125 | 25 | 25 | 0 | 0 | 0 |
| 126-150 | 25 | 25 | 0 | 0 | 0 |
| 151-175 | 25 | 25 | 0 | 0 | 0 |
| 176-200 | 25 | 25 | 0 | 0 | 0 |
| 201-225 | 25 | 25 | 0 | 0 | 0 |
| 226-250 | 25 | 25 | 0 | 0 | 0 |
| 251-275 | 25 | 25 | 0 | 0 | 0 |
| 276-300 | 25 | 25 | 0 | 0 | 0 |
| 301-325 | 25 | 25 | 0 | 0 | 0 |
| 326-350 | 25 | 25 | 0 | 0 | 0 |
| 351-375 | 25 | 25 | 0 | 0 | 0 |
| 376-400 | 25 | 25 | 0 | 0 | 0 |
| 401-425 | 25 | 25 | 0 | 0 | 0 |
| 426-450 | 25 | 25 | 0 | 0 | 0 |
| 451-475 | 25 | 25 | 0 | 0 | 0 |
| 476-500 | 25 | 25 | 0 | 0 | 0 |

## Coverage Notes

The live QA focuses on species safety, empty shortlists, and major nutrition-direction
mismatches for urinary, renal, kitten, senior, sterilised, weight-control, allergy,
hydration, hairball, indoor/outdoor, pregnancy/lactation, and red-flag scenarios.
