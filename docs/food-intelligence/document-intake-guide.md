# Food Document Intake Guide

Use this guide when new food evidence arrives from brochures, PDFs, manufacturer emails, retailer pages, or store photos.

## Why Intake Exists

The master import file should contain reviewed food rows only. Raw evidence belongs in an intake queue first, so each source can be checked for market, formula identity, missing panels, and trust level before extraction.

## Files

- Template: `data/templates/food-document-intake-template.csv`
- Active queue: `data/review/food_document_intake.csv`
- Validator: `npm.cmd run review:food-documents`

## Intake Statuses

- `new`: evidence was added but not checked.
- `needs_more_photos`: one or more required label panels are missing.
- `ready_for_extraction`: enough evidence exists to extract a Food V2 row.
- `extracted`: data was copied into `data/imports/foods_master.csv` or another reviewed import file.
- `blocked`: evidence cannot be used yet because formula identity, market, or source quality is unclear.
- `rejected`: source is not acceptable for NutriTail canonical food data.

## Source Types

- `official_html`
- `official_pdf`
- `manufacturer_response`
- `authorized_retailer`
- `pack_photo`
- `unknown`

## Evidence Kinds

- `url`
- `pdf`
- `photo_set`
- `email`
- `spreadsheet`
- `mixed`

## Required Photo Panels

For store photos, mark each panel as `yes`, `no`, or `unknown`:

- `has_front_pack`
- `has_barcode`
- `has_ingredients`
- `has_analysis`
- `has_calories`
- `has_feeding_guide`
- `has_pack_weight`

Rows can move to `ready_for_extraction` when they have enough evidence for formula identity, ingredients/composition, analytical constituents, calories, market, and source traceability.

## Operating Rule

Do not paste uncertain data directly into `foods_master.csv`. Add it to `food_document_intake.csv`, run the validator, then extract only rows that are `ready_for_extraction`.
