# Cat Chatbot Live Cases 001-010

Site: https://nutritail.ai
Run date: 2026-06-30T13:55:54.943Z
OpenAI extraction: skipped
Result: 10/10 passed, 0 review
Prompt encoding repairs applied: 0
Prompt encoding issues after repair: 0

This QA checks the live Food V2 recommendation endpoint with cat scenarios from `data/evals/chatbot-cat-quality-live.json`.
It focuses on species safety, empty shortlists, and major nutrition-direction mismatches for urinary, renal, kitten, senior, sterilised, weight-control, and allergy scenarios.

## Executive Summary

### Goal Coverage

| Goal | Pass rate | Most common first picks |
| --- | ---: | --- |
| allergy | 1/1 | Purina Pro Plan - Veterinary Diets Cat HA Hypoallergenic (1) |
| growth | 1/1 | ACANA - Grasslands Adult Cat & Kitten (1) |
| renal | 1/1 | Royal Canin - Vet Diet Cat Renal Special (1) |
| senior | 1/1 | Royal Canin - Ageing Sterilised 11+ (1) |
| sensitive_digestion | 1/1 | Royal Canin - Vet Diet Cat Renal (1) |
| urinary | 2/2 | Monge VetSolution - Urinary Oxalate (2) |
| weight_control | 3/3 | Monge - Adult Light Turkey (3) |

### Signal Coverage

| Signal | Pass rate | Common top-2 foods |
| --- | ---: | --- |
| allergy | 1/1 | Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι (1); Purina Pro Plan - Veterinary Diets Cat HA Hypoallergenic (1) |
| kitten_growth | 1/1 | ACANA - Grasslands Adult Cat & Kitten (1); ACANA - Pacifica Adult Cat & Kitten (1) |
| preference | 1/1 | Josera - Josicat Classic Sterilised (1); Monge - Adult Light Turkey (1) |
| renal | 1/1 | Royal Canin - Vet Diet Cat Renal (1); Royal Canin - Vet Diet Cat Renal Special (1) |
| senior | 2/2 | Monge - Senior Rich In Chicken (1); Royal Canin - Ageing Sterilised 11+ (1); Royal Canin - Vet Diet Cat Renal (1); Royal Canin - Vet Diet Cat Renal Special (1) |
| sensitive_digestion | 1/1 | Royal Canin - Vet Diet Cat Renal (1); Royal Canin - Vet Diet Cat Renal Special (1) |
| sterilised | 3/3 | Monge - Adult Light Turkey (3); Schesir - Cat Sterilized & Light Με Κοτόπουλο (2); Josera - Josicat Classic Sterilised (1) |
| urinary | 2/2 | Monge VetSolution - Urinary Oxalate (2); Monge VetSolution - Urinary Struvite (2) |
| weight_control | 3/3 | Monge - Adult Light Turkey (3); Schesir - Cat Sterilized & Light Με Κοτόπουλο (2); Josera - Josicat Classic Sterilised (1) |

### Recurring First Picks

- No single first pick appears in four or more cases.

Use this section for qualitative review: repeated first picks can be healthy if they match the scenario, but they can also reveal over-dominant ranking signals.

## Results

### cat-quality-001 - PASS

Prompt: Sterilised indoor cat, 5kg, 4 years old. I need dry food for weight maintenance.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα

Warnings:
- None

### cat-quality-002 - PASS

Prompt: Sterilised indoor cat, 6.5kg, gained weight after neutering. I want dry food for weight loss.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Schesir - Cat Sterilized & Light Με Κοτόπουλο
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - LIGHT Cat Γαλοπούλα

Warnings:
- None

### cat-quality-003 - PASS

Prompt: Kitten, 5 months old, 2kg. I need dry food for healthy growth.
Goal: growth

Top foods:
- ACANA - Grasslands Adult Cat & Kitten
- ACANA - Pacifica Adult Cat & Kitten
- ORIJEN - Tundra Adult Cat & Kitten

Warnings:
- None

### cat-quality-004 - PASS

Prompt: Senior cat, 13 years old, 4.5kg, low activity, no kidney or urinary diagnosis. I need senior dry food.
Goal: senior

Top foods:
- Royal Canin - Ageing Sterilised 11+
- Monge - Senior Rich In Chicken
- Josera - Senior

Warnings:
- None

### cat-quality-005 - PASS

Prompt: Senior cat, 12 years old, 4kg, diagnosed with chronic kidney disease. I need dry renal food.
Goal: renal

Top foods:
- Royal Canin - Vet Diet Cat Renal Special
- Royal Canin - Vet Diet Cat Renal
- Monge VetSolution - Renal

Warnings:
- None

### cat-quality-006 - PASS

Prompt: Cat with struvite crystal history. I need dry urinary support food.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Oxalate
- Monge VetSolution - Urinary Struvite
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat

Warnings:
- None

### cat-quality-007 - PASS

Prompt: Cat with oxalate stone history. I need dry urinary support food.
Goal: urinary

Top foods:
- Monge VetSolution - Urinary Oxalate
- Monge VetSolution - Urinary Struvite
- Purina Pro Plan Veterinary Diets - FELINE UR ST/OX URINARY Cat

Warnings:
- None

### cat-quality-008 - PASS

Prompt: Adult cat allergic to chicken and turkey, prefers salmon dry food.
Goal: allergy

Top foods:
- Purina Pro Plan - Veterinary Diets Cat HA Hypoallergenic
- Purina Pro Plan - STERILISED Savoury Duo Πάπια Και Συκώτι
- Purina Pro Plan - Sterilised Μπακαλιάρος Και Πέστρορφα

Warnings:
- None

### cat-quality-009 - PASS

Prompt: Adult cat with sensitive digestion and soft stool after food changes. I need dry food.
Goal: sensitive_digestion

Top foods:
- Royal Canin - Vet Diet Cat Renal
- Royal Canin - Vet Diet Cat Renal Special
- Royal Canin - Vet Diet Cat Urinary S/O

Warnings:
- None

### cat-quality-010 - PASS

Prompt: Adult sterilised cat, 4.8kg, loves salmon but refuses beef and lamb.
Goal: weight_control

Top foods:
- Monge - Adult Light Turkey
- Josera - Josicat Classic Sterilised
- Purina Pro Plan - STERILISED Vital Functions Cat Σολομός
- Purina Pro Plan - LIGHT Cat Γαλοπούλα

Warnings:
- None
