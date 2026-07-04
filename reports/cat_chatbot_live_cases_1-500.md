# Cat Chatbot Live Cases 001-500

Site: https://nutritail.ai
Run date: 2026-07-04T15:26:23.426Z
OpenAI extraction: skipped
Result: 500/500 passed, 0 review
Prompt encoding repairs applied: 0
Prompt encoding issues after repair: 0

This QA checks the live Food V2 recommendation endpoint with cat scenarios from `data/evals/chatbot-extra-cases-cat-001-500.json`.
It focuses on species safety, empty shortlists, and major nutrition-direction mismatches for urinary, renal, kitten, senior, sterilised, weight-control, and allergy scenarios.

## Executive Summary

### Goal Coverage

| Goal | Pass rate | Most common first picks |
| --- | ---: | --- |
| allergy | 27/27 | Josera - Marinesse Hypoallergenic Adult (13); Schesir - Chicken With Egg (7); Purina Pro Plan - Veterinary Diets Cat HA Hypoallergenic (4) |
| general | 276/276 | Josera - Culinesse Adult (202); Josera - Sensicat Sensitive Adult (30); Monge - Monoprotein Adult Salmon (9) |
| growth | 36/36 | ACANA - Grasslands Adult Cat & Kitten (31); Josera - Kitten (2); Royal Canin - Kitten Sterilised (2) |
| renal | 39/39 | Monge VetSolution - Renal (36); Royal Canin - Vet Diet Cat Renal Special (2) |
| senior | 25/25 | Josera - Senior (25) |
| sensitive_digestion | 16/16 | Farmina - Vet Life Cat Gastrointestinal (14); Monge VetSolution - Gastrointestinal (1) |
| sterilised | 15/15 | Josera - Josicat Classic Sterilised (9); Monge BWild - Grain Free Sterilised Tuna With Peas (2); Josera - Josicat Crunchy Chicken (1) |
| urinary | 35/35 | Monge VetSolution - Urinary Struvite (25); Monge VetSolution - Urinary Oxalate (3); Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού (3) |
| weight_control | 31/31 | Monge - Adult Light Turkey (30); Schesir - Cat Sterilized & Light Με Κοτόπουλο (1) |

### Signal Coverage

| Signal | Pass rate | Common top-2 foods |
| --- | ---: | --- |
| active | 32/32 | Josera - Sensicat Sensitive Adult (30); Monge BWild - Low Grain Adult Anchovies (30); Josera - Kitten (2); Josera - Kitten Grain Free (2) |
| allergy | 34/34 | Josera - Marinesse Hypoallergenic Adult (20); Monge BWild - Low Grain Adult Hare (14); Schesir - Chicken With Egg (7); Monge - Monoprotein Adult Rabbit (5) |
| budget | 3/3 | Josera - Culinesse Adult (3); Josera - Sensicat Sensitive Adult (3) |
| cat | 500/500 | Josera - Sensicat Sensitive Adult (216); Josera - Culinesse Adult (204); Monge BWild - Low Grain Adult Anchovies (48); Royal Canin - Vet Diet Cat Renal (38) |
| general_recommendation | 108/108 | Josera - Culinesse Adult (97); Josera - Sensicat Sensitive Adult (97); Monge BWild - Low Grain Adult Anchovies (2); Monge BWild - Low Grain Adult Hare (2) |
| hydration | 19/19 | Josera - Culinesse Adult (8); Josera - Sensicat Sensitive Adult (8); N&D - Quinoa Grain Free Digestion Lamb (1); ORIJEN - Regional Red (1) |
| indoor | 31/31 | Josera - Sensicat Sensitive Adult (25); Josera - Culinesse Adult (24); Josera - Josicat Classic Sterilised (3); Josera - Josicat Crunchy Chicken (1) |
| kitten_growth | 36/36 | ACANA - Grasslands Adult Cat & Kitten (33); ACANA - Pacifica Adult Cat & Kitten (32); Josera - Kitten (2); Josera - Kitten Grain Free (2) |
| preference | 75/75 | Josera - Culinesse Adult (32); Josera - Sensicat Sensitive Adult (30); Monge - Monoprotein Adult Salmon (8); Josera - Josicat Classic Sterilised (6) |
| premium | 8/8 | Josera - Culinesse Adult (8); Josera - Sensicat Sensitive Adult (8) |
| red_flag_blood | 1/1 | None |
| red_flag_collapse | 1/1 | None |
| red_flag_lethargy | 1/1 | None |
| red_flag_not_drinking | 1/1 | None |
| red_flag_not_eating | 3/3 | None |
| red_flag_pain | 1/1 | None |
| red_flag_urinary_blockage | 1/1 | None |
| red_flag_vomiting | 1/1 | None |
| renal | 39/39 | Royal Canin - Vet Diet Cat Renal (38); Monge VetSolution - Renal (36); Royal Canin - Vet Diet Cat Renal Special (2) |
| reproduction | 18/18 | Josera - Culinesse Adult (8); Josera - Sensicat Sensitive Adult (8); ACANA - Grasslands Adult Cat & Kitten (4); ACANA - Pacifica Adult Cat & Kitten (4) |
| rescue | 29/29 | Josera - Culinesse Adult (20); Josera - Sensicat Sensitive Adult (20); ACANA - Grasslands Adult Cat & Kitten (3); ACANA - Pacifica Adult Cat & Kitten (3) |
| senior | 33/33 | Josera - Senior (25); Monge - Senior Rich In Chicken (25); Josera - Josicat Classic Sterilised (5); Monge BWild - Grain Free Sterilised Tuna With Peas (4) |
| sensitive_digestion | 18/18 | Monge VetSolution - Gastrointestinal (15); Farmina - Vet Life Cat Gastrointestinal (14); ACANA - Grasslands Adult Cat & Kitten (2); ACANA - Pacifica Adult Cat & Kitten (2) |
| skin_hairball | 20/20 | Josera - Culinesse Adult (16); Monge BWild - Low Grain Adult Anchovies (16); ACANA - Pacifica Adult Cat & Kitten (1); Monge - Adult Light Turkey (1) |
| sterilised | 25/25 | Josera - Josicat Classic Sterilised (14); Monge BWild - Grain Free Sterilised Tuna With Peas (11); Monge - Adult Light Turkey (3); Monge VetSolution - Urinary Oxalate (3) |
| urinary | 39/39 | Monge VetSolution - Urinary Struvite (28); Monge - Urinary Rich In Chicken (26); Monge VetSolution - Renal (4); Royal Canin - Vet Diet Cat Renal (4) |
| weight_control | 36/36 | Schesir - Cat Sterilized & Light Με Κοτόπουλο (31); Monge - Adult Light Turkey (30); Monge - Urinary Rich In Chicken (3); Monge VetSolution - Urinary Struvite (3) |
| weight_loss | 1/1 | Josera - Culinesse Adult (1); Josera - Sensicat Sensitive Adult (1) |

### Recurring First Picks

- Josera - Culinesse Adult: 202 first-pick appearances
- Monge VetSolution - Renal: 36 first-pick appearances
- ACANA - Grasslands Adult Cat & Kitten: 31 first-pick appearances
- Josera - Sensicat Sensitive Adult: 30 first-pick appearances
- Monge - Adult Light Turkey: 30 first-pick appearances
- Josera - Senior: 25 first-pick appearances
- Monge VetSolution - Urinary Struvite: 25 first-pick appearances
- Farmina - Vet Life Cat Gastrointestinal: 14 first-pick appearances
- Josera - Marinesse Hypoallergenic Adult: 13 first-pick appearances
- Josera - Josicat Classic Sterilised: 10 first-pick appearances

Use this section for qualitative review: repeated first picks can be healthy if they match the scenario, but they can also reveal over-dominant ranking signals.

## Results

### cat-001 - PASS

Prompt: Στειρωμένη γάτα 2 ετών, 4kg, indoor, λατρεύει κοτόπουλο.
Goal: sterilised

Top foods:
- Josera - Josicat Crunchy Chicken
- Schesir - Sterilized Chicken
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - STERILISED Vital Functions Cat Σολομός
- Josera - Indoor Grain Free Sterilised

Warnings:
- None

### cat-002 - PASS

Prompt: Στειρωμένη γάτα 3 ετών, 5kg, indoor, αγαπά σολομό.
Goal: sterilised

Top foods:
- Purina Pro Plan - STERILISED Vital Functions Cat Σολομός
- Josera - Josicat Classic Sterilised
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Josera - Josicat Crunchy Chicken
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-003 - PASS

Prompt: Στειρωμένη γάτα 4 ετών, 6kg, indoor, προτιμά πάπια.
Goal: sterilised

Top foods:
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι
- Josera - Josicat Classic Sterilised
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Purina Pro Plan - STERILISED Vital Functions Cat Σολομός
- Josera - Josicat Crunchy Chicken

Warnings:
- None

### cat-004 - PASS

Prompt: Στειρωμένη γάτα 5 ετών, 4.5kg, αγαπά αρνί.
Goal: sterilised

Top foods:
- N&D - Pumpkin Grain Free Lamb & Blueberry Sterilised
- Josera - Josicat Classic Sterilised
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Purina Pro Plan - STERILISED Vital Functions Cat Σολομός
- Josera - Josicat Crunchy Chicken

Warnings:
- None

### cat-005 - PASS

Prompt: Στειρωμένη γάτα 7 ετών, 5kg, θέλει ψάρι.
Goal: sterilised

Top foods:
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Josera - Josicat Classic Sterilised
- Josera - Indoor Grain Free Sterilised
- Josera - Josicat Crunchy Chicken
- Purina Pro Plan - STERILISED Vital Functions Cat Σολομός

Warnings:
- None

### cat-006 - PASS

Prompt: Στειρωμένη γάτα 8 ετών, 6kg, πολύ ιδιότροπη.
Goal: sterilised

Top foods:
- Josera - Josicat Classic Sterilised
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Josera - Indoor Grain Free Sterilised
- Purina Pro Plan - STERILISED Vital Functions Cat Σολομός
- Josera - Josicat Crunchy Chicken

Warnings:
- None

