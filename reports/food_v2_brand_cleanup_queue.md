# Food V2 Brand Cleanup Queue

Generated: 2026-06-19T02:01:28.181Z

## Summary

- Brands queued: 80
- Top priority brand: Josera
- Output CSV: data/review/food_v2_brand_cleanup_queue.csv
- Highest customer impact brand: Royal Canin

## Queue By Phase

- nutrient_backfill: 35
- title_cleanup: 26
- dedupe_before_import: 8
- controlled_import_ready: 6
- small_batch_review: 5

## Top Cleanup Priorities

- 1. Josera: priority=199; customer_impact=134; dedupe_before_import; rows=54; title identities=68; title issues=69; duplicates=3; Ca/P gaps=15
- 2. Royal Canin: priority=196; customer_impact=136; dedupe_before_import; rows=29; title identities=6; title issues=12; duplicates=56; Ca/P gaps=21
- 3. Belcando: priority=101; customer_impact=87; dedupe_before_import; rows=20; title identities=26; title issues=68; duplicates=4; Ca/P gaps=0
- 4. Ambrosia: priority=97; customer_impact=82; title_cleanup; rows=8; title identities=28; title issues=94; duplicates=0; Ca/P gaps=1
- 5. Brit: priority=80; customer_impact=77; title_cleanup; rows=46; title identities=19; title issues=39; duplicates=0; Ca/P gaps=0
- 6. JosiDog: priority=64; customer_impact=47; title_cleanup; rows=24; title identities=24; title issues=24; duplicates=0; Ca/P gaps=12
- 7. Hills: priority=60; customer_impact=59; title_cleanup; rows=37; title identities=8; title issues=16; duplicates=0; Ca/P gaps=0
- 8. Royal Canin Veterinary Diet: priority=54; customer_impact=50; title_cleanup; rows=5; title identities=4; title issues=8; duplicates=0; Ca/P gaps=4
- 9. Hill's Prescription Diet: priority=52; customer_impact=46; title_cleanup; rows=8; title identities=9; title issues=22; duplicates=0; Ca/P gaps=0
- 10. Happy Dog: priority=39; customer_impact=39; nutrient_backfill; rows=11; title identities=0; title issues=0; duplicates=0; Ca/P gaps=0
- 11. Acana: priority=36; customer_impact=39; dedupe_before_import; rows=4; title identities=0; title issues=0; duplicates=2; Ca/P gaps=0
- 12. Orijen: priority=36; customer_impact=39; dedupe_before_import; rows=4; title identities=0; title issues=0; duplicates=2; Ca/P gaps=0
- 13. Farmina: priority=35; customer_impact=37; controlled_import_ready; rows=7; title identities=0; title issues=0; duplicates=0; Ca/P gaps=0
- 14. Purina Pro Plan: priority=33; customer_impact=37; title_cleanup; rows=4; title identities=1; title issues=2; duplicates=0; Ca/P gaps=2
- 15. Monge: priority=30; customer_impact=34; nutrient_backfill; rows=3; title identities=0; title issues=0; duplicates=0; Ca/P gaps=3
- 16. Reflex: priority=26; customer_impact=25; dedupe_before_import; rows=19; title identities=0; title issues=0; duplicates=1; Ca/P gaps=13
- 17. Amanova: priority=26; customer_impact=22; title_cleanup; rows=10; title identities=5; title issues=10; duplicates=0; Ca/P gaps=10
- 18. Calibra: priority=25; customer_impact=24; title_cleanup; rows=3; title identities=10; title issues=44; duplicates=0; Ca/P gaps=0
- 19. Leonardo: priority=23; customer_impact=20; title_cleanup; rows=10; title identities=4; title issues=8; duplicates=0; Ca/P gaps=0
- 20. Cennamo: priority=20; customer_impact=21; title_cleanup; rows=13; title identities=5; title issues=11; duplicates=0; Ca/P gaps=2
- 21. Carnilove: priority=19; customer_impact=19; title_cleanup; rows=10; title identities=5; title issues=16; duplicates=0; Ca/P gaps=0
- 22. Wolf of Wilderness: priority=18; customer_impact=19; title_cleanup; rows=3; title identities=6; title issues=15; duplicates=0; Ca/P gaps=1
- 23. Canagan: priority=17; customer_impact=15; title_cleanup; rows=6; title identities=2; title issues=4; duplicates=0; Ca/P gaps=0
- 24. Happy Cat: priority=16; customer_impact=16; nutrient_backfill; rows=14; title identities=0; title issues=0; duplicates=0; Ca/P gaps=1
- 25. Briantos: priority=16; customer_impact=17; dedupe_before_import; rows=2; title identities=4; title issues=10; duplicates=1; Ca/P gaps=0
- 26. Naturea: priority=15; customer_impact=16; title_cleanup; rows=11; title identities=3; title issues=6; duplicates=0; Ca/P gaps=0
- 27. Anima: priority=15; customer_impact=17; title_cleanup; rows=3; title identities=5; title issues=20; duplicates=0; Ca/P gaps=0
- 28. Taste of the Wild: priority=14; customer_impact=12; nutrient_backfill; rows=7; title identities=0; title issues=0; duplicates=0; Ca/P gaps=7
- 29. Brekkies: priority=14; customer_impact=12; nutrient_backfill; rows=5; title identities=0; title issues=0; duplicates=0; Ca/P gaps=4
- 30. Trainer: priority=14; customer_impact=12; nutrient_backfill; rows=5; title identities=0; title issues=0; duplicates=0; Ca/P gaps=5

