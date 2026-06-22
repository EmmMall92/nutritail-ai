# Dog Chatbot Live Cases 201-600

Site: https://nutritail.ai
Run date: 2026-06-22T19:35:07.060Z
Runner: `npm.cmd run qa:dog-chatbot-live-cases:201-600:chunks`
OpenAI extraction: skipped
Result: 400/400 passed, 0 review

This QA checks the live Food V2 recommendation endpoint with dog scenarios from
`data/evals/chatbot-extra-cases-dog-201-600.json`.

The batch is executed in 16 chunks of 25 cases so a slow live API call cannot block
the entire 400-case run without identifying the affected range.

## Summary

- Cases checked: 400
- Passed: 400
- Needs review: 0
- Previously failing/reviewed case 534 now passes in the 526-550 chunk.

## Chunk Results

| Chunk | Checked | Passed | Needs review |
| --- | ---: | ---: | ---: |
| 201-225 | 25 | 25 | 0 |
| 226-250 | 25 | 25 | 0 |
| 251-275 | 25 | 25 | 0 |
| 276-300 | 25 | 25 | 0 |
| 301-325 | 25 | 25 | 0 |
| 326-350 | 25 | 25 | 0 |
| 351-375 | 25 | 25 | 0 |
| 376-400 | 25 | 25 | 0 |
| 401-425 | 25 | 25 | 0 |
| 426-450 | 25 | 25 | 0 |
| 451-475 | 25 | 25 | 0 |
| 476-500 | 25 | 25 | 0 |
| 501-525 | 25 | 25 | 0 |
| 526-550 | 25 | 25 | 0 |
| 551-575 | 25 | 25 | 0 |
| 576-600 | 25 | 25 | 0 |

## Coverage Notes

The live QA validates the same contract as the dog live-case runner:

- species safety
- minimum missing-question flow
- safety intent
- Food V2 recommendation availability
- allergy/rejected ingredient conflicts
- puppy and large-breed puppy growth logic
- calcium/phosphorus visibility for large-breed puppy recommendations
- weight-control kcal/fat/fiber logic
- renal and urinary fit
- sterilised calorie fit
- senior fit
- active/high-activity energy and protein guards

OpenAI fact extraction was not checked in this run because the live QA was run with
`NUTRITAIL_QA_OPENAI=0` through the chunked wrapper default.