### cat-007 - PASS

Prompt: Στειρωμένη γάτα 10 ετών, 4kg, θέλει έντονη μυρωδιά τροφής.
Goal: sterilised

Top foods:
- Josera - Josicat Classic Sterilised
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Schesir - Sterilized Chicken
- Purina Pro Plan - STERILISED Vital Functions Cat Σολομός
- Josera - Indoor Grain Free Sterilised

Warnings:
- None

### cat-008 - PASS

Prompt: Στειρωμένη γάτα 12 ετών, 3.5kg, μειωμένη όρεξη.
Goal: sterilised

Top foods:
- Josera - Josicat Classic Sterilised
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Schesir - Sterilized Chicken
- Purina Pro Plan - STERILISED Vital Functions Cat Σολομός
- Josera - Indoor Grain Free Sterilised

Warnings:
- None

### cat-009 - PASS

Prompt: Στειρωμένη γάτα 14 ετών, 4kg, αγαπά τόνο.
Goal: sterilised

Top foods:
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Josera - Josicat Classic Sterilised
- Schesir - Sterilized Chicken
- Purina Pro Plan - STERILISED Vital Functions Cat Σολομός
- Josera - Josicat Crunchy Chicken

Warnings:
- None

### cat-010 - PASS

Prompt: Στειρωμένη γάτα 15 ετών, 3kg, θέλει εύπεπτη τροφή.
Goal: sterilised

Top foods:
- Josera - Josicat Classic Sterilised
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Schesir - Sterilized Chicken
- Purina Pro Plan - STERILISED Vital Functions Cat Σολομός
- Josera - Indoor Grain Free Sterilised

Warnings:
- None

### cat-011 - PASS

Prompt: Γατάκι 2 μηνών, 0.9kg.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-012 - PASS

Prompt: Γατάκι 3 μηνών, 1.4kg.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-013 - PASS

Prompt: Γατάκι 4 μηνών, 2kg.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-014 - PASS

Prompt: Γατάκι 5 μηνών, 2.5kg.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-015 - PASS

Prompt: Γατάκι 6 μηνών, 3kg.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-016 - PASS

Prompt: Γατάκι Maine Coon 4 μηνών.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-017 - PASS

Prompt: Γατάκι Persian 5 μηνών.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-018 - PASS

Prompt: Γατάκι British Shorthair 6 μηνών.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-019 - PASS

Prompt: Γατάκι rescue άγνωστης φυλής.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-020 - PASS

Prompt: Ορφανό γατάκι που απογαλακτίστηκε πρόσφατα.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-021 - PASS

Prompt: Αστείρωτη γάτα 2 ετών, 4kg.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-022 - PASS

Prompt: Αστείρωτη γάτα 3 ετών, outdoor.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-023 - PASS

Prompt: Αστείρωτη γάτα 5 ετών, κυνηγά καθημερινά.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-024 - PASS

Prompt: Αστείρωτη γάτα 6 ετών, τρώει πολύ.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-025 - PASS

Prompt: Αστείρωτη γάτα 7 ετών, προτιμά ψάρι.
Goal: general

Top foods:
- Monge - Monoprotein Adult Salmon
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils
- Monge BWild - Grain Free Adult Salmon With Peas
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies

Warnings:
- None

### cat-026 - PASS

Prompt: Αστείρωτη γάτα 8 ετών, πολύ δραστήρια.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-027 - PASS

Prompt: Αστείρωτη γάτα 9 ετών, θέλει κοτόπουλο.
Goal: general

Top foods:
- Monge - Hairball Rich In Chicken
- Monge - Indoor Rich In Chicken
- Schesir - Chicken With Egg
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-028 - PASS

Prompt: Αστείρωτη γάτα 10 ετών, αγαπά πάπια.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-029 - PASS

Prompt: Αστείρωτη γάτα 11 ετών, προτιμά αρνί.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-030 - PASS

Prompt: Αστείρωτη γάτα 12 ετών, μειωμένη όρεξη.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-031 - PASS

Prompt: Γάτα με ιστορικό στρουβίτη.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-032 - PASS

Prompt: Γάτα με ιστορικό οξαλικών λίθων.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-033 - PASS

Prompt: Γάτα με συχνές ουρολοιμώξεις.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-034 - PASS

Prompt: Αρσενική γάτα με ουρολογική ευαισθησία.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-035 - PASS

Prompt: Στειρωμένος γάτος 6kg με ιστορικό FLUTD.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Oxalate
- Monge VetSolution - Urinary Struvite
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού
- Purina Pro Plan - Veterinary Diets Cat UR Urinary

Warnings:
- None

### cat-036 - PASS

Prompt: Γάτα που πίνει λίγο νερό.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-037 - PASS

Prompt: Γάτα που τρώει μόνο ξηρά.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-038 - PASS

Prompt: Γάτα που αρνείται υγρή τροφή.
Goal: general

Top foods:
- N&D - Quinoa Grain Free Digestion Lamb
- ORIJEN - Regional Red
- ORIJEN - Tundra
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-039 - PASS

Prompt: Γάτα με ουρολογικό και παχυσαρκία.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-040 - PASS

Prompt: Γάτα με ουρολογικό και ευαισθησία στο κοτόπουλο.
Goal: urinary

Top foods:
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-041 - PASS

Prompt: Γάτα με νεφρική ανεπάρκεια IRIS 2.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-042 - PASS

Prompt: Γάτα με νεφρική ανεπάρκεια IRIS 3.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-043 - PASS

Prompt: Γάτα με αυξημένη κρεατινίνη.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-044 - PASS

Prompt: Γάτα με αυξημένη ουρία.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-045 - PASS

Prompt: Senior γάτα με νεφρικό.
Goal: renal

Top foods:
- Royal Canin - Vet Diet Cat Renal Special
- Royal Canin - Vet Diet Cat Renal
- Monge VetSolution - Renal

Warnings:
- None

### cat-046 - PASS

Prompt: Γάτα με νεφρικό και απώλεια βάρους.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-047 - PASS

Prompt: Γάτα με νεφρικό και κακή όρεξη.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-048 - PASS

Prompt: Γάτα με νεφρικό και ουρολογικό.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-049 - PASS

Prompt: Γάτα με νεφρικό και υπέρταση.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-050 - PASS

Prompt: Γάτα με νεφρικό και δυσκοιλιότητα.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-051 - PASS

Prompt: Υπέρβαρη γάτα 7kg.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-052 - PASS

Prompt: Υπέρβαρη γάτα 8kg.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-053 - PASS

Prompt: Υπέρβαρη γάτα 9kg.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-054 - PASS

Prompt: BCS 8/9.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-055 - PASS

Prompt: BCS 9/9.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-056 - PASS

Prompt: Indoor γάτα που δεν κινείται.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-057 - PASS

Prompt: Στειρωμένη γάτα που πεινάει συνέχεια.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-058 - PASS

Prompt: Γάτα που τρώει πολύ γρήγορα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-059 - PASS

Prompt: Γάτα που ζητά φαγητό όλη μέρα.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-060 - PASS

Prompt: Γάτα που χρειάζεται πρόγραμμα απώλειας βάρους.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-061 - PASS

Prompt: Γάτα αλλεργική στο κοτόπουλο.
Goal: allergy

Top foods:
- Purina Pro Plan - Veterinary Diets Cat HA Hypoallergenic
- N&D - Ocean Low Grain Cod, Spelt, Oats & Orange
- Purina Pro Plan Veterinary Diets - Delicate Digestion Γαλοπούλα
- Purina Pro Plan Veterinary Diets - ELEGANT Cat Σολομός
- ORIJEN - 6 Fish

Warnings:
- None

### cat-062 - PASS

Prompt: Γάτα αλλεργική στο ψάρι.
Goal: allergy

Top foods:
- Monge BWild - Low Grain Adult Hare
- Monge - Monoprotein Adult Rabbit
- Josera - Sensicat Sensitive Adult
- Josera - Dailycat Adult Grain Free
- Josera - Senior

Warnings:
- None

### cat-063 - PASS

Prompt: Γάτα αλλεργική στο μοσχάρι.
Goal: allergy

Top foods:
- Schesir - Chicken With Egg
- Josera - Marinesse Hypoallergenic Adult
- Monge BWild - Low Grain Adult Hare
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies

Warnings:
- None

### cat-064 - PASS

Prompt: Γάτα αλλεργική στο αρνί.
Goal: allergy

Top foods:
- Schesir - Chicken With Egg
- Josera - Marinesse Hypoallergenic Adult
- Monge BWild - Low Grain Adult Hare
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-065 - PASS

Prompt: Γάτα αλλεργική στο αυγό.
Goal: allergy

Top foods:
- Josera - Marinesse Hypoallergenic Adult
- Monge - Monoprotein Adult Rabbit
- Monge - Monoprotein Adult Salmon
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-066 - PASS

Prompt: Γάτα αλλεργική στα σιτηρά.
Goal: allergy

Top foods:
- Schesir - Chicken With Egg
- Josera - Marinesse Hypoallergenic Adult
- Monge VetSolution - Dermatosis
- Purina Pro Plan Veterinary Diets - ELEGANT Cat Σολομός
- Purina Pro Plan - Veterinary Diets Cat HA Hypoallergenic

Warnings:
- None

### cat-067 - PASS

Prompt: Γάτα αλλεργική στο καλαμπόκι.
Goal: allergy

Top foods:
- Schesir - Chicken With Egg
- Josera - Marinesse Hypoallergenic Adult
- Monge BWild - Low Grain Adult Hare
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free

Warnings:
- None

### cat-068 - PASS

Prompt: Γάτα με πολλαπλές αλλεργίες.
Goal: allergy

Top foods:
- Josera - Marinesse Hypoallergenic Adult
- Monge BWild - Low Grain Adult Hare
- Monge - Monoprotein Adult Rabbit
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-069 - PASS

Prompt: Γάτα σε elimination diet.
Goal: allergy

Top foods:
- Josera - Marinesse Hypoallergenic Adult
- Monge BWild - Low Grain Adult Hare
- Monge - Monoprotein Adult Rabbit
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-070 - PASS

