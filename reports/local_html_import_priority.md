# Local HTML Import Priority Plan

Generated: 2026-06-01T20:06:21.896Z

## Summary

- Source import rows: 564
- Duplicate-reviewed formula keys: 32
- Output rows: 564

## Priority Buckets

- commit_first_after_qa: 271
- commit_after_kcal_review: 245
- commit_after_basic_review: 16
- possible_duplicate_review: 23
- duplicate_review_first: 9

## Kcal Status

- label: 297
- estimated: 267

## Recommended Workflow

1. Review `commit_first_after_qa` first and commit selected rows from Admin Food V2.
2. Review `possible_duplicate_review` before importing, especially exact or near Acana/Royal/Josera matches.
3. Use `commit_after_kcal_review` only when estimated kcal is acceptable or official kcal is unavailable.
4. Keep `needs_kcal_backfill` for official source search, label photos, or later energy calculation review.

## Outputs

- data/review/local_html_import_priority.csv