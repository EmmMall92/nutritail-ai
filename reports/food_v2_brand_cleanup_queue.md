# Food V2 Brand Cleanup Queue

Generated: 2026-06-19T02:18:02.312Z

## Summary

- Brands queued: 80
- Top priority brand: Royal Canin
- Output CSV: data/review/food_v2_brand_cleanup_queue.csv
- Highest customer impact brand: Royal Canin

## Queue By Phase

- nutrient_backfill: 38
- title_cleanup: 26
- controlled_import_ready: 6
- small_batch_review: 6
- dedupe_before_import: 4

## Top Cleanup Priorities

- 1. Royal Canin: priority=181; customer_impact=136; dedupe_before_import; rows=29; title identities=6; title issues=12; duplicates=35; Ca/P gaps=21
- 2. Ambrosia: priority=97; customer_impact=82; title_cleanup; rows=8; title identities=28; title issues=89; duplicates=0; Ca/P gaps=1
- 3. Belcando: priority=89; customer_impact=77; title_cleanup; rows=20; title identities=26; title issues=57; duplicates=0; Ca/P gaps=0
- 4. Brit: priority=80; customer_impact=77; title_cleanup; rows=46; title identities=19; title issues=39; duplicates=0; Ca/P gaps=0
- 5. Josera: priority=62; customer_impact=58; dedupe_before_import; rows=54; title identities=1; title issues=1; duplicates=2; Ca/P gaps=15
- 6. Hills: priority=60; customer_impact=59; title_cleanup; rows=37; title identities=8; title issues=16; duplicates=0; Ca/P gaps=0
- 7. Royal Canin Veterinary Diet: priority=54; customer_impact=50; title_cleanup; rows=5; title identities=4; title issues=8; duplicates=0; Ca/P gaps=4
- 8. Hill's Prescription Diet: priority=52; customer_impact=46; title_cleanup; rows=8; title identities=9; title issues=14; duplicates=0; Ca/P gaps=0
- 9. Happy Dog: priority=39; customer_impact=39; nutrient_backfill; rows=11; title identities=0; title issues=0; duplicates=0; Ca/P gaps=0
- 10. Farmina: priority=35; customer_impact=37; controlled_import_ready; rows=7; title identities=0; title issues=0; duplicates=0; Ca/P gaps=0
- 11. Acana: priority=33; customer_impact=37; dedupe_before_import; rows=4; title identities=0; title issues=0; duplicates=1; Ca/P gaps=0
- 12. Purina Pro Plan: priority=33; customer_impact=37; title_cleanup; rows=4; title identities=1; title issues=2; duplicates=0; Ca/P gaps=2
- 13. Orijen: priority=30; customer_impact=34; small_batch_review; rows=4; title identities=0; title issues=0; duplicates=0; Ca/P gaps=0
- 14. Monge: priority=30; customer_impact=34; nutrient_backfill; rows=3; title identities=0; title issues=0; duplicates=0; Ca/P gaps=3
- 15. Amanova: priority=26; customer_impact=22; title_cleanup; rows=10; title identities=5; title issues=10; duplicates=0; Ca/P gaps=10
- 16. Calibra: priority=25; customer_impact=24; title_cleanup; rows=3; title identities=10; title issues=44; duplicates=0; Ca/P gaps=0
- 17. Reflex: priority=23; customer_impact=23; nutrient_backfill; rows=19; title identities=0; title issues=0; duplicates=0; Ca/P gaps=13
- 18. Leonardo: priority=23; customer_impact=20; title_cleanup; rows=10; title identities=4; title issues=8; duplicates=0; Ca/P gaps=0
- 19. Cennamo: priority=20; customer_impact=21; title_cleanup; rows=13; title identities=5; title issues=7; duplicates=0; Ca/P gaps=2
- 20. Carnilove: priority=19; customer_impact=19; title_cleanup; rows=10; title identities=5; title issues=12; duplicates=0; Ca/P gaps=0
- 21. Wolf of Wilderness: priority=18; customer_impact=19; title_cleanup; rows=3; title identities=6; title issues=14; duplicates=0; Ca/P gaps=1
- 22. Canagan: priority=17; customer_impact=15; title_cleanup; rows=6; title identities=2; title issues=4; duplicates=0; Ca/P gaps=0
- 23. JosiDog: priority=16; customer_impact=11; nutrient_backfill; rows=24; title identities=0; title issues=0; duplicates=0; Ca/P gaps=12
- 24. Happy Cat: priority=16; customer_impact=16; nutrient_backfill; rows=14; title identities=0; title issues=0; duplicates=0; Ca/P gaps=1
- 25. Briantos: priority=16; customer_impact=17; dedupe_before_import; rows=2; title identities=4; title issues=10; duplicates=1; Ca/P gaps=0
- 26. Naturea: priority=15; customer_impact=16; title_cleanup; rows=11; title identities=3; title issues=6; duplicates=0; Ca/P gaps=0
- 27. Anima: priority=15; customer_impact=17; title_cleanup; rows=3; title identities=5; title issues=20; duplicates=0; Ca/P gaps=0
- 28. Taste of the Wild: priority=14; customer_impact=12; nutrient_backfill; rows=7; title identities=0; title issues=0; duplicates=0; Ca/P gaps=7
- 29. Brekkies: priority=14; customer_impact=12; nutrient_backfill; rows=5; title identities=0; title issues=0; duplicates=0; Ca/P gaps=4
- 30. Trainer: priority=14; customer_impact=12; nutrient_backfill; rows=5; title identities=0; title issues=0; duplicates=0; Ca/P gaps=5