Prompt: Γάτα με χρόνια φαγούρα.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-071 - PASS

Prompt: Γάτα με τριχοβεζωάρια.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies
- Monge BWild - Low Grain Adult Hare
- Josera - Sensicat Sensitive Adult
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-072 - PASS

Prompt: Μακρύτριχη γάτα με hairballs.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies
- Monge BWild - Low Grain Adult Hare
- Josera - Sensicat Sensitive Adult
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-073 - PASS

Prompt: Persian με συχνά hairballs.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies
- Monge BWild - Low Grain Adult Hare
- Josera - Sensicat Sensitive Adult
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-074 - PASS

Prompt: Maine Coon με hairballs.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies
- Monge BWild - Low Grain Adult Hare
- Josera - Sensicat Sensitive Adult
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-075 - PASS

Prompt: Γάτα που κάνει εμετό τρίχες συχνά.
Goal: sensitive_digestion

Top foods:
- Farmina - Vet Life Cat Gastrointestinal
- Monge VetSolution - Gastrointestinal
- N&D - Quinoa Grain Free Digestion Lamb
- Purina Pro Plan Veterinary Diets - FELINE EN GASTROINTESTINAL Cat
- Purina Pro Plan - Veterinary Diets Cat EN Gastrointestinal

Warnings:
- None

### cat-076 - PASS

Prompt: Γάτα που γλείφεται υπερβολικά.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-077 - PASS

Prompt: Γάτα με θαμπό τρίχωμα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies
- Monge BWild - Low Grain Adult Hare
- Josera - Sensicat Sensitive Adult
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-078 - PASS

Prompt: Γάτα με ξηρό δέρμα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies
- Monge BWild - Low Grain Adult Hare
- Josera - Sensicat Sensitive Adult
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-079 - PASS

Prompt: Γάτα με πιτυρίδα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies
- Monge BWild - Low Grain Adult Hare
- Josera - Naturecat Grain Free Adult
- Josera - Josicat Crunchy Chicken

Warnings:
- None

### cat-080 - PASS

Prompt: Γάτα που χρειάζεται υποστήριξη δέρματος.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies
- Monge BWild - Low Grain Adult Hare
- Josera - Sensicat Sensitive Adult
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-081 - PASS

Prompt: Πολύ ιδιότροπη γάτα που τρώει μόνο τόνο.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-082 - PASS

Prompt: Γάτα που τρώει μόνο σολομό.
Goal: general

Top foods:
- Monge - Monoprotein Adult Salmon
- Monge BWild - Grain Free Adult Salmon With Peas
- Purina Pro Plan Veterinary Diets - ELEGANT Cat Σολομός
- Josera - Culinesse Adult
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-083 - PASS

Prompt: Γάτα που τρώει μόνο κοτόπουλο.
Goal: general

Top foods:
- Monge - Hairball Rich In Chicken
- Monge - Indoor Rich In Chicken
- Schesir - Chicken With Egg
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-084 - PASS

Prompt: Γάτα που τρώει μόνο υγρή τροφή.
Goal: general

Top foods:
- None

Warnings:
- Food V2 returned no visible wet/canned candidates; this is a wet-food data coverage gap.

### cat-085 - PASS

Prompt: Γάτα που τρώει μόνο ξηρά.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-086 - PASS

Prompt: Γάτα που αλλάζει συνεχώς προτιμήσεις.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-087 - PASS

Prompt: Γάτα που βαρέθηκε την τωρινή τροφή.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-088 - PASS

Prompt: Γάτα που τρώει μόνο μικρή κροκέτα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-089 - PASS

Prompt: Γάτα που θέλει έντονη μυρωδιά.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-090 - PASS

Prompt: Γάτα που τρώει μόνο αν ζεστάνω την τροφή.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-091 - PASS

Prompt: Rescue γάτα με άγνωστη ηλικία.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-092 - PASS

Prompt: Rescue γάτα με άγνωστο ιστορικό.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-093 - PASS

Prompt: Rescue γάτα υποσιτισμένη.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-094 - PASS

Prompt: Rescue γάτα πολύ φοβική.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-095 - PASS

Prompt: Rescue γάτα που τρώει λαίμαργα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-096 - PASS

Prompt: Γάτα σε σπίτι με 5 γάτες.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-097 - PASS

Prompt: Γάτα που μοιράζεται την τροφή με άλλη γάτα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-098 - PASS

Prompt: Γάτα σε πολύ ζεστό κλίμα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-099 - PASS

Prompt: Γάτα σε πολύ ψυχρό κλίμα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-100 - PASS

Prompt: Γάτα που θέλει την καλύτερη δυνατή τροφή ανεξαρτήτως κόστους.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-101 - PASS

Prompt: Στειρωμένη γάτα 4kg με χρόνια δυσκοιλιότητα.
Goal: sterilised

Top foods:
- Josera - Josicat Classic Sterilised
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Josera - Indoor Grain Free Sterilised
- Purina Pro Plan - STERILISED Vital Functions Cat Σολομός
- Josera - Josicat Crunchy Chicken

Warnings:
- None

### cat-102 - PASS

Prompt: Στειρωμένη γάτα 5kg με συχνή διάρροια.
Goal: sensitive_digestion

Top foods:
- Monge VetSolution - Gastrointestinal
- Purina Pro Plan Veterinary Diets - Delicate Digestion Γαλοπούλα
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Josera - Josicat Classic Sterilised
- Purina Pro Plan Veterinary Diets - FELINE EN GASTROINTESTINAL Cat

Warnings:
- None

### cat-103 - PASS

Prompt: Γάτα με ευαίσθητο πεπτικό.
Goal: sensitive_digestion

Top foods:
- Farmina - Vet Life Cat Gastrointestinal
- Monge VetSolution - Gastrointestinal
- N&D - Quinoa Grain Free Digestion Lamb
- Purina Pro Plan Veterinary Diets - FELINE EN GASTROINTESTINAL Cat
- Purina Pro Plan - Veterinary Diets Cat EN Gastrointestinal

Warnings:
- None

### cat-104 - PASS

Prompt: Γάτα με IBD.
Goal: sensitive_digestion

Top foods:
- Farmina - Vet Life Cat Gastrointestinal
- Monge VetSolution - Gastrointestinal
- N&D - Quinoa Grain Free Digestion Lamb
- Purina Pro Plan Veterinary Diets - FELINE EN GASTROINTESTINAL Cat
- Purina Pro Plan - Veterinary Diets Cat EN Gastrointestinal

Warnings:
- None

### cat-105 - PASS

Prompt: Γάτα με ιστορικό παγκρεατίτιδας.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-106 - PASS

Prompt: Γάτα με χρόνια γαστρίτιδα.
Goal: sensitive_digestion

Top foods:
- Farmina - Vet Life Cat Gastrointestinal
- Monge VetSolution - Gastrointestinal
- N&D - Quinoa Grain Free Digestion Lamb
- Purina Pro Plan Veterinary Diets - FELINE EN GASTROINTESTINAL Cat
- Purina Pro Plan - Veterinary Diets Cat EN Gastrointestinal

Warnings:
- None

### cat-107 - PASS

Prompt: Γάτα που κάνει εμετούς μετά το φαγητό.
Goal: sensitive_digestion

Top foods:
- Farmina - Vet Life Cat Gastrointestinal
- Monge VetSolution - Gastrointestinal
- N&D - Quinoa Grain Free Digestion Lamb
- Purina Pro Plan Veterinary Diets - FELINE EN GASTROINTESTINAL Cat
- Purina Pro Plan - Veterinary Diets Cat EN Gastrointestinal

Warnings:
- None

### cat-108 - PASS

Prompt: Γάτα που κάνει εμετούς όταν τρώει γρήγορα.
Goal: sensitive_digestion

Top foods:
- Farmina - Vet Life Cat Gastrointestinal
- Monge VetSolution - Gastrointestinal
- N&D - Quinoa Grain Free Digestion Lamb
- Purina Pro Plan Veterinary Diets - FELINE EN GASTROINTESTINAL Cat
- Purina Pro Plan - Veterinary Diets Cat EN Gastrointestinal

Warnings:
- None

### cat-109 - PASS

Prompt: Γάτα με συχνά μαλακά κόπρανα.
Goal: sensitive_digestion

Top foods:
- Farmina - Vet Life Cat Gastrointestinal
- Monge VetSolution - Gastrointestinal
- N&D - Quinoa Grain Free Digestion Lamb
- Purina Pro Plan Veterinary Diets - FELINE EN GASTROINTESTINAL Cat
- Purina Pro Plan - Veterinary Diets Cat EN Gastrointestinal

Warnings:
- None

### cat-110 - PASS

Prompt: Γάτα που χάνει βάρος λόγω πεπτικού.
Goal: sensitive_digestion

Top foods:
- Farmina - Vet Life Cat Gastrointestinal
- Monge VetSolution - Gastrointestinal
- N&D - Quinoa Grain Free Digestion Lamb
- Purina Pro Plan Veterinary Diets - FELINE EN GASTROINTESTINAL Cat
- Purina Pro Plan - Veterinary Diets Cat EN Gastrointestinal

Warnings:
- None

### cat-111 - PASS

Prompt: Maine Coon 8kg, 3 ετών.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-112 - PASS

Prompt: Maine Coon 10kg, στειρωμένος.
Goal: sterilised

Top foods:
- Josera - Josicat Classic Sterilised
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Josera - Indoor Grain Free Sterilised
- Purina Pro Plan - STERILISED Vital Functions Cat Σολομός
- Josera - Josicat Crunchy Chicken

Warnings:
- None

### cat-113 - PASS

Prompt: Persian 5kg, indoor.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-114 - PASS

Prompt: British Shorthair 7kg, στειρωμένη.
Goal: sterilised

Top foods:
- Josera - Josicat Classic Sterilised
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Josera - Indoor Grain Free Sterilised
- Purina Pro Plan - STERILISED Vital Functions Cat Σολομός
- Josera - Josicat Crunchy Chicken

Warnings:
- None

