# Chatbot Live Manual QA - 20 Scenario Pass

Site: `https://nutritail.ai/account/chatbot`
Run date: 2026-06-27
Mode: authenticated in-app browser live testing
Save actions: not used

## Summary

- Scenarios checked: 20
- Console errors observed: 0
- Strong pass signals: language toggle, English urgent urinary hard-stop, saved-pet progress entry point, saved-pet alternative-food entry point, implausible weight rejection
- Main failure pattern: Greek medical red flags are not interrupting the intake flow before the bot asks for a pet name

## Scenario Results

| ID | Scenario | Result | Notes |
| --- | --- | --- | --- |
| T01 | Greek male cat cannot urinate | Fail | Recognized cat, then asked name instead of urgent vet hard-stop. |
| T02 | Greek cat not eating for 48h | Fail | Asked name instead of urgent anorexia warning. |
| T03 | Greek dog diarrhea with blood | Fail | Asked name instead of urgent veterinary caution. |
| T04 | Greek pancreatitis + high-fat request | Fail | Asked name instead of warning against high-fat advice. |
| T05 | Greek renal cat IRIS 3 asking non-vet senior food | Fail | Asked name instead of condition-first renal caution. |
| T06 | Greeklish soft stool/gas | Review | Parsed `skylaki` as pet name and asked weight; missed digestive intent and dog species confidence. |
| T07 | Chicken allergy + salmon preference | Review | Asked name first; did not immediately acknowledge allergy/avoidance constraint. |
| T08 | Great Dane puppy growth | Review | Did not infer dog species from Great Dane; asked user to say dog/cat. |
| T09 | Recently weaned kitten | Review | Recognized cat and asked name; did not mention kitten/growth caution up front. |
| T10 | Senior dog with no teeth/choking on kibble | Review | Recognized dog and asked name; did not surface chewing/senior concern up front. |
| T11 | English Royal Canin vs Acana compare | Pass | Did not hallucinate comparison before pet selection; asked for pet context. |
| T12 | Implausible 115 kg dog | Pass | Did not accept the weight; after name it asked for weight again. |
| T13 | Current food + disliked salmon | Review | Initial message did not immediately preserve all facts; needs full-flow verification for current-food parsing. |
| T14 | Unknown current food + disliked salmon | Review | Known issue from prior full flow: disliked salmon can be mistaken as current food/food match. |
| T15 | English male cat cannot urinate | Pass | Correctly produced urgent vet hard-stop before normal intake. |
| T16 | Saved pet progress with weight and grams | Review | Detected weight increase, but asked again for grams/day even though user supplied 70 g/day. |
| T17 | Saved pet asks alternative food after boredom | Pass | Correctly entered alternative-food flow and asked current food. Minor mixed-language label remains. |
| T18 | Health-card Greek urinary hard-stop | Fail | Even after choosing health context, Greek urinary red flag asked name instead of urgent stop. |
| T19 | English full cat fact message | Pass | Extracted enough facts to skip species/name/weight/age and asked activity. |
| T20 | Greek lowercase pet name | Partial | Started flow and kept facts; capitalization not fully verified because the summary was not reached. |

## Priority Issues

### P0 - Greek medical red flags must interrupt intake

Greek prompts for urinary blockage, anorexia, blood diarrhea, pancreatitis, and renal disease currently enter normal intake and ask the pet name. English urinary red flag does hard-stop correctly, so the safety layer exists but Greek red-flag routing/lexicon is incomplete.

Required behavior:
- If Greek text includes male cat/no urine/straining, stop immediately and recommend urgent veterinary care.
- If cat not eating for 24-48h, blood, collapse, severe vomiting/diarrhea, pancreatitis, renal disease, or diabetes appears, respond condition-first before asking ordinary intake questions.

### P1 - Disliked proteins must never become current food or food match

Prior full-flow live test showed `δεν τρώει σολομό` later became `Τωρινή τροφή: σολομό` and a salmon-based food match. This can produce unsafe or confusing recommendations.

Required behavior:
- Parse `δεν τρώει X`, `δεν του αρέσει X`, `τον πειράζει X`, and `αλλεργία σε X` as avoidance/allergy signals only.
- Do not use avoidance tokens as `currentFoodName`.
- Do not match Food V2 candidates from disliked ingredients.

### P1 - Full initial message facts should be retained

When a user gives species, weight, age, neuter status, activity, preferences, dislikes, and weight goal in one message, the bot keeps some facts but still re-asks preference and goal.

Required behavior:
- Ask only missing fields.
- Preserve extracted optional fields such as `preferredProteins`, `excludedIngredients`, `currentFoodName`, and `weightGoal`.

### P2 - Greeklish and breed inference need improvement

Greeklish digestive prompt was treated as pet name `Skylaki`. `Great Dane puppy` did not infer dog species.

Required behavior:
- Greeklish phrases like `skylaki`, `malaka kaka`, `aera`, `fagito` should map to dog + digestive sensitivity.
- Known dog/cat breeds should infer species.

### P2 - Progress parsing should use supplied grams/treats

Saved-pet progress detected weight gain but asked again for grams/day after the user supplied `70 γραμμάρια τη μέρα`.

Required behavior:
- Extract current weight, grams/day, treats, appetite, stool, and energy from the progress message.
- Ask only for missing progress fields.

### P2 - Mixed-language customer copy remains

Greek flow still shows labels like `Use Σαραμπι`, `Progress`, `Another food`, and English transition guidance in some outputs.

Required behavior:
- Customer-facing labels should follow the selected language.
- English fallback strings should not appear in Greek responses unless the user selected English.

## Recommended Next PR

Create one focused PR for:

1. Greek red-flag hard-stop before normal intake.
2. Stronger Greek/Greeklish extraction for allergies, dislikes, current food, and weight goal.
3. Guard so disliked/allergy terms cannot be used as current-food matches.
4. Progress-message extraction for grams/day, treats, appetite, stool, and energy.
5. Customer copy localization cleanup for saved-pet action labels and transition guidance.

## Verification For Next PR

- Add automated cases for T01-T05 and T18 to prove Greek urgent medical prompts interrupt normal intake.
- Add tests for disliked proteins not becoming current food.
- Add progress parsing test with `6.4 κιλά`, `70 γραμμάρια`, and `λίγες λιχουδιές`.
- Re-run live browser smoke for at least T01, T14, T16, and T18 after deploy.
