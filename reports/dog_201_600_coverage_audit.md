# Dog 201-600 Coverage Audit

Generated: 2026-06-28T18:44:00.353Z
Fixture: `data/evals/chatbot-extra-cases-dog-201-600.json`
Result: PASS

## Summary

- Cases checked: 400
- Expected cases: 400
- Unique ids: 400
- Prompt encoding repairs applied: 0
- Prompt encoding issues after repair: 0
- Structural issues: 0
- Coverage issues: 0
- Issues: 0

## Goal Coverage

- general: 122
- growth: 100
- sterilised: 65
- allergy: 49
- senior: 20
- sensitive_digestion: 14
- premium: 11
- weight_control: 8
- value: 6
- urinary: 3
- renal: 2

## Safety Coverage

- normal: 278
- vet_referral: 121
- emergency: 1

## Check Coverage

- foodV2Candidates: 400
- medicalNoTreatment: 108
- puppyGrowth: 100
- obesityLogic: 75
- activeFit: 41
- allergyReject: 28
- largeBreedPuppy: 22

## Topic Coverage

- feeding_behaviour_201_250: 50
- lifestage_sterilised_251_350: 100
- sterilised_weight_351_425: 75
- allergy_sensitivity_426_475: 50
- medical_senior_growth_476_550: 75
- growth_gi_value_551_600: 50

## Issues

- None

## Next Step

The 400-case dog fixture is structurally valid and covers the main 201-600 recommendation, safety, growth, sterilised, allergy, senior, GI, renal, urinary, value, premium, and activity scenarios.
