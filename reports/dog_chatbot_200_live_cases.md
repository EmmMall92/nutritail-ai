# Dog Chatbot 200 Live Cases

Generated: 2026-06-23T05:15:13.589Z
Site: https://nutritail.ai
OpenAI extraction: skipped

## Summary

- Cases checked: 200
- Passed: 200
- Needs review: 0
- Prompt encoding repairs applied: 0
- Prompt encoding issues after repair: 0

Checks cover OpenAI fact extraction when an API key is available, minimum missing-question flow, safety intent, Food V2 recommendation availability, allergy conflicts, puppy growth, large-breed puppy mineral data, weight-control kcal/fat/fiber logic, renal/urinary fit, sterilised calorie fit, senior fit, and active-dog/high-activity energy/protein mismatch guards.

OpenAI fact extraction was not checked in this run because no usable OPENAI_API_KEY was available to the QA runner.

## Executive Summary

### Goal Coverage

| Goal | Pass rate | Most common first picks |
| --- | ---: | --- |
| allergy | 24/24 | Monge All Breeds Adult Monoprotein Beef With Rice (14); Monge VetSolution An Hydro (4); Monge All Breeds Adult Monoprotein Salmon With Rice (3) |
| general | 74/74 | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί (48); Josera ACTIVE NATURE (13); Monge All Breeds Adult Active (2) |
| growth | 27/27 | Brit Premium By Nature Junior Small (14); Brit Care Grain Free Puppy Salmon (9); Purina Pro Plan SMALL&MINI PUPPY Healthy Start Κοτόπουλο (2) |
| premium | 6/6 | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο (3); Josera ACTIVE NATURE (1); Josera Medi/maxi Adult Chicken & Rice (1) |
| renal | 5/5 | Monge VetSolution Renal And Oxalate (5) |
| senior | 26/26 | Brit Care Sustainable Senior Chicken & Insect (23); Josera MINI SENIOR SALMON (3) |
| sensitive_digestion | 17/17 | Josera GASTRO DRY (13); Josera DUCK & POTATO (2); Monge All Breeds Adult Monoprotein Beef With Rice (1) |
| sterilised | 3/3 | Happy Dog Fit & Vital Light (1); Josera LIGHT & VITAL (1); N&D Quinoa Grain Free Neutered Duck Adult Mini (1) |
| urinary | 5/5 | Monge VetSolution Urinary Struvite (4); Monge VetSolution Renal And Oxalate (1) |
| value | 2/2 | Happy Dog Naturcroq Adult Chicken (2) |
| weight_control | 11/11 | Josera LIGHT & VITAL (9); Happy Dog Fit & Vital Light (2) |

### Safety Coverage

| Safety level | Pass rate | Common top-2 foods |
| --- | ---: | --- |
| emergency | 9/9 | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί (3); Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός (3); Brit Premium By Nature Junior Small (1); Josera DUCK & POTATO (1) |
| normal | 97/97 | Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός (23); Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί (21); Monge All Breeds Adult Active (17); Josera ACTIVE NATURE (14) |
| vet_referral | 94/94 | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί (24); Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός (24); Brit Care Sustainable Senior Chicken & Insect (19); Acana Senior (15) |

### Recurring First Picks

- Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί: 48 first-pick appearances
- Brit Care Sustainable Senior Chicken & Insect: 23 first-pick appearances
- Monge All Breeds Adult Monoprotein Beef With Rice: 15 first-pick appearances
- Brit Premium By Nature Junior Small: 14 first-pick appearances
- Josera ACTIVE NATURE: 14 first-pick appearances
- Josera GASTRO DRY: 13 first-pick appearances
- Josera LIGHT & VITAL: 10 first-pick appearances
- Brit Care Grain Free Puppy Salmon: 9 first-pick appearances
- Monge VetSolution Renal And Oxalate: 6 first-pick appearances

Use this section for qualitative review: repeated first picks can be healthy if they match the scenario, but they can also reveal over-dominant ranking signals.

## Results