### cat-115 - PASS

Prompt: Bengal 5kg, πολύ δραστήρια.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-116 - PASS

Prompt: Siberian 6kg, μακρύτριχη.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies
- Monge BWild - Low Grain Adult Hare
- Josera - Sensicat Sensitive Adult
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-117 - PASS

Prompt: Norwegian Forest 7kg.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-118 - PASS

Prompt: Ragdoll 8kg.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-119 - PASS

Prompt: Sphynx 4kg με αυξημένες ενεργειακές ανάγκες.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-120 - PASS

Prompt: Scottish Fold 5kg.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-121 - PASS

Prompt: Γάτα με σακχαρώδη διαβήτη.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-122 - PASS

Prompt: Γάτα με προδιαβήτη.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-123 - PASS

Prompt: Γάτα με υπεργλυκαιμία.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-124 - PASS

Prompt: Γάτα με διαβήτη και παχυσαρκία.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-125 - PASS

Prompt: Γάτα με διαβήτη και νεφρικό.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-126 - PASS

Prompt: Γάτα με διαβήτη και ουρολογικό.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-127 - PASS

Prompt: Γάτα με διαβήτη και χαμηλή όρεξη.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-128 - PASS

Prompt: Γάτα με διαβήτη που τρώει μόνο ξηρά.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-129 - PASS

Prompt: Γάτα με διαβήτη που τρώει μόνο υγρή.
Goal: general

Top foods:
- None

Warnings:
- Food V2 returned no visible wet/canned candidates; this is a wet-food data coverage gap.

### cat-130 - PASS

Prompt: Γάτα με διαβήτη και πολλά γεύματα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-131 - PASS

Prompt: Γάτα με καρδιοπάθεια.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-132 - PASS

Prompt: Γάτα με υπερτροφική μυοκαρδιοπάθεια.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-133 - PASS

Prompt: Γάτα με υπέρταση.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-134 - PASS

Prompt: Γάτα με καρδιοπάθεια και νεφρικό.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-135 - PASS

Prompt: Γάτα με χαμηλή μυϊκή μάζα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-136 - PASS

Prompt: Γάτα με απώλεια βάρους.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-137 - PASS

Prompt: Γάτα με κακή φυσική κατάσταση.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-138 - PASS

Prompt: Γάτα μετά από νοσηλεία.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-139 - PASS

Prompt: Γάτα σε ανάρρωση.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-140 - PASS

Prompt: Γάτα που πρέπει να πάρει βάρος.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-141 - PASS

Prompt: Γατάκι 2 μηνών που δεν τρώει εύκολα.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-142 - PASS

Prompt: Γατάκι 3 μηνών με διάρροια.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-143 - PASS

Prompt: Γατάκι 4 μηνών rescue.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-144 - PASS

Prompt: Γατάκι 5 μηνών με χαμηλό βάρος.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-145 - PASS

Prompt: Γατάκι 6 μηνών πολύ δραστήριο.
Goal: growth

Top foods:
- Josera - Kitten
- Josera - Kitten Grain Free
- Purina Pro Plan Veterinary Diets - Kitten Κοτόπουλο
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten

Warnings:
- None

### cat-146 - PASS

Prompt: Γατάκι 7 μηνών που θα στειρωθεί.
Goal: growth

Top foods:
- Royal Canin - Kitten Sterilised
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- ORIJEN - Adult Cat & Kitten

Warnings:
- None

### cat-147 - PASS

Prompt: Γατάκι 8 μηνών στειρωμένο.
Goal: growth

Top foods:
- Royal Canin - Kitten Sterilised
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- ORIJEN - Adult Cat & Kitten

Warnings:
- None

### cat-148 - PASS

Prompt: Γατάκι 9 μηνών με ευαισθησία στο κοτόπουλο.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- ORIJEN - Regional Red Adult Cat & Kitten
- ORIJEN - Six Fish Adult Cat & Kitten

Warnings:
- None

### cat-149 - PASS

Prompt: Γατάκι 10 μηνών με hairballs.
Goal: growth

Top foods:
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- ORIJEN - Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-150 - PASS

Prompt: Γατάκι 11 μηνών με ιδιοτροπίες.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-151 - PASS

Prompt: Indoor γάτα που δεν κινείται καθόλου.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-152 - PASS

Prompt: Indoor γάτα που κοιμάται όλη μέρα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-153 - PASS

Prompt: Indoor γάτα σε μικρό διαμέρισμα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-154 - PASS

Prompt: Indoor γάτα με stress.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-155 - PASS

Prompt: Indoor γάτα με πολλή όρεξη.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-156 - PASS

Prompt: Indoor γάτα που παχαίνει εύκολα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-157 - PASS

Prompt: Indoor γάτα με λίγη άσκηση.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-158 - PASS

Prompt: Indoor γάτα που δεν πίνει αρκετό νερό.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-159 - PASS

Prompt: Indoor γάτα που τρώει μόνο ξηρά.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-160 - PASS

Prompt: Indoor γάτα που χρειάζεται έλεγχο βάρους.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-161 - PASS

Prompt: Outdoor γάτα που κυνηγά καθημερινά.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-162 - PASS

Prompt: Outdoor γάτα που ζει σε αγρόκτημα.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-163 - PASS

Prompt: Outdoor γάτα με υψηλές ενεργειακές ανάγκες.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-164 - PASS

Prompt: Outdoor γάτα που χάνει βάρος τον χειμώνα.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-165 - PASS

Prompt: Outdoor γάτα σε ψυχρό κλίμα.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-166 - PASS

Prompt: Outdoor γάτα σε θερμό κλίμα.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-167 - PASS

Prompt: Outdoor γάτα που τρώει θηράματα.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-168 - PASS

Prompt: Outdoor γάτα που επιστρέφει μόνο για φαγητό.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-169 - PASS

Prompt: Outdoor γάτα με μεγάλη δραστηριότητα.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-170 - PASS

Prompt: Outdoor γάτα που χρειάζεται περισσότερες θερμίδες.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-171 - PASS

Prompt: Γάτα με αλλεργία σε κοτόπουλο και γαλοπούλα.
Goal: allergy

Top foods:
- Purina Pro Plan - Veterinary Diets Cat HA Hypoallergenic
- N&D - Ocean Low Grain Cod, Spelt, Oats & Orange
- Royal Canin - Vet Diet Cat Anallergenic
- Purina Pro Plan Veterinary Diets - ELEGANT Cat Σολομός
- ORIJEN - 6 Fish

Warnings:
- None

### cat-172 - PASS

Prompt: Γάτα με αλλεργία σε ψάρι.
Goal: allergy

Top foods:
- Monge BWild - Low Grain Adult Hare
- Monge - Monoprotein Adult Rabbit
- Josera - Sensicat Sensitive Adult
- Josera - Dailycat Adult Grain Free
- Josera - Senior

Warnings:
- None

### cat-173 - PASS

Prompt: Γάτα με αλλεργία σε σολομό.
Goal: allergy

Top foods:
- Monge BWild - Low Grain Adult Hare
- Monge - Monoprotein Adult Rabbit
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free

Warnings:
- None

### cat-174 - PASS

Prompt: Γάτα με αλλεργία σε τόνο.
Goal: allergy

Top foods:
- Josera - Marinesse Hypoallergenic Adult
- Monge BWild - Low Grain Adult Hare
- Monge - Monoprotein Adult Rabbit
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-175 - PASS

Prompt: Γάτα με αλλεργία στο μοσχάρι.
Goal: allergy

Top foods:
- Schesir - Chicken With Egg
- Josera - Marinesse Hypoallergenic Adult
- Monge BWild - Low Grain Adult Hare
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies

Warnings:
- None

### cat-176 - PASS

Prompt: Γάτα με αλλεργία στο αρνί.
Goal: allergy

Top foods:
- Schesir - Chicken With Egg
- Josera - Marinesse Hypoallergenic Adult
- Monge BWild - Low Grain Adult Hare
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-177 - PASS

Prompt: Γάτα με αλλεργία στο αυγό.
Goal: allergy

Top foods:
- Josera - Marinesse Hypoallergenic Adult
- Monge - Monoprotein Adult Rabbit
- Monge - Monoprotein Adult Salmon
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-178 - PASS

Prompt: Γάτα με αλλεργία στα σιτηρά.
Goal: allergy

Top foods:
- Schesir - Chicken With Egg
- Josera - Marinesse Hypoallergenic Adult
- Monge VetSolution - Dermatosis
- Purina Pro Plan Veterinary Diets - ELEGANT Cat Σολομός
- Purina Pro Plan - Veterinary Diets Cat HA Hypoallergenic

Warnings:
- None

### cat-179 - PASS

Prompt: Γάτα με πολλαπλές τροφικές αλλεργίες.
Goal: allergy

Top foods:
- Josera - Marinesse Hypoallergenic Adult
- Monge BWild - Low Grain Adult Hare
- Monge - Monoprotein Adult Rabbit
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-180 - PASS

Prompt: Γάτα σε υποαλλεργική δίαιτα.
Goal: allergy

Top foods:
- Josera - Marinesse Hypoallergenic Adult
- Monge BWild - Low Grain Adult Hare
- Monge - Monoprotein Adult Rabbit
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-181 - PASS

Prompt: Γάτα που θέλει μόνο τόνο.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-182 - PASS

Prompt: Γάτα που θέλει μόνο σολομό.
Goal: general

Top foods:
- Monge - Monoprotein Adult Salmon
- Monge BWild - Grain Free Adult Salmon With Peas
- Purina Pro Plan Veterinary Diets - ELEGANT Cat Σολομός
- Josera - Culinesse Adult
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-183 - PASS

Prompt: Γάτα που θέλει μόνο κοτόπουλο.
Goal: general

Top foods:
- Monge - Hairball Rich In Chicken
- Monge - Indoor Rich In Chicken
- Schesir - Chicken With Egg
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-184 - PASS

Prompt: Γάτα που θέλει μόνο πάπια.
Goal: general

Top foods:
- N&D - Pumpkin Grain Free Duck
- ORIJEN - Tundra
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies

Warnings:
- None

