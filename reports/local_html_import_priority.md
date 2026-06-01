# Local HTML Import Priority Plan

Generated: 2026-06-01T19:36:48.120Z

## Summary

- Source import rows: 391
- Duplicate-reviewed formula keys: 33
- Output rows: 391

## Priority Buckets

- commit_first_after_qa: 137
- commit_after_kcal_review: 211
- commit_after_basic_review: 7
- possible_duplicate_review: 22
- duplicate_review_first: 11
- review_later: 3

## Kcal Status

- label: 164
- estimated: 227

## Recommended Workflow

1. Review `commit_first_after_qa` first and commit selected rows from Admin Food V2.
2. Review `possible_duplicate_review` before importing, especially exact or near Acana/Royal/Josera matches.
3. Use `commit_after_kcal_review` only when estimated kcal is acceptable or official kcal is unavailable.
4. Keep `needs_kcal_backfill` for official source search, label photos, or later energy calculation review.

## Outputs

- data/review/local_html_import_priority.csv