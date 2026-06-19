# Food V2 Title Quality Audit

Generated: 2026-06-19T03:06:56.133Z

## Summary

- Rows reviewed: 757
- Food V2 candidate rows reviewed: 552
- Source registry rows reviewed: 205
- Audit findings: 315
- Manual cleanup findings: 0
- Auto-cleanup/info findings: 315
- Rows with high/critical title issues: 0
- Rows without manual title issues: 757
- Output CSV: data/review/food_v2_title_quality_audit.csv

## Issues By Severity

- info: 315

## Issues By Type

- formula_name_brand_prefix_auto_cleaned: 144
- source_registry_fallback_formula_name_too_long: 47
- source_registry_fallback_formula_name_starts_with_brand: 46
- source_registry_fallback_formula_name_looks_like_description: 30
- medical_claim_product_line_ok: 22
- source_registry_fallback_formula_contains_pack_or_offer: 20
- source_registry_fallback_medical_claim_used_as_name: 5
- source_registry_fallback_display_name_too_long: 1

## High/Critical Issues By Brand

- none

## Medium Cleanup Focus By Brand

- none

## Recommended Next Step

No high/critical title issues were found. Work through the medium cleanup brands above when polishing customer-facing names.

## Inputs

- Food V2 candidates: data/imports/food_v2_best_candidate_preview.csv
- Source registry: data/sources/category_product_sources_registry.csv

## Title Cleanup Policy

- Customer-facing names should look like product names, not SEO descriptions.
- Prefer Gatoskilo titles when they are clean product titles, then official/PDF titles, then other retailers, with Petsamolis last.
- Keep `formula_name` concise and keep the brand in `display_name`.
- Full playbook: docs/food-v2-title-cleanup-playbook.md