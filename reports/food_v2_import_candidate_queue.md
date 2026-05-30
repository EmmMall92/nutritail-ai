# Food V2 Import Candidate Queue

Generated: 2026-05-30T17:27:19.766Z

## Summary

- Queue rows: 1325
- Candidate rows: 0
- Hold rows: 1325
- Reject rows: 0
- Output CSV: data/review/food_v2_import_candidate_queue.csv

## By Decision

- hold: 1325

## By Dataset

- data/imports/mixed_eshop_spreadsheet_extract_v2.csv: 475
- data/imports/dog_dry_eshop_spreadsheet_extract_v2.csv: 179
- data/imports/vet_eshop_document_extract_v2.csv: 154
- data/imports/schesir_gheda_marketplace_ods_extract_v2.csv: 151
- data/imports/gheda_schesir_spreadsheet_extract_v2.csv: 140
- data/imports/wave1_royal_josera_foods_v2.csv: 47
- data/imports/royal_canin_dog_photo_batch_v2.csv: 29
- data/imports/purina_pro_plan_dog_document_extract_v2.csv: 28
- data/imports/aatu_barking_heads_document_extract_v2.csv: 22
- data/imports/josera_document_extract_v2.csv: 22
- data/imports/unica_classe_document_extract_v2.csv: 12
- data/imports/sams_field_document_extract_v2.csv: 11
- data/imports/belcando_document_extract_v2.csv: 10
- data/imports/cat_dry_analysis_document_extract_v2.csv: 8
- data/imports/purina_cat_chow_document_extract_v2.csv: 7
- data/imports/ambrosia_document_extract_v2.csv: 6
- data/imports/unica_natura_document_extract_v2.csv: 6
- data/imports/royal_canin_cat_photo_pilot_v2.csv: 5
- data/imports/schesir_dry_document_extract_v2.csv: 5
- data/imports/acana_document_extract_v2.csv: 4
- data/imports/orijen_document_extract_v2.csv: 4

## Operating Rule

Only candidate rows may move to admin preview for commit. Hold rows stay in review until missing blockers are resolved.
