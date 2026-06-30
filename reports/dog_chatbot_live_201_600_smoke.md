# Dog Chatbot 20 Live Cases

Generated: 2026-06-30T00:12:04.603Z
Site: https://nutritail.ai
OpenAI extraction: skipped

## Summary

- Cases checked: 20
- Passed: 20
- Needs review: 0
- Prompt encoding repairs applied: 0
- Prompt encoding issues after repair: 0

Checks cover OpenAI fact extraction when an API key is available, minimum missing-question flow, safety intent, Food V2 recommendation availability, allergy conflicts, puppy growth, large-breed puppy mineral data, weight-control kcal/fat/fiber logic, renal/urinary fit, sterilised calorie fit, senior fit, and active-dog/high-activity energy/protein mismatch guards.

OpenAI fact extraction was not checked in this run because no usable OPENAI_API_KEY was available to the QA runner.

## Executive Summary

### Goal Coverage

| Goal | Pass rate | Most common first picks |
| --- | ---: | --- |
| allergy | 2/2 | Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes (1); Monge VetSolution An Hydro (1) |
| general | 5/5 | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο (4); Purina Pro Plan LARGE ATHLETIC ADULT Everyday Nutrition Κοτόπουλο (1) |
| growth | 5/5 | Acana Puppy Large Breed (1); Josera Duck & Potato (1); Josera Kids (1) |
| premium | 1/1 | Josera Kids (1) |
| sensitive_digestion | 2/2 | Josera Gastro Dry (1); Monge VetSolution Gastrointestinal Puppy (1) |
| sterilised | 3/3 | Happy Dog Naturcroq Adult Chicken (1); Happy Dog Naturcroq Duck & Rice Sterilised (1); Purina Pro Plan All Sizes Adult Light/sterilised Κοτόπουλο (1) |
| urinary | 1/1 | Monge VetSolution Urinary Struvite (1) |
| value | 1/1 | Happy Dog Naturcroq Duck & Rice Sterilised (1) |

### Safety Coverage

| Safety level | Pass rate | Common top-2 foods |
| --- | ---: | --- |
| normal | 13/13 | Happy Dog Naturcroq Duck & Rice Sterilised (2); Josera Kids (2); Monge All Breeds Puppy And Junior Monoprotein Beef With Rice (2); Purina Pro Plan All Sizes Adult Light/sterilised Κοτόπουλο (2) |
| vet_referral | 7/7 | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο (2); Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί (2); Josera Duck & Potato (1); Josera Youngstar (1) |

### Recurring First Picks

- No single first pick appears in six or more cases.

Use this section for qualitative review: repeated first picks can be healthy if they match the scenario, but they can also reveal over-dominant ranking signals.

## Results

| # | Status | Top foods | Review notes |
| --- | --- | --- | --- |
| 201 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 205 | pass | Josera Gastro Dry; Schesir Dry Medium Maintenance Chicken; Monge Hypo With Salmon And Tuna | - |
| 221 | pass | Josera Duck & Potato; Josera Youngstar; ACANA Puppy Small Breed | - |
| 231 | pass | Monge VetSolution Urinary Struvite; Monge VetSolution Renal And Oxalate; Royal Canin Vet Diet Urinary S/O | - |
| 261 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 271 | pass | Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna; Josera Hypoallergenic Dry | - |
| 281 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 291 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 301 | pass | Purina Pro Plan All Sizes Adult Light/sterilised Κοτόπουλο; Purina Pro Plan Small&mini Adult Light/sterilised Κοτόπουλο; Josera Light & Vital Adult | - |
| 321 | pass | Happy Dog Naturcroq Adult Chicken; Purina Pro Plan All Sizes Adult Light/sterilised Κοτόπουλο; Purina Pro Plan LARGE ROBUST ADULT Everyday Nutrition Κοτόπουλο | - |
| 341 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; Josera Light & Vital Adult; Happy Dog Fit & Vital Light | - |
| 361 | pass | Josera Kids; Happy Dog Fit & Vital Junior; Josera Duck & Potato | - |
| 381 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; Josera Medi/maxi Adult Chicken & Rice; Happy Dog Naturcroq Adult Chicken | - |
| 421 | pass | Purina Pro Plan LARGE ATHLETIC ADULT Everyday Nutrition Κοτόπουλο; Monge All Breeds Adult Active; Purina Pro Plan LARGE ATHLETIC ADULT Sensitive Skin Σολομός | - |
| 461 | pass | Purina Pro Plan MEDIUM PUPPY Healthy Start Κοτόπουλο; Schesir Puppy Medium Με Κοτόπουλο; Josera Kids | - |
| 501 | pass | Purina Pro Plan SMALL&MINI PUPPY Healthy Start Κοτόπουλο; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 521 | pass | Acana Puppy Large Breed; Orijen Puppy Large; Josera Kids | - |
| 541 | pass | Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes; Monge All Breeds Puppy And Junior Monoprotein Duck With Rice And Potatoes; Monge BWild All Breeds Puppy E Junior Duck With Potatoes Gb | - |
| 561 | pass | Monge VetSolution Gastrointestinal Puppy; Royal Canin German Shepherd Junior; Royal Canin Giant Junior | - |
| 600 | pass | Josera Kids; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