### cat-185 - PASS

Prompt: Γάτα που θέλει μόνο γαλοπούλα.
Goal: general

Top foods:
- Purina Pro Plan Veterinary Diets - Delicate Digestion Γαλοπούλα
- ORIJEN - Cat & Kitten
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies

Warnings:
- None

### cat-186 - PASS

Prompt: Γάτα που θέλει μόνο αρνί.
Goal: general

Top foods:
- N&D - Quinoa Grain Free Digestion Lamb
- ORIJEN - Regional Red
- ORIJEN - Tundra
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-187 - PASS

Prompt: Γάτα που θέλει μόνο λευκό ψάρι.
Goal: general

Top foods:
- Monge - Monoprotein Adult Salmon
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils
- Monge BWild - Grain Free Adult Salmon With Peas
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies

Warnings:
- None

### cat-188 - PASS

Prompt: Γάτα που αλλάζει γεύση κάθε μήνα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-189 - PASS

Prompt: Γάτα που βαριέται γρήγορα την τροφή.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-190 - PASS

Prompt: Γάτα που θέλει συνεχώς νέα τροφή.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-191 - PASS

Prompt: Γάτα σε σπίτι με 2 γάτες.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-192 - PASS

Prompt: Γάτα σε σπίτι με 4 γάτες.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-193 - PASS

Prompt: Γάτα σε σπίτι με 6 γάτες.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-194 - PASS

Prompt: Γάτα που κλέβει φαγητό από άλλες γάτες.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-195 - PASS

Prompt: Γάτα που δεν προλαβαίνει να φάει.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-196 - PASS

Prompt: Γάτα που τρώει πολύ γρήγορα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-197 - PASS

Prompt: Γάτα που τρώει πολύ αργά.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-198 - PASS

Prompt: Γάτα που φοβάται την ώρα του φαγητού.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-199 - PASS

Prompt: Γάτα rescue με άγνωστο ιστορικό υγείας.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-200 - PASS

Prompt: Γάτα rescue που θέλει μετάβαση σε premium διατροφή.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-201 - PASS

Prompt: Στειρωμένος γάτος 6kg με ιστορικό στρουβίτη.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Oxalate
- Monge VetSolution - Urinary Struvite
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού
- Purina Pro Plan - Veterinary Diets Cat UR Urinary

Warnings:
- None

### cat-202 - PASS

Prompt: Στειρωμένος γάτος 7kg με υποτροπές στρουβίτη.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Oxalate
- Monge VetSolution - Urinary Struvite
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού
- Purina Pro Plan - Veterinary Diets Cat UR Urinary

Warnings:
- None

### cat-203 - PASS

Prompt: Στειρωμένος γάτος 5kg με ιστορικό απόφραξης ουρήθρας.
Goal: urinary

Top foods:
- None

Warnings:
- None

### cat-204 - PASS

Prompt: Γάτος 8kg που είχε ουροκαθετήρα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-205 - PASS

Prompt: Γάτος με FLUTD.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-206 - PASS

Prompt: Γάτος με συχνές ουρολοιμώξεις.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-207 - PASS

Prompt: Γάτος που ουρεί εκτός λεκάνης.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-208 - PASS

Prompt: Γάτος που πίνει λίγο νερό.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-209 - PASS

Prompt: Γάτος που τρώει μόνο ξηρά.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-210 - PASS

Prompt: Γάτος με ουρολογικό και παχυσαρκία.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-211 - PASS

Prompt: Γάτα με οξαλικούς λίθους.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-212 - PASS

Prompt: Γάτα με υποτροπές οξαλικών.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-213 - PASS

Prompt: Γάτα με ουρολογικό και αλλεργία στο κοτόπουλο.
Goal: urinary

Top foods:
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-214 - PASS

Prompt: Γάτα με ουρολογικό και hairballs.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat

Warnings:
- None

### cat-215 - PASS

Prompt: Γάτα με ουρολογικό και stress.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-216 - PASS

Prompt: Γάτα με ουρολογικό και χαμηλή όρεξη.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-217 - PASS

Prompt: Γάτα με ουρολογικό και νεφρικό.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-218 - PASS

Prompt: Γάτα με ουρολογικό και διαβήτη.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-219 - PASS

Prompt: Γάτα με ουρολογικό και senior ηλικία.
Goal: urinary

Top foods:
- Monge - Urinary Rich In Chicken
- N&D - Quinoa Grain Free Urinary Duck
- Monge VetSolution - Urinary Struvite
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-220 - PASS

Prompt: Γάτα με ουρολογικό και δυσκοιλιότητα.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-221 - PASS

Prompt: Γάτα IRIS 1.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-222 - PASS

Prompt: Γάτα IRIS 2.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-223 - PASS

Prompt: Γάτα IRIS 3.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-224 - PASS

Prompt: Γάτα IRIS 4.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-225 - PASS

Prompt: Γάτα με αυξημένη ουρία.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-226 - PASS

Prompt: Γάτα με αυξημένη κρεατινίνη.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-227 - PASS

Prompt: Γάτα με αυξημένο SDMA.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-228 - PASS

Prompt: Γάτα με πρωτεϊνουρία.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-229 - PASS

Prompt: Γάτα με νεφρικό και απώλεια βάρους.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-230 - PASS

Prompt: Γάτα με νεφρικό και κακή όρεξη.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-231 - PASS

Prompt: Γάτα με νεφρικό και υπέρταση.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-232 - PASS

Prompt: Γάτα με νεφρικό και υποκαλιαιμία.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-233 - PASS

Prompt: Γάτα με νεφρικό και ουρολογικό.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-234 - PASS

Prompt: Γάτα με νεφρικό και διαβήτη.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-235 - PASS

Prompt: Γάτα με νεφρικό και obesity.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-236 - PASS

Prompt: Γάτα με νεφρικό και hairballs.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - STERILISED Renal Plus Cat Σολομός
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο

Warnings:
- None

### cat-237 - PASS

Prompt: Γάτα με νεφρικό και αλλεργίες.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-238 - PASS

Prompt: Γάτα με νεφρικό που τρώει μόνο ξηρά.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-239 - PASS

Prompt: Γάτα με νεφρικό που τρώει μόνο υγρή.
Goal: renal

Top foods:
- None

Warnings:
- Food V2 returned no visible wet/canned candidates; this is a wet-food data coverage gap.

### cat-240 - PASS

Prompt: Γάτα με νεφρικό που τρώει ελάχιστα.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-241 - PASS

Prompt: Στειρωμένη γάτα 7kg BCS 8/9.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-242 - PASS

Prompt: Στειρωμένη γάτα 8kg BCS 9/9.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-243 - PASS

Prompt: Indoor γάτα με σοβαρή παχυσαρκία.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-244 - PASS

Prompt: Γάτα που πήρε 2kg μετά τη στείρωση.
Goal: general

Top foods:
- Josera - Josicat Classic Sterilised
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Josera - Indoor Grain Free Sterilised
- Josera - Culinesse Adult
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-245 - PASS

Prompt: Γάτα που ζητά φαγητό όλη μέρα.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-246 - PASS

Prompt: Γάτα που τρώει 10 φορές τη μέρα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-247 - PASS

Prompt: Γάτα που κλέβει φαγητό.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-248 - PASS

Prompt: Γάτα με obesity και ουρολογικό.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-249 - PASS

Prompt: Γάτα με obesity και διαβήτη.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-250 - PASS

Prompt: Γάτα με obesity και αρθρίτιδα.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-251 - PASS

Prompt: Senior γάτα 11 ετών.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-252 - PASS

Prompt: Senior γάτα 12 ετών.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-253 - PASS

Prompt: Senior γάτα 13 ετών.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-254 - PASS

Prompt: Senior γάτα 14 ετών.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-255 - PASS

Prompt: Senior γάτα 15 ετών.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-256 - PASS

Prompt: Senior γάτα 16 ετών.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-257 - PASS

Prompt: Senior γάτα 17 ετών.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-258 - PASS

Prompt: Senior γάτα 18 ετών.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-259 - PASS

Prompt: Senior γάτα με χαμηλή μυϊκή μάζα.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-260 - PASS

Prompt: Senior γάτα με απώλεια βάρους.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-261 - PASS

Prompt: Senior γάτα με άνοια.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-262 - PASS

Prompt: Senior γάτα με κακή όσφρηση.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-263 - PASS

Prompt: Senior γάτα χωρίς δόντια.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-264 - PASS

Prompt: Senior γάτα που τρώει δύσκολα.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-265 - PASS

Prompt: Senior γάτα με νεφρικό.
Goal: renal

Top foods:
- Royal Canin - Vet Diet Cat Renal Special
- Royal Canin - Vet Diet Cat Renal
- Monge VetSolution - Renal

Warnings:
- None

### cat-266 - PASS

Prompt: Senior γάτα με διαβήτη.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-267 - PASS

Prompt: Senior γάτα με υπέρταση.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-268 - PASS

Prompt: Senior γάτα με αρθρίτιδα.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-269 - PASS

Prompt: Senior γάτα με δυσκοιλιότητα.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-270 - PASS

Prompt: Senior γάτα με χαμηλή όρεξη.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-271 - PASS

Prompt: Γάτα με διαβήτη και obesity.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-272 - PASS

Prompt: Γάτα με διαβήτη και νεφρικό.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-273 - PASS

Prompt: Γάτα με διαβήτη και ουρολογικό.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-274 - PASS

Prompt: Γάτα με διαβήτη και senior ηλικία.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-275 - PASS

Prompt: Γάτα με διαβήτη που τρώει μόνο ξηρά.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-276 - PASS

Prompt: Γάτα με διαβήτη που τρώει μόνο υγρή.
Goal: general

Top foods:
- None

Warnings:
- Food V2 returned no visible wet/canned candidates; this is a wet-food data coverage gap.

### cat-277 - PASS

Prompt: Γάτα με διαβήτη και χαμηλό βάρος.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-278 - PASS

Prompt: Γάτα με διαβήτη και υψηλό βάρος.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-279 - PASS

