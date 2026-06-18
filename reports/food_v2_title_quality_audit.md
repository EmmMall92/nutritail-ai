# Food V2 Title Quality Audit

Generated: 2026-06-18T20:42:58.319Z

## Summary

- Candidate rows reviewed: 553
- Issue rows: 151
- Candidate rows with high/critical title issues: 0
- Candidate rows without title issues: 478
- Output CSV: data/review/food_v2_title_quality_audit.csv

## Issues By Severity

- medium: 151

## Issues By Type

- retailer_title_needs_human_review: 75
- formula_contains_pack_or_offer: 57
- medical_claim_used_as_name: 19

## High/Critical Issues By Brand

- none

## Medium Cleanup Focus By Brand

- Brit: 39
- Ambrosia: 16
- Hills: 16
- Belcando: 14
- Royal Canin: 12
- Amanova: 10
- Leonardo: 8
- Naturea: 6
- Briantos: 4
- Canagan: 4
- Royal Canin Veterinary Diet: 4
- Wolf of Wilderness: 4
- BEWI: 2
- Bozita: 2
- Dr. Clauder: 2

## Recommended Next Step

No high/critical title issues were found. Work through the medium cleanup brands above when polishing customer-facing names.

## Title Cleanup Policy

- Customer-facing names should look like product names, not SEO descriptions.
- Prefer Gatoskilo titles when they are clean product titles, then official/PDF titles, then other retailers, with Petsamolis last.
- Keep `formula_name` concise and keep the brand in `display_name`.
- Full playbook: docs/food-v2-title-cleanup-playbook.md