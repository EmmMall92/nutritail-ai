# Gatoskilo Food V2 Review Queue Integration

Generated: 2026-06-01

## Purpose

The Gatoskilo local HTML batch now feeds the admin Food V2 review queue, so the extracted rows can be filtered and exported from `/admin/foods/v2-review` without manually hunting for the generated CSV.

## Queue Mapping

- `importable_after_qa` rows become `candidate` queue rows.
- `needs_backfill` rows become `hold` queue rows.
- Source dataset is `data/imports/gatoskilo_local_html_batch_v2.csv`.
- Source priority remains `retailer`.
- Quality status remains `needs_review`.

## Current Gatoskilo Batch

- Formula rows exported: 391
- Candidate rows added to queue: 370
- Hold/backfill rows added to queue: 21
- Pack-size duplicates already skipped by extractor: 113

## Admin Workflow

1. Open `/admin/foods/v2-review`.
2. Filter Source file to `data/imports/gatoskilo_local_html_batch_v2.csv`.
3. Filter Decision to `candidate`.
4. Download preview CSV.
5. Open `/admin/foods/v2-preview`.
6. Upload/check the preview CSV.
7. Commit selected rows only after QA.
