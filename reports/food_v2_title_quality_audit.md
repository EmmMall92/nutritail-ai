# Food V2 Title Quality Audit

Generated: 2026-06-19T02:14:09.788Z

## Summary

- Rows reviewed: 758
- Food V2 candidate rows reviewed: 553
- Source registry rows reviewed: 205
- Audit findings: 574
- Manual cleanup findings: 433
- Auto-cleanup/info findings: 141
- Rows with high/critical title issues: 64
- Rows without manual title issues: 580
- Output CSV: data/review/food_v2_title_quality_audit.csv

## Issues By Severity

- medium: 343
- info: 141
- high: 90

## Issues By Type

- retailer_title_needs_human_review: 177
- formula_name_brand_prefix_auto_cleaned: 141
- formula_contains_pack_or_offer: 87
- formula_name_too_long: 59
- formula_name_starts_with_brand: 49
- formula_name_looks_like_description: 30
- medical_claim_used_as_name: 30
- display_name_too_long: 1

## High/Critical Issues By Brand

- Ambrosia: 25
- Calibra: 18
- Belcando: 13
- Anima: 10
- Black Olympus: 7
- Carnilove: 6
- Amity: 5
- Akvatera: 2
- ACANA: 1
- Affinity: 1
- Hill's Prescription Diet: 1
- Wolf of Wilderness: 1

## Medium Cleanup Focus By Brand

- Ambrosia: 64
- Belcando: 44
- Brit: 39
- Calibra: 26
- Hills: 16
- Black Olympus: 15
- Hill's Prescription Diet: 13
- Wolf of Wilderness: 13
- Royal Canin: 12
- Amanova: 10
- Anima: 10
- Briantos: 10
- Leonardo: 8
- Royal Canin Veterinary Diet: 8
- Amity: 7

## Recommended Next Step

Clean high/critical title issues before committing those rows to Food V2. Then work through the medium cleanup brands above.

## Inputs

- Food V2 candidates: data/imports/food_v2_best_candidate_preview.csv
- Source registry: data/sources/category_product_sources_registry.csv

## Title Cleanup Policy

- Customer-facing names should look like product names, not SEO descriptions.
- Prefer Gatoskilo titles when they are clean product titles, then official/PDF titles, then other retailers, with Petsamolis last.
- Keep `formula_name` concise and keep the brand in `display_name`.
- Full playbook: docs/food-v2-title-cleanup-playbook.md