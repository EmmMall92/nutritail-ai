# Food V2 Title Cleanup Playbook

Last reviewed: 2026-06-16

This playbook keeps customer-facing food names consistent while Food V2 continues
to ingest rows from retailer HTML, official pages, PDFs, and spreadsheets.

## Naming Goal

Food titles shown to customers should read like a real product name:

`Brand Line Life Stage Size/Need Protein`

Examples:

- `Ambrosia Mediterranean Diet Grain Free Puppy Fresh Sardine & Herring`
- `Royal Canin Mini Adult Digestive Care`
- `Schesir Adult Medium Chicken`
- `Monge VetSolution Renal Canine`

Avoid using SEO descriptions as product names, such as:

- `Complete dry food for adult dogs with...`
- `Holistic food for puppies of all breeds...`
- `Dietetic food for support of...`

Those belong in notes, tags, or descriptions, not in `formula_name`.

## Source Priority For Titles

Use the best available title source in this order:

1. `gatoskilo.gr` product title when it is a clear product title.
2. Official/PDF product title from the brand.
3. Other retailers such as Zooplus, Petshop88, Pet-it, or Petcity.
4. Petsamolis only when the above sources do not provide a usable title.
5. Manual canonical title when all source titles are descriptive or noisy.

This priority is only for the customer-facing name. Nutrition facts still follow
the existing source-quality and completeness rules.

## Formula Name Rules

- `formula_name` should not include the brand unless the brand is part of the
  official line name.
- `display_name` should include the brand.
- Remove pack sizes such as `2kg`, `11kg`, `12 x 400g`.
- Remove offer wording such as `promo`, `gift`, `free`, `offer`.
- Keep meaningful line names such as `VetSolution`, `N&D`, `NaturCroq`,
  `Prescription Diet`, `Pro Plan`, `BWild`, `LeChat`, `Gemon`.
- Deduplicate repeated words such as `Vetsolution Vetsolution`.
- Prefer English product naming when the brand/PDF uses English. Greek retailer
  names are acceptable only when they are the best available clear title.

## Brand Cleanup Order

Work brand by brand so duplicates and naming patterns are easy to review:

1. Royal Canin
2. Ambrosia
3. Josera
4. Schesir
5. Monge
6. Farmina / N&D
7. Acana / Orijen
8. Purina Pro Plan
9. Brit
10. Happy Dog

## QA Commands

Run these before committing title cleanup batches:

```bash
npm run audit:food-v2-title-quality
npm run audit:food-v2-duplicate-risks
npm run audit:food-v2-ranking-scenarios
npm run build
```

## Admin Review Checklist

- Open `/admin/foods/v2-review`.
- Filter by the current brand.
- Check for titles that look like descriptions.
- Check duplicate groups before committing new rows.
- Keep one canonical formula per product, even if it appears from many sources.
- After cleanup, test a matching chatbot scenario for that brand.
