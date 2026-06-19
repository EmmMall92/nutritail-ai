# Food V2 Duplicate Merge Risk Audit

Generated: 2026-06-19T02:33:56.467Z

## Summary

- Groups analyzed: 337
- High risk groups: 0
- Medium risk groups: 3
- Low risk groups: 78
- Hold groups: 256
- Output CSV: data/review/food_v2_duplicate_merge_risk_audit.csv

## High Risk Groups

- none

## Medium Risk Groups

- Schesir Dry Medium Maintenance Chicken: multiple_importable_candidates; action=Use conflict check before commit. Import only one survivor for this canonical identity.
- Schesir Dry Small Maintenance με κοτόπουλο: multiple_importable_candidates; action=Use conflict check before commit. Import only one survivor for this canonical identity.
- Acana Prairie Poultry 9.7kg: multiple_importable_candidates; action=Use conflict check before commit. Import only one survivor for this canonical identity.

## Operating Rule

High-risk groups should never be auto-merged. Medium-risk groups should run through the admin conflict check and keep only one survivor per canonical identity. Low-risk groups are likely source/pack-size evidence duplicates, but still need a quick title/source spot-check.
