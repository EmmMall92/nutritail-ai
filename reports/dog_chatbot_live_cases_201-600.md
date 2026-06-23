# Dog Chatbot Live Cases 201-600

Site: https://nutritail.ai
Run date: 2026-06-23T05:45:19.897Z
Runner: `npm.cmd run qa:dog-chatbot-live-cases:201-600:chunks`
OpenAI extraction: skipped
Result: 400/400 passed, 0 review

This QA checks the live Food V2 recommendation endpoint with dog scenarios from
`data/evals/chatbot-extra-cases-dog-201-600.json`.

The batch is executed in chunks so a slow live API call cannot block the entire
run without identifying the affected range.

## Summary

- Cases checked: 400
- Passed: 400
- Needs review: 0
- Prompt encoding repairs applied: 0
- Prompt encoding issues after repair: 0
- Previously failing/reviewed case 534 passed in the chunk that contains it.

## Chunk Results

| Chunk | Checked | Passed | Needs review | Encoding repairs | Encoding issues |
| --- | ---: | ---: | ---: | ---: | ---: |
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
| 501-525 | 25 | 25 | 0 | 0 | 0 |
| 526-550 | 25 | 25 | 0 | 0 | 0 |
| 551-575 | 25 | 25 | 0 | 0 | 0 |
| 576-600 | 25 | 25 | 0 | 0 | 0 |

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

OpenAI fact extraction is skipped by default through the chunked wrapper unless
`NUTRITAIL_QA_OPENAI=1` is set.
