# Dog Chatbot 200 Live Cases

Generated: 2026-07-04T14:49:58.696Z
Site: https://nutritail.ai
OpenAI extraction: enabled

## Summary

- Cases checked: 200
- Passed: 200
- Needs review: 0
- Prompt encoding repairs applied: 0
- Prompt encoding issues after repair: 0

Checks cover OpenAI fact extraction when an API key is available, minimum missing-question flow, safety intent, Food V2 recommendation availability, allergy conflicts, puppy growth, large-breed puppy mineral data, weight-control kcal/fat/fiber logic, renal/urinary fit, sterilised calorie fit, senior fit, and active-dog/high-activity energy/protein mismatch guards.

OpenAI fact extraction was checked for each case.

## Executive Summary

### Goal Coverage

| Goal | Pass rate | Most common first picks |
| --- | ---: | --- |
| allergy | 24/24 | Josera Hypoallergenic Dry (18); Josera Salmon & Potato (4); Monge BWild Grain Free All Breeds Lamb With Potatoes And Peas (1) |
| general | 74/74 | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο (29); Josera Active Nature (16); Purina Pro Plan SMALL&MINI ADULT Age Defence 9+ Κοτόπουλο (3) |
| growth | 27/27 | Josera Duck & Potato (13); Acana Puppy Large Breed (9); Purina Pro Plan SMALL&MINI PUPPY Healthy Start Κοτόπουλο (3) |
| premium | 6/6 | Josera Salmon & Potato (3); Josera Active Nature (2); Josera Medi/maxi Adult Chicken & Rice (1) |
| renal | 5/5 | Monge VetSolution Renal And Oxalate (5) |
| senior | 26/26 | Josera Senior Balance (9); Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός (9); Schesir Mature Medium Με Κοτόπουλο (5) |
| sensitive_digestion | 17/17 | Josera Gastro Dry (13); Monge VetSolution Gastrointestinal Puppy (2); Monge Hypo With Salmon And Tuna (1) |
| sterilised | 3/3 | Happy Dog Naturcroq Duck & Rice Sterilised (3) |
| urinary | 5/5 | Monge VetSolution Urinary Struvite (4); Monge VetSolution Renal And Oxalate (1) |
| value | 2/2 | Josera Salmon & Potato (2) |
| weight_control | 11/11 | Happy Dog Naturcroq Duck & Rice Sterilised (11) |

### Safety Coverage

| Safety level | Pass rate | Common top-2 foods |
| --- | ---: | --- |
| emergency | 9/9 | Josera Duck & Potato (1); Josera Youngstar (1); Monge VetSolution Renal And Oxalate (1); Monge VetSolution Urinary Struvite (1) |
| normal | 97/97 | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο (19); Josera Active Nature (17); Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί (17); Josera Salmon & Potato (14) |
| vet_referral | 94/94 | Josera Hypoallergenic Dry (14); Josera Gastro Dry (13); Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί (13); Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο (12) |

### Recurring First Picks

- Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο: 29 first-pick appearances
- Josera Active Nature: 18 first-pick appearances
- Josera Hypoallergenic Dry: 18 first-pick appearances
- Happy Dog Naturcroq Duck & Rice Sterilised: 16 first-pick appearances
- Josera Duck & Potato: 13 first-pick appearances
- Josera Gastro Dry: 13 first-pick appearances
- Josera Salmon & Potato: 11 first-pick appearances
- Acana Puppy Large Breed: 9 first-pick appearances
- Josera Senior Balance: 9 first-pick appearances
- Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός: 9 first-pick appearances
- Monge VetSolution Renal And Oxalate: 6 first-pick appearances

Use this section for qualitative review: repeated first picks can be healthy if they match the scenario, but they can also reveal over-dominant ranking signals.

## Results

