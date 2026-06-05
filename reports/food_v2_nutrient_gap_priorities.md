# Food V2 Nutrient Gap Priorities

Generated: 2026-06-05T17:41:58.735Z

## Summary

- Candidate rows reviewed: 801
- Rows with nutrient gaps or estimated/default values: 801
- High priority: 477
- Medium priority: 312
- Low priority: 12
- Output CSV: data/review/food_v2_nutrient_gap_priorities.csv

## Priority By Level

- high: 477
- medium: 312
- low: 12

## Most Common Blockers

- none: 496
- calcium_percent: 294
- phosphorus_percent: 262

## Estimated Values To Replace

- none: 457
- kcal_per_100g: 344
- moisture_percent: 232

## Health Context

- none: 461
- puppy: 104
- senior: 95
- kitten: 56
- weight_control: 51
- urinary: 24
- renal: 19
- allergy: 6
- gi_support: 6
- obesity: 3
- sensitive_digestion: 2

## Top Priority Rows

- Royal Canin - Royal Canin Urinary Care 400g: priority=high; score=192; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=urinary, kitten
- Royal Canin - Royal Canin Mini Urinary Care: priority=high; score=174; blockers=calcium_percent, phosphorus_percent; estimated=none; context=urinary, senior
- Purina Pro Plan - Purina Pro Plan Renal Plus Sterilised Σολομός 10kg: priority=high; score=168; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=renal
- Royal Canin - Royal Canin Medium Adult 7+ 4kg: priority=high; score=168; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=senior
- Fish4Dogs - Fish4dogs Finest Salmon Senior Small 6kg: priority=high; score=164; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=senior
- Royal Canin - Royal Canin Maxi light Weight Care: priority=high; score=162; blockers=calcium_percent, phosphorus_percent; estimated=none; context=weight_control, senior
- Royal Canin - Royal Canin Medium Light Weight Care: priority=high; score=162; blockers=calcium_percent, phosphorus_percent; estimated=none; context=weight_control, senior
- Royal Canin - Royal Canin Mini Light Weight Care: priority=high; score=162; blockers=calcium_percent, phosphorus_percent; estimated=none; context=weight_control, senior
- Reflex - Reflex Plus Kitten Chicken 1.5kg: priority=high; score=156; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=kitten
- Reflex - Reflex Plus Medium / Large Junior Lamb 12kg: priority=high; score=156; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=puppy
- Royal Canin - Royal Canin Baby Cat 400gr: priority=high; score=156; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=kitten
- Royal Canin - Royal Canin Cocker Junior 3kg: priority=high; score=156; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=puppy
- Royal Canin - Royal Canin Dental Care 400g: priority=high; score=156; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=kitten
- Royal Canin - Royal Canin Digestive Care 400gr: priority=high; score=156; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=kitten
- Royal Canin - Royal Canin Fit 32 10kg: priority=high; score=156; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=kitten
- Royal Canin - Royal Canin Hair & Skin Care 400g: priority=high; score=156; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=kitten
- Royal Canin - Royal Canin Hairball Care 400g: priority=high; score=156; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=kitten
- Royal Canin - Royal Canin Indoor 27 400g: priority=high; score=156; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=kitten
- Royal Canin - Royal Canin Kitten 400gr: priority=high; score=156; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=kitten
- Royal Canin - Royal Canin Light Weight Care 400g: priority=high; score=156; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=weight_control, kitten
- Royal Canin - Royal Canin Persian Adult 400g: priority=high; score=156; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=kitten
- Royal Canin - Royal Canin Poodle Junior 3kg: priority=high; score=156; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=puppy
- Royal Canin - Royal Canin Pug Junior 1.5kg: priority=high; score=156; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=puppy
- Royal Canin - Royal Canin Rottweiler Junior 12kg: priority=high; score=156; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=puppy
- Royal Canin - Royal Canin Schnauzer Junior 1.5kg: priority=high; score=156; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=puppy

## Workflow

1. Fix high-priority rows first, especially medical, puppy/kitten, renal, urinary, obesity and senior formulas.
2. Replace estimated kcal with official kcal/kg or kcal/100g whenever a label, official page or PDF provides it.
3. Replace default ash/moisture assumptions with declared values when available.
4. Use omega3/omega6/EPA/DHA gaps as second-pass enrichment unless the food targets growth, senior, renal, skin or joint support.
5. Keep retailer-only rows in review unless official evidence or clear pack photos confirm the missing fields.