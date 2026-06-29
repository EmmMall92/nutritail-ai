# Cat Chatbot Live Cases 001-100

Site: https://nutritail.ai
Run date: 2026-06-29T23:35:18.688Z
OpenAI extraction: skipped
Result: 100/100 passed, 0 review
Prompt encoding repairs applied: 0
Prompt encoding issues after repair: 0

This QA checks the live Food V2 recommendation endpoint with cat scenarios from `data/evals/chatbot-extra-cases-cat-001-100.json`.
It focuses on species safety, empty shortlists, and major nutrition-direction mismatches for urinary, renal, kitten, senior, sterilised, weight-control, and allergy scenarios.

## Executive Summary

### Goal Coverage

| Goal | Pass rate | Most common first picks |
| --- | ---: | --- |
| allergy | 10/10 | Josera - Marinesse Hypoallergenic Adult (8); Monge - Monoprotein Sterilised Duck (1); Purina Pro Plan - Veterinary Diets Cat HA Hypoallergenic (1) |
| general | 39/39 | Josera - Culinesse Adult (33); Monge - Indoor Rich In Chicken (2); Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils (1) |
| growth | 12/12 | ACANA - Grasslands Adult Cat & Kitten (10); ACANA - Pacifica Adult Cat & Kitten (2) |
| renal | 10/10 | Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι (9); Royal Canin - Vet Diet Cat Renal Special (1) |
| senior | 3/3 | Royal Canin - Ageing Sterilised 11+ (3) |
| sterilised | 10/10 | Josera - Josicat Classic Sterilised (4); Monge BWild - Grain Free Sterilised Tuna With Peas (2); Josera - Josicat Crunchy Chicken (1) |
| urinary | 8/8 | Monge VetSolution - Urinary Oxalate (7); Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat Ψάρια Ωκεανού (1) |
| weight_control | 8/8 | Monge - Adult Light Turkey (8) |

### Signal Coverage

| Signal | Pass rate | Common top-2 foods |
| --- | ---: | --- |
| active | 10/10 | Josera - Culinesse Adult (6); Monge BWild - Low Grain Adult Anchovies (5); Monge - Senior Rich In Chicken (3); Royal Canin - Ageing Sterilised 11+ (3) |
| allergy | 12/12 | Josera - Marinesse Hypoallergenic Adult (8); Monge BWild - Grain Free Sterilised Tuna With Peas (7); Monge - Monoprotein Sterilised Duck (1); Monge BWild - Low Grain Adult Hare (1) |
| environment | 4/4 | Josera - Culinesse Adult (4); Monge BWild - Grain Free Sterilised Tuna With Peas (4) |
| general_recommendation | 3/3 | Josera - Culinesse Adult (3); Monge BWild - Grain Free Sterilised Tuna With Peas (3) |
| kitten_growth | 12/12 | ACANA - Pacifica Adult Cat & Kitten (12); ACANA - Grasslands Adult Cat & Kitten (10); ORIJEN - Tundra Adult Cat & Kitten (2) |
| preference | 28/28 | Monge BWild - Grain Free Sterilised Tuna With Peas (14); Josera - Culinesse Adult (11); Josera - Josicat Classic Sterilised (7); Monge - Indoor Rich In Chicken (2) |
| renal | 10/10 | Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι (9); Purina Pro Plan - STERILISED Renal Plus Cat Σολομός (9); Royal Canin - Vet Diet Cat Renal (1); Royal Canin - Vet Diet Cat Renal Special (1) |
| rescue | 6/6 | Josera - Culinesse Adult (5); Monge BWild - Grain Free Sterilised Tuna With Peas (5); ACANA - Grasslands Adult Cat & Kitten (1); ACANA - Pacifica Adult Cat & Kitten (1) |
| senior | 8/8 | Josera - Josicat Classic Sterilised (4); Monge BWild - Grain Free Sterilised Tuna With Peas (4); Monge - Senior Rich In Chicken (3); Royal Canin - Ageing Sterilised 11+ (3) |
| skin_hairball | 10/10 | Josera - Culinesse Adult (8); Monge BWild - Grain Free Sterilised Tuna With Peas (8); ACANA - Pacifica Adult Cat & Kitten (2); ORIJEN - Tundra Adult Cat & Kitten (2) |
| sterilised | 12/12 | Josera - Josicat Classic Sterilised (9); Monge BWild - Grain Free Sterilised Tuna With Peas (6); Josera - Josicat Crunchy Chicken (1); Monge - Adult Light Turkey (1) |
| urinary | 9/9 | Monge VetSolution - Urinary Oxalate (7); Monge VetSolution - Urinary Struvite (7); Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι (1); Purina Pro Plan - STERILISED Renal Plus Cat Σολομός (1) |
| weight_control | 9/9 | Monge - Adult Light Turkey (8); Schesir - Cat Sterilized & Light Με Κοτόπουλο (8); Monge VetSolution - Urinary Oxalate (1); Monge VetSolution - Urinary Struvite (1) |

