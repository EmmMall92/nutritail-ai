# Royal Canin Core Backfill Review

Generated at: 2026-05-27

## Summary

- Reviewed 3 high-priority Royal Canin rows from the cleanup plan.
- No canonical nutrition values were changed in this pass.
- Official Royal Canin UK pages still do not publish the missing calcium/phosphorus values for these rows.
- Cross-market/retailer fallback values were found, but rejected because they do not safely match the current UK formula details.

## Reviewed Rows

- Royal Canin Mini Adult: official UK page confirms metabolisable energy and core macros, but calcium and phosphorus remain missing.
- Royal Canin Maxi Adult 5+: official UK page confirms protein, fat, fibre, and ash, but kcal, calcium, and phosphorus remain missing.
- Royal Canin Mini Digestive Care: official UK page confirms protein, fat, fibre, and ash, but kcal, calcium, and phosphorus remain missing.

## Candidate Evidence Decision

Fallback sources can be useful for search, but they should not overwrite the canonical row when the market or analytical panel does not match the official UK page. For this batch, the safer decision is to keep the Royal Canin rows as `needs_review` and collect exact pack-label evidence.

## Next Step

Collect current UK/GR package photos or an official Royal Canin technical sheet for:

- front of pack
- barcode
- analytical constituents panel
- calorie / metabolisable energy panel
- pack size and market/language marker

Then re-run:

```text
npm run review:foods
npm run plan:food-cleanup
```
