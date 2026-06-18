# Food V2 Nutrient Gap Priorities

Generated: 2026-06-18T20:42:58.328Z

## Summary

- Candidate rows reviewed: 553
- Rows with nutrient gaps or estimated/default values: 553
- High priority: 274
- Medium priority: 265
- Low priority: 14
- Output CSV: data/review/food_v2_nutrient_gap_priorities.csv

## Priority By Level

- high: 274
- medium: 265
- low: 14

## Most Common Blockers

- none: 404
- calcium_percent: 142
- phosphorus_percent: 131

## Estimated Values To Replace

- none: 299
- kcal_per_100g: 254
- moisture_percent: 145

## Health Context

- none: 377
- puppy: 53
- weight_control: 35
- senior: 30
- kitten: 25
- urinary: 16
- renal: 14
- gi_support: 6
- allergy: 4
- obesity: 2
- sensitive_digestion: 2

## Top Priority Rows

- Fish4Dogs - Fish4dogs Finest Salmon Senior Small 6kg: priority=high; score=164; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=senior
- Reflex - Reflex Plus Kitten Chicken 1.5kg: priority=high; score=156; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=kitten
- Reflex - Reflex Plus Medium / Large Junior Lamb 12kg: priority=high; score=156; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=puppy
- Tonus Dog Chow - Tonus Dog Chow Puppy Κοτόπουλο 2.5kg: priority=high; score=156; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=puppy
- Trendline - Trendline Kitten Chicken 15kg: priority=high; score=156; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=kitten
- Josera - Josera LOOPIES WITH BEEF: priority=high; score=146; blockers=calcium_percent, phosphorus_percent; estimated=none; context=senior
- Josera - Josera LOOPIES WITH LAMB: priority=high; score=146; blockers=calcium_percent, phosphorus_percent; estimated=none; context=senior
- Josera - Josera LOOPIES WITH POULTRY: priority=high; score=146; blockers=calcium_percent, phosphorus_percent; estimated=none; context=senior
- Reflex - Reflex Plus Breed Pomeranian Puppy Hypoallergenic 1.5kg: priority=high; score=144; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g; context=puppy
- Reflex - Reflex Plus Breed Poodle Puppy Hypoallergenic 1.5kg: priority=high; score=144; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g; context=puppy
- Ambrosia - Ambrosia Mediterranean Diet Grain Free Puppy Fresh Sardine & Herring 1,5kg: priority=high; score=140; blockers=calcium_percent, phosphorus_percent; estimated=none; context=puppy
- Royal Canin - Royal Canin Vet Diet Dog Urinary UC Low P 2kg: priority=high; score=140; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=urinary
- Brekkies - Brekkies Cat Adult Special Care Urinary 20kg: priority=high; score=132; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=urinary
- Dr. Clauder - Dr Clauder's High Premium Cat Sterilised/Senior/Light 10kg: priority=high; score=122; blockers=calcium_percent; estimated=kcal_per_100g, moisture_percent; context=weight_control, senior
- Royal Canin - Royal Canin Maxi Puppy 3kg: priority=high; score=120; blockers=calcium_percent, phosphorus_percent; estimated=none; context=puppy
- Royal Canin - Royal Canin Medium Puppy 3kg: priority=high; score=120; blockers=calcium_percent, phosphorus_percent; estimated=none; context=puppy
- Josera - Josera Help Cat Renal 2kg: priority=high; score=116; blockers=none; estimated=kcal_per_100g, moisture_percent; context=renal
- Royal Canin - Royal Canin Vet Diet Puppy GastroIntestinal 1kg: priority=high; score=114; blockers=phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=puppy
- Burns - Burns Adult & Senior Sensitive Duck & Potato: priority=high; score=112; blockers=none; estimated=kcal_per_100g; context=senior
- Happy Dog - Happy Dog Fit & Vital Mini Senior 4kg: priority=high; score=112; blockers=none; estimated=kcal_per_100g, moisture_percent; context=senior
- Happy Dog - Happy Dog NaturCroq Senior 11kg: priority=high; score=112; blockers=none; estimated=kcal_per_100g, moisture_percent; context=senior
- Happy Dog - Happy Dog Senior 12kg: priority=high; score=112; blockers=none; estimated=kcal_per_100g, moisture_percent; context=senior
- Royal Canin Veterinary Diet - Royal Canin Veterinary Canine Gastrointestinal Low Fat: priority=high; score=112; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g; context=gi_support
- Royal Canin Veterinary Diet - Royal Canin Veterinary Dog - Gastrointestinal: priority=high; score=112; blockers=calcium_percent, phosphorus_percent; estimated=kcal_per_100g; context=gi_support
- Happy Cat - Happy Cat Minkas Junior Care 1.5kg: priority=high; score=110; blockers=phosphorus_percent; estimated=kcal_per_100g, moisture_percent; context=kitten

## Workflow

1. Fix high-priority rows first, especially medical, puppy/kitten, renal, urinary, obesity and senior formulas.
2. Replace estimated kcal with official kcal/kg or kcal/100g whenever a label, official page or PDF provides it.
3. Replace default ash/moisture assumptions with declared values when available.
4. Use omega3/omega6/EPA/DHA gaps as second-pass enrichment unless the food targets growth, senior, renal, skin or joint support.
5. Keep retailer-only rows in review unless official evidence or clear pack photos confirm the missing fields.