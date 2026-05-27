# Foods Data Cleanup Plan

Generated at: 2026-05-27T10:32:54.452Z

## Summary

- Quality issues reviewed: 115
- Cleanup tasks created: 12
- High priority tasks: 2
- Medium priority tasks: 10
- Low priority tasks: 0

## High Priority

- Batch 1: Royal Canin core nutrition backfill: 3 rows; fields=calcium_percent|phosphorus_percent|kcal_per_100g
- Batch 1: Royal Canin label photo evidence: 3 rows; fields=missing_fields

## Medium Priority

- Batch 2: Ambrosia sodium/magnesium backfill: 18 rows; fields=sodium_percent|magnesium_percent
- Batch 2: Ambrosia label photo evidence: 18 rows; fields=missing_fields
- Batch 2: Ambrosia partial status review: 18 rows; fields=data_quality_status
- Batch 2: Farmina sodium/magnesium backfill: 2 rows; fields=sodium_percent|magnesium_percent
- Batch 2: Farmina label photo evidence: 2 rows; fields=missing_fields
- Batch 2: Farmina partial status review: 2 rows; fields=data_quality_status
- Batch 2: Royal Canin sodium/magnesium backfill: 3 rows; fields=sodium_percent|magnesium_percent
- Batch 2: Virbac sodium/magnesium backfill: 6 rows; fields=magnesium_percent
- Batch 2: Virbac label photo evidence: 6 rows; fields=missing_fields
- Batch 2: Virbac partial status review: 6 rows; fields=data_quality_status

## Low Priority

- None

## Operating Rule

- Fix high-priority core gaps before broad mineral backfill.
- Keep source evidence in notes or private photo manifests before changing status to verified.
- Re-run `npm run review:foods` and `npm run plan:food-cleanup` after each food dataset PR.
