# Food Evidence Photo Intake Guide

Use photos only as fallback evidence when official manufacturer pages or PDFs do not publish calories, sodium, magnesium, barcode, or market-specific pack details.

## Required Photos

- Front of pack: confirms brand, formula family, species, life stage, and pet-size positioning.
- Barcode or GTIN: best pack-level SKU matcher.
- Ingredients or composition panel: source for the ordered ingredients array.
- Analytical constituents or guaranteed analysis panel: source for protein, fat, fiber, calcium, phosphorus, sodium, and magnesium.
- Calorie or metabolizable energy panel: source for `kcal_per_100g`.
- Pack weight panel: sidecar SKU mapping only, not the main formula row.
- Country, language, importer, or market marker if visible.

## File Naming

Use this pattern:

```text
<brand>__<formula_slug>__<market>__<packsize>__<panel>.jpg
```

Example:

```text
hills__science-plan-small-mini-adult-chicken__UK__1.5kg__analysis.jpg
```

Allowed panel labels:

- `front`
- `barcode`
- `ingredients`
- `analysis`
- `calories`
- `weight`
- `market`

## Storage

Store the image set in a private Supabase Storage bucket:

```text
food-evidence/private/<batch-id>/
```

Do not expose photo evidence on public pages or SEO routes.

## Manifest

Add one row per pack to:

```text
data/imports/nutritail_foods_photo_manifest.csv
```

Required matching order:

1. Barcode.
2. Exact brand plus formula name plus pack size plus market.
3. Exact brand plus formula name plus panel text.
4. Manual review.

## Production Rules

- Photo-only rows stay `needs_review`.
- Use photos to backfill an existing formula row only after formula identity is clear.
- Do not create a new production food row for pack-size-only differences.
- Keep formula-level nutrition in the main dataset and pack-level details in the SKU sidecar.
