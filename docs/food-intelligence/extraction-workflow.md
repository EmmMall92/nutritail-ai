# Food Intelligence Extraction Workflow

This workflow turns uploaded food evidence into a structured NutriTail nutrition knowledge base without changing the production database schema.

## Goal

Food data quality comes before chatbot UX. Every imported row should be traceable to evidence, normalized into the Food V2 shape, reviewed when incomplete, and safe to use for retrieval or recommendations.

## Current Foundation

- Schema: `supabase/migrations/food_v2_schema.sql`
- Import preview and normalization: `lib/food-v2/importPreview.ts`
- Validation and completeness scoring: `lib/food-v2/validateFood.ts`
- Admin preview/review/export UI: `/admin/foods/v2-preview`, `/admin/foods/v2-review`
- CSV template: `data/templates/nutritail-food-v2-template.csv`
- Source registry: `data/sources/food_source_registry.csv`

## Evidence Flow

1. Store raw evidence outside the app bundle.
   - Official pages: source URL plus extracted text/HTML snapshot when available.
   - Official PDFs: original PDF or extracted text in a private evidence folder.
   - Store photos: private Supabase Storage bucket, never public.

2. Register the source.
   - Add or update `data/sources/food_source_registry.csv`.
   - Mark source tier clearly: official, authorized, photo, or unknown.

3. Extract raw fields.
   - Preserve original label wording for ingredients and analytical constituents.
   - Do not invent missing nutrients.
   - Keep market and basis in `source_notes`, for example: `market=GR; basis=as-fed; source_tier=official`.

4. Normalize to Food V2.
   - Use `data/dictionaries/ingredient_normalization.json` for ingredient signals.
   - Use `data/dictionaries/nutrient_normalization.json` for nutrient names and unit conversions.
   - Write reviewed rows into `data/imports/foods_master.csv` using the exact Food V2 template headers.

5. Preview before commit.
   - Upload/import through `/admin/foods/v2-preview`.
   - Fix missing critical fields, impossible values, and conflicts before commit.

6. Review unresolved rows.
   - Add incomplete or conflicting rows to `data/review/food_v2_review_queue.csv`.
   - Keep `needs_review` rows out of confident chatbot/recommendation language.

7. Commit only safe rows.
   - `verified`: official source and complete enough for confident use.
   - `needs_review`: keep in queue until corroborated.
   - `unknown`: do not import as production food intelligence.

## Master CSV Rules

`data/imports/foods_master.csv` is the canonical working CSV for Food V2 imports. Its headers must match `data/templates/nutritail-food-v2-template.csv` exactly so it can pass through the existing preview/import pipeline.

Rules:

- One row equals one formula, not one bag size.
- Pack size, EAN/barcode, and photo evidence stay in source notes or sidecar review files until a dedicated SKU table exists.
- Nutrient basis is as-fed.
- Missing values remain blank.
- Decimal commas from EU labels must be converted to decimal points before import.
- `source_notes` must include `market=` and `basis=as-fed`.

## Review Queue Rules

Use `data/review/food_v2_review_queue.csv` for:

- missing sodium, magnesium, calcium, phosphorus, calories, or ingredients
- retailer-only evidence
- conflicting values between official page, retailer page, PDF, and photo
- unclear formula identity
- suspected duplicate formula keys

## Verification

Run:

```bash
npm.cmd run review:food-intelligence
npm.cmd run lint
npm.cmd run build
```

The review command checks schema coverage, CSV compatibility, source registry shape, review queue headers, and normalization dictionary coverage.
