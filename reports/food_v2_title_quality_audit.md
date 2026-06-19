# Food V2 Title Quality Audit

Generated: 2026-06-19T02:29:57.426Z

## Summary

- Rows reviewed: 758
- Food V2 candidate rows reviewed: 553
- Source registry rows reviewed: 205
- Audit findings: 359
- Manual cleanup findings: 59
- Auto-cleanup/info findings: 300
- Rows with high/critical title issues: 2
- Rows without manual title issues: 729
- Output CSV: data/review/food_v2_title_quality_audit.csv

## Issues By Severity

- info: 300
- medium: 57
- high: 2

## Issues By Type

- formula_name_brand_prefix_auto_cleaned: 144
- source_registry_fallback_formula_name_too_long: 57
- source_registry_fallback_formula_name_starts_with_brand: 45
- source_registry_fallback_formula_name_looks_like_description: 30
- retailer_title_needs_human_review: 28
- medical_claim_used_as_name: 25
- source_registry_fallback_formula_contains_pack_or_offer: 18
- source_registry_fallback_medical_claim_used_as_name: 5
- formula_contains_pack_or_offer: 3
- formula_name_too_long: 2
- formula_name_starts_with_brand: 1
- source_registry_fallback_display_name_too_long: 1

## High/Critical Issues By Brand

- Hill's Prescription Diet: 1
- Wolf of Wilderness: 1

## Medium Cleanup Focus By Brand

- Hills: 16
- Royal Canin: 12
- Hill's Prescription Diet: 9
- Royal Canin Veterinary Diet: 8
- Briantos: 5
- Brit: 2
- Purina Pro Plan: 2
- Wolf of Wilderness: 2
- Josera: 1

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