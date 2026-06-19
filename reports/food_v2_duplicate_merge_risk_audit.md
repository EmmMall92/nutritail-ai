# Food V2 Duplicate Merge Risk Audit

Generated: 2026-06-19T02:18:01.852Z

## Summary

- Groups analyzed: 337
- High risk groups: 0
- Medium risk groups: 41
- Low risk groups: 40
- Hold groups: 256
- Output CSV: data/review/food_v2_duplicate_merge_risk_audit.csv

## High Risk Groups

- none

## Medium Risk Groups

- Schesir Dry Medium Maintenance Chicken: multiple_importable_candidates; action=Use conflict check before commit. Import only one survivor for this canonical identity.
- Schesir Dry Small Maintenance με κοτόπουλο: multiple_importable_candidates; action=Use conflict check before commit. Import only one survivor for this canonical identity.
- Royal Canin Bulldog Puppy: multiple_importable_candidates; action=Use conflict check before commit. Import only one survivor for this canonical identity.
- Royal Canin Chihuahua Adult: multiple_importable_candidates; action=Use conflict check before commit. Import only one survivor for this canonical identity.
- Royal Canin Chihuahua Puppy: multiple_importable_candidates; action=Use conflict check before commit. Import only one survivor for this canonical identity.
- Royal Canin French Bulldog Adult: multiple_importable_candidates; action=Use conflict check before commit. Import only one survivor for this canonical identity.
- Royal Canin Shih Tzu Adult: multiple_importable_candidates; action=Use conflict check before commit. Import only one survivor for this canonical identity.
- Royal Canin West Highland White Terrier Adult: multiple_importable_candidates; action=Use conflict check before commit. Import only one survivor for this canonical identity.
- Acana Prairie Poultry 9.7kg: multiple_importable_candidates; action=Use conflict check before commit. Import only one survivor for this canonical identity.
- Briantos Adult Grain-Free Duck & Potato: multiple_importable_candidates; action=Use conflict check before commit. Import only one survivor for this canonical identity.
- Josera Active Nature: multiple_importable_candidates; action=Use conflict check before commit. Import only one survivor for this canonical identity.
- Josera MINI JUNIOR DUCK & SALMON: multiple_importable_candidates; action=Use conflict check before commit. Import only one survivor for this canonical identity.
- Royal Canin Beagle Adult: multiple_importable_candidates; action=Use conflict check before commit. Import only one survivor for this canonical identity.
- Royal Canin Boxer Adult: multiple_importable_candidates; action=Use conflict check before commit. Import only one survivor for this canonical identity.
- Royal Canin Bulldog Adult: multiple_importable_candidates; action=Use conflict check before commit. Import only one survivor for this canonical identity.
- Royal Canin Cavalier King Charles Adult: multiple_importable_candidates; action=Use conflict check before commit. Import only one survivor for this canonical identity.
- Royal Canin Cocker Adult: multiple_importable_candidates; action=Use conflict check before commit. Import only one survivor for this canonical identity.
- Royal Canin Dachshund Adult: multiple_importable_candidates; action=Use conflict check before commit. Import only one survivor for this canonical identity.
- Royal Canin Dalmatian Adult: multiple_importable_candidates; action=Use conflict check before commit. Import only one survivor for this canonical identity.
- Royal Canin German Shepherd Adult 11kg: multiple_importable_candidates; action=Use conflict check before commit. Import only one survivor for this canonical identity.

## Operating Rule

High-risk groups should never be auto-merged. Medium-risk groups should run through the admin conflict check and keep only one survivor per canonical identity. Low-risk groups are likely source/pack-size evidence duplicates, but still need a quick title/source spot-check.
