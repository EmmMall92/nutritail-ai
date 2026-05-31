# External Product Sources Extract

Generated: 2026-05-31T18:35:16.083Z

## Summary

- Source URLs processed: 4
- Candidate rows for Food V2 review: 4
- Output CSV: data/imports/external_product_sources_extract_v2.csv
- Review CSV: data/review/external_product_sources_extract_review.csv
- Registry CSV: data/sources/external_product_sources_registry.csv

## Rows

- Briantos Adult Grain-Free Duck & Potato: candidate (retailer)
- Josera Active Nature: candidate (official)
- Akvatera Natures Protection Superior Care Sensitive Skin&Stomach Adult Small Breeds Lamb: candidate (retailer)
- Royal Canin Yorkshire Terrier Adult: candidate (official)

## Notes

- Retailer rows are accepted as evidence for filling gaps, but remain `is_recommendable=false` until admin QA.
- Josera is an official product page, but also stays in review because new imports should be checked before recommendations.
- Petsamolis calories are estimated with Modified Atwater because no explicit ME/kcal value was visible on the product page.
