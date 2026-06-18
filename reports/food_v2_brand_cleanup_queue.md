# Food V2 Brand Cleanup Queue

Generated: 2026-06-18T21:41:33.009Z

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

## How To Use This

1. Start with high `customer_impact_score` brands because these are most likely to affect visible chatbot recommendations.
2. Resolve `dedupe_before_import` before importing new rows, because duplicate formulas can confuse ranking and food cards.
3. Resolve `title_cleanup` before customer exposure, because product names are what users remember and click.
4. Resolve `nutrient_backfill` before relying on medical, growth, senior, or weight-control confidence.

`title_issue_identities` counts distinct formula/source identities from the title audit and may be higher than committed rows when the source registry has extra candidate rows.

## Operating Rule

Use this as the brand-by-brand cleanup order before broad customer-facing recommendation testing. It does not write to Supabase; it combines title quality, duplicate risk and nutrient gaps into one working queue.