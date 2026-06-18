# Food V2 Title Quality Audit

Generated: 2026-06-18T19:37:52.010Z

## Summary

- Candidate rows reviewed: 801
- Issue rows: 227
- Candidate rows with high/critical title issues: 0
- Candidate rows without title issues: 688
- Output CSV: data/review/food_v2_title_quality_audit.csv

## Issues By Severity

- medium: 227

## Issues By Type

- retailer_title_needs_human_review: 113
- formula_contains_pack_or_offer: 91
- medical_claim_used_as_name: 21
- formula_name_starts_with_brand: 2

## High/Critical Issues By Brand

- none

## Medium Cleanup Focus By Brand

- N&D: 54
- Brit: 39
- Ambrosia: 22
- Hills: 16
- Belcando: 14
- Royal Canin: 14
- Amanova: 10
- Josera: 8
- Leonardo: 8
- Naturea: 6
- Briantos: 4
- Canagan: 4
- Purina Pro Plan: 4
- Royal Canin Veterinary Diet: 4
- Schesir: 4

## Recommended Next Step

No high/critical title issues were found. Work through the medium cleanup brands above when polishing customer-facing names.

## Title Cleanup Policy

- Customer-facing names should look like product names, not SEO descriptions.
- Prefer Gatoskilo titles when they are clean product titles, then official/PDF titles, then other retailers, with Petsamolis last.
- Keep `formula_name` concise and keep the brand in `display_name`.
- Full playbook: docs/food-v2-title-cleanup-playbook.md