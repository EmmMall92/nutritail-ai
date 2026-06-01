# Gatoskilo Local HTML Batch Extract

Generated: 2026-06-01T20:06:15.689Z

## Summary

- htmlFilesScanned: 752
- rawRowsParsed: 752
- formulaRowsExported: 564
- duplicateLocalOrPackRowsSkipped: 188
- parseFailures: 0
- importableAfterQa: 540
- needsEnergyOrMinorBackfill: 0
- needsBackfillOrFailed: 24
- labelKcalRows: 297
- estimatedKcalRows: 267
- labelAshRows: 555
- calciumRows: 423
- phosphorusRows: 460
- sodiumRows: 225
- magnesiumRows: 188
- feedingGuideRows: 546

## Notes

- Rows are formula-level and deduped across local pack-size variants.
- Retailer values are accepted as review evidence, not as verified/recommendable production rows.
- Label kcal and label ash from the HTML override future estimated values during human QA/import.
- Missing kcal is estimated only when proximate analysis is sufficient for a dry-food Modified Atwater estimate.

## Outputs

- data/imports/gatoskilo_local_html_batch_v2.csv
- data/review/gatoskilo_local_html_batch_review.csv