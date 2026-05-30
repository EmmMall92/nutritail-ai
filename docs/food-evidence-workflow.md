# Food Evidence Workflow

Use this workflow for foods that remain in `hold` because calories, minerals,
ingredients, or official source URLs are missing.

## Evidence Set

For each formula, collect as many of these as possible:

- Front of pack
- Barcode / EAN
- Ingredients or composition panel
- Analytical constituents / guaranteed analysis panel
- Calorie / ME panel
- Pack size
- Official product URL or manufacturer PDF URL

## Manifest

Start from:

`data/templates/food-evidence-manifest-template.csv`

Save each working batch under:

`data/review/food_evidence_manifest_<batch>.csv`

## Matching Order

1. `barcode`
2. `formula_key`
3. exact `brand_guess` + `formula_name_guess` + `market`
4. manual review

## Review Rule

Evidence can fill missing fields, but it should not automatically commit a
food. Run it through Food V2 Preview first, then commit only rows that pass
validation.
