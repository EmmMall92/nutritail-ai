# Food V2 Brand Cleanup Queue

Generated: 2026-06-18T20:43:14.190Z

## Summary

- Brands queued: 80
- Top priority brand: Royal Canin
- Output CSV: data/review/food_v2_brand_cleanup_queue.csv

## Queue By Phase

- nutrient_backfill: 41
- title_cleanup: 16
- dedupe_before_import: 8
- small_batch_review: 8
- controlled_import_ready: 7

## Top Cleanup Priorities

- 1. Royal Canin: score 201; dedupe_before_import; rows=29; titles=12; duplicates=56; Ca/P gaps=21
- 2. Brit: score 96; title_cleanup; rows=46; titles=39; duplicates=0; Ca/P gaps=0
- 3. Belcando: score 69; dedupe_before_import; rows=20; titles=14; duplicates=4; Ca/P gaps=0
- 4. Hills: score 67; title_cleanup; rows=37; titles=16; duplicates=0; Ca/P gaps=0
- 5. Ambrosia: score 64; title_cleanup; rows=8; titles=16; duplicates=0; Ca/P gaps=1
- 6. Josera: score 63; dedupe_before_import; rows=54; titles=0; duplicates=3; Ca/P gaps=15
- 7. Royal Canin Veterinary Diet: score 51; title_cleanup; rows=5; titles=4; duplicates=0; Ca/P gaps=4
- 8. Happy Dog: score 39; nutrient_backfill; rows=11; titles=0; duplicates=0; Ca/P gaps=0
- 9. Hill's Prescription Diet: score 36; title_cleanup; rows=8; titles=2; duplicates=0; Ca/P gaps=0
- 10. Acana: score 36; dedupe_before_import; rows=4; titles=0; duplicates=2; Ca/P gaps=0
- 11. Orijen: score 36; dedupe_before_import; rows=4; titles=0; duplicates=2; Ca/P gaps=0
- 12. Farmina: score 35; controlled_import_ready; rows=7; titles=0; duplicates=0; Ca/P gaps=0
- 13. Purina Pro Plan: score 34; title_cleanup; rows=4; titles=2; duplicates=0; Ca/P gaps=2
- 14. Amanova: score 30; title_cleanup; rows=10; titles=10; duplicates=0; Ca/P gaps=10
- 15. Monge: score 30; nutrient_backfill; rows=3; titles=0; duplicates=0; Ca/P gaps=3
- 16. Reflex: score 26; dedupe_before_import; rows=19; titles=0; duplicates=1; Ca/P gaps=13
- 17. Leonardo: score 26; title_cleanup; rows=10; titles=8; duplicates=0; Ca/P gaps=0
- 18. Canagan: score 18; title_cleanup; rows=6; titles=4; duplicates=0; Ca/P gaps=0
- 19. Naturea: score 17; title_cleanup; rows=11; titles=6; duplicates=0; Ca/P gaps=0
- 20. JosiDog: score 16; nutrient_backfill; rows=24; titles=0; duplicates=0; Ca/P gaps=12
- 21. Happy Cat: score 16; nutrient_backfill; rows=14; titles=0; duplicates=0; Ca/P gaps=1
- 22. Taste of the Wild: score 14; nutrient_backfill; rows=7; titles=0; duplicates=0; Ca/P gaps=7
- 23. Brekkies: score 14; nutrient_backfill; rows=5; titles=0; duplicates=0; Ca/P gaps=4
- 24. Trainer: score 14; nutrient_backfill; rows=5; titles=0; duplicates=0; Ca/P gaps=5
- 25. Friskies: score 14; nutrient_backfill; rows=5; titles=0; duplicates=0; Ca/P gaps=5
- 26. Tonus Dog Chow: score 14; nutrient_backfill; rows=5; titles=0; duplicates=0; Ca/P gaps=5
- 27. Equilibrio: score 13; nutrient_backfill; rows=7; titles=0; duplicates=0; Ca/P gaps=0
- 28. Kudo: score 13; nutrient_backfill; rows=7; titles=0; duplicates=0; Ca/P gaps=0
- 29. Pedigree: score 13; nutrient_backfill; rows=5; titles=0; duplicates=0; Ca/P gaps=3
- 30. Briantos: score 13; dedupe_before_import; rows=2; titles=4; duplicates=1; Ca/P gaps=0

## Operating Rule

Use this as the brand-by-brand cleanup order before broad customer-facing recommendation testing. It does not write to Supabase; it combines title quality, duplicate risk and nutrient gaps into one working queue.