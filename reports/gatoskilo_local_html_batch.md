# Gatoskilo Local HTML Batch Extract

Generated: 2026-06-01T17:47:07.590Z

## Summary

- htmlFilesScanned: 504
- rawRowsParsed: 504
- formulaRowsExported: 391
- duplicateLocalOrPackRowsSkipped: 113
- parseFailures: 0
- importableAfterQa: 370
- needsEnergyOrMinorBackfill: 0
- needsBackfillOrFailed: 21
- labelKcalRows: 164
- estimatedKcalRows: 227
- labelAshRows: 384
- calciumRows: 283
- phosphorusRows: 312
- sodiumRows: 119
- magnesiumRows: 55
- feedingGuideRows: 380

## Notes

- Rows are formula-level and deduped across local pack-size variants.
- Retailer values are accepted as review evidence, not as verified/recommendable production rows.
- Label kcal and label ash from the HTML override future estimated values during human QA/import.
- Missing kcal is estimated only when proximate analysis is sufficient for a dry-food Modified Atwater estimate.

## Outputs

- data/imports/gatoskilo_local_html_batch_v2.csv
- data/review/gatoskilo_local_html_batch_review.csv