### Recurring First Picks

- Josera - Culinesse Adult: 33 first-pick appearances
- ACANA - Grasslands Adult Cat & Kitten: 10 first-pick appearances
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι: 9 first-pick appearances
- Josera - Marinesse Hypoallergenic Adult: 8 first-pick appearances
- Monge - Adult Light Turkey: 8 first-pick appearances
- Monge VetSolution - Urinary Oxalate: 7 first-pick appearances
- Josera - Josicat Classic Sterilised: 4 first-pick appearances

Use this section for qualitative review: repeated first picks can be healthy if they match the scenario, but they can also reveal over-dominant ranking signals.

## Results

### cat-001 - PASS

Prompt: Στειρωμένη γάτα 2 ετών, 4kg, indoor, λατρεύει κοτόπουλο.
Goal: sterilised

Top foods:
- Josera - Josicat Crunchy Chicken
- Schesir - Sterilized Chicken
- Josera - Josicat Classic Sterilised

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

Warnings:
- None

### cat-003 - PASS

Prompt: Στειρωμένη γάτα 4 ετών, 6kg, indoor, προτιμά πάπια.
Goal: sterilised

Top foods:
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι
- Josera - Josicat Classic Sterilised
- Monge BWild - Grain Free Sterilised Tuna With Peas
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

Warnings:
- None

### cat-006 - PASS

Prompt: Στειρωμένη γάτα 8 ετών, 6kg, πολύ ιδιότροπη.
Goal: sterilised

Top foods:
- Josera - Josicat Classic Sterilised
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Josera - Indoor Grain Free Sterilised
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

Warnings:
- None

### cat-008 - PASS

Prompt: Στειρωμένη γάτα 12 ετών, 3.5kg, μειωμένη όρεξη.
Goal: sterilised

Top foods:
- Josera - Josicat Classic Sterilised
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Schesir - Sterilized Chicken

Warnings:
- None

### cat-009 - PASS

Prompt: Στειρωμένη γάτα 14 ετών, 4kg, αγαπά τόνο.
Goal: sterilised

Top foods:
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Josera - Josicat Classic Sterilised
- Schesir - Sterilized Chicken

Warnings:
- None

### cat-010 - PASS

Prompt: Στειρωμένη γάτα 15 ετών, 3kg, θέλει εύπεπτη τροφή.
Goal: sterilised

Top foods:
- Josera - Josicat Classic Sterilised
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Schesir - Sterilized Chicken

Warnings:
- None

### cat-011 - PASS

Prompt: Γατάκι 2 μηνών, 0.9kg.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten

Warnings:
- None

### cat-012 - PASS

Prompt: Γατάκι 3 μηνών, 1.4kg.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten

Warnings:
- None

### cat-013 - PASS

Prompt: Γατάκι 4 μηνών, 2kg.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten

Warnings:
- None

### cat-014 - PASS

Prompt: Γατάκι 5 μηνών, 2.5kg.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten

Warnings:
- None

