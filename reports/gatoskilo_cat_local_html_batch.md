# Gatoskilo Local HTML Batch Extract

Generated: 2026-06-20T20:05:15.323Z

## Summary

- htmlFilesScanned: 171
- rawRowsParsed: 171
- formulaRowsExported: 165
- duplicateLocalOrPackRowsSkipped: 6
- parseFailures: 0
- importableAfterQa: 162
- needsEnergyOrMinorBackfill: 0
- needsBackfillOrFailed: 3
- labelKcalRows: 93
- estimatedKcalRows: 72
- labelAshRows: 165
- calciumRows: 128
- phosphorusRows: 136
- sodiumRows: 67
- magnesiumRows: 91
- feedingGuideRows: 156

## Notes

- Rows are formula-level and deduped across local pack-size variants.
- Retailer values are accepted as review evidence, not as verified/recommendable production rows.
- Label kcal and label ash from the HTML override future estimated values during human QA/import.
- Missing kcal is estimated only when proximate analysis is sufficient for a dry-food Modified Atwater estimate.

## Outputs

- data/imports/gatoskilo_cat_local_html_batch_v2.csv
- data/review/gatoskilo_cat_local_html_batch_review.csv