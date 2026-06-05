# Food V2 Brand Import Batch Plan

Generated: 2026-06-05T17:03:05.867Z

## Summary

- Planned brand batches: 84
- First-wave controlled import candidates: 20
- Second-wave review candidates: 20
- Input: data/review/food_v2_brand_readiness_audit.csv
- CSV: data/review/food_v2_brand_import_batches.csv

## First Wave

- #1 Brit: 49 rows, ready_for_controlled_import, score 100
- #2 N&D: 36 rows, ready_for_controlled_import, score 100
- #3 Club 4 Paws: 18 rows, ready_for_controlled_import, score 100
- #4 Farmina: 12 rows, ready_for_controlled_import, score 100
- #5 Harper & Bone: 11 rows, ready_for_controlled_import, score 100
- #6 Acana: 7 rows, ready_for_controlled_import, score 100
- #7 Hi: 6 rows, ready_for_controlled_import, score 100
- #8 Carnilove: 10 rows, ready_for_controlled_import, score 99
- #9 Naturea: 11 rows, ready_for_controlled_import, score 98
- #10 Orijen: 8 rows, ready_for_controlled_import, score 98
- #11 Pro-Nutrition (Flatazor): 6 rows, ready_for_controlled_import, score 98
- #12 Ambrosia: 11 rows, ready_for_controlled_import, score 96
- #13 Ownat: 9 rows, ready_for_controlled_import, score 96
- #14 Matisse: 5 rows, ready_for_controlled_import, score 95
- #15 Cennamo: 13 rows, ready_for_controlled_import, score 94
- #16 Gemon: 10 rows, ready_for_controlled_import, score 93
- #17 Josera: 97 rows, ready_for_controlled_import, score 91
- #18 JosiDog: 24 rows, ready_for_controlled_import, score 90
- #19 Purina Pro Plan: 13 rows, ready_for_controlled_import, score 90
- #20 Wellness Core: 5 rows, ready_for_controlled_import, score 90

## Second Wave

- #21 Canagan: 6 rows, review_before_import, score 100
- #22 Happy Dog: 18 rows, review_before_import, score 99
- #23 Happy Cat: 14 rows, review_before_import, score 98
- #24 Belcando: 20 rows, review_before_import, score 95
- #25 Leonardo: 10 rows, review_before_import, score 95
- #26 Hill's Prescription Diet: 8 rows, review_before_import, score 95
- #27 Equilibrio: 7 rows, review_before_import, score 95
- #28 Kudo: 7 rows, review_before_import, score 95
- #29 Dr. Clauder: 6 rows, review_before_import, score 95
- #30 Hills: 37 rows, review_before_import, score 94
- #31 Brekkies: 5 rows, review_before_import, score 91
- #32 Trainer: 5 rows, review_before_import, score 90
- #33 Friskies: 5 rows, review_before_import, score 89
- #34 Pedigree: 5 rows, review_before_import, score 89
- #35 Reflex: 19 rows, review_before_import, score 88
- #36 Royal Canin Veterinary Diet: 5 rows, review_before_import, score 87
- #37 Tonus Dog Chow: 5 rows, review_before_import, score 87
- #38 Amanova: 10 rows, review_before_import, score 86
- #39 Royal Canin: 159 rows, review_before_import, score 85
- #40 Taste of the Wild: 7 rows, review_before_import, score 85

## Admin Flow

1. Open /admin/foods/v2-preview.
2. Load Best Candidates.
3. Use the brand/source/quality filters from the CSV.
4. Run Check Existing.
5. Export selected review CSV.
6. Commit selected rows only after duplicate groups look safe.