### cat-015 - PASS

Prompt: Γατάκι 6 μηνών, 3kg.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten

Warnings:
- None

### cat-016 - PASS

Prompt: Γατάκι Maine Coon 4 μηνών.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten

Warnings:
- None

### cat-017 - PASS

Prompt: Γατάκι Persian 5 μηνών.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten

Warnings:
- None

### cat-018 - PASS

Prompt: Γατάκι British Shorthair 6 μηνών.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten

Warnings:
- None

### cat-019 - PASS

Prompt: Γατάκι rescue άγνωστης φυλής.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten

Warnings:
- None

### cat-020 - PASS

Prompt: Ορφανό γατάκι που απογαλακτίστηκε πρόσφατα.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten

Warnings:
- None

### cat-021 - PASS

Prompt: Αστείρωτη γάτα 2 ετών, 4kg.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies
- Monge - Indoor Rich In Chicken

Warnings:
- None

### cat-022 - PASS

Prompt: Αστείρωτη γάτα 3 ετών, outdoor.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies
- Monge - Indoor Rich In Chicken

Warnings:
- None

### cat-023 - PASS

Prompt: Αστείρωτη γάτα 5 ετών, κυνηγά καθημερινά.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies
- Monge - Indoor Rich In Chicken

Warnings:
- None

### cat-024 - PASS

Prompt: Αστείρωτη γάτα 6 ετών, τρώει πολύ.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies
- Monge - Indoor Rich In Chicken

Warnings:
- None

### cat-025 - PASS

Prompt: Αστείρωτη γάτα 7 ετών, προτιμά ψάρι.
Goal: general

Top foods:
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils
- Monge BWild - Grain Free Adult Salmon With Peas
- Josera - Culinesse Adult

Warnings:
- None

### cat-026 - PASS

Prompt: Αστείρωτη γάτα 8 ετών, πολύ δραστήρια.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Low Grain Adult Anchovies
- Monge - Indoor Rich In Chicken

Warnings:
- None

### cat-027 - PASS

Prompt: Αστείρωτη γάτα 9 ετών, θέλει κοτόπουλο.
Goal: general

Top foods:
- Monge - Indoor Rich In Chicken
- Josera - Culinesse Adult
- Schesir - Chicken With Egg

Warnings:
- None

### cat-028 - PASS

Prompt: Αστείρωτη γάτα 10 ετών, αγαπά πάπια.
Goal: senior

Top foods:
- Royal Canin - Ageing Sterilised 11+
- Monge - Senior Rich In Chicken
- Josera - Senior

Warnings:
- None

### cat-029 - PASS

Prompt: Αστείρωτη γάτα 11 ετών, προτιμά αρνί.
Goal: senior

Top foods:
- Royal Canin - Ageing Sterilised 11+
- Monge - Senior Rich In Chicken
- Josera - Senior

Warnings:
- None

### cat-030 - PASS

Prompt: Αστείρωτη γάτα 12 ετών, μειωμένη όρεξη.
Goal: senior

Top foods:
- Royal Canin - Ageing Sterilised 11+
- Monge - Senior Rich In Chicken
- Josera - Senior

Warnings:
- None

### cat-031 - PASS

Prompt: Γάτα με ιστορικό στρουβίτη.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Oxalate
- Monge VetSolution - Urinary Struvite
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat

Warnings:
- None

### cat-032 - PASS

Prompt: Γάτα με ιστορικό οξαλικών λίθων.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Oxalate
- Monge VetSolution - Urinary Struvite
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat

Warnings:
- None

### cat-033 - PASS

Prompt: Γάτα με συχνές ουρολοιμώξεις.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Oxalate
- Monge VetSolution - Urinary Struvite
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat

Warnings:
- None

### cat-034 - PASS

Prompt: Αρσενική γάτα με ουρολογική ευαισθησία.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Oxalate
- Monge VetSolution - Urinary Struvite
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat

Warnings:
- None

### cat-035 - PASS