| # | Status | Top foods | Review notes |
| --- | --- | --- | --- |
| 1 | pass | Josera Duck & Potato; Josera Mini Junior Duck & Salmon; Josera Youngstar | - |
| 2 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; Josera Light & Vital; Happy Dog Fit & Vital Light | - |
| 3 | pass | Purina Pro Plan SMALL&MINI ADULT Age Defence 9+ Κοτόπουλο; Purina Pro Plan SMALL&MINI ADULT Everyday Nutrition Κοτόπουλο; Happy Dog Naturcroq Adult Chicken | - |
| 4 | pass | Acana Puppy Large Breed; Orijen Puppy Large; Josera Duck & Potato | - |
| 5 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; Josera Light & Vital Adult; Happy Dog Fit & Vital Light | - |
| 6 | pass | Brit Care Sustainable Senior Chicken & Insect; Josera Senior Balance; Josera Mini Senior Salmon | - |
| 7 | pass | Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός; Purina Pro Plan MEDIUM & LARGE ADULT Age Defence 7+ Κοτόπουλο; Brit Care Sustainable Senior Chicken & Insect | - |
| 8 | pass | Josera Gastro Dry; Schesir Dry Medium Maintenance Chicken; Monge Hypo With Salmon And Tuna | - |
| 9 | pass | Josera Active Nature; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 10 | pass | Josera Hypoallergenic Dry; Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna | - |
| 11 | pass | Josera Hypoallergenic Dry; Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna | - |
| 12 | pass | Josera Gastro Dry; Schesir Dry Medium Maintenance Chicken; Monge Hypo With Salmon And Tuna | - |
| 13 | pass | Schesir Adult Medium Με Χοιρινό Προσούτο; Schesir Adult Medium Με Ψάρι; Schesir Mature Medium Με Κοτόπουλο | - |
| 14 | pass | Monge VetSolution Renal And Oxalate; Josera Renal Dry; Royal Canin Vet Diet Small Renal | - |
| 15 | pass | Monge VetSolution Urinary Struvite; Monge VetSolution Renal And Oxalate; Royal Canin Vet Diet Urinary S/O | - |
| 16 | pass | Royal Canin Medium Light Weight Care; Josera Light & Vital; Monge VetSolution Diabetic | - |
| 17 | pass | Monge VetSolution Cardiac | - |
| 18 | pass | - | - |
| 19 | pass | Josera Salmon & Potato; Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes | - |
| 20 | pass | Josera Hypoallergenic Dry; Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna | - |
| 21 | pass | Josera Salmon & Potato; Happy Dog Naturcroq Adult Chicken; Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο | - |
| 22 | pass | Josera Active Nature; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 23 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 24 | pass | Josera Active Nature; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 25 | pass | Josera Gastro Dry; Schesir Dry Medium Maintenance Chicken; Monge Hypo With Salmon And Tuna | - |
| 26 | pass | Josera Duck & Potato; Josera Youngstar; ACANA Puppy Small Breed | - |
| 27 | pass | Josera Salmon & Potato; Schesir Adult Small Με Χοιρινό Προσούτο; Schesir Adult Small Με Ψάρι & Ρύζι | - |
| 28 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Josera Salmon & Potato; Monge All Breeds Adult Monoprotein Salmon With Rice | - |
| 29 | pass | Josera Hypoallergenic Dry; Monge All Breeds Adult Monoprotein Salmon With Rice; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 30 | pass | Monge BWild Grain Free All Breeds Lamb With Potatoes And Peas; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Josera Lamb & Rice Adult | - |
| 31 | pass | Purina Pro Plan SMALL&MINI PUPPY Healthy Start Κοτόπουλο; Josera Duck & Potato; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice | - |
| 32 | pass | Acana Puppy Large Breed; Orijen Puppy Large; Josera Kids | - |
| 33 | pass | Acana Puppy Large Breed; Orijen Puppy Large; Josera Duck & Potato | - |
| 34 | pass | Purina Pro Plan SMALL&MINI PUPPY Healthy Start Κοτόπουλο; Josera Duck & Potato; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice | - |
| 35 | pass | Monge VetSolution Gastrointestinal Puppy; Royal Canin Bulldog Puppy; Royal Canin Chihuahua Puppy | - |
| 36 | pass | Josera Duck & Potato; Josera Mini Junior Duck & Salmon; Josera Youngstar | - |
| 37 | pass | Josera Kids; Josera Duck & Potato; Josera Youngstar | - |
| 38 | pass | Acana Puppy Large Breed; Orijen Puppy Large; Josera Duck & Potato | - |
| 39 | pass | Josera Duck & Potato; Josera Youngstar; ACANA Puppy Small Breed | - |
| 40 | pass | Monge VetSolution Gastrointestinal Puppy; Royal Canin German Shepherd Junior; Royal Canin Giant Junior | - |
| 41 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; Josera Light & Vital Adult; Happy Dog Fit & Vital Light | - |
| 42 | pass | Josera Active Nature; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 43 | pass | Josera Active Nature; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 44 | pass | Josera Active Nature; Purina Pro Plan LARGE ATHLETIC ADULT Everyday Nutrition Κοτόπουλο; Monge All Breeds Adult Active | - |
| 45 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; Josera Light & Vital Adult; Happy Dog Fit & Vital Light | - |
| 46 | pass | Josera Medi/maxi Adult Chicken & Rice; Josera Salmon & Potato; Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός | - |
| 47 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 48 | pass | Josera Medi/maxi Adult Chicken & Rice; Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός; Purina Pro Plan MEDIUM & LARGE ADULT Age Defence 7+ Κοτόπουλο | - |
| 49 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 50 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 51 | pass | Josera Mini Senior Salmon; N&D Low Grain Chicken & Pomegranate Senior Mini; Acana Senior | - |
| 52 | pass | Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός; Purina Pro Plan MEDIUM & LARGE ADULT Age Defence 7+ Κοτόπουλο; Brit Care Sustainable Senior Chicken & Insect | - |
| 53 | pass | Josera Senior Balance; Josera Mini Senior Salmon; N&D Low Grain Chicken & Pomegranate Senior Mini | - |
| 54 | pass | Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός; Purina Pro Plan MEDIUM & LARGE ADULT Age Defence 7+ Κοτόπουλο; Brit Care Sustainable Senior Chicken & Insect | - |
| 55 | pass | Schesir Mature Medium Με Κοτόπουλο; Royal Canin Medium Adult 7+; Royal Canin Medium Ageing 10+ | - |
| 56 | pass | Monge VetSolution Renal And Oxalate; Josera Renal Dry; Royal Canin Vet Diet Renal | - |
| 57 | pass | Josera Senior Balance; Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός; Purina Pro Plan MEDIUM & LARGE ADULT Age Defence 7+ Κοτόπουλο | - |
| 58 | pass | Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός; Purina Pro Plan MEDIUM & LARGE ADULT Age Defence 7+ Κοτόπουλο; Brit Care Sustainable Senior Chicken & Insect | - |
| 59 | pass | Schesir Mature Medium Με Κοτόπουλο; Royal Canin Medium Ageing 10+; Acana Senior | - |
| 60 | pass | Josera Senior Balance; Schesir Mature Medium Με Κοτόπουλο; Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός | - |
| 61 | pass | Josera Gastro Dry; Schesir Dry Medium Maintenance Chicken; Monge Hypo With Salmon And Tuna | - |
| 62 | pass | Josera Salmon & Potato; Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Happy Dog Naturcroq Adult Chicken | - |
| 63 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; Josera Light & Vital Adult; Happy Dog Fit & Vital Light | - |
| 64 | pass | Josera Salmon & Potato; Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Happy Dog Naturcroq Adult Chicken | - |
| 65 | pass | Josera Salmon & Potato; ACANA Classic Red Meat; ACANA Prairie Poultry | - |
| 66 | pass | Josera Gastro Dry; Monge Hypo With Salmon And Tuna; Monge VetSolution Gastrointestinal Adult | - |
| 67 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 68 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 69 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 70 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 71 | pass | Schesir Dry Small Maintenance Με Κοτόπουλο; Schesir Adult Small Chicken & Rice; Josera Salmon & Potato | - |
| 72 | pass | Josera Duck & Potato; Josera Mini Junior Duck & Salmon; Josera Youngstar | - |
| 73 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; Josera Light & Vital Adult; Happy Dog Fit & Vital Light | - |
| 74 | pass | Purina Pro Plan SMALL&MINI PUPPY Healthy Start Κοτόπουλο; Josera Duck & Potato; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice | - |
| 75 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 76 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; Josera Light & Vital Adult; Happy Dog Fit & Vital Light | - |
| 77 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; Josera Light & Vital Adult; Happy Dog Fit & Vital Light | - |
| 78 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 79 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 80 | pass | Josera Active Nature; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 81 | pass | - | - |
| 82 | pass | - | - |
| 83 | pass | - | - |
| 84 | pass | - | - |
| 85 | pass | - | - |
| 86 | pass | - | - |
| 87 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 88 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; Royal Canin Medium Sterilised | - |
| 89 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 90 | pass | Monge VetSolution Urinary Struvite; Monge VetSolution Renal And Oxalate; Royal Canin Vet Diet Urinary S/O | - |
| 91 | pass | Purina Pro Plan SMALL&MINI ADULT Age Defence 9+ Κοτόπουλο; Purina Pro Plan SMALL&MINI ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan SMALL&MINI ADULT Sensitive Skin Σολομός | - |
| 92 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 93 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 94 | pass | Josera Active Nature; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 95 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 96 | pass | Josera Salmon & Potato; Happy Dog Naturcroq Adult Chicken; Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο | - |
| 97 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; N&D Quinoa Grain Free Neutered Duck Adult Mini; Happy Dog Naturcroq Adult Chicken | - |
| 98 | pass | Josera Salmon & Potato; Schesir Adult Medium Με Ψάρι; Monge All Breeds Adult Monoprotein Salmon With Rice | - |
| 99 | pass | Josera Hypoallergenic Dry; Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna | - |
| 100 | pass | Josera Medi/maxi Adult Chicken & Rice; Josera Salmon & Potato; Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός | - |
| 101 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 102 | pass | Josera Active Nature; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 103 | pass | Josera Hypoallergenic Dry; Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna | - |
| 104 | pass | Josera Gastro Dry; Monge Hypo With Salmon And Tuna; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί | - |
| 105 | pass | Acana Puppy Large Breed; Orijen Puppy Large; Josera Duck & Potato | - |
| 106 | pass | Acana Puppy Large Breed; Orijen Puppy Large; Josera Duck & Potato | - |
| 107 | pass | Acana Puppy Large Breed; Orijen Puppy Large; Josera Duck & Potato | - |
| 108 | pass | Acana Puppy Large Breed; Orijen Puppy Large; Josera Duck & Potato | - |
| 109 | pass | Josera Active Nature; Purina Pro Plan LARGE ATHLETIC ADULT Everyday Nutrition Κοτόπουλο; Monge All Breeds Adult Active | - |
| 110 | pass | Josera Active Nature; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 111 | pass | Josera Active Nature; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 112 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; Josera Light & Vital Adult; Happy Dog Fit & Vital Light | - |
| 113 | pass | Josera Active Nature; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 114 | pass | Josera Active Nature; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 115 | pass | Josera Active Nature; Royal Canin Sporting Life Trail 4300; Monge All Breeds Adult Active | - |
| 116 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; Josera Light & Vital Adult; Happy Dog Fit & Vital Light | - |
| 117 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; Josera Light & Vital Adult; Happy Dog Fit & Vital Light | - |
| 118 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; Royal Canin Medium Sterilised | - |
| 119 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; Josera Light & Vital Adult; Happy Dog Fit & Vital Light | - |
| 120 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 121 | pass | Josera Gastro Dry; Schesir Dry Medium Maintenance Chicken; Monge Hypo With Salmon And Tuna | - |
| 122 | pass | Josera Gastro Dry; Schesir Dry Medium Maintenance Chicken; Monge Hypo With Salmon And Tuna | - |
| 123 | pass | Josera Gastro Dry; Schesir Dry Medium Maintenance Chicken; Monge Hypo With Salmon And Tuna | - |
| 124 | pass | Schesir Dry Medium Maintenance Chicken; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Monge Hypo With Salmon And Tuna | - |
| 125 | pass | Josera Hypoallergenic Dry; Josera Salmon & Potato; Monge All Breeds Adult Monoprotein Beef With Rice | - |
| 126 | pass | Josera Hypoallergenic Dry; Josera Salmon & Potato; Monge All Breeds Adult Monoprotein Beef With Rice | - |
| 127 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 128 | pass | Josera Salmon & Potato; Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes | - |
| 129 | pass | Josera Salmon & Potato; Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes | - |
| 130 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Adult Medium Με Χοιρινό Προσούτο; Schesir Adult Medium Με Ψάρι | - |
| 131 | pass | Josera Gastro Dry; Schesir Dry Medium Maintenance Chicken; Monge Hypo With Salmon And Tuna | - |
| 132 | pass | Josera Gastro Dry; Schesir Dry Medium Maintenance Chicken; Monge Hypo With Salmon And Tuna | - |
| 133 | pass | Josera Gastro Dry; Schesir Dry Medium Maintenance Chicken; Monge Hypo With Salmon And Tuna | - |
| 134 | pass | Monge Hypo With Salmon And Tuna; Purina Pro Plan Veterinary Diets Small EN Gastrointestinal; Purina Pro Plan Veterinary Diets Canine En Gastrointestinal Σολομός | - |
| 135 | pass | Josera Gastro Dry; Schesir Dry Medium Maintenance Chicken; Monge Hypo With Salmon And Tuna | - |
| 136 | pass | Josera Hypoallergenic Dry; Josera Salmon & Potato; Monge All Breeds Adult Monoprotein Beef With Rice | - |
| 137 | pass | Josera Hypoallergenic Dry; Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna | - |
| 138 | pass | Monge Hypo With Salmon And Tuna; Josera Salmon & Potato; Monge All Breeds Adult Monoprotein Beef With Rice | - |
| 139 | pass | Josera Hypoallergenic Dry; Josera Salmon & Potato; Monge VetSolution An Hydro | - |
| 140 | pass | Josera Hypoallergenic Dry; Josera Salmon & Potato; Monge All Breeds Adult Monoprotein Beef With Rice | - |
| 141 | pass | Josera Hypoallergenic Dry; Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna | - |
| 142 | pass | Josera Hypoallergenic Dry; Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes | - |
| 143 | pass | Josera Hypoallergenic Dry; Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna | - |
| 144 | pass | Josera Hypoallergenic Dry; Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna | - |
| 145 | pass | Josera Hypoallergenic Dry; Brit Care Hypoallergenic Adult Show Champion Salmon & Herring; Josera Salmon & Potato | - |
| 146 | pass | Josera Hypoallergenic Dry; Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna | - |
| 147 | pass | Josera Salmon & Potato; Brit Care Hypoallergenic Adult Show Champion Salmon & Herring; Monge All Breeds Adult Monoprotein Salmon With Rice | - |
| 148 | pass | - | food: Food V2 returned no visible wet/canned candidates; this is a wet-food data coverage gap. |
| 149 | pass | - | food: Food V2 returned no visible wet/canned candidates; this is a wet-food data coverage gap. |
| 150 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 151 | pass | Monge VetSolution Urinary Struvite; Monge VetSolution Renal And Oxalate; Royal Canin Vet Diet Urinary S/O | - |
| 152 | pass | Monge VetSolution Urinary Struvite; Royal Canin Vet Diet Urinary S/O; Royal Canin Vet Diet Urinary S/O Small | - |
| 153 | pass | Monge VetSolution Renal And Oxalate; Royal Canin Vet Diet Urinary S/O; Royal Canin Vet Diet Urinary S/O Small | - |
| 154 | pass | Monge VetSolution Renal And Oxalate; Josera Renal Dry; Royal Canin Vet Diet Renal | - |
| 155 | pass | Monge VetSolution Renal And Oxalate; Josera Renal Dry; Royal Canin Vet Diet Renal | - |
| 156 | pass | Monge VetSolution Renal And Oxalate; Josera Renal Dry; Royal Canin Vet Diet Renal | - |
| 157 | pass | Josera Liver Dry; Monge VetSolution Urinary Struvite; Monge All Breeds Adult Monoprotein Beef With Rice | - |
| 158 | pass | Josera Liver Dry; Monge VetSolution Urinary Struvite; Monge All Breeds Adult Monoprotein Beef With Rice | - |
| 159 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 160 | pass | Monge VetSolution Cardiac | - |
| 161 | pass | Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός; Purina Pro Plan MEDIUM & LARGE ADULT Age Defence 7+ Κοτόπουλο; Brit Care Sustainable Senior Chicken & Insect | - |
| 162 | pass | Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός; Purina Pro Plan MEDIUM & LARGE ADULT Age Defence 7+ Κοτόπουλο; Brit Care Sustainable Senior Chicken & Insect | - |
| 163 | pass | Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός; Purina Pro Plan MEDIUM & LARGE ADULT Age Defence 7+ Κοτόπουλο; Brit Care Sustainable Senior Chicken & Insect | - |
| 164 | pass | Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός; Purina Pro Plan MEDIUM & LARGE ADULT Age Defence 7+ Κοτόπουλο; Brit Care Sustainable Senior Chicken & Insect | - |
| 165 | pass | Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός; Purina Pro Plan MEDIUM & LARGE ADULT Age Defence 7+ Κοτόπουλο; Brit Care Sustainable Senior Chicken & Insect | - |
| 166 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 167 | pass | Monge VetSolution Gastrointestinal Adult; Purina Pro Plan Veterinary Diets CANINE JM Joint Mobility; Purina Pro Plan Veterinary Diets Canine En Gastrointestinal Σολομός | - |
| 168 | pass | Monge VetSolution Gastrointestinal Adult; Purina Pro Plan Veterinary Diets CANINE JM Joint Mobility; Purina Pro Plan Veterinary Diets Canine En Gastrointestinal Σολομός | - |
| 169 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 170 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 171 | pass | Josera Duck & Potato; Josera Youngstar; ACANA Puppy Small Breed | - |
| 172 | pass | Josera Duck & Potato; Josera Mini Junior Duck & Salmon; Josera Youngstar | - |
| 173 | pass | Josera Duck & Potato; Josera Youngstar; ACANA Puppy Small Breed | - |
| 174 | pass | Purina Pro Plan Small&medium Starter Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan Large Starter Κοτόπουλο | - |
| 175 | pass | Josera Duck & Potato; Josera Youngstar; ACANA Puppy Small Breed | - |
| 176 | pass | Josera Duck & Potato; Josera Youngstar; ACANA Puppy Small Breed | - |
| 177 | pass | Josera Duck & Potato; Josera Youngstar; ACANA Puppy Small Breed | - |
| 178 | pass | Acana Puppy Large Breed; Orijen Puppy Large; Josera Duck & Potato | - |
| 179 | pass | Josera Duck & Potato; Josera Youngstar; ACANA Puppy Small Breed | - |
| 180 | pass | Josera Duck & Potato; Josera Youngstar; ACANA Puppy Small Breed | - |
| 181 | pass | Josera Senior Balance; Schesir Mature Medium Με Κοτόπουλο; Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός | - |
| 182 | pass | Josera Senior Balance; Schesir Mature Medium Με Κοτόπουλο; Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός | - |
| 183 | pass | Josera Senior Balance; Schesir Mature Medium Με Κοτόπουλο; Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός | - |
| 184 | pass | Josera Senior Balance; Schesir Mature Medium Με Κοτόπουλο; Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός | - |
| 185 | pass | Schesir Mature Medium Με Κοτόπουλο; Royal Canin Medium Adult 7+; Royal Canin Medium Ageing 10+ | - |
| 186 | pass | - | - |
| 187 | pass | Josera Senior Balance; Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός; Purina Pro Plan MEDIUM & LARGE ADULT Age Defence 7+ Κοτόπουλο | - |
| 188 | pass | Josera Senior Balance; Schesir Mature Medium Με Κοτόπουλο; Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός | - |
| 189 | pass | Schesir Mature Medium Με Κοτόπουλο; Acana Senior; Royal Canin Medium Adult 7+ | - |
| 190 | pass | Schesir Mature Medium Με Κοτόπουλο; Royal Canin Medium Adult 7+; Royal Canin Medium Ageing 10+ | - |
| 191 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 192 | pass | Josera Active Nature; Royal Canin Sporting Life Trail 4300; Monge All Breeds Adult Active | - |
| 193 | pass | Josera Active Nature; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 194 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; Josera Light & Vital Adult; Happy Dog Fit & Vital Light | - |
| 195 | pass | Josera Active Nature; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 196 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 197 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 198 | pass | Purina Pro Plan SMALL&MINI ADULT Age Defence 9+ Κοτόπουλο; Purina Pro Plan SMALL&MINI ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan SMALL&MINI ADULT Sensitive Skin Σολομός | - |
| 199 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
| 200 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός | - |
