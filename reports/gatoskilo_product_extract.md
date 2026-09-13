# Gatoskilo Product Extract

- Product rows extracted: 0
- Raw local/category pages parsed: 0
- Duplicate local/pack rows skipped: 0
- Registry links queued: 0
- Local HTML/MHTML files scanned: 0
- Importable after QA: 0
- Needs backfill/errors: 1

Outputs:
- data/imports/gatoskilo_product_extract_v2.csv
- data/review/gatoskilo_product_extract_review.csv
- data/sources/gatoskilo_product_link_registry.csv

Retailer rows are marked `needs_review` and `is_recommendable=false` by default. Kcal may be estimated from proximate analysis for dry foods and is recorded in `source_notes`.

Usage:
- Single saved page: `npm run collect:gatoskilo-products -- --local "C:/path/product.html"`
- Folder of saved pages: `npm run collect:gatoskilo-products -- --dir "C:/Users/NIOstb/Desktop/photo_foods_nutritail/gatoskilo"`
- Live category crawl: `npm run collect:gatoskilo-products -- --category "https://www.gatoskilo.gr/981-ksira-trofi-skyloy" --limit 100`