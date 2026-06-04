# EPA/DHA Combined Normalization

Generated: 2026-06-04T17:09:49.582Z

## Summary

- Files changed: 0
- Rows normalized: 45
- Current combined rows: 45
- Filled combined values: 0
- Moved duplicate split values to combined: 0
- Review CSV: data/review/epa_dha_combined_normalization_review.csv

## Rule

Rows with clear separate values such as "DHA / EPA 0.7% / 0.5%" keep separate DHA and EPA fields. Rows with one combined label value such as "EPA+DHA: 0.4%" or "EPA + DHA 2.1 g/kg" use epa_dha_percent instead. Suspicious equal EPA/DHA values, especially Royal Canin combined-style rows, are moved to epa_dha_percent and the split fields are cleared.

## By Brand

- Royal Canin: 33
- Purina Pro Plan Veterinary Diets: 6
- Pro-Nutrition (Flatazor): 4
- Royal Canin Breed: 1
- Flatazor: 1

## Changed Files

- none
