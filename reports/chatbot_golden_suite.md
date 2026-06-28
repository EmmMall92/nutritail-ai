# Chatbot Golden Suite

Generated: 2026-06-28T18:45:39.949Z

## Summary

- Mode: fast
- Checks run: 19/19
- Passed: 19
- Failed: 0

## Coverage

- AI intake golden cases: OpenAI/fallback fact extraction, pet name cleanup, preference parsing, weight limits.
- Bulk chatbot case intake: Future dog/cat golden case batches have valid ids, prompts, species, locale, safety expectations, and duplicate checks.
- Chatbot intake cleanup: Live-style Greek pet name cleanup and liked/avoided protein conflict reconciliation.
- Dog edge fixture 101-200: User-supplied dog cases 101-200 fixture structure and required expectations.
- Dog golden coverage audit: 200 live runner ids, fixture coverage, duplicates, and damaged prompt detection.
- Dog 201-600 coverage audit: 400 additional dog cases cover growth, sterilised, allergy, senior, GI, renal, urinary, value, premium, activity, and safety scenarios.
- Cat 001-500 coverage audit: 500 cat cases cover urinary, renal, kitten/growth, allergy, senior, sterilised, weight-control, preference, and urgent safety scenarios.
- Food Intelligence use cases: Strengths, cautions, best use cases, and not-ideal cases for weight, growth, senior, renal, allergy, skin/coat, and active-food logic.
- Medical nutrition rules: Renal and urinary mineral-context rules, veterinary safety notes, and Food V2 ranking signals.
- GI allergy senior v2 rules: GI symptom ranking, allergy/intolerance hard rejects, and senior low-appetite/chewing logic.
- Pancreatitis fat-sensitive v2 rules: Pancreatitis and fat-sensitive low-fat fit, missing-fat caution, high-fat holds, and vet framing.
- Nutrition source-map intake: Book and training source maps define allowed uses, copyright policy, topics, and target rule files before rules are extracted.
- Food V2 ranking scenarios: Condition-specific recommendation accuracy for sterilised, senior, allergy, urinary, renal, growth, and active-dog scenarios.
- Food V2 guard coverage: Every blocking Food V2 ranking signal is exposed through recommendation guard diagnostics.
- Chatbot portion estimates: Choose food -> estimate grams/day using main-food calories after treat allowance.
- Customer chatbot flow links: Saved analysis next steps, pet profile/report/timeline/progress links, and customer-facing recommendation card actions.
- Customer recommendation smoke: Customer-facing summaries for sterilised, weight loss, allergy, GI, urinary, renal, growth, active, and senior scenarios stay simple and card-action oriented.
- Live dog chatbot smoke cases: Representative live dog chatbot smoke cases across growth, sterilised, allergy, urinary, renal, active, senior, and rescue contexts.
- Customer-facing recommendation copy: No back-office wording in customer chatbot recommendations and card action flow.

## Objective Coverage

- 1. Recommendation accuracy: Food V2 ranking scenarios, food preference ranking, dog live cases, and feeding rules cover sterilised, senior, allergy, urinary, renal, large-breed puppy, and active-dog logic.
- 2. Customer-facing answer quality: Customer recommendation copy, customer recommendation smoke, and customer chatbot flow links guard against back-office wording and verify food-card action flow.
- 3. Large dog/cat live chatbot case coverage: Dog edge fixture, dog 1-200 coverage, dog 201-600 coverage, and cat 001-500 coverage prove the large case bank is structurally sound and balanced. The fast suite runs representative live smoke cases for quick regression feedback; run the full or strict suite before release-level signoff.
- 4. Brand data cleanup: Title/source/duplicate/product-form QA scripts keep customer-facing food names, duplicate risks, and non-complete-food guards visible.
- 5. Food Intelligence: Food Intelligence use-case QA checks strengths, cautions, best use cases, and not-ideal cases for major nutrition contexts.
- 6. End-to-end user experience: Customer flow links cover account chatbot, report, timeline, progress, and food-selection next steps. The fast suite skips slower live route checks; run the full or strict suite for live route signoff.

