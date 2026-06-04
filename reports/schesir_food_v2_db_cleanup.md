# Schesir Food V2 DB Cleanup Audit

Generated: 2026-06-04T18:43:55.995Z

## Summary

- Schesir Food V2 rows reviewed: 12
- Duplicate canonical groups: 3
- Cleanup CSV: data/review/schesir_food_v2_db_cleanup.csv

## Recommended Handling

This is a read-only audit. Do not delete rows blindly. For each duplicate canonical group, keep the recommended formula key, compare nutrients/sources in admin, then merge or remove the older duplicate only after review.

## Duplicate Groups

- schesir|kitten-chicken|cat|dry: 2 rows, keep=schesir|kitten-chicken|cat|dry
- schesir|sterilized-light-chicken|cat|dry: 2 rows, keep=schesir|sterilized-light-chicken|cat|dry
- schesir|adult-medium-chicken|dog|dry: 2 rows, keep=schesir|adult-medium-chicken|dog|dry