Prompt: Γάτα με διαβήτη και hairballs.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies
- Monge BWild - Low Grain Adult Hare
- Josera - Sensicat Sensitive Adult
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-280 - PASS

Prompt: Γάτα με διαβήτη και αλλεργία.
Goal: allergy

Top foods:
- Josera - Marinesse Hypoallergenic Adult
- Monge BWild - Low Grain Adult Hare
- Monge - Monoprotein Adult Rabbit
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-281 - PASS

Prompt: Γάτα με ηπατική λιπίδωση.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-282 - PASS

Prompt: Γάτα με αυξημένα ηπατικά ένζυμα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-283 - PASS

Prompt: Γάτα με χρόνια ηπατοπάθεια.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-284 - PASS

Prompt: Γάτα με παγκρεατίτιδα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-285 - PASS

Prompt: Γάτα με χρόνια παγκρεατίτιδα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-286 - PASS

Prompt: Γάτα με IBD.
Goal: sensitive_digestion

Top foods:
- Farmina - Vet Life Cat Gastrointestinal
- Monge VetSolution - Gastrointestinal
- N&D - Quinoa Grain Free Digestion Lamb
- Purina Pro Plan Veterinary Diets - FELINE EN GASTROINTESTINAL Cat
- Purina Pro Plan - Veterinary Diets Cat EN Gastrointestinal

Warnings:
- None

### cat-287 - PASS

Prompt: Γάτα με χρόνια διάρροια.
Goal: sensitive_digestion

Top foods:
- Farmina - Vet Life Cat Gastrointestinal
- Monge VetSolution - Gastrointestinal
- N&D - Quinoa Grain Free Digestion Lamb
- Purina Pro Plan Veterinary Diets - FELINE EN GASTROINTESTINAL Cat
- Purina Pro Plan - Veterinary Diets Cat EN Gastrointestinal

Warnings:
- None

### cat-288 - PASS

Prompt: Γάτα με χρόνια δυσκοιλιότητα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-289 - PASS

Prompt: Γάτα με γαστρίτιδα.
Goal: sensitive_digestion

Top foods:
- Farmina - Vet Life Cat Gastrointestinal
- Monge VetSolution - Gastrointestinal
- N&D - Quinoa Grain Free Digestion Lamb
- Purina Pro Plan Veterinary Diets - FELINE EN GASTROINTESTINAL Cat
- Purina Pro Plan - Veterinary Diets Cat EN Gastrointestinal

Warnings:
- None

### cat-290 - PASS

Prompt: Γάτα με ευαίσθητο πεπτικό.
Goal: sensitive_digestion

Top foods:
- Farmina - Vet Life Cat Gastrointestinal
- Monge VetSolution - Gastrointestinal
- N&D - Quinoa Grain Free Digestion Lamb
- Purina Pro Plan Veterinary Diets - FELINE EN GASTROINTESTINAL Cat
- Purina Pro Plan - Veterinary Diets Cat EN Gastrointestinal

Warnings:
- None

### cat-291 - PASS

Prompt: Γάτα με ουρολογικό + νεφρικό + obesity.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-292 - PASS

Prompt: Γάτα με νεφρικό + διαβήτη.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-293 - PASS

Prompt: Γάτα με obesity + hairballs.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-294 - PASS

Prompt: Γάτα με obesity + senior ηλικία.
Goal: weight_control

Top foods:
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Vital Functions Cat Σολομός

Warnings:
- None

### cat-295 - PASS

Prompt: Γάτα με ουρολογικό + αλλεργία στο κοτόπουλο.
Goal: urinary

Top foods:
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-296 - PASS

Prompt: Γάτα με ουρολογικό + picky eater.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-297 - PASS

Prompt: Γάτα με νεφρικό + picky eater.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-298 - PASS

Prompt: Γάτα με διαβήτη + picky eater.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-299 - PASS

Prompt: Γάτα με πολλαπλά προβλήματα υγείας.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-300 - PASS

Prompt: Γάτα με άγνωστο ιστορικό αλλά πολλά συμπτώματα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-301 - PASS

Prompt: Maine Coon 9kg, στειρωμένος, indoor.
Goal: sterilised

Top foods:
- Josera - Josicat Classic Sterilised
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Josera - Indoor Grain Free Sterilised
- Purina Pro Plan - STERILISED Vital Functions Cat Σολομός
- Josera - Josicat Crunchy Chicken

Warnings:
- None

### cat-302 - PASS

Prompt: Maine Coon 11kg, υπέρβαρος.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-303 - PASS

Prompt: Maine Coon 7 μηνών, ανάπτυξη.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-304 - PASS

Prompt: Maine Coon με hairballs.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies
- Monge BWild - Low Grain Adult Hare
- Josera - Sensicat Sensitive Adult
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-305 - PASS

Prompt: Maine Coon με ευαίσθητο στομάχι.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-306 - PASS

Prompt: Persian 5kg, indoor.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-307 - PASS

Prompt: Persian με χρόνια hairballs.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies
- Monge BWild - Low Grain Adult Hare
- Josera - Sensicat Sensitive Adult
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-308 - PASS

Prompt: Persian με δακρύρροια.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-309 - PASS

Prompt: Persian που τρώει μόνο υγρή.
Goal: general

Top foods:
- None

Warnings:
- Food V2 returned no visible wet/canned candidates; this is a wet-food data coverage gap.

### cat-310 - PASS

Prompt: Persian πολύ ιδιότροπη.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-311 - PASS

Prompt: British Shorthair 8kg, στειρωμένος.
Goal: sterilised

Top foods:
- Josera - Josicat Classic Sterilised
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Josera - Indoor Grain Free Sterilised
- Purina Pro Plan - STERILISED Vital Functions Cat Σολομός
- Josera - Josicat Crunchy Chicken

Warnings:
- None

### cat-312 - PASS

Prompt: British Shorthair με obesity.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-313 - PASS

Prompt: British Shorthair που δεν κινείται.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-314 - PASS

Prompt: British Shorthair που τρώει πολύ.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-315 - PASS

Prompt: British Shorthair picky eater.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-316 - PASS

Prompt: Bengal 5kg, πολύ δραστήρια.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-317 - PASS

Prompt: Bengal που θέλει υψηλή πρωτεΐνη.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-318 - PASS

Prompt: Bengal που βγαίνει έξω.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-319 - PASS

Prompt: Bengal με χαμηλό βάρος.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-320 - PASS

Prompt: Bengal με ευαισθησία στο κοτόπουλο.
Goal: allergy

Top foods:
- Purina Pro Plan - Veterinary Diets Cat HA Hypoallergenic
- N&D - Ocean Low Grain Cod, Spelt, Oats & Orange
- Purina Pro Plan Veterinary Diets - Delicate Digestion Γαλοπούλα
- Purina Pro Plan Veterinary Diets - ELEGANT Cat Σολομός
- ORIJEN - 6 Fish

Warnings:
- None

### cat-321 - PASS

Prompt: Ragdoll 8kg, indoor.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-322 - PASS

Prompt: Ragdoll με χαμηλή δραστηριότητα.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-323 - PASS

Prompt: Ragdoll με obesity.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-324 - PASS

Prompt: Ragdoll με hairballs.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies
- Monge BWild - Low Grain Adult Hare
- Josera - Sensicat Sensitive Adult
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-325 - PASS

Prompt: Ragdoll που θέλει ψάρι.
Goal: general

Top foods:
- Monge - Monoprotein Adult Salmon
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils
- Monge BWild - Grain Free Adult Salmon With Peas
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies

Warnings:
- None

### cat-326 - PASS

Prompt: Sphynx 4kg με αυξημένες θερμιδικές ανάγκες.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-327 - PASS

Prompt: Sphynx με ευαίσθητο δέρμα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies
- Monge BWild - Low Grain Adult Hare
- Josera - Sensicat Sensitive Adult
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-328 - PASS

Prompt: Sphynx που πεινάει συνέχεια.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-329 - PASS

Prompt: Sphynx με αλλεργίες.
Goal: allergy

Top foods:
- Josera - Marinesse Hypoallergenic Adult
- Monge BWild - Low Grain Adult Hare
- Monge - Monoprotein Adult Rabbit
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-330 - PASS

Prompt: Sphynx picky eater.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-331 - PASS

Prompt: Norwegian Forest Cat 7kg.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-332 - PASS

Prompt: Norwegian Forest με hairballs.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies
- Monge BWild - Low Grain Adult Hare
- Josera - Sensicat Sensitive Adult
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-333 - PASS

Prompt: Norwegian Forest outdoor.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-334 - PASS

Prompt: Norwegian Forest senior.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-335 - PASS

Prompt: Norwegian Forest με obesity.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-336 - PASS

Prompt: Siberian 6kg.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-337 - PASS

Prompt: Siberian με αλλεργία.
Goal: allergy

Top foods:
- Josera - Marinesse Hypoallergenic Adult
- Monge BWild - Low Grain Adult Hare
- Monge - Monoprotein Adult Rabbit
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-338 - PASS

Prompt: Siberian indoor.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-339 - PASS

Prompt: Siberian outdoor.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-340 - PASS

Prompt: Siberian picky eater.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-341 - PASS

Prompt: Scottish Fold 5kg.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-342 - PASS

Prompt: Scottish Fold με αρθρώσεις.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-343 - PASS

Prompt: Scottish Fold με obesity.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-344 - PASS

Prompt: Scottish Fold με χαμηλή όρεξη.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-345 - PASS

Prompt: Scottish Fold senior.
Goal: senior

Top foods:
- Josera - Senior
- Monge - Senior Rich In Chicken

Warnings:
- None

### cat-346 - PASS

Prompt: Exotic Shorthair 5kg.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-347 - PASS

Prompt: Exotic με hairballs.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies
- Monge BWild - Low Grain Adult Hare
- Josera - Sensicat Sensitive Adult
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-348 - PASS

Prompt: Exotic με ουρολογικό.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-349 - PASS

Prompt: Exotic picky eater.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-350 - PASS

Prompt: Exotic indoor.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-351 - PASS

Prompt: Γάτα που ζει μόνη της.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-352 - PASS

