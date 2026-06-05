# Food V2 Controlled Import Round 1

Generated: 2026-06-05T17:13:44.453Z

## Summary

- Round 1 brands: 3
- Round 1 preview rows: 30
- Max target rows: 30
- Source batch plan: data/review/food_v2_brand_import_batches.csv
- Review CSV: data/review/food_v2_controlled_import_round1_brands.csv
- Import preview CSV: data/imports/food_v2_controlled_import_round1_preview.csv

## Selected Brands

- #1 Farmina: 12 rows, score 100, source filter retailer
- #2 Harper & Bone: 11 rows, score 100, source filter retailer
- #3 Acana: 7 rows, score 100, source filter retailer

## Admin Workflow

1. Open /admin/foods/v2-preview.
2. Load Best Candidates.
3. For each selected brand, apply the brand/source/quality filters listed in data/review/food_v2_controlled_import_round1_brands.csv.
4. Run Check Existing.
5. Export selected review CSV.
6. Commit Selected only if duplicate groups and titles look safe.

## Safety Rule

This plan does not write to Supabase. Keep Round 1 as a controlled pilot before large brands such as Brit or Josera, even when those brands have strong scores.
