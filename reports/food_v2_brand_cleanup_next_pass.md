# Food V2 Brand Cleanup Next Pass

Generated for the recommendation and UX improvement phase.

## Goal

Keep the customer-facing chatbot recommendations clean while the Food V2 catalog grows.

This is not a database migration. It is the next QA queue for brand-by-brand cleanup before or after imports.

## Priority Order

1. Royal Canin
2. Ambrosia
3. Josera
4. Schesir
5. Monge
6. Farmina
7. Acana / Orijen
8. Purina Pro Plan
9. Brit
10. Happy Dog

## Checks Per Brand

- Title quality: use `Brand + line + life stage/size + protein/flavor + condition` where possible.
- Duplicate formula keys: merge pack-size or retailer duplicates into the best canonical row.
- Wrong-size recommendations: verify mini/small/medium/large/giant tags.
- Missing kcal: prefer official or label value; keep estimated kcal marked as estimated.
- Missing ash/moisture/minerals: backfill from official PDF, label photo, or trusted retailer when official data is unavailable.
- Condition tags: verify urinary, renal, sterilised, senior, puppy/kitten, sensitive digestion, allergy, weight control.
- Ingredient conflicts: verify chicken, poultry, lamb, beef, salmon/fish, grains, legumes and rice tags.

## Chatbot Safety Impact

- Sterilised and weight-control recommendations need kcal and fat.
- Large-breed puppy recommendations need calcium and phosphorus.
- Urinary recommendations need urinary positioning plus magnesium/phosphorus when available.
- Renal recommendations should prefer renal-positioned formulas and need phosphorus data for confidence.
- Allergy recommendations depend on ingredient text and protein-source tags.
- Senior recommendations should prefer senior-positioned formulas unless weight trend or appetite suggests another path.

## Suggested Next Commands

- `npm.cmd run qa:food-v2-recommendations`
- `npm.cmd run qa:chatbot-golden-cases`
- `node scripts/data/review/audit-food-v2-title-quality.mjs`
- `node scripts/data/review/audit-food-v2-source-dedupe.mjs`
- `node scripts/data/review/audit-food-v2-nutrient-gap-priorities.mjs`

## Customer-Facing Rule

Do not expose review/source-tier wording to customers. Use admin/review wording only in admin pages and QA reports.

Customer copy should say:

- "strongest fit"
- "value option"
- "watch calories/fat"
- "ask your vet for urinary/renal/pancreatitis/diabetes"
- "choose a food to calculate grams/day"

Customer copy should not say:

- `needs_review`
- source tier
- retailer source
- missing internal fields
- backend confidence internals