## Next Cleanup Sprint

Work these in order before the next broad customer-facing recommendation test.

1. Royal Canin (dedupe_before_import) - Review duplicate groups first, pick one canonical survivor per formula, then import. Open `data/review/food_v2_duplicate_merge_risk_audit.csv`; Filter duplicate audit by brand/canonical identity, choose one customer-facing survivor, then keep other rows as evidence/backfill only.
2. Ambrosia (title_cleanup) - Clean customer-facing formula names before wider chatbot exposure. Open `data/review/food_v2_title_quality_audit.csv`; Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
3. Belcando (title_cleanup) - Clean customer-facing formula names before wider chatbot exposure. Open `data/review/food_v2_title_quality_audit.csv`; Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
4. Brit (title_cleanup) - Clean customer-facing formula names before wider chatbot exposure. Open `data/review/food_v2_title_quality_audit.csv`; Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
5. Josera (dedupe_before_import) - Review duplicate groups first, pick one canonical survivor per formula, then import. Open `data/review/food_v2_duplicate_merge_risk_audit.csv`; Filter duplicate audit by brand/canonical identity, choose one customer-facing survivor, then keep other rows as evidence/backfill only.

## Customer-Facing Risk Hotspots

These brands are most likely to produce confusing customer recommendations because of visible title, duplicate or nutrition-confidence issues.

- Royal Canin: customer_impact=136; title_risk=20; duplicate_risk=64; nutrition_gap=30; next=data/review/food_v2_duplicate_merge_risk_audit.csv
- Ambrosia: customer_impact=82; title_risk=82; duplicate_risk=7; nutrition_gap=11; next=data/review/food_v2_title_quality_audit.csv
- Belcando: customer_impact=77; title_risk=63; duplicate_risk=8; nutrition_gap=17; next=data/review/food_v2_title_quality_audit.csv
- Brit: customer_impact=77; title_risk=47; duplicate_risk=10; nutrition_gap=8; next=data/review/food_v2_title_quality_audit.csv
- Hills: customer_impact=59; title_risk=24; duplicate_risk=9; nutrition_gap=21; next=data/review/food_v2_title_quality_audit.csv
- Josera: customer_impact=58; title_risk=9; duplicate_risk=14; nutrition_gap=11; next=data/review/food_v2_duplicate_merge_risk_audit.csv
- Royal Canin Veterinary Diet: customer_impact=50; title_risk=16; duplicate_risk=6; nutrition_gap=12; next=data/review/food_v2_title_quality_audit.csv
- Hill's Prescription Diet: customer_impact=46; title_risk=24; duplicate_risk=7; nutrition_gap=12; next=data/review/food_v2_title_quality_audit.csv
- Happy Dog: customer_impact=39; title_risk=8; duplicate_risk=7; nutrition_gap=13; next=data/review/food_v2_nutrient_gap_priorities.csv
- Farmina: customer_impact=37; title_risk=8; duplicate_risk=7; nutrition_gap=8; next=data/review/food_v2_brand_cleanup_queue.csv
- Acana: customer_impact=37; title_risk=8; duplicate_risk=8; nutrition_gap=8; next=data/review/food_v2_duplicate_merge_risk_audit.csv
- Purina Pro Plan: customer_impact=37; title_risk=10; duplicate_risk=6; nutrition_gap=10; next=data/review/food_v2_title_quality_audit.csv