Prompt: Στειρωμένος γάτος 6kg με ιστορικό FLUTD.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Oxalate
- Monge VetSolution - Urinary Struvite
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat

Warnings:
- None

### cat-036 - PASS

Prompt: Γάτα που πίνει λίγο νερό.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Oxalate
- Monge VetSolution - Urinary Struvite
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat

Warnings:
- None

### cat-037 - PASS

Prompt: Γάτα που τρώει μόνο ξηρά.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

Warnings:
- None

### cat-038 - PASS

Prompt: Γάτα που αρνείται υγρή τροφή.
Goal: general

Top foods:
- N&D - Pumpkin Grain Free Lamb & Blueberry Sterilised
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas

Warnings:
- None

### cat-039 - PASS

Prompt: Γάτα με ουρολογικό και παχυσαρκία.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Oxalate
- Monge VetSolution - Urinary Struvite
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat

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
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι
- Purina Pro Plan - STERILISED Renal Plus Cat Σολομός
- Purina Pro Plan Veterinary Diets - STERILISED Renal Plus Cat Γαλοπούλα

Warnings:
- None

### cat-042 - PASS

Prompt: Γάτα με νεφρική ανεπάρκεια IRIS 3.
Goal: renal

Top foods:
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι
- Purina Pro Plan - STERILISED Renal Plus Cat Σολομός
- Purina Pro Plan Veterinary Diets - STERILISED Renal Plus Cat Γαλοπούλα

Warnings:
- None

### cat-043 - PASS

Prompt: Γάτα με αυξημένη κρεατινίνη.
Goal: renal

Top foods:
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι
- Purina Pro Plan - STERILISED Renal Plus Cat Σολομός
- Purina Pro Plan Veterinary Diets - STERILISED Renal Plus Cat Γαλοπούλα

Warnings:
- None

### cat-044 - PASS

Prompt: Γάτα με αυξημένη ουρία.
Goal: renal

Top foods:
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι
- Purina Pro Plan - STERILISED Renal Plus Cat Σολομός
- Purina Pro Plan Veterinary Diets - STERILISED Renal Plus Cat Γαλοπούλα

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
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι
- Purina Pro Plan - STERILISED Renal Plus Cat Σολομός
- Purina Pro Plan Veterinary Diets - STERILISED Renal Plus Cat Γαλοπούλα

Warnings:
- None

### cat-047 - PASS

Prompt: Γάτα με νεφρικό και κακή όρεξη.
Goal: renal

Top foods:
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι
- Purina Pro Plan - STERILISED Renal Plus Cat Σολομός
- Purina Pro Plan Veterinary Diets - STERILISED Renal Plus Cat Γαλοπούλα

Warnings:
- None

### cat-048 - PASS

Prompt: Γάτα με νεφρικό και ουρολογικό.
Goal: renal

Top foods:
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι
- Purina Pro Plan - STERILISED Renal Plus Cat Σολομός
- Purina Pro Plan Veterinary Diets - STERILISED Renal Plus Cat Γαλοπούλα

Warnings:
- None

### cat-049 - PASS

Prompt: Γάτα με νεφρικό και υπέρταση.
Goal: renal

Top foods:
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι
- Purina Pro Plan - STERILISED Renal Plus Cat Σολομός
- Purina Pro Plan Veterinary Diets - STERILISED Renal Plus Cat Γαλοπούλα

Warnings:
- None

### cat-050 - PASS

Prompt: Γάτα με νεφρικό και δυσκοιλιότητα.
Goal: renal

Top foods:
- Purina Pro Plan - STERILISED Renal Plus Cat Κουνέλι
- Purina Pro Plan - STERILISED Renal Plus Cat Σολομός
- Purina Pro Plan Veterinary Diets - STERILISED Renal Plus Cat Γαλοπούλα

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

Warnings:
- None

### cat-056 - PASS

Prompt: Indoor γάτα που δεν κινείται.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

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

Warnings:
- None

### cat-058 - PASS

