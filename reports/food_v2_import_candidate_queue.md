# Food V2 Import Candidate Queue

Generated: 2026-05-30T13:43:32.260Z

## Summary

- Queue rows: 81
- Candidate rows: 0
- Hold rows: 81
- Reject rows: 0
- Output CSV: data/review/food_v2_import_candidate_queue.csv

## By Decision

- hold: 81

## By Dataset

- data/imports/wave1_royal_josera_foods_v2.csv: 47
- data/imports/royal_canin_dog_photo_batch_v2.csv: 29
- data/imports/royal_canin_cat_photo_pilot_v2.csv: 5

## Operating Rule

Only candidate rows may move to admin preview for commit. Hold rows stay in review until missing blockers are resolved.
