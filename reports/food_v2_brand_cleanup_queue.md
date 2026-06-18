# Food V2 Brand Cleanup Queue

Generated: 2026-06-18T20:26:06.027Z

## Summary

- Brands queued: 84
- Top priority brand: Royal Canin
- Output CSV: data/review/food_v2_brand_cleanup_queue.csv

## Queue By Phase

- nutrient_backfill: 43
- title_cleanup: 17
- dedupe_before_import: 9
- small_batch_review: 8
- controlled_import_ready: 7

## Top Cleanup Priorities

- 1. Royal Canin: score 272; dedupe_before_import; rows=159; titles=14; duplicates=56; Ca/P gaps=143
- 2. N&D: score 118; title_cleanup; rows=36; titles=54; duplicates=0; Ca/P gaps=0
- 3. Josera: score 97; dedupe_before_import; rows=97; titles=8; duplicates=3; Ca/P gaps=38
- 4. Brit: score 97; title_cleanup; rows=49; titles=39; duplicates=0; Ca/P gaps=0
- 5. Schesir: score 74; dedupe_before_import; rows=2; titles=4; duplicates=11; Ca/P gaps=2
- 6. Belcando: score 69; dedupe_before_import; rows=20; titles=14; duplicates=4; Ca/P gaps=0
- 7. Ambrosia: score 69; title_cleanup; rows=11; titles=22; duplicates=0; Ca/P gaps=1
- 8. Hills: score 67; title_cleanup; rows=37; titles=16; duplicates=0; Ca/P gaps=0
- 9. Royal Canin Veterinary Diet: score 51; title_cleanup; rows=5; titles=4; duplicates=0; Ca/P gaps=4
- 10. Purina Pro Plan: score 44; title_cleanup; rows=13; titles=4; duplicates=0; Ca/P gaps=8
- 11. Happy Dog: score 42; nutrient_backfill; rows=18; titles=0; duplicates=0; Ca/P gaps=0
- 12. Orijen: score 40; dedupe_before_import; rows=8; titles=0; duplicates=2; Ca/P gaps=2
- 13. Acana: score 39; dedupe_before_import; rows=7; titles=0; duplicates=2; Ca/P gaps=0
- 14. Farmina: score 36; controlled_import_ready; rows=12; titles=0; duplicates=0; Ca/P gaps=0
- 15. Hill's Prescription Diet: score 36; title_cleanup; rows=8; titles=2; duplicates=0; Ca/P gaps=0
- 16. Amanova: score 30; title_cleanup; rows=10; titles=10; duplicates=0; Ca/P gaps=10
- 17. Monge: score 30; nutrient_backfill; rows=3; titles=0; duplicates=0; Ca/P gaps=3
- 18. ACANA: score 29; small_batch_review; rows=1; titles=0; duplicates=0; Ca/P gaps=0
- 19. Reflex: score 26; dedupe_before_import; rows=19; titles=0; duplicates=1; Ca/P gaps=13
- 20. Leonardo: score 26; title_cleanup; rows=10; titles=8; duplicates=0; Ca/P gaps=0
- 21. Canagan: score 18; title_cleanup; rows=6; titles=4; duplicates=0; Ca/P gaps=0
- 22. Naturea: score 17; title_cleanup; rows=11; titles=6; duplicates=0; Ca/P gaps=0
- 23. JosiDog: score 16; nutrient_backfill; rows=24; titles=0; duplicates=0; Ca/P gaps=12
- 24. Happy Cat: score 16; nutrient_backfill; rows=14; titles=0; duplicates=0; Ca/P gaps=1
- 25. Taste of the Wild: score 14; nutrient_backfill; rows=7; titles=0; duplicates=0; Ca/P gaps=7
- 26. Brekkies: score 14; nutrient_backfill; rows=5; titles=0; duplicates=0; Ca/P gaps=4
- 27. Trainer: score 14; nutrient_backfill; rows=5; titles=0; duplicates=0; Ca/P gaps=5
- 28. Friskies: score 14; nutrient_backfill; rows=5; titles=0; duplicates=0; Ca/P gaps=5
- 29. Tonus Dog Chow: score 14; nutrient_backfill; rows=5; titles=0; duplicates=0; Ca/P gaps=5
- 30. Equilibrio: score 13; nutrient_backfill; rows=7; titles=0; duplicates=0; Ca/P gaps=0

## Operating Rule

Use this as the brand-by-brand cleanup order before broad customer-facing recommendation testing. It does not write to Supabase; it combines title quality, duplicate risk and nutrient gaps into one working queue.