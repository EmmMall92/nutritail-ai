# Food V2 Import Merge Policy

Generated: 2026-06-01

## Purpose

This checklist defines how Food V2 imports should handle better evidence over time.

## Rules

- Label kcal from a source page must override older estimated kcal.
- Estimated kcal must not overwrite existing label kcal.
- Higher-priority existing energy values are preserved when the incoming row has weaker evidence.
- Label ash is preserved when an incoming row has no declared ash.
- Incoming label ash is allowed to update an existing ash value.
- Retailer rows remain `needs_review` and `is_recommendable=false` until human QA.
- Pack-size duplicates should stay formula-level through `formula_key` and source notes.

## Admin Preview Expectations

- `Label kcal` shows rows with source-backed energy.
- `Estimated kcal` shows rows using calculated fallback energy.
- `Label ash` shows rows with declared ash.
- `Retailer rows` confirms rows that need QA before publish.
- `Official rows` confirms manufacturer-backed rows.

## QA Before Commit

- Review `estimatedEnergyRows` before committing.
- Prefer rows with `label_energy_used=true` over `kcal_estimated=true`.
- Check any high-impact medical/veterinary foods manually.
- Keep `is_recommendable=false` for retailer imports until the row is reviewed.
