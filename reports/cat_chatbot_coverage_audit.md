# Cat Chatbot Coverage Audit

Generated: 2026-06-29T22:29:35.515Z
Fixture: `data/evals/chatbot-extra-cases-cat-001-500.json`
Result: PASS

## Summary

- Cases checked: 500
- Expected cases: 500
- Unique ids: 500
- Prompt encoding repairs applied: 0
- Prompt encoding issues after repair: 0
- Structural issues: 0
- Coverage issues: 0
- Issues: 0

## Goal Coverage

- general: 280
- renal: 39
- growth: 36
- urinary: 35
- weight_control: 31
- allergy: 27
- senior: 25
- sterilised: 16
- premium: 8
- value: 3

## Signal Coverage

- cat: 500
- general_recommendation: 108
- preference: 75
- renal: 39
- urinary: 39
- kitten_growth: 36
- weight_control: 36
- allergy: 34
- senior: 33
- active: 32
- indoor: 31
- rescue: 29
- sterilised: 25
- skin_hairball: 20
- hydration: 19
- reproduction: 18
- sensitive_digestion: 18
- premium: 8
- budget: 3
- red_flag_not_eating: 3
- red_flag_blood: 1
- red_flag_collapse: 1
- red_flag_lethargy: 1
- red_flag_not_drinking: 1
- red_flag_pain: 1
- red_flag_urinary_blockage: 1
- red_flag_vomiting: 1
- weight_loss: 1

## Safety Coverage

- normal: 332
- caution: 158
- urgent: 10

## Topic Coverage

- sterilised_indoor_preference_001_010: 10
- kitten_growth_011_020: 10
- active_unsterilised_021_030: 10
- urinary_hydration_031_040: 10
- renal_041_050: 10
- weight_control_051_060: 10
- allergy_061_070: 10
- hairball_skin_071_080: 10
- sensitive_digestion_081_090: 10
- senior_091_100: 10
- expanded_customer_cases_101_500: 400

## Issues

- None

## Next Step

The 500-case cat fixture is structurally valid and covers the main feline recommendation, medical caution, growth, urinary, renal, senior, allergy, and weight-control scenarios.
