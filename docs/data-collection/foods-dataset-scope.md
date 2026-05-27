# Nutritail Foods Dataset Scope

## Goal

Build `euuk_v1`, a formula-canonical EU/UK pet-food nutrition dataset that can be reviewed and imported into the current Nutritail foods schema without database schema changes.

The first production dataset should improve trust in nutrition scoring by prioritizing official source provenance, consistent unit normalization, and clear handling of missing sodium, magnesium, calories, and market-specific gaps.

## Artifacts

- `data/imports/nutritail_foods_euuk_v1.json`: canonical master export.
- `data/imports/nutritail_foods_euuk_v1.csv`: review and import mirror.
- `data/imports/nutritail_foods_euuk_v1_sku_map.csv`: pack-size, barcode, and photo traceability.
- `data/imports/nutritail_foods_missing_photo_queue.csv`: unresolved rows that need label photos or stronger source evidence.

JSON is the canonical artifact because arrays preserve ingredients and tags losslessly. CSV is a mirror for review and admin import workflows.

## Row Grain

The main foods import is formula-level, not pack-SKU-level. One formula with multiple bag sizes should produce one food row and multiple sidecar SKU rows.

Pack size, barcode, GTIN, and store-photo evidence belong in the SKU sidecar until the database has dedicated formula/SKU tables.

## Market Policy

`euuk_v1` is scoped to UK/EU sources only. Do not mix US and EU values for the same formula family in one production row.

Until dedicated `market`, `basis`, and `moisture_percent` columns exist, put these values in `data_notes`:

```text
market=UK; basis=as-fed; source_tier=official; source_kind=product_page; moisture=8
```

## Source Priority

1. Official manufacturer product pages.
2. Official manufacturer PDFs, veterinary portals, or spec sheets.
3. Authorized retailer or distributor pages.
4. User-supplied private pack photos.

Rows from official sources can be `verified` or `partial`. Retailer-only and photo-only rows should stay `needs_review` until corroborated.

Greek retailer fallbacks currently approved for research and backfill:

- `gatoskilo.gr`
- `petshop88.gr`
- `pet-it.gr`
- `petcity.gr`
- `petsamolis.gr`

Use these sources for Greek-market pack sizes, local availability, barcode clues, translated label text, or missing-field backfill. Do not classify a row as `verified` from these sources alone.

## Quality Classification

- `verified`: official source, core fields complete, sodium and magnesium present.
- `partial`: official source, core fields complete, one or more optional minerals missing.
- `needs_review`: retailer-only, photo/OCR-only, or conflicting values.
- `unknown`: placeholder or incomplete row that must not be imported.

Core fields for production import:

- `brand`
- `name`
- `species`
- `ingredients`
- `kcal_per_100g`
- `protein_percent`
- `fat_percent`
- `fiber_percent`
- `calcium_percent`
- `phosphorus_percent`
- `data_source_url`
- `data_notes`

## Normalization Rules

- Store all nutrient values as labelled/as-fed values.
- Preserve ingredient order exactly as published.
- Convert `kcal/kg` to `kcal_per_100g` by dividing by 10.
- Convert `kJ/kg` to `kcal_per_100g` by dividing by 4.184 and then by 10.
- Convert `g/kg` minerals to percent by dividing by 10.
- Convert `mg/kg` minerals to percent by dividing by 10000.
- Use lowercase snake_case tags.
- Use pet size segment in `size`, never pack size.

## Photo Evidence Intake

Minimum useful photo set:

- front of pack
- barcode or GTIN
- ingredients/composition panel
- analytical constituents or guaranteed analysis panel
- calorie or metabolizable energy panel
- pack weight
- country, language, or market marker if visible

Recommended private path:

```text
food-evidence/private/<batch-id>/<brand>__<formula_slug>__<market>__<packsize>__<panel>.jpg
```

## Acceptance Criteria

- Dataset version is explicitly `euuk_v1`.
- 100% of staged rows have `data_source_url`.
- 100% of staged rows have `data_notes` containing `market=` and `source_tier=`.
- No `needs_review` or `unknown` rows merge to production.
- No duplicate formula keys in the master dataset.
- `npm run build` passes after scripts/helpers are added.
