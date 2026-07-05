# NutriTail Dialogue Corpus v1

This folder contains structured customer dialogue fixtures for long-term NutriTail QA.

The corpus is not UI copy and not prompt cosmetics. It is a regression asset for:

- OpenAI fact extraction
- conversation memory
- one-question-at-a-time follow-up logic
- medical red-flag interrupts
- Food V2 retrieval
- rules-based food ranking
- customer-facing answer quality
- Greek and Greeklish understanding
- dog/cat recommendation accuracy

## Principles

- Database equals truth.
- NutriTail rules decide safety, filtering, and ranking.
- OpenAI may extract facts and write human explanations.
- OpenAI must not invent foods, nutrients, contraindications, or override NutriTail ranking.
- Medical red flags must interrupt normal shopping/recommendation flow.

## Structure

The corpus is split by species and scenario type:

- `dogs/`: dog recommendation, puppy, senior, medical, emergency, comparison, and feeding cases.
- `cats/`: cat recommendation, kitten, senior, urinary/renal/emergency, and feeding cases.
- `mixed/`: cross-cutting budget, premium, picky-eater, multi-pet, and transition cases.

Every item follows the TypeScript contract in `schema.ts`.

## Current Coverage

Version 1 contains 100 realistic dialogue fixtures:

- 20 dog recommendation dialogues
- 20 cat recommendation dialogues
- 10 puppy dialogues
- 10 kitten dialogues
- 10 emergency/red-flag dialogues
- 10 allergy/sensitivity dialogues
- 10 comparison dialogues
- 10 feeding amount / transition dialogues

Run:

```bash
npm run qa:dialogue-corpus
```

## Expansion Plan Toward 1000 Dialogues

1. Add 100 more dog cases focused on breed size, activity, obesity, allergy, GI, renal, urinary, senior, and puppy growth.
2. Add 100 more cat cases focused on sterilised, urinary, renal, indoor, hairball, senior, kitten, picky appetite, and wet/dry preference.
3. Add 100 Greeklish and mixed-language cases to harden intake extraction.
4. Add 100 incomplete/confused customer cases to test one-question-at-a-time follow-up logic.
5. Add 100 emergency and caution cases to prove medical interrupt recall.
6. Add 100 budget and premium cases to test clear customer-facing recommendation grouping.
7. Add 100 food comparison cases using brands already present in Food V2.
8. Add 100 saved-pet follow-up cases for progress, no progress, flavor fatigue, and food switching.
9. Add 100 feeding amount and transition cases with known kcal/100g products.
10. Add 100 regression cases from real live QA failures.

Each expansion should keep the same schema and pass `qa:dialogue-corpus`.