Prompt: Γάτα που τρώει πολύ γρήγορα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

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

Warnings:
- None

### cat-061 - PASS

Prompt: Γάτα αλλεργική στο κοτόπουλο.
Goal: allergy

Top foods:
- Purina Pro Plan - Veterinary Diets Cat HA Hypoallergenic
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι
- Purina Pro Plan - STERILISED Vital Functions Cat Σολομός

Warnings:
- None

### cat-062 - PASS

Prompt: Γάτα αλλεργική στο ψάρι.
Goal: allergy

Top foods:
- Monge - Monoprotein Sterilised Duck
- Monge BWild - Low Grain Adult Hare
- Monge - Monoprotein Adult Rabbit

Warnings:
- None

### cat-063 - PASS

Prompt: Γάτα αλλεργική στο μοσχάρι.
Goal: allergy

Top foods:
- Josera - Marinesse Hypoallergenic Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

Warnings:
- None

### cat-064 - PASS

Prompt: Γάτα αλλεργική στο αρνί.
Goal: allergy

Top foods:
- Josera - Marinesse Hypoallergenic Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils
- Josera - Culinesse Adult

Warnings:
- None

### cat-065 - PASS

Prompt: Γάτα αλλεργική στο αυγό.
Goal: allergy

Top foods:
- Josera - Marinesse Hypoallergenic Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils
- Josera - Culinesse Adult

Warnings:
- None

### cat-066 - PASS

Prompt: Γάτα αλλεργική στα σιτηρά.
Goal: allergy

Top foods:
- Josera - Marinesse Hypoallergenic Adult
- Schesir - Chicken With Egg
- Monge VetSolution - Dermatosis

Warnings:
- None

### cat-067 - PASS

Prompt: Γάτα αλλεργική στο καλαμπόκι.
Goal: allergy

Top foods:
- Josera - Marinesse Hypoallergenic Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

Warnings:
- None

### cat-068 - PASS

Prompt: Γάτα με πολλαπλές αλλεργίες.
Goal: allergy

Top foods:
- Josera - Marinesse Hypoallergenic Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils
- Josera - Culinesse Adult

Warnings:
- None

### cat-069 - PASS

Prompt: Γάτα σε elimination diet.
Goal: allergy

Top foods:
- Josera - Marinesse Hypoallergenic Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils
- Josera - Culinesse Adult

Warnings:
- None

### cat-070 - PASS

Prompt: Γάτα με χρόνια φαγούρα.
Goal: allergy

Top foods:
- Josera - Marinesse Hypoallergenic Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils
- Josera - Culinesse Adult

Warnings:
- None

### cat-071 - PASS

Prompt: Γάτα με τριχοβεζωάρια.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils
- Monge BWild - Low Grain Adult Anchovies
- Josera - Josicat Crunchy Chicken

Warnings:
- None

### cat-072 - PASS

Prompt: Μακρύτριχη γάτα με hairballs.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils
- Monge BWild - Low Grain Adult Anchovies
- Josera - Josicat Crunchy Chicken

Warnings:
- None

### cat-073 - PASS

Prompt: Persian με συχνά hairballs.
Goal: growth

Top foods:
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- ORIJEN - Adult Cat & Kitten

Warnings:
- None

### cat-074 - PASS

Prompt: Maine Coon με hairballs.
Goal: growth

Top foods:
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten
- ORIJEN - Adult Cat & Kitten

Warnings:
- None

### cat-075 - PASS

Prompt: Γάτα που κάνει εμετό τρίχες συχνά.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils
- Monge BWild - Low Grain Adult Anchovies
- Josera - Josicat Crunchy Chicken

Warnings:
- None

### cat-076 - PASS

Prompt: Γάτα που γλείφεται υπερβολικά.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils
- Monge BWild - Low Grain Adult Anchovies
- Josera - Josicat Crunchy Chicken

Warnings:
- None

### cat-077 - PASS

Prompt: Γάτα με θαμπό τρίχωμα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils
- Monge BWild - Low Grain Adult Anchovies
- Josera - Josicat Crunchy Chicken

