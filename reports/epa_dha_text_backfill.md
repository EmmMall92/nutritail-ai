# EPA/DHA Text Backfill

Generated: 2026-06-04T16:46:50.257Z

## Summary

- Files changed: 6
- Newly backfilled values this run: 20
- Newly backfilled DHA values: 12
- Newly backfilled EPA values: 8
- Rows with EPA/DHA text backfill flags now: 15
- DHA values flagged from text now: 12
- EPA values flagged from text now: 8
- Ambiguous combined mentions left for review: 30
- Conflicting values left for review: 0
- Review CSV: data/review/epa_dha_text_backfill_review.csv

## Rule

Only exact separate EPA/DHA values are auto-filled. Combined values such as "EPA/DHA: 4 g" or "EPA + DHA: 0.4%" are not split automatically.

## Changed Files

- data/imports/dog_dry_eshop_spreadsheet_extract_v2.csv
- data/imports/gatoskilo_local_html_batch_v2.csv
- data/imports/mixed_eshop_spreadsheet_extract_v2.csv
- data/imports/petshop88_product_extract_v2.csv
- data/imports/purina_official_enrichment_extract_v2.csv
- data/imports/retailer_source_backfill_v2.csv

## Current Backfill Coverage

- data/imports/dog_dry_eshop_spreadsheet_extract_v2.csv: 2 rows (2 DHA, 2 EPA)
- data/imports/gatoskilo_local_html_batch_v2.csv: 1 rows (1 DHA, 0 EPA)
- data/imports/mixed_eshop_spreadsheet_extract_v2.csv: 1 rows (1 DHA, 1 EPA)
- data/imports/petshop88_product_extract_v2.csv: 1 rows (1 DHA, 1 EPA)
- data/imports/purina_official_enrichment_extract_v2.csv: 9 rows (6 DHA, 3 EPA)
- data/imports/retailer_source_backfill_v2.csv: 1 rows (1 DHA, 1 EPA)