## Next Cleanup Sprint

Work these in order before the next broad customer-facing recommendation test.

1. Josera (dedupe_before_import) - Review duplicate groups first, pick one canonical survivor per formula, then import. Open `data/review/food_v2_duplicate_merge_risk_audit.csv`; Filter duplicate audit by brand/canonical identity, choose one customer-facing survivor, then keep other rows as evidence/backfill only.
2. Royal Canin (dedupe_before_import) - Review duplicate groups first, pick one canonical survivor per formula, then import. Open `data/review/food_v2_duplicate_merge_risk_audit.csv`; Filter duplicate audit by brand/canonical identity, choose one customer-facing survivor, then keep other rows as evidence/backfill only.
3. Belcando (dedupe_before_import) - Review duplicate groups first, pick one canonical survivor per formula, then import. Open `data/review/food_v2_duplicate_merge_risk_audit.csv`; Filter duplicate audit by brand/canonical identity, choose one customer-facing survivor, then keep other rows as evidence/backfill only.
4. Ambrosia (title_cleanup) - Clean customer-facing formula names before wider chatbot exposure. Open `data/review/food_v2_title_quality_audit.csv`; Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
5. Brit (title_cleanup) - Clean customer-facing formula names before wider chatbot exposure. Open `data/review/food_v2_title_quality_audit.csv`; Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.

## Customer-Facing Risk Hotspots

These brands are most likely to produce confusing customer recommendations because of visible title, duplicate or nutrition-confidence issues.

