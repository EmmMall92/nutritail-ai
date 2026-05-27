# Foods Data Quality Summary

Generated at: 2026-05-27T10:27:07.050Z

## Dataset Snapshot

- Canonical food rows: 38
- Missing photo queue rows: 29
- Total quality issues tracked: 115

## Food Rows By Status

- partial: 26
- verified: 9
- needs_review: 3

## Issues By Priority

- medium: 104
- high: 11

## Issues By Type

- missing_optional_mineral: 52
- missing_photo_queue: 29
- partial_row: 26
- missing_core_field: 8

## Issues By Brand

- Ambrosia: 72
- Virbac: 18
- Royal Canin: 17
- Farmina: 8

## High Priority Sample

- Royal Canin - Mini Adult: missing_core_field (calcium_percent)
- Royal Canin - Mini Adult: missing_core_field (phosphorus_percent)
- Royal Canin - Maxi Adult 5+: missing_core_field (kcal_per_100g)
- Royal Canin - Maxi Adult 5+: missing_core_field (calcium_percent)
- Royal Canin - Maxi Adult 5+: missing_core_field (phosphorus_percent)
- Royal Canin - Mini Digestive Care: missing_core_field (kcal_per_100g)
- Royal Canin - Mini Digestive Care: missing_core_field (calcium_percent)
- Royal Canin - Mini Digestive Care: missing_core_field (phosphorus_percent)
- Royal Canin - Mini Adult: missing_photo_queue (missing_fields)
- Royal Canin - Maxi Adult 5+: missing_photo_queue (missing_fields)
- Royal Canin - Mini Digestive Care: missing_photo_queue (missing_fields)

## Recommended Workflow

- Work high priority suspicious values first.
- Backfill sodium and magnesium from official sheets or label photos.
- Keep partial rows partial until both optional minerals are present.
- Re-run `npm run review:foods` after every dataset batch.
