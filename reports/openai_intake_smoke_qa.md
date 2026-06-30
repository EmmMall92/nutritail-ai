# OpenAI Intake Smoke QA

Generated: 2026-06-30T14:24:20.311Z
Status: completed

This smoke test checks that OpenAI is used only for structured pet fact extraction.
It uses the same NutriTail fact-extraction prompt contract and intake validation layer as the chatbot.
It does not rank foods or invent nutrient values.

## Summary

- Cases checked: 5
- Passed: 5
- Failed: 0
- Skipped: 0
- OpenAI key source: OPENAI_API_KEY

The key value was not written to this report.

## Results

| Case | Status | Source | Notes |
| --- | --- | --- | --- |
| greek_full_pet_profile | pass | openai | - |
| english_weight_loss_cat | pass | openai | - |
| greek_allergy_avoidance | pass | openai | - |
| greek_urinary_red_flag | pass | openai | - |
| implausible_weight_rejected | pass | openai | - |