Warnings:
- None

### cat-078 - PASS

Prompt: Γάτα με ξηρό δέρμα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils
- Monge BWild - Low Grain Adult Anchovies
- Josera - Josicat Crunchy Chicken

Warnings:
- None

### cat-079 - PASS

Prompt: Γάτα με πιτυρίδα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

Warnings:
- None

### cat-080 - PASS

Prompt: Γάτα που χρειάζεται υποστήριξη δέρματος.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils
- Monge BWild - Low Grain Adult Anchovies
- Josera - Josicat Crunchy Chicken

Warnings:
- None

### cat-081 - PASS

Prompt: Πολύ ιδιότροπη γάτα που τρώει μόνο τόνο.
Goal: general

Top foods:
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Josera - Culinesse Adult
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

Warnings:
- None

### cat-082 - PASS

Prompt: Γάτα που τρώει μόνο σολομό.
Goal: general

Top foods:
- Monge BWild - Grain Free Adult Salmon With Peas
- Purina Pro Plan - STERILISED Vital Functions Cat Σολομός
- Josera - Culinesse Adult

Warnings:
- None

### cat-083 - PASS

Prompt: Γάτα που τρώει μόνο κοτόπουλο.
Goal: general

Top foods:
- Monge - Indoor Rich In Chicken
- Schesir - Sterilized Chicken
- Josera - Culinesse Adult
- Josera - Josicat Crunchy Chicken
- Monge BWild - Low Grain Adult Anchovies

Warnings:
- None

### cat-084 - PASS

Prompt: Γάτα που τρώει μόνο υγρή τροφή.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

Warnings:
- None

### cat-085 - PASS

Prompt: Γάτα που τρώει μόνο ξηρά και είναι πολύ ιδιότροπη.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

Warnings:
- None

### cat-086 - PASS

Prompt: Γάτα που αλλάζει συνεχώς προτιμήσεις.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

Warnings:
- None

### cat-087 - PASS

Prompt: Γάτα που βαρέθηκε την τωρινή τροφή.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

Warnings:
- None

### cat-088 - PASS

Prompt: Γάτα που τρώει μόνο μικρή κροκέτα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

Warnings:
- None

### cat-089 - PASS

Prompt: Γάτα που θέλει έντονη μυρωδιά.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

Warnings:
- None

### cat-090 - PASS

Prompt: Γάτα που τρώει μόνο αν ζεστάνω την τροφή.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

Warnings:
- None

### cat-091 - PASS

Prompt: Rescue γάτα με άγνωστη ηλικία.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

Warnings:
- None

### cat-092 - PASS

Prompt: Rescue γάτα με άγνωστο ιστορικό.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

Warnings:
- None

### cat-093 - PASS

Prompt: Rescue γάτα υποσιτισμένη.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

Warnings:
- None

### cat-094 - PASS

Prompt: Rescue γάτα πολύ φοβική.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

Warnings:
- None

### cat-095 - PASS

Prompt: Rescue γάτα που τρώει λαίμαργα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

Warnings:
- None

### cat-096 - PASS

Prompt: Γάτα σε σπίτι με 5 γάτες.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

Warnings:
- None

### cat-097 - PASS

Prompt: Γάτα που μοιράζεται την τροφή με άλλη γάτα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

Warnings:
- None

### cat-098 - PASS

Prompt: Γάτα σε πολύ ζεστό κλίμα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

Warnings:
- None

### cat-099 - PASS

Prompt: Γάτα σε πολύ ψυχρό κλίμα.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

Warnings:
- None

### cat-100 - PASS

Prompt: Γάτα που θέλει την καλύτερη δυνατή τροφή ανεξαρτήτως κόστους.
Goal: general

Top foods:
- Josera - Culinesse Adult
- Monge BWild - Grain Free Sterilised Tuna With Peas
- Monge BWild - Grain Free Adult Codfish With Potatoes And Lentils

Warnings:
- None
