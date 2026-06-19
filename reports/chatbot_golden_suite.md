# Chatbot Golden Suite

Generated: 2026-06-19T01:19:15.512Z

## Summary

- Checks run: 5/5
- Passed: 5
- Failed: 0

## Coverage

- AI intake golden cases: OpenAI/fallback fact extraction, pet name cleanup, preference parsing, weight limits.
- Dog edge fixture 101-200: User-supplied dog cases 101-200 fixture structure and required expectations.
- Dog golden coverage audit: 200 live runner ids, fixture coverage, duplicates, and damaged prompt detection.
- Live dog chatbot 200 cases: Live extraction, safety expectations, Food V2 candidates, and recommendation guards.
- Customer-facing recommendation copy: No back-office wording in customer chatbot recommendations and card action flow.

## Results

### AI intake golden cases

- Status: pass
- Duration: 0.5s
- Command: `npm.cmd run qa:ai-intake`

```text
      "status": "pass",
      "failures": [],
      "source": "ui_helpers"
    },
    {
      "id": "validated_openai_cleanup",
      "status": "pass",
      "failures": [],
      "source": "validation"
    }
  ]
}
```

### Dog edge fixture 101-200

- Status: pass
- Duration: 0.5s
- Command: `npm.cmd run qa:dog-edge-fixture`

```text
> nutritail@0.1.0 qa:dog-edge-fixture
> tsx scripts/qa/check-dog-edge-case-fixture.ts
Dog edge case fixture QA passed.
```

### Dog golden coverage audit

- Status: pass
- Duration: 0.3s
- Command: `npm.cmd run audit:dog-chatbot-golden-coverage`

```text
> nutritail@0.1.0 audit:dog-chatbot-golden-coverage
> node scripts/qa/audit-dog-chatbot-golden-coverage.mjs
{
  "liveCases": 200,
  "edgeCases": 100,
  "liveDamagedPrompts": 0,
  "edgeDamagedPrompts": 0,
  "blockingProblems": 0,
  "report": "reports/dog_chatbot_golden_coverage_audit.md"
}
```

### Live dog chatbot 200 cases

- Status: pass
- Duration: 229.0s
- Command: `npm.cmd run qa:dog-chatbot-live-cases`

```text
> nutritail@0.1.0 qa:dog-chatbot-live-cases
> tsx scripts/qa/run-dog-chatbot-live-cases.ts
{
  "siteUrl": "https://nutritail.ai",
  "openaiExtraction": "skipped",
  "checked": 200,
  "passed": 200,
  "review": 0,
  "report": "reports/dog_chatbot_200_live_cases.md"
}
```

### Customer-facing recommendation copy

- Status: pass
- Duration: 0.5s
- Command: `npm.cmd run qa:chatbot-customer-recommendations`

```text
> nutritail@0.1.0 qa:chatbot-customer-recommendations
> tsx scripts/qa/check-chatbot-customer-facing-recommendations.ts
Customer-facing chatbot recommendation QA passed.
```

