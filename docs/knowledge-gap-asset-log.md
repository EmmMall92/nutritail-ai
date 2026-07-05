# NutriTail Knowledge Gap Asset Log

This log turns repeated findings into durable NutriTail assets. It is not a task dump.
Each entry must say what pattern was found, which permanent asset should own it, and how we will verify it.

## Asset Types

- `rule`: deterministic nutrition, safety, ranking, intake, or formatting logic.
- `dataset`: Food V2, dialogue corpus, golden cases, source registry, or evaluation fixture data.
- `test`: regression, QA script, smoke test, live-case fixture, or launch readiness gate.
- `profile`: brand, ingredient, nutrient, health-condition, or customer-context profile.
- `knowledge_module`: structured veterinary/nutrition knowledge module used by rules or explanation.

## Current Priority Entries

| Gap or pattern | Asset type | Permanent owner | Proposed fix | Verification |
| --- | --- | --- | --- | --- |
| Customer-facing chatbot exposed back-office wording such as review/source/quality labels. | rule, test | `lib/ai/responseComposer.ts`, `lib/food-v2/chatbotRecommendationSummary.ts` | Keep customer answers in plain shopping/nutrition language; keep internal evidence only in admin/report contexts. | `npm run qa:chatbot-customer-recommendations`, `npm run qa:customer-recommendation-presentation-contract` |
| A preferred protein such as salmon was not strong enough to shape the first shortlist when safe salmon options existed. | rule, test | `lib/food-v2/recommendationRanking.ts` | Prioritize safe customer-visible preferred-protein matches when they are close enough nutritionally, even if only one or two matching foods exist; keep stronger non-preferred foods only when the gap is large. | `npm run qa:food-v2-preference-ranking` |
| Natural Greek pet-name phrases can be mistaken for the whole name. | rule, test | `lib/petName.ts`, `lib/ai/intakeValidation.ts` | Strip phrases such as "την λένε", "τον λένε", and species-owner name phrases before saving/displaying. | `npm run qa:chatbot-intake-cleanup` |
| Brand/food comparison intent may arrive before a pet is selected. | rule, test | `app/account/chatbot/page.tsx`, `app/api/account/foods/compare/route.ts` | Preserve the pending compare request and ask only the missing pet context before comparing. | `npm run qa:chatbot-customer-recommendations` |
| Medical red flags must interrupt shopping flow. | rule, dataset, test | `lib/chatbot/safetyRules.ts`, `data/dialogue-corpus/*/emergency.json` | Convert every urgent symptom pattern into a dialogue corpus entry and a safety regression case. | `npm run qa:chatbot-safety-interrupts`, `npm run qa:dialogue-corpus` |
| Dog cases 101-200 reveal breed, activity, GI, allergy, urinary, renal, senior, and environment patterns. | dataset, test, knowledge_module | `data/evals/chatbot-dog-edge-cases-101-200.json`, `lib/nutrition-v2/*Rules.ts` | Keep cases as a live QA bank; promote failures into rules or dialogue corpus entries. | `npm run qa:dog-edge-fixture`, `npm run qa:dog-chatbot-live-cases` |
| Cat cases need parallel coverage by life stage, sterilisation, urinary/renal, obesity, picky eating, and emergency. | dataset, test | `data/evals/chatbot-extra-cases-cat-001-500.json`, `data/dialogue-corpus/cats` | Keep cat cases grouped by category and turn repeated misses into safety/ranking tests. | `npm run qa:cat-case-fixture`, `npm run qa:cat-chatbot-live-cases` |
| Wrong size or life-stage recommendations are high-trust failures. | rule, test | `lib/food-v2/recommendationRanking.ts` | Hard-hold visible size/life-stage mismatches when suitable alternatives exist. | `npm run qa:food-v2-preference-ranking`, `npm run qa:food-v2-launch-edge-accuracy` |
| Nutrient gaps should not become vague customer warnings. | dataset, rule, profile | Food V2 nutrient gap reports, nutrient profiles | Use gaps to drive data-quality queues and internal confidence, while customer copy stays simple. | `npm run qa:food-v2-format-coverage`, `npm run qa:clean-customer-wording-proof` |
| Wet/canned-only requests can pass logic but still expose a Food V2 coverage gap when no visible wet candidates exist. | dataset, test | Food V2 wet-food import queue, dog/cat live case fixtures | Add wet dog and cat foods as a dedicated import wave; keep dry-food recommendations held when the user asks only for wet/canned. | `npm run qa:dog-chatbot-live-cases`, `npm run qa:cat-chatbot-live-cases`, `npm run qa:missing-format-recommendation-message` |
| Repeated brand behavior should become brand intelligence, not ad hoc copy. | profile, knowledge_module | `lib/food-intelligence/profiles.ts` | Store brand strengths, cautions, best use cases, and known data limitations for explanation only. | `npm run qa:food-intelligence-use-cases` |

## Intake Rule

When a new bug, repeated customer phrase, disease nuance, missing nutrient pattern, or brand-specific behavior appears:

1. Add or update one row in this log.
2. Pick the durable asset owner.
3. Add a regression test or identify the existing QA gate.
4. Only then apply the immediate code/data fix.