## Title Cleanup Hotspots

- Ambrosia: title_risk=82; title issues=89; identities=28; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
- Belcando: title_risk=63; title issues=57; identities=26; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
- Brit: title_risk=47; title issues=39; identities=19; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
- Calibra: title_risk=33; title issues=44; identities=10; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
- Hills: title_risk=24; title issues=16; identities=8; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
- Hill's Prescription Diet: title_risk=24; title issues=14; identities=9; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
- Royal Canin: title_risk=20; title issues=12; identities=6; next step: Filter duplicate audit by brand/canonical identity, choose one customer-facing survivor, then keep other rows as evidence/backfill only.
- Black Olympus: title_risk=17; title issues=22; identities=5; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
- Royal Canin Veterinary Diet: title_risk=16; title issues=8; identities=4; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
- Anima: title_risk=16; title issues=20; identities=5; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.

## Duplicate Cleanup Hotspots

- Royal Canin: duplicate_risk=64; duplicate groups=35; next step: Filter duplicate audit by brand/canonical identity, choose one customer-facing survivor, then keep other rows as evidence/backfill only.
- Josera: duplicate_risk=14; duplicate groups=2; next step: Filter duplicate audit by brand/canonical identity, choose one customer-facing survivor, then keep other rows as evidence/backfill only.
- Brit: duplicate_risk=10; duplicate groups=0; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
- Hills: duplicate_risk=9; duplicate groups=0; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
- Belcando: duplicate_risk=8; duplicate groups=0; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
- Acana: duplicate_risk=8; duplicate groups=1; next step: Filter duplicate audit by brand/canonical identity, choose one customer-facing survivor, then keep other rows as evidence/backfill only.
- Ambrosia: duplicate_risk=7; duplicate groups=0; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
- Hill's Prescription Diet: duplicate_risk=7; duplicate groups=0; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
- Happy Dog: duplicate_risk=7; duplicate groups=0; next step: Filter nutrient gaps by brand and backfill kcal, ash, calcium/phosphorus from official pages, PDFs, labels or trusted retailers.
- Farmina: duplicate_risk=7; duplicate groups=0; next step: Run admin preview, Check Existing, import a selected controlled batch, then rerun this queue.

## Nutrition Confidence Hotspots

- Royal Canin: nutrition_gap=30; Ca/P gaps=21; ash gaps=0; estimated kcal=23; missing kcal=0
- Reflex: nutrition_gap=24; Ca/P gaps=13; ash gaps=0; estimated kcal=19; missing kcal=0
- Hills: nutrition_gap=21; Ca/P gaps=0; ash gaps=5; estimated kcal=25; missing kcal=0
- Belcando: nutrition_gap=17; Ca/P gaps=0; ash gaps=0; estimated kcal=20; missing kcal=0
- Amanova: nutrition_gap=14; Ca/P gaps=10; ash gaps=0; estimated kcal=0; missing kcal=0
- Happy Dog: nutrition_gap=13; Ca/P gaps=0; ash gaps=0; estimated kcal=11; missing kcal=0
- Leonardo: nutrition_gap=13; Ca/P gaps=0; ash gaps=0; estimated kcal=10; missing kcal=0
- Happy Cat: nutrition_gap=13; Ca/P gaps=1; ash gaps=0; estimated kcal=10; missing kcal=0
- Trainer: nutrition_gap=13; Ca/P gaps=5; ash gaps=0; estimated kcal=5; missing kcal=0
- Friskies: nutrition_gap=13; Ca/P gaps=5; ash gaps=0; estimated kcal=5; missing kcal=0

## How To Use This

1. Start with high `customer_impact_score` brands because these are most likely to affect visible chatbot recommendations.
2. Resolve `dedupe_before_import` before importing new rows, because duplicate formulas can confuse ranking and food cards.
3. Resolve `title_cleanup` before customer exposure, because product names are what users remember and click.
4. Resolve `nutrient_backfill` before relying on medical, growth, senior, or weight-control confidence.
5. Use the risk columns to split work: title risk affects what customers see, duplicate risk affects ranking, nutrition gap risk affects confidence.

`title_issue_identities` counts distinct formula/source identities from the title audit and may be higher than committed rows when the source registry has extra candidate rows.

## Operating Rule

Use this as the brand-by-brand cleanup order before broad customer-facing recommendation testing. It does not write to Supabase; it combines title quality, duplicate risk and nutrient gaps into one working queue.