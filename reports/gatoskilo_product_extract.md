# Gatoskilo Product Extract

- Product rows extracted: 1
- Raw local/category pages parsed: 2
- Duplicate local/pack rows skipped: 1
- Registry links queued: 0
- Local HTML/MHTML files scanned: 2
- Importable after QA: 1
- Needs backfill/errors: 0

Outputs:
- data/imports/gatoskilo_product_extract_v2.csv
- data/review/gatoskilo_product_extract_review.csv
- data/sources/gatoskilo_product_link_registry.csv

Retailer rows are marked `needs_review` and `is_recommendable=false` by default. Kcal may be estimated from proximate analysis for dry foods and is recorded in `source_notes`.

Usage:
- Single saved page: `npm run collect:gatoskilo-products -- --local "C:/path/product.html"`
- Folder of saved pages: `npm run collect:gatoskilo-products -- --dir "C:/Users/NIOstb/Desktop/photo_foods_nutritail/gatoskilo"`
- Live category crawl: `npm run collect:gatoskilo-products -- --category "https://www.gatoskilo.gr/981-ksira-trofi-skyloy" --limit 100`