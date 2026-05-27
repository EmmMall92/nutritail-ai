# Food Backfill Priority Queue

Generated: 2026-05-27T20:46:59.863Z

## Summary

- Total formulas reviewed: 38
- Backfill queue rows: 29
- High priority: 3
- Medium priority: 26
- Low priority: 0
- CSV queue: data/review/food_backfill_priority_queue.csv
- JSON queue: data/review/food_backfill_priority_queue.json
- Evidence request templates: reports/food_backfill_evidence_requests.md

## High Priority

- Royal Canin - Maxi Adult 5+: status=needs_review; missing_core=kcal_per_100g, calcium_percent, phosphorus_percent; missing_optional_minerals=sodium_percent, magnesium_percent; evidence=official_pdf_or_label_photo; source=https://www.royalcanin.com/uk/dogs/products/retail-products/maxi-adult-5%2B-3008
- Royal Canin - Mini Adult: status=needs_review; missing_core=calcium_percent, phosphorus_percent; missing_optional_minerals=sodium_percent, magnesium_percent; evidence=official_pdf_or_label_photo; source=https://www.royalcanin.com/uk/dogs/products/retail-products/mini-adult-3001
- Royal Canin - Mini Digestive Care: status=needs_review; missing_core=kcal_per_100g, calcium_percent, phosphorus_percent; missing_optional_minerals=sodium_percent, magnesium_percent; evidence=official_pdf_or_label_photo; source=https://www.royalcanin.com/uk/dogs/products/retail-products/digestive-care-mini-2447

## Medium Priority

- Ambrosia - Beef & Fresh Salmon: status=partial; missing_optional_minerals=sodium_percent, magnesium_percent; evidence=official_pdf_manufacturer_response_or_label_photo; source=https://ambrosiapetfood.com/el/products/beef-fresh-salmon/
- Ambrosia - Chicken & Fresh Fish: status=partial; missing_optional_minerals=sodium_percent, magnesium_percent; evidence=official_pdf_manufacturer_response_or_label_photo; source=https://ambrosiapetfood.com/el/products/chicken-fresh-fish/
- Ambrosia - Chicken & Fresh Salmon: status=partial; missing_optional_minerals=sodium_percent, magnesium_percent; evidence=official_pdf_manufacturer_response_or_label_photo; source=https://ambrosiapetfood.com/el/products/chicken-fresh-salmon/
- Ambrosia - Chicken & Veggies: status=partial; missing_optional_minerals=sodium_percent, magnesium_percent; evidence=official_pdf_manufacturer_response_or_label_photo; source=https://ambrosiapetfood.com/el/products/chicken-veggies/
- Ambrosia - Fresh Duck: status=partial; missing_optional_minerals=sodium_percent, magnesium_percent; evidence=official_pdf_manufacturer_response_or_label_photo; source=https://ambrosiapetfood.com/el/products/fresh-duck/
- Ambrosia - Fresh Lamb: status=partial; missing_optional_minerals=sodium_percent, magnesium_percent; evidence=official_pdf_manufacturer_response_or_label_photo; source=https://ambrosiapetfood.com/el/products/fresh-lamb/
- Ambrosia - Fresh Salmon & Chicken: status=partial; missing_optional_minerals=sodium_percent, magnesium_percent; evidence=official_pdf_manufacturer_response_or_label_photo; source=https://ambrosiapetfood.com/el/products/fresh-salmon-chicken/
- Ambrosia - Fresh Salmon & Rabbit: status=partial; missing_optional_minerals=sodium_percent, magnesium_percent; evidence=official_pdf_manufacturer_response_or_label_photo; source=https://ambrosiapetfood.com/el/products/fresh-salmon-rabbit/
- Ambrosia - Fresh Salmon & Turkey: status=partial; missing_optional_minerals=sodium_percent, magnesium_percent; evidence=official_pdf_manufacturer_response_or_label_photo; source=https://ambrosiapetfood.com/el/products/fresh-salmon-turkey/
- Ambrosia - Fresh Sardine & Cod: status=partial; missing_optional_minerals=sodium_percent, magnesium_percent; evidence=official_pdf_manufacturer_response_or_label_photo; source=https://ambrosiapetfood.com/el/products/fresh-sardine-cod/
- Ambrosia - Fresh Sardine & Tuna: status=partial; missing_optional_minerals=sodium_percent, magnesium_percent; evidence=official_pdf_manufacturer_response_or_label_photo; source=https://ambrosiapetfood.com/el/products/fresh-sardine-tuna/
- Ambrosia - Fresh Turkey: status=partial; missing_optional_minerals=sodium_percent, magnesium_percent; evidence=official_pdf_manufacturer_response_or_label_photo; source=https://ambrosiapetfood.com/el/products/fresh-turkey/
- Ambrosia - Fresh Turkey & Chicken: status=partial; missing_optional_minerals=sodium_percent, magnesium_percent; evidence=official_pdf_manufacturer_response_or_label_photo; source=https://ambrosiapetfood.com/el/products/fresh-turkey-chicken/
- Ambrosia - Fresh Turkey & Duck: status=partial; missing_optional_minerals=sodium_percent, magnesium_percent; evidence=official_pdf_manufacturer_response_or_label_photo; source=https://ambrosiapetfood.com/el/products/fresh-turkey-duck/
- Ambrosia - Fresh Turkey & Rabbit: status=partial; missing_optional_minerals=sodium_percent, magnesium_percent; evidence=official_pdf_manufacturer_response_or_label_photo; source=https://ambrosiapetfood.com/el/products/fresh-turkey-rabbit/
- Ambrosia - Fresh Turkey & Salmon: status=partial; missing_optional_minerals=sodium_percent, magnesium_percent; evidence=official_pdf_manufacturer_response_or_label_photo; source=https://ambrosiapetfood.com/el/products/fresh-turkey-salmon/
- Ambrosia - Fresh Venison & Lamb: status=partial; missing_optional_minerals=sodium_percent, magnesium_percent; evidence=official_pdf_manufacturer_response_or_label_photo; source=https://ambrosiapetfood.com/el/products/fresh-venison-lamb/
- Ambrosia - Lamb & Fresh Salmon: status=partial; missing_optional_minerals=sodium_percent, magnesium_percent; evidence=official_pdf_manufacturer_response_or_label_photo; source=https://ambrosiapetfood.com/el/products/lamb-fresh-salmon/
- Farmina - N&D Ancestral Grain Chicken & Pomegranate Puppy Mini: status=partial; missing_optional_minerals=sodium_percent, magnesium_percent; evidence=official_pdf_manufacturer_response_or_label_photo; source=https://www.farmina.com/mt/eshop/dog-food/n%26d-ancestral-grain-dog/106-chicken-%26-pomegranate-puppy-mini.html
- Farmina - N&D Pumpkin Chicken and Pomegranate Adult Mini: status=partial; missing_optional_minerals=sodium_percent, magnesium_percent; evidence=official_pdf_manufacturer_response_or_label_photo; source=https://www.farmina.com/mt/eshop/dog-food/n%26d-pumpkin-dog/390-chicken-and-pomegranate-adult-mini.html

## Recommended Backfill Workflow

1. Resolve high-priority rows first: missing kcal, calcium, or phosphorus blocks confident recommendations.
2. Use official manufacturer pages or PDFs before retailer sources.
3. Use label photos only for rows that official sources cannot complete.
4. Keep rows as partial or needs_review until source evidence is strong enough.
5. Re-run npm run review:backfill after every batch.
