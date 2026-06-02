# Gatoskilo Local HTML Batch Extract

Generated: 2026-06-02T10:52:20.721Z

## Summary

- htmlFilesScanned: 94
- rawRowsParsed: 94
- formulaRowsExported: 94
- duplicateLocalOrPackRowsSkipped: 0
- parseFailures: 0
- importableAfterQa: 86
- needsEnergyOrMinorBackfill: 0
- needsBackfillOrFailed: 8
- labelKcalRows: 14
- estimatedKcalRows: 80
- labelAshRows: 86
- calciumRows: 13
- phosphorusRows: 11
- sodiumRows: 9
- magnesiumRows: 4
- feedingGuideRows: 94

## Notes

- Rows are formula-level and deduped across local pack-size variants.
- Retailer values are accepted as review evidence, not as verified/recommendable production rows.
- Label kcal and label ash from the HTML override future estimated values during human QA/import.
- Missing kcal is estimated only when proximate analysis is sufficient for a dry-food Modified Atwater estimate.

## Outputs

- data/imports/gatoskilo_royal_canin_dog_html_batch_v2.csv
- data/review/gatoskilo_royal_canin_dog_html_batch_review.csv