- Royal Canin: customer_impact=136; title_risk=20; duplicate_risk=98; nutrition_gap=30; next=data/review/food_v2_duplicate_merge_risk_audit.csv
- Josera: customer_impact=134; title_risk=100; duplicate_risk=15; nutrition_gap=11; next=data/review/food_v2_duplicate_merge_risk_audit.csv
- Belcando: customer_impact=87; title_risk=69; duplicate_risk=14; nutrition_gap=17; next=data/review/food_v2_duplicate_merge_risk_audit.csv
- Ambrosia: customer_impact=82; title_risk=85; duplicate_risk=7; nutrition_gap=11; next=data/review/food_v2_title_quality_audit.csv
- Brit: customer_impact=77; title_risk=47; duplicate_risk=10; nutrition_gap=8; next=data/review/food_v2_title_quality_audit.csv
- Hills: customer_impact=59; title_risk=24; duplicate_risk=9; nutrition_gap=21; next=data/review/food_v2_title_quality_audit.csv
- Royal Canin Veterinary Diet: customer_impact=50; title_risk=16; duplicate_risk=6; nutrition_gap=12; next=data/review/food_v2_title_quality_audit.csv
- JosiDog: customer_impact=47; title_risk=35; duplicate_risk=2; nutrition_gap=7; next=data/review/food_v2_title_quality_audit.csv
- Hill's Prescription Diet: customer_impact=46; title_risk=28; duplicate_risk=7; nutrition_gap=12; next=data/review/food_v2_title_quality_audit.csv
- Happy Dog: customer_impact=39; title_risk=8; duplicate_risk=7; nutrition_gap=13; next=data/review/food_v2_nutrient_gap_priorities.csv
- Acana: customer_impact=39; title_risk=8; duplicate_risk=10; nutrition_gap=8; next=data/review/food_v2_duplicate_merge_risk_audit.csv
- Orijen: customer_impact=39; title_risk=8; duplicate_risk=10; nutrition_gap=8; next=data/review/food_v2_duplicate_merge_risk_audit.csv

## Title Cleanup Hotspots

- Josera: title_risk=100; title issues=69; identities=68; next step: Filter duplicate audit by brand/canonical identity, choose one customer-facing survivor, then keep other rows as evidence/backfill only.
- Ambrosia: title_risk=85; title issues=94; identities=28; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
- Belcando: title_risk=69; title issues=68; identities=26; next step: Filter duplicate audit by brand/canonical identity, choose one customer-facing survivor, then keep other rows as evidence/backfill only.
- Brit: title_risk=47; title issues=39; identities=19; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
- JosiDog: title_risk=35; title issues=24; identities=24; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
- Calibra: title_risk=33; title issues=44; identities=10; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
- Hill's Prescription Diet: title_risk=28; title issues=22; identities=9; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
- Hills: title_risk=24; title issues=16; identities=8; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
- Royal Canin: title_risk=20; title issues=12; identities=6; next step: Filter duplicate audit by brand/canonical identity, choose one customer-facing survivor, then keep other rows as evidence/backfill only.
- Black Olympus: title_risk=17; title issues=22; identities=5; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.

## Duplicate Cleanup Hotspots

- Royal Canin: duplicate_risk=98; duplicate groups=56; next step: Filter duplicate audit by brand/canonical identity, choose one customer-facing survivor, then keep other rows as evidence/backfill only.
- Josera: duplicate_risk=15; duplicate groups=3; next step: Filter duplicate audit by brand/canonical identity, choose one customer-facing survivor, then keep other rows as evidence/backfill only.
- Belcando: duplicate_risk=14; duplicate groups=4; next step: Filter duplicate audit by brand/canonical identity, choose one customer-facing survivor, then keep other rows as evidence/backfill only.
- Brit: duplicate_risk=10; duplicate groups=0; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
- Acana: duplicate_risk=10; duplicate groups=2; next step: Filter duplicate audit by brand/canonical identity, choose one customer-facing survivor, then keep other rows as evidence/backfill only.
- Orijen: duplicate_risk=10; duplicate groups=2; next step: Filter duplicate audit by brand/canonical identity, choose one customer-facing survivor, then keep other rows as evidence/backfill only.
- Hills: duplicate_risk=9; duplicate groups=0; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
- Ambrosia: duplicate_risk=7; duplicate groups=0; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
- Hill's Prescription Diet: duplicate_risk=7; duplicate groups=0; next step: Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.
- Happy Dog: duplicate_risk=7; duplicate groups=0; next step: Filter nutrient gaps by brand and backfill kcal, ash, calcium/phosphorus from official pages, PDFs, labels or trusted retailers.

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