| # | Status | Top foods | Review notes |
| --- | --- | --- | --- |
| 1 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 2 | pass | Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi | - |
| 3 | pass | Purina Pro Plan SMALL&MINI ADULT Age Defence 9+ Κοτόπουλο; Purina Pro Plan SMALL&MINI ADULT Everyday Nutrition Κοτόπουλο; ACANA Prairie Poultry | - |
| 4 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 5 | pass | Josera LIGHT & VITAL; Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi | - |
| 6 | pass | Josera MINI SENIOR SALMON; N&D Low Grain Chicken & Pomegranate Senior Mini; Brit Care Sustainable Senior Chicken & Insect | - |
| 7 | pass | Brit Care Sustainable Senior Chicken & Insect; Orijen Senior; Royal Canin Maxi Joint Care | - |
| 8 | pass | Josera GASTRO DRY; Josera SALMON & POTATO; Schesir Dry Medium Maintenance Chicken | - |
| 9 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 10 | pass | Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna; Josera HYPOALLERGENIC DRY | - |
| 11 | pass | Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna; Josera HYPOALLERGENIC DRY | - |
| 12 | pass | Josera GASTRO DRY; Josera SALMON & POTATO; Schesir Dry Medium Maintenance Chicken | - |
| 13 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 14 | pass | Monge VetSolution Renal And Oxalate; Josera RENAL DRY; Royal Canin Vet Diet Small Renal | - |
| 15 | pass | Monge VetSolution Urinary Struvite; Monge VetSolution Renal And Oxalate; Royal Canin Vet Diet Urinary S/O | - |
| 16 | pass | Acana Senior; Brit Care Sustainable Senior Chicken & Insect; Orijen Senior | - |
| 17 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 18 | pass | - | - |
| 19 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 20 | pass | Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna; Josera HYPOALLERGENIC DRY | - |
| 21 | pass | Happy Dog Naturcroq Adult Chicken; Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Ambrosia Ολιστική Τροφή Για Ενήλικους Σκύλους, Όλων Των Φυλών, Με Σαρδέλα Και Τόνο | - |
| 22 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 23 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 24 | pass | Monge All Breeds Adult Active; Purina Pro Plan LARGE ATHLETIC ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan LARGE ATHLETIC ADULT Sensitive Skin Σολομός | - |
| 25 | pass | Josera GASTRO DRY; Josera SALMON & POTATO; Schesir Dry Medium Maintenance Chicken | - |
| 26 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 27 | pass | Schesir Dry Small Maintenance Με Κοτόπουλο; Schesir Adult Small Chicken & Rice; Josera SALMON & POTATO | - |
| 28 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Monge All Breeds Adult Monoprotein Salmon With Rice; Monge Hypo With Salmon And Tuna | - |
| 29 | pass | Monge All Breeds Adult Monoprotein Salmon With Rice; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Purina Pro Plan Veterinary Diets CANINE DRM DERMATOSISTM | - |
| 30 | pass | Monge BWild Bwild Grain Free All Breeds Lamb With Potatoes And Peas; ACANA Classic Red Meat; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί | - |
| 31 | pass | Purina Pro Plan SMALL&MINI PUPPY Healthy Start Κοτόπουλο; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 32 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 33 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 34 | pass | Purina Pro Plan SMALL&MINI PUPPY Healthy Start Κοτόπουλο; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 35 | pass | Josera DUCK & POTATO; Josera KIDS; Josera MINI JUNIOR DUCK & SALMON | - |
| 36 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 37 | pass | Acana Wild Coast; Josera KIDS; Brit Premium By Nature Junior Medium | - |
| 38 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 39 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 40 | pass | Josera DUCK & POTATO; Josera KIDS; Josera YOUNGSTAR | - |
| 41 | pass | Josera LIGHT & VITAL; Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Neutered Duck Adult Mini | - |
| 42 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 43 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Purina Pro Plan LARGE ATHLETIC ADULT Everyday Nutrition Κοτόπουλο | - |
| 44 | pass | Monge All Breeds Adult Active; Purina Pro Plan LARGE ATHLETIC ADULT Sensitive Skin Σολομός; Happy Dog Profi High Energy 30/20 | - |
| 45 | pass | Josera LIGHT & VITAL; Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Neutered Duck Adult Mini | - |
| 46 | pass | Josera Medi/maxi Adult Chicken & Rice; Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός; Purina Pro Plan MEDIUM & LARGE ADULT Age Defence 7+ Κοτόπουλο | - |
| 47 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 48 | pass | Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός; Purina Pro Plan MEDIUM & LARGE ADULT Age Defence 7+ Κοτόπουλο; N&D Low Grain Chicken & Pomegranate Adult Med/maxi | - |
| 49 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 50 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 51 | pass | Josera MINI SENIOR SALMON; Brit Care Sustainable Senior Chicken & Insect; Acana Senior | - |
| 52 | pass | Brit Care Sustainable Senior Chicken & Insect; Orijen Senior; Royal Canin Medium Adult 7+ | - |
| 53 | pass | Josera MINI SENIOR SALMON; N&D Low Grain Chicken & Pomegranate Senior Mini; Brit Care Sustainable Senior Chicken & Insect | - |
| 54 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 55 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 56 | pass | Monge VetSolution Renal And Oxalate; Royal Canin Vet Diet Renal | - |
| 57 | pass | Brit Care Sustainable Senior Chicken & Insect; Orijen Senior; Royal Canin Medium Adult 7+ | - |
| 58 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 59 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 60 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 61 | pass | Josera GASTRO DRY; Josera SALMON & POTATO; Schesir Dry Medium Maintenance Chicken | - |
| 62 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; ACANA Classic Red Meat; ACANA Prairie Poultry | - |
| 63 | pass | Josera LIGHT & VITAL; Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi | - |
| 64 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; ACANA Classic Red Meat; ACANA Prairie Poultry | - |
| 65 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; ACANA Classic Red Meat; ACANA Prairie Poultry | - |
| 66 | pass | Josera GASTRO DRY; Josera SALMON & POTATO; Schesir Dry Medium Maintenance Chicken | - |
| 67 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 68 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 69 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 70 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 71 | pass | Schesir Dry Small Maintenance Με Κοτόπουλο; Schesir Adult Small Chicken & Rice; Josera SALMON & POTATO | - |
| 72 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 73 | pass | Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi | - |
| 74 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 75 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 76 | pass | Josera LIGHT & VITAL; Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi | - |
| 77 | pass | Josera LIGHT & VITAL; Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi | - |
| 78 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 79 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 80 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 81 | pass | - | - |
| 82 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 83 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 84 | pass | - | - |
| 85 | pass | - | - |
| 86 | pass | - | - |
| 87 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 88 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 89 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 90 | pass | Monge VetSolution Urinary Struvite; Monge VetSolution Renal And Oxalate; Royal Canin Vet Diet Urinary S/O | - |
| 91 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 92 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 93 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 94 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 95 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 96 | pass | Happy Dog Naturcroq Adult Chicken; Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Ambrosia Ολιστική Τροφή Για Ενήλικους Σκύλους, Όλων Των Φυλών, Με Σαρδέλα Και Τόνο | - |
| 97 | pass | N&D Quinoa Grain Free Neutered Duck Adult Mini; Happy Dog Naturcroq Σολομός & Ρύζι; Royal Canin Medium Sterilised Adult | - |
| 98 | pass | Royal Canin Medium Adult; Monge All Breeds Adult Monoprotein Salmon With Rice; Monge Hypo With Salmon And Tuna | - |
| 99 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 100 | pass | Josera Medi/maxi Adult Chicken & Rice; Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός; Purina Pro Plan MEDIUM & LARGE ADULT Age Defence 7+ Κοτόπουλο | - |
| 101 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Josera Medi/maxi Adult Chicken & Rice | - |
| 102 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Purina Pro Plan LARGE ATHLETIC ADULT Everyday Nutrition Κοτόπουλο | - |
| 103 | pass | Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός; Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 104 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 105 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 106 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 107 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 108 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 109 | pass | Monge All Breeds Adult Active; Purina Pro Plan LARGE ATHLETIC ADULT Sensitive Skin Σολομός; Happy Dog Profi High Energy 30/20 | - |
| 110 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 111 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 112 | pass | Josera LIGHT & VITAL; Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi | - |
| 113 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 114 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 115 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 116 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 117 | pass | Josera LIGHT & VITAL; Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi | - |
| 118 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 119 | pass | Josera LIGHT & VITAL; Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi | - |
| 120 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 121 | pass | Josera GASTRO DRY; Josera SALMON & POTATO; Schesir Dry Medium Maintenance Chicken | - |
| 122 | pass | Josera GASTRO DRY; Josera SALMON & POTATO; Schesir Dry Medium Maintenance Chicken | - |
| 123 | pass | Josera GASTRO DRY; Josera SALMON & POTATO; Schesir Dry Medium Maintenance Chicken | - |
| 124 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 125 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 126 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 127 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 128 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 129 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 130 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 131 | pass | Josera GASTRO DRY; Josera SALMON & POTATO; Schesir Dry Medium Maintenance Chicken | - |
| 132 | pass | Josera GASTRO DRY; Josera SALMON & POTATO; Schesir Dry Medium Maintenance Chicken | - |
| 133 | pass | Josera GASTRO DRY; Josera SALMON & POTATO; Schesir Dry Medium Maintenance Chicken | - |
| 134 | pass | Josera GASTRO DRY; Josera SALMON & POTATO; Schesir Dry Medium Maintenance Chicken | - |
| 135 | pass | Josera GASTRO DRY; Josera SALMON & POTATO; Schesir Dry Medium Maintenance Chicken | - |
| 136 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 137 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 138 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 139 | pass | Monge VetSolution An Hydro; Purina Pro Plan Veterinary Diets CANINE DRM DERMATOSISTM; Monge BWild Bwild Grain Free All Breeds Lamb With Potatoes And Peas | - |
| 140 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes; Monge All Breeds Adult Monoprotein Rabbit With Rice And Potatoes | - |
| 141 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes; Monge All Breeds Adult Monoprotein Salmon With Rice | - |
| 142 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 143 | pass | Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes; Monge All Breeds Adult Monoprotein Rabbit With Rice And Potatoes | - |
| 144 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 145 | pass | Monge All Breeds Adult Monoprotein Salmon With Rice; Purina Pro Plan Veterinary Diets CANINE DRM DERMATOSISTM; Brit Care Hypoallergenic Adult Show Champion Salmon & Herring | - |
| 146 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 147 | pass | Monge All Breeds Adult Monoprotein Salmon With Rice; Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna | - |
| 148 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 149 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 150 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 151 | pass | Monge VetSolution Urinary Struvite; Monge VetSolution Renal And Oxalate; Royal Canin Vet Diet Urinary S/O | - |
| 152 | pass | Monge VetSolution Urinary Struvite; Royal Canin Vet Diet Urinary S/O; Royal Canin Vet Diet Urinary S/O Small | - |
| 153 | pass | Monge VetSolution Renal And Oxalate; Royal Canin Vet Diet Urinary S/O; Royal Canin Vet Diet Urinary S/O Small | - |
| 154 | pass | Monge VetSolution Renal And Oxalate; Royal Canin Vet Diet Renal | - |
| 155 | pass | Monge VetSolution Renal And Oxalate; Royal Canin Vet Diet Renal | - |
| 156 | pass | Monge VetSolution Renal And Oxalate; Royal Canin Vet Diet Renal | - |
| 157 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 158 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 159 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 160 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 161 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 162 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 163 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 164 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 165 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 166 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 167 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 168 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 169 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 170 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 171 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 172 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 173 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 174 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 175 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 176 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 177 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 178 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 179 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 180 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 181 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 182 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 183 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 184 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 185 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 186 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 187 | pass | Brit Care Sustainable Senior Chicken & Insect; Orijen Senior; Royal Canin Medium Adult 7+ | - |
| 188 | pass | Brit Care Sustainable Senior Chicken & Insect; Orijen Senior; Royal Canin Medium Adult 7+ | - |
| 189 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 190 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 191 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 192 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 193 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 194 | pass | Josera LIGHT & VITAL; Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi | - |
| 195 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 196 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 197 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 198 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 199 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 200 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
