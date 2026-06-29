# Dog Chatbot 21 Live Cases

Generated: 2026-06-29T23:32:39.692Z
Site: https://nutritail.ai
OpenAI extraction: skipped

## Summary

- Cases checked: 21
- Passed: 21
- Needs review: 0
- Prompt encoding repairs applied: 0
- Prompt encoding issues after repair: 0

Checks cover OpenAI fact extraction when an API key is available, minimum missing-question flow, safety intent, Food V2 recommendation availability, allergy conflicts, puppy growth, large-breed puppy mineral data, weight-control kcal/fat/fiber logic, renal/urinary fit, sterilised calorie fit, senior fit, and active-dog/high-activity energy/protein mismatch guards.

OpenAI fact extraction was not checked in this run because no usable OPENAI_API_KEY was available to the QA runner.

## Executive Summary

### Goal Coverage

| Goal | Pass rate | Most common first picks |
| --- | ---: | --- |
| allergy | 3/3 | Monge All Breeds Adult Monoprotein Beef With Rice (1); Monge VetSolution An Hydro (1); Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός (1) |
| general | 2/2 | Josera Active Nature (1); Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο (1) |
| growth | 2/2 | Acana Puppy Large Breed (2) |
| renal | 2/2 | Monge VetSolution Renal And Oxalate (2) |
| senior | 2/2 | Josera Senior Balance (2) |
| sensitive_digestion | 2/2 | Josera Gastro Dry (2) |
| sterilised | 2/2 | Happy Dog Naturcroq Duck & Rice Sterilised (2) |
| urinary | 4/4 | Monge VetSolution Urinary Struvite (3); Monge VetSolution Renal And Oxalate (1) |
| weight_control | 2/2 | Happy Dog Naturcroq Duck & Rice Sterilised (2) |

### Safety Coverage

| Safety level | Pass rate | Common top-2 foods |
| --- | ---: | --- |
| normal | 8/8 | Happy Dog Naturcroq Duck & Rice Sterilised (4); Josera Light & Vital Adult (3); Acana Puppy Large Breed (2); Orijen Puppy Large (2) |
| vet_referral | 13/13 | Monge VetSolution Renal And Oxalate (5); Monge VetSolution Urinary Struvite (3); Josera Gastro Dry (2); Monge All Breeds Adult Monoprotein Beef With Rice (2) |

### Recurring First Picks

- No single first pick appears in six or more cases.

Use this section for qualitative review: repeated first picks can be healthy if they match the scenario, but they can also reveal over-dominant ranking signals.

## Results

| # | Status | Top foods | Review notes |
| --- | --- | --- | --- |
| 2 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi | - |
| 4 | pass | Acana Puppy Large Breed; Orijen Puppy Large; Purina Pro Plan LARGE ROBUST PUPPY Healthy Start Κοτόπουλο | - |
| 9 | pass | Josera Active Nature; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 10 | pass | Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna; Josera Hypoallergenic Dry | - |
| 14 | pass | Monge VetSolution Renal And Oxalate; Josera Renal Dry; Royal Canin Vet Diet Small Renal | - |
| 15 | pass | Monge VetSolution Urinary Struvite; Monge VetSolution Renal And Oxalate; Royal Canin Vet Diet Urinary S/O | - |
| 41 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; Josera Light & Vital Adult; Happy Dog Fit & Vital Light | - |
| 51 | pass | Josera Senior Balance; Josera Mini Senior Salmon; Brit Care Sustainable Senior Chicken & Insect | - |
| 103 | pass | Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός; Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 105 | pass | Acana Puppy Large Breed; Orijen Puppy Large; Purina Pro Plan LARGE ROBUST PUPPY Healthy Start Κοτόπουλο | - |
| 116 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; Josera Light & Vital Adult; Happy Dog Fit & Vital Light | - |
| 117 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; Josera Light & Vital Adult; Happy Dog Fit & Vital Light | - |
| 121 | pass | Josera Gastro Dry; Schesir Dry Medium Maintenance Chicken; Monge Hypo With Salmon And Tuna | - |
| 132 | pass | Josera Gastro Dry; Schesir Dry Medium Maintenance Chicken; Monge Hypo With Salmon And Tuna | - |
| 141 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes; Monge All Breeds Adult Monoprotein Salmon With Rice | - |
| 151 | pass | Monge VetSolution Urinary Struvite; Monge VetSolution Renal And Oxalate; Royal Canin Vet Diet Urinary S/O | - |
| 152 | pass | Monge VetSolution Urinary Struvite; Royal Canin Vet Diet Urinary S/O; Royal Canin Vet Diet Urinary S/O Small | - |
| 153 | pass | Monge VetSolution Renal And Oxalate; Royal Canin Vet Diet Urinary S/O; Royal Canin Vet Diet Urinary S/O Small | - |
| 154 | pass | Monge VetSolution Renal And Oxalate; Royal Canin Vet Diet Renal | - |
| 181 | pass | Josera Senior Balance; Schesir Mature Medium Με Κοτόπουλο; Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός | - |
| 200 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