Prompt: Γάτα σε σπίτι με 2 γάτες.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-353 - PASS

Prompt: Γάτα σε σπίτι με 3 γάτες.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-354 - PASS

Prompt: Γάτα σε σπίτι με 5 γάτες.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-355 - PASS

Prompt: Γάτα που τρώει την τροφή των άλλων.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-356 - PASS

Prompt: Γάτα που δεν προλαβαίνει να φάει.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-357 - PASS

Prompt: Γάτα που τρώει κρυφά.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-358 - PASS

Prompt: Γάτα που ζηλεύει τις άλλες.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-359 - PASS

Prompt: Γάτα με stress λόγω άλλων γατών.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-360 - PASS

Prompt: Γάτα που τρώει μόνο όταν είναι μόνη.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-361 - PASS

Prompt: Indoor γάτα σε διαμέρισμα 40τμ.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-362 - PASS

Prompt: Indoor γάτα σε μεγάλο σπίτι.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-363 - PASS

Prompt: Indoor γάτα χωρίς παιχνίδι.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-364 - PASS

Prompt: Indoor γάτα με καθημερινό παιχνίδι.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-365 - PASS

Prompt: Indoor γάτα που κοιμάται 20 ώρες.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-366 - PASS

Prompt: Indoor γάτα με χαμηλή δραστηριότητα.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-367 - PASS

Prompt: Indoor γάτα που παχαίνει.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-368 - PASS

Prompt: Indoor γάτα που δεν πίνει νερό.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-369 - PASS

Prompt: Indoor γάτα που τρώει μόνο ξηρά.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-370 - PASS

Prompt: Indoor γάτα που τρώει μόνο υγρή.
Goal: general

Top foods:
- None

Warnings:
- Food V2 returned no visible wet/canned candidates; this is a wet-food data coverage gap.

### cat-371 - PASS

Prompt: Outdoor γάτα που κυνηγά.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-372 - PASS

Prompt: Outdoor γάτα που τρώει ποντίκια.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-373 - PASS

Prompt: Outdoor γάτα σε χωριό.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-374 - PASS

Prompt: Outdoor γάτα σε πόλη.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-375 - PASS

Prompt: Outdoor γάτα με υψηλές ανάγκες.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-376 - PASS

Prompt: Outdoor γάτα που χάνει βάρος τον χειμώνα.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-377 - PASS

Prompt: Outdoor γάτα που ζει σε νησί.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-378 - PASS

Prompt: Outdoor γάτα σε ψυχρό κλίμα.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-379 - PASS

Prompt: Outdoor γάτα σε θερμό κλίμα.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-380 - PASS

Prompt: Outdoor γάτα που επιστρέφει μόνο για φαγητό.
Goal: general

Top foods:
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult
- Josera - Senior

Warnings:
- None

### cat-381 - PASS

Prompt: Γάτα που θέλει μόνο τόνο.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-382 - PASS

Prompt: Γάτα που θέλει μόνο σολομό.
Goal: general

Top foods:
- Monge - Monoprotein Adult Salmon
- Monge BWild - Grain Free Adult Salmon With Peas
- Purina Pro Plan Veterinary Diets - ELEGANT Cat Σολομός
- Josera - Culinesse Adult
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-383 - PASS

Prompt: Γάτα που θέλει μόνο λευκό ψάρι.
Goal: general

Top foods:
- Monge - Monoprotein Adult Salmon
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils
- Monge BWild - Grain Free Adult Salmon With Peas
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies

Warnings:
- None

### cat-384 - PASS

Prompt: Γάτα που θέλει μόνο κοτόπουλο.
Goal: general

Top foods:
- Monge - Hairball Rich In Chicken
- Monge - Indoor Rich In Chicken
- Schesir - Chicken With Egg
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-385 - PASS

Prompt: Γάτα που θέλει μόνο πάπια.
Goal: general

Top foods:
- N&D - Pumpkin Grain Free Duck
- ORIJEN - Tundra
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies

Warnings:
- None

### cat-386 - PASS

Prompt: Γάτα που θέλει μόνο γαλοπούλα.
Goal: general

Top foods:
- Purina Pro Plan Veterinary Diets - Delicate Digestion Γαλοπούλα
- ORIJEN - Cat & Kitten
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies

Warnings:
- None

### cat-387 - PASS

Prompt: Γάτα που θέλει μόνο αρνί.
Goal: general

Top foods:
- N&D - Quinoa Grain Free Digestion Lamb
- ORIJEN - Regional Red
- ORIJEN - Tundra
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-388 - PASS

Prompt: Γάτα που θέλει μόνο κουνέλι.
Goal: general

Top foods:
- Monge - Monoprotein Adult Rabbit
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free

Warnings:
- None

### cat-389 - PASS

Prompt: Γάτα που αλλάζει γεύση κάθε εβδομάδα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-390 - PASS

Prompt: Γάτα που βαριέται την τροφή.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-391 - PASS

Prompt: Γάτα που πίνει πολύ λίγο νερό.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-392 - PASS

Prompt: Γάτα που πίνει υπερβολικά πολύ νερό.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-393 - PASS

Prompt: Γάτα που τρώει μόνο ξηρά και δεν πίνει.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-394 - PASS

Prompt: Γάτα που τρώει μόνο υγρή.
Goal: general

Top foods:
- None

Warnings:
- Food V2 returned no visible wet/canned candidates; this is a wet-food data coverage gap.

### cat-395 - PASS

Prompt: Γάτα που χρειάζεται καλύτερη ενυδάτωση.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-396 - PASS

Prompt: Γάτα που ζει σε πολύ ζεστό κλίμα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-397 - PASS

Prompt: Γάτα που ζει σε πολύ ψυχρό κλίμα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-398 - PASS

Prompt: Γάτα που ταξιδεύει συχνά.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-399 - PASS

Prompt: Γάτα rescue με stress.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-400 - PASS

Prompt: Γάτα που θέλει την καλύτερη δυνατή τροφή χωρίς περιορισμό κόστους.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-401 - PASS

Prompt: Έγκυος γάτα στον 1ο μήνα κύησης.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-402 - PASS

Prompt: Έγκυος γάτα στον 2ο μήνα κύησης.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-403 - PASS

Prompt: Έγκυος γάτα στον τελευταίο μήνα κύησης.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-404 - PASS

Prompt: Έγκυος γάτα με χαμηλή όρεξη.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-405 - PASS

Prompt: Έγκυος γάτα που χάνει βάρος.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-406 - PASS

Prompt: Έγκυος γάτα με αλλεργία στο κοτόπουλο.
Goal: allergy

Top foods:
- Purina Pro Plan - Veterinary Diets Cat HA Hypoallergenic
- N&D - Ocean Low Grain Cod, Spelt, Oats & Orange
- Purina Pro Plan Veterinary Diets - Delicate Digestion Γαλοπούλα
- Purina Pro Plan Veterinary Diets - ELEGANT Cat Σολομός
- ORIJEN - 6 Fish

Warnings:
- None

### cat-407 - PASS

Prompt: Έγκυος γάτα με ουρολογικό ιστορικό.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-408 - PASS

Prompt: Έγκυος γάτα που τρώει μόνο υγρή.
Goal: general

Top foods:
- None

Warnings:
- Food V2 returned no visible wet/canned candidates; this is a wet-food data coverage gap.

### cat-409 - PASS

Prompt: Έγκυος γάτα που τρώει μόνο ξηρά.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-410 - PASS

Prompt: Έγκυος γάτα rescue.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-411 - PASS

Prompt: Γάτα που θηλάζει 2 γατάκια.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-412 - PASS

Prompt: Γάτα που θηλάζει 4 γατάκια.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-413 - PASS

Prompt: Γάτα που θηλάζει 6 γατάκια.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-414 - PASS

Prompt: Γάτα που θηλάζει 8 γατάκια.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-415 - PASS

Prompt: Γάτα που έχασε βάρος στον θηλασμό.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-416 - PASS

Prompt: Γάτα που πεινάει συνέχεια στον θηλασμό.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-417 - PASS

Prompt: Γάτα που δεν έχει όρεξη μετά τον τοκετό.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-418 - PASS

Prompt: Γάτα που θηλάζει και έχει ουρολογικό.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-419 - PASS

Prompt: Γάτα που θηλάζει και έχει αλλεργίες.
Goal: allergy

Top foods:
- Josera - Marinesse Hypoallergenic Adult
- Monge BWild - Low Grain Adult Hare
- Monge - Monoprotein Adult Rabbit
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-420 - PASS

Prompt: Γάτα μετά τον απογαλακτισμό.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-421 - PASS

Prompt: Γατάκι 6 εβδομάδων.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-422 - PASS

Prompt: Γατάκι 8 εβδομάδων.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-423 - PASS

Prompt: Γατάκι 10 εβδομάδων.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-424 - PASS

Prompt: Γατάκι 12 εβδομάδων.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-425 - PASS

Prompt: Γατάκι που μόλις απογαλακτίστηκε.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-426 - PASS

Prompt: Γατάκι που δεν τρώει εύκολα.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-427 - PASS

Prompt: Γατάκι που κάνει διάρροια.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-428 - PASS

Prompt: Γατάκι rescue.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-429 - PASS

Prompt: Γατάκι με χαμηλό βάρος.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- Josera - Kitten
- Josera - Kitten Grain Free

Warnings:
- None

### cat-430 - PASS

Prompt: Γατάκι πολύ δραστήριο.
Goal: growth

Top foods:
- Josera - Kitten
- Josera - Kitten Grain Free
- Purina Pro Plan Veterinary Diets - Kitten Κοτόπουλο
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten

Warnings:
- None

### cat-431 - PASS

Prompt: Γάτα που άλλαξε τροφή και κάνει διάρροια.
Goal: sensitive_digestion

Top foods:
- Farmina - Vet Life Cat Gastrointestinal
- Monge VetSolution - Gastrointestinal
- N&D - Quinoa Grain Free Digestion Lamb
- Purina Pro Plan Veterinary Diets - FELINE EN GASTROINTESTINAL Cat
- Purina Pro Plan - Veterinary Diets Cat EN Gastrointestinal