## Results

### AI intake golden cases

- Status: pass
- Duration: 0.7s
- Command: `npm.cmd run qa:ai-intake`

```text
      "status": "pass",
      "failures": [],
      "source": "validation"
    },
    {
      "id": "fallback_pet_name_cleanup",
      "status": "pass",
      "failures": [],
      "source": "fallback"
    }
  ]
}
```

### Bulk chatbot case intake

- Status: pass
- Duration: 0.6s
- Command: `npm.cmd run qa:chatbot-case-intake`

```text
> nutritail@0.1.0 qa:chatbot-case-intake
> tsx scripts/qa/check-chatbot-case-intake.ts
{
  "files_checked": 5,
  "cases_checked": 1103,
  "passed": true,
  "failures": []
}
```

### Chatbot intake cleanup

- Status: pass
- Duration: 0.6s
- Command: `npm.cmd run qa:chatbot-intake-cleanup`

```text
    {
      "name": "Validation removes OpenAI preference conflicts",
      "pass": true,
      "details": "{\"species\":null,\"petName\":\"Κύρκη\",\"weightKg\":null,\"ageYears\":null,\"activityLevel\":null,\"neutered\":null,\"healthIssues\":[],\"allergies\":[],\"currentFoodName\":null,\"preferredProteins\":[\"chicken\"],\"excludedIngredients\":[\"salmon\"],\"weightGoal\":null,\"language\":null,\"missingFields\":[],\"redFlags\":[],\"confidence\":\"medium\",\"notes\":[]}"
    },
    {
      "name": "Preference reconciliation removes excluded proteins",
      "pass": true,
      "details": "[\"chicken\"]"
    }
  ]
}
```

### Dog edge fixture 101-200

- Status: pass
- Duration: 0.6s
- Command: `npm.cmd run qa:dog-edge-fixture`

```text
> nutritail@0.1.0 qa:dog-edge-fixture
> tsx scripts/qa/check-dog-edge-case-fixture.ts
Dog edge case fixture QA passed.
```

### Dog golden coverage audit

- Status: pass
- Duration: 0.4s
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

### Dog 201-600 coverage audit

- Status: pass
- Duration: 0.4s
- Command: `npm.cmd run audit:dog-201-600-coverage`

```text
> nutritail@0.1.0 audit:dog-201-600-coverage
> node scripts/qa/audit-dog-201-600-coverage.mjs
{
  "cases": 400,
  "repairedMessages": 0,
  "damagedAfterRepair": 0,
  "structuralProblems": 0,
  "coverageWarnings": 0,
  "result": "PASS",
  "report": "reports/dog_201_600_coverage_audit.md"
}
```

### Cat 001-500 coverage audit

- Status: pass
- Duration: 0.4s
- Command: `npm.cmd run audit:cat-chatbot-coverage`

```text
> nutritail@0.1.0 audit:cat-chatbot-coverage
> node scripts/qa/audit-cat-chatbot-coverage.mjs
{
  "cases": 500,
  "repairedPrompts": 0,
  "damagedAfterRepair": 0,
  "structuralProblems": 0,
  "coverageWarnings": 0,
  "result": "PASS",
  "report": "reports/cat_chatbot_coverage_audit.md"
}
```

### Food Intelligence use cases

- Status: pass
- Duration: 0.6s
- Command: `npm.cmd run qa:food-intelligence-use-cases`

```text
> nutritail@0.1.0 qa:food-intelligence-use-cases
> tsx scripts/qa/check-food-intelligence-use-cases.ts
Food intelligence use-case QA passed.
```

### Medical nutrition rules

- Status: pass
- Duration: 0.6s
- Command: `npm.cmd run qa:medical-rules`

```text
> nutritail@0.1.0 qa:medical-rules
> tsx scripts/qa/check-medical-rule-edge-cases.ts
Medical renal/urinary rule edge cases passed.
```

### GI allergy senior v2 rules

