# Schesir Food V2 DB Merge Cleanup

Generated: 2026-06-04T19:11:28.001Z
Mode: execute

## Summary

- Pairs configured: 3
- Duplicates merged: 3
- Duplicates that would be merged: 0
- Skipped: 0
- Cleanup CSV: data/review/schesir_food_v2_db_merge_cleanup.csv

## Scope

This script only handles the three Schesir duplicate pairs that were identified by the prior DB audit. It keeps the cleaner canonical Food V2 row, copies any missing source evidence from the older duplicate row, appends a merge note, and then deletes only the older duplicate product row in execute mode.

## Results

- merged_duplicate: schesir-dry-medium-maintenance-chicken-dog-dry-gr-document -> schesir|adult-medium-chicken|dog|dry (sources copied: 0, skipped: 1)
- merged_duplicate: schesir-dry-kitten-cat-dry-gr-document -> schesir|kitten-chicken|cat|dry (sources copied: 0, skipped: 1)
- merged_duplicate: schesir-cat-sterilized-light-cat-dry-gr-document -> schesir|sterilized-light-chicken|cat|dry (sources copied: 0, skipped: 1)