Warnings:
- None

### cat-432 - PASS

Prompt: Γάτα που άλλαξε τροφή και κάνει εμετούς.
Goal: sensitive_digestion

Top foods:
- Farmina - Vet Life Cat Gastrointestinal
- Monge VetSolution - Gastrointestinal
- N&D - Quinoa Grain Free Digestion Lamb
- Purina Pro Plan Veterinary Diets - FELINE EN GASTROINTESTINAL Cat
- Purina Pro Plan - Veterinary Diets Cat EN Gastrointestinal

Warnings:
- None

### cat-433 - PASS

Prompt: Γάτα που αρνείται τη νέα τροφή.
Goal: general

Top foods:
- N&D - Quinoa Grain Free Digestion Lamb
- ORIJEN - Regional Red
- ORIJEN - Tundra
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-434 - PASS

Prompt: Γάτα που δέχεται μόνο αργή μετάβαση.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-435 - PASS

Prompt: Γάτα που τρώει παλιά και νέα τροφή μαζί.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-436 - PASS

Prompt: Γάτα που χρειάζεται αλλαγή λόγω obesity.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-437 - PASS

Prompt: Γάτα που χρειάζεται αλλαγή λόγω ουρολογικού.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-438 - PASS

Prompt: Γάτα που χρειάζεται αλλαγή λόγω νεφρικού.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-439 - PASS

Prompt: Γάτα που χρειάζεται αλλαγή λόγω αλλεργίας.
Goal: allergy

Top foods:
- Josera - Marinesse Hypoallergenic Adult
- Monge BWild - Low Grain Adult Hare
- Monge - Monoprotein Adult Rabbit
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-440 - PASS

Prompt: Γάτα που χρειάζεται αλλαγή λόγω ηλικίας.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-441 - PASS

Prompt: Γάτα που δεν τρώει για 24 ώρες.
Goal: general

Top foods:
- None

Warnings:
- None

### cat-442 - PASS

Prompt: Γάτα που δεν τρώει για 48 ώρες.
Goal: general

Top foods:
- None

Warnings:
- None

### cat-443 - PASS

Prompt: Γάτα που κάνει συνεχείς εμετούς.
Goal: sensitive_digestion

Top foods:
- None

Warnings:
- None

### cat-444 - PASS

Prompt: Γάτα με αίμα στα ούρα.
Goal: urinary

Top foods:
- None

Warnings:
- None

### cat-445 - PASS

Prompt: Γάτος που προσπαθεί να ουρήσει και δεν μπορεί.
Goal: urinary

Top foods:
- None

Warnings:
- None

### cat-446 - PASS

Prompt: Γάτα με έντονο πόνο στην κοιλιά.
Goal: general

Top foods:
- None

Warnings:
- None

### cat-447 - PASS

Prompt: Γάτα με ξαφνική απώλεια βάρους.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-448 - PASS

Prompt: Γάτα με λήθαργο και ανορεξία.
Goal: general

Top foods:
- None

Warnings:
- None

### cat-449 - PASS

Prompt: Γάτα που κατέρρευσε.
Goal: general

Top foods:
- None

Warnings:
- None

### cat-450 - PASS

Prompt: Γάτα που δεν πίνει καθόλου νερό.
Goal: general

Top foods:
- None

Warnings:
- None

### cat-451 - PASS

Prompt: Γάτα με obesity + urinary.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-452 - PASS

Prompt: Γάτα με obesity + renal.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-453 - PASS

Prompt: Γάτα με diabetes + renal.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-454 - PASS

Prompt: Γάτα με diabetes + obesity.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-455 - PASS

Prompt: Γάτα με urinary + renal.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-456 - PASS

Prompt: Γάτα με urinary + allergy.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-457 - PASS

Prompt: Γάτα με renal + picky eater.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-458 - PASS

Prompt: Γάτα με obesity + picky eater.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-459 - PASS

Prompt: Γάτα με diabetes + picky eater.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-460 - PASS

Prompt: Γάτα με τρία χρόνια προβλήματα μαζί.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-461 - PASS

Prompt: Γάτα που ζει σε σπίτι με σκύλο.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-462 - PASS

Prompt: Γάτα που τρώει τροφή σκύλου.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-463 - PASS

Prompt: Γάτα που κλέβει τροφή από τον σκύλο.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-464 - PASS

Prompt: Γάτα που φοβάται την ώρα του φαγητού.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-465 - PASS

Prompt: Γάτα που τρώει μόνο μόνη της.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-466 - PASS

Prompt: Γάτα με stress λόγω μετακόμισης.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-467 - PASS

Prompt: Γάτα με stress λόγω νέου μωρού.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-468 - PASS

Prompt: Γάτα με stress λόγω νέας γάτας.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-469 - PASS

Prompt: Γάτα που σταμάτησε να τρώει μετά από αλλαγή περιβάλλοντος.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-470 - PASS

Prompt: Γάτα που τρώει μόνο όταν είναι ήσυχα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-471 - PASS

Prompt: Γάτα με budget 10€/μήνα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-472 - PASS

Prompt: Γάτα με budget 20€/μήνα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-473 - PASS

Prompt: Γάτα με budget 40€/μήνα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-474 - PASS

Prompt: Γάτα χωρίς περιορισμό κόστους.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-475 - PASS

Prompt: Γάτα που θέλει premium τροφή.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-476 - PASS

Prompt: Γάτα που θέλει super premium τροφή.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-477 - PASS

Prompt: Γάτα που θέλει grain free.
Goal: general

Top foods:
- Monge BWild - Low Grain Adult Anchovies
- Monge BWild - Low Grain Adult Hare
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult

Warnings:
- None

### cat-478 - PASS

Prompt: Γάτα που θέλει low grain.
Goal: general

Top foods:
- Monge BWild - Low Grain Adult Anchovies
- Monge BWild - Low Grain Adult Hare
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult
- Josera - Culinesse Adult

Warnings:
- None

### cat-479 - PASS

Prompt: Γάτα που θέλει limited ingredients.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-480 - PASS

Prompt: Γάτα που θέλει μονοπρωτεϊνική τροφή.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-481 - PASS

Prompt: Γάτα που αγαπά μόνο τόνο.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-482 - PASS

Prompt: Γάτα που αγαπά μόνο σολομό.
Goal: general

Top foods:
- Monge - Monoprotein Adult Salmon
- Monge BWild - Grain Free Adult Salmon With Peas
- Purina Pro Plan Veterinary Diets - ELEGANT Cat Σολομός
- Josera - Culinesse Adult
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-483 - PASS

Prompt: Γάτα που αγαπά μόνο κοτόπουλο.
Goal: general

Top foods:
- Monge - Hairball Rich In Chicken
- Monge - Indoor Rich In Chicken
- Schesir - Chicken With Egg
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-484 - PASS

Prompt: Γάτα που αγαπά μόνο πάπια.
Goal: general

Top foods:
- N&D - Pumpkin Grain Free Duck
- ORIJEN - Tundra
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies

Warnings:
- None

### cat-485 - PASS

Prompt: Γάτα που αγαπά μόνο αρνί.
Goal: general

Top foods:
- N&D - Quinoa Grain Free Digestion Lamb
- ORIJEN - Regional Red
- ORIJEN - Tundra
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-486 - PASS

Prompt: Γάτα που αγαπά μόνο γαλοπούλα.
Goal: general

Top foods:
- Purina Pro Plan Veterinary Diets - Delicate Digestion Γαλοπούλα
- ORIJEN - Cat & Kitten
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies

Warnings:
- None

### cat-487 - PASS

Prompt: Γάτα που αγαπά μόνο κουνέλι.
Goal: general

Top foods:
- Monge - Monoprotein Adult Rabbit
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free

Warnings:
- None

### cat-488 - PASS

Prompt: Γάτα που αγαπά μόνο λευκό ψάρι.
Goal: general

Top foods:
- Monge - Monoprotein Adult Salmon
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils
- Monge BWild - Grain Free Adult Salmon With Peas
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies

Warnings:
- None

### cat-489 - PASS

Prompt: Γάτα που αλλάζει γεύση κάθε μήνα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-490 - PASS

Prompt: Γάτα που θέλει πολύ έντονη μυρωδιά τροφής.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-491 - PASS

Prompt: Rescue γάτα με άγνωστο ιστορικό.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-492 - PASS

Prompt: Rescue γάτα υποσιτισμένη.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-493 - PASS

Prompt: Rescue γάτα με obesity.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι

Warnings:
- None

### cat-494 - PASS

Prompt: Rescue γάτα με ουρολογικό.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Struvite
- Monge - Urinary Rich In Chicken
- Monge VetSolution - Urinary Oxalate
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού

Warnings:
- None

### cat-495 - PASS

Prompt: Rescue γάτα με νεφρικό.
Goal: renal

Top foods:
- Monge VetSolution - Renal
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Purina Pro Plan - Adult Renal Plus Cat Κοτόπουλο
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι

Warnings:
- None

### cat-496 - PASS

Prompt: Rescue γάτα με αλλεργίες.
Goal: allergy

Top foods:
- Josera - Marinesse Hypoallergenic Adult
- Monge BWild - Low Grain Adult Hare
- Monge - Monoprotein Adult Rabbit
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult

Warnings:
- None

### cat-497 - PASS

Prompt: Rescue γάτα που τρώει μόνο υγρή.
Goal: general

Top foods:
- None

Warnings:
- Food V2 returned no visible wet/canned candidates; this is a wet-food data coverage gap.

### cat-498 - PASS

Prompt: Rescue γάτα που τρώει μόνο ξηρά.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-499 - PASS

Prompt: Rescue γάτα με έντονο stress.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None

### cat-500 - PASS

Prompt: Rescue γάτα που θέλει πλήρη μετάβαση σε premium διατροφή.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Josera - Sensicat Sensitive Adult
- Monge BWild - Low Grain Adult Anchovies
- Josera - Dailycat Adult Grain Free
- Josera - Naturecat Grain Free Adult

Warnings:
- None