- Status: pass
- Duration: 0.6s
- Command: `npm.cmd run qa:gi-allergy-senior-v2`

```text
> nutritail@0.1.0 qa:gi-allergy-senior-v2
> tsx scripts/qa/check-gi-allergy-senior-v2.ts
GI, allergy/intolerance, and senior v2 QA passed.
```

### Pancreatitis fat-sensitive v2 rules

- Status: pass
- Duration: 0.6s
- Command: `npm.cmd run qa:pancreatitis-fat-sensitive-v2`

```text
> nutritail@0.1.0 qa:pancreatitis-fat-sensitive-v2
> tsx scripts/qa/check-pancreatitis-fat-sensitive-v2.ts
Pancreatitis and fat-sensitive v2 QA passed.
```

### Nutrition source-map intake

- Status: pass
- Duration: 0.6s
- Command: `npm.cmd run qa:nutrition-source-map-intake`

```text
> nutritail@0.1.0 qa:nutrition-source-map-intake
> tsx scripts/qa/check-nutrition-source-map-intake.ts
{
  "files_checked": 3,
  "passed": true,
  "failures": []
}
```

### Food V2 ranking scenarios

- Status: pass
- Duration: 56.9s
- Command: `npm.cmd run audit:food-v2-ranking-scenarios`

```text
> nutritail@0.1.0 audit:food-v2-ranking-scenarios
> node scripts/qa/audit-food-v2-ranking-scenarios.mjs
{
  "siteUrl": "https://nutritail.ai",
  "scenarioSource": "data/evals/food-v2-recommendation-scenarios.json",
  "checked": 34,
  "passed": 34,
  "review": 0,
  "report": "reports/food_v2_ranking_scenario_audit.md"
}
```

### Food V2 guard coverage

- Status: pass
- Duration: 0.4s
- Command: `npm.cmd run qa:food-v2-guard-coverage`

```text
> nutritail@0.1.0 qa:food-v2-guard-coverage
> node scripts/qa/check-food-v2-guard-coverage.mjs
{
  "checkedExcludeSignals": 15,
  "missing": 0
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
- Duration: 0.4s
- Command: `npm.cmd run qa:customer-chatbot-flow-links`

```text
> nutritail@0.1.0 qa:customer-chatbot-flow-links
> node scripts/qa/check-customer-chatbot-flow-links.mjs
{
  "checked": 146,
  "passed": 146,
  "failed": 0,
  "report": "reports/customer_chatbot_flow_links_qa.md"
}
```

### Customer recommendation smoke

- Status: pass
- Duration: 0.6s
- Command: `npm.cmd run qa:customer-recommendation-smoke`

```text
  "scenarios": [
    "sterilised dog",
    "weight loss dog",
    "chicken allergy dog",
    "sensitive digestion dog",
    "urinary cat",
    "renal cat",
    "large breed puppy",
    "active dog",
    "senior dog"
  ]
}
```

### Live dog chatbot smoke cases

- Status: pass
- Duration: 36.9s
- Command: `npm.cmd run qa:dog-chatbot-live-smoke`

```text
> nutritail@0.1.0 qa:dog-chatbot-live-smoke
> node scripts/qa/run-dog-chatbot-live-smoke.mjs
> nutritail@0.1.0 qa:dog-chatbot-live-cases
> tsx scripts/qa/run-dog-chatbot-live-cases.ts
{
  "siteUrl": "https://nutritail.ai",
  "openaiExtraction": "skipped",
  "checked": 21,
  "passed": 21,
  "review": 0,
  "report": "reports/dog_chatbot_live_smoke.md"
}
```

### Customer-facing recommendation copy

- Status: pass
- Duration: 0.6s
- Command: `npm.cmd run qa:chatbot-customer-recommendations`

```text
> nutritail@0.1.0 qa:chatbot-customer-recommendations
> tsx scripts/qa/check-chatbot-customer-facing-recommendations.ts
Customer-facing chatbot recommendation QA passed.
```

