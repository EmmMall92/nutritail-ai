# Chatbot Golden Suite

Generated: 2026-06-19T03:27:26.120Z

## Summary

- Checks run: 10/10
- Passed: 10
- Failed: 0

## Coverage

- AI intake golden cases: OpenAI/fallback fact extraction, pet name cleanup, preference parsing, weight limits.
- Dog edge fixture 101-200: User-supplied dog cases 101-200 fixture structure and required expectations.
- Dog golden coverage audit: 200 live runner ids, fixture coverage, duplicates, and damaged prompt detection.
- Food Intelligence use cases: Strengths, cautions, best use cases, and not-ideal cases for weight, growth, senior, renal, allergy, skin/coat, and active-food logic.
- Food V2 ranking scenarios: Condition-specific recommendation accuracy for sterilised, senior, allergy, urinary, renal, growth, and active-dog scenarios.
- Chatbot portion estimates: Choose food -> estimate grams/day using main-food calories after treat allowance.
- Customer chatbot flow links: Saved analysis next steps, pet profile/report/timeline/progress links, and customer-facing recommendation card actions.
- Account progress live routes: Live account chatbot/report/timeline/progress routes respond safely on production.
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
  "coverageCases": 200,
  "liveDamagedPrompts": 0,
  "edgeDamagedPrompts": 0,
  "blockingProblems": 0,
  "report": "reports/dog_chatbot_golden_coverage_audit.md"
}
```

### Food Intelligence use cases

- Status: pass
- Duration: 0.5s
- Command: `npm.cmd run qa:food-intelligence-use-cases`

```text
> nutritail@0.1.0 qa:food-intelligence-use-cases
> tsx scripts/qa/check-food-intelligence-use-cases.ts
Food intelligence use-case QA passed.
```

### Food V2 ranking scenarios

- Status: pass
- Duration: 39.2s
- Command: `npm.cmd run audit:food-v2-ranking-scenarios`

```text
> nutritail@0.1.0 audit:food-v2-ranking-scenarios
> node scripts/qa/audit-food-v2-ranking-scenarios.mjs
{
  "siteUrl": "https://nutritail.ai",
  "scenarioSource": "data/evals/food-v2-recommendation-scenarios.json",
  "checked": 29,
  "passed": 29,
  "review": 0,
  "report": "reports/food_v2_ranking_scenario_audit.md"
}
```

### Chatbot portion estimates

- Status: pass
- Duration: 0.5s
- Command: `npm.cmd run qa:chatbot-portions`

```text
> nutritail@0.1.0 qa:chatbot-portions
> tsx scripts/qa/check-chatbot-portion-estimates.ts
{
  "status": "pass",
  "checkedCases": 3,
  "rule": "grams_per_day_uses_main_food_calories_after_10_percent_treat_allowance"
}
```

### Customer chatbot flow links

- Status: pass
- Duration: 0.3s
- Command: `npm.cmd run qa:customer-chatbot-flow-links`

```text
> nutritail@0.1.0 qa:customer-chatbot-flow-links
> node scripts/qa/check-customer-chatbot-flow-links.mjs
{
  "checked": 27,
  "passed": 27,
  "failed": 0,
  "report": "reports/customer_chatbot_flow_links_qa.md"
}
```

### Account progress live routes

- Status: pass
- Duration: 5.1s
- Command: `npm.cmd run qa:account-progress-live-routes`

```text
> nutritail@0.1.0 qa:account-progress-live-routes
> node scripts/qa/check-account-progress-live-routes.mjs
{
  "siteUrl": "https://nutritail.ai",
  "checked": 10,
  "passed": 10,
  "failed": 0,
  "report": "reports/account_progress_live_route_smoke_qa.md"
}
```

### Live dog chatbot 200 cases

- Status: pass
- Duration: 185.2s
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

