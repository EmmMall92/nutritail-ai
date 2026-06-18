# Food V2 Title Quality Audit

Generated: 2026-06-18T21:07:00.751Z

## Summary

- Rows reviewed: 758
- Food V2 candidate rows reviewed: 553
- Source registry rows reviewed: 205
- Issue rows: 574
- Rows with high/critical title issues: 64
- Rows without title issues: 489
- Output CSV: data/review/food_v2_title_quality_audit.csv

## Issues By Severity

- medium: 484
- high: 90

## Issues By Type

- formula_name_starts_with_brand: 190
- retailer_title_needs_human_review: 177
- formula_contains_pack_or_offer: 87
- formula_name_too_long: 59
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

- Ambrosia: 69
- Josera: 69
- Belcando: 55
- Brit: 39
- Calibra: 26
- JosiDog: 24
- Hill's Prescription Diet: 21
- Hills: 16
- Black Olympus: 15
- Amity: 14
- Wolf of Wilderness: 14
- Royal Canin: 12
- Cennamo: 11
- Amanova: 10
- Anima: 10

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