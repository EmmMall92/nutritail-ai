# Food V2 Best Candidate Preview Export

Generated: 2026-06-04T20:04:49.700Z

## Summary

- Importable best candidate rows exported: 275
- Candidate groups considered: 284
- Already-imported canonical rows skipped: 9
- Missing source rows skipped: 0
- Existing DB canonical check: enabled
- Output CSV: data/imports/food_v2_best_candidate_preview.csv

## By Source Priority

- official: 155
- retailer: 120

## By Brand

- Royal Canin: 125
- Josera: 68
- JosiDog: 24
- Calibra: 10
- Hill's Prescription Diet: 8
- Carnilove: 5
- Royal Canin Veterinary Diet: 5
- Wolf of Wilderness: 4
- Ambrosia: 3
- Eukanuba: 3
- Hill's Science Plan: 3
- Royal Canin Size: 3
- ACANA: 2
- Briantos: 2
- Schesir: 2
- Akvatera: 1
- Black Olympus: 1
- Burns: 1
- Cennamo: 1
- Happy Dog: 1
- Markus Mühle: 1
- Purina Pro Plan Veterinary Diets: 1
- Royal Canin Breed: 1

## By Dataset

- data/imports/category_product_sources_extract_v2.csv: 142
- data/imports/gatoskilo_royal_canin_dog_html_batch_v2.csv: 62
- data/imports/royal_canin_gr_product_extract_v2.csv: 62
- data/imports/external_product_sources_extract_v2.csv: 4
- data/imports/petshop88_product_extract_v2.csv: 2
- data/imports/retailer_source_backfill_v2.csv: 2
- data/imports/gatoskilo_product_extract_v2.csv: 1

## Already Imported Canonical Rows Skipped

- schesir|adult medium chicken|dog|dry: Schesir Dry Medium Maintenance Chicken
- schesir|adult small chicken rice|dog|dry: Schesir Dry Small Maintenance με κοτόπουλο
- schesir|sterilized light chicken|cat|dry: Schesir Cat Sterilized & Light με κοτόπουλο
- schesir|kitten chicken|cat|dry: Schesir Dry Kitten με κοτόπουλο
- schesir|adult small pork ham|dog|dry: Schesir Adult Small με Χοιρινό Προσούτο
- schesir|adult small fish and rice|dog|dry: Schesir Adult Small με Ψάρι & Ρύζι
- schesir|mature medium chicken|dog|dry: Schesir Mature Medium με Κοτόπουλο
- schesir|puppy large chicken|dog|dry: Schesir Puppy Large με Κοτόπουλο
- schesir|puppy medium chicken|dog|dry: Schesir Puppy Medium με Κοτόπουλο

## Operating Rule

This file contains one best candidate row per canonical formula identity. It is intended for Admin Food V2 preview before commit. Alternative rows remain in the dedupe review files as evidence/backfill references.

Rows are skipped from this export when the same canonical food identity already exists in Food V2, even if the old source formula_key is different. This prevents re-importing the same formula from another site, PDF, or pack-size source.
