# Royal Canin Core Backfill Review

Generated at: 2026-05-27
Rechecked at: 2026-05-29

## Summary

- Reviewed 3 high-priority Royal Canin rows from the cleanup plan.
- No canonical nutrition values were changed in this pass.
- Official Royal Canin UK pages were rechecked on 2026-05-29 and still do not publish the missing calcium/phosphorus values for these rows.
- Zooplus GR/COM fallback pages were checked for the same formulas.
- Zooplus corroborates ingredients and proximate values for these formulas, but does not publish the missing core kcal/mineral values needed for canonical backfill.
- Cross-market/retailer fallback values remain unsuitable for overwriting the current UK rows unless exact formula and market evidence is captured.

## Reviewed Rows

- Royal Canin Mini Adult: official UK page confirms metabolisable energy 3912 kcal/kg, protein 27.0%, fat 16.0%, fibre 1.4%, and ash 6.8%, but calcium and phosphorus remain missing.
- Royal Canin Maxi Adult 5+: official UK page confirms protein 26.0%, fat 17.0%, fibre 1.6%, and ash 6.4%, but kcal, calcium, and phosphorus remain missing.
- Royal Canin Mini Digestive Care: official UK page confirms protein 30.0%, fat 22.0%, fibre 1.8%, and ash 6.1%, but kcal, calcium, and phosphorus remain missing.

## 2026-05-29 Official Source Recheck

- Mini Adult: official source still publishes composition, additives, analytical constituents, and metabolisable energy, but not calcium, phosphorus, sodium, or magnesium.
- Maxi Adult 5+: official source still publishes composition, additives, protein/fat/fibre/ash, and an RSA/Namibia statement, but not UK kcal, calcium, phosphorus, sodium, or magnesium.
- Mini Digestive Care: official source still publishes composition, additives, and protein/fat/fibre/ash, but not kcal, calcium, phosphorus, sodium, or magnesium.

## Zooplus Fallback Review

- Royal Canin Mini Adult: Zooplus GR confirms ingredients, protein 27.0%, fat 16.0%, fibre 1.7%, ash 6.8%, and pack sizes 2kg/4kg/8kg/2x8kg. It does not publish calcium, phosphorus, sodium, or magnesium.
- Royal Canin Maxi Adult 5+: Zooplus GR confirms ingredients, protein 26.0%, fat 17.0%, fibre 1.6%, ash 6.4%, and pack sizes 15kg/2x15kg. It does not publish kcal, calcium, phosphorus, sodium, or magnesium.
- Royal Canin Mini Digestive Care: Zooplus GR and Zooplus COM confirm ingredients, protein 30.0%, fat 22.0%, fibre 1.8%, ash 6.1%, and pack sizes 3kg/8kg/2x8kg. They do not publish kcal, calcium, phosphorus, sodium, or magnesium.

## Candidate Evidence Decision

Fallback sources can be useful for search and corroboration, but they should not overwrite the canonical row when the market, source tier, or analytical panel does not prove the missing values. For this batch, the safer decision is to keep the Royal Canin rows as `needs_review` and collect exact pack-label evidence.

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
npm run review:backfill
```
