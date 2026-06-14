# Food V2 Title Canonicalization Pass

Generated: 2026-06-14T15:12:54.003Z

## Summary

- Candidate rows reviewed: 801
- Title repair candidates: 648
- High priority repairs: 0
- Medium priority repairs: 616
- Low priority repairs: 32
- Output CSV: data/review/food_v2_title_canonicalization_queue.csv

## Source Priority Policy

1. Prefer Gatoskilo local HTML titles when the product page title is formula-like.
2. Prefer uploaded PDFs/documents next when they expose a clean official formula name.
3. Use official product pages after that.
4. Use Zooplus/Petshop88/Pet-it/Petcity as retailer fallback titles.
5. Use Petsamolis last unless it is the only usable title source.
6. Formula names must not include pack size; display names should include the brand.

## Repair Candidates By Priority

- medium: 616
- low: 32

## Repair Candidates By Brand

- Royal Canin: 102
- Brit: 49
- Hills: 37
- N&D: 36
- Josera: 35
- Belcando: 20
- Reflex: 19
- Club 4 Paws: 18
- Happy Dog: 18
- Happy Cat: 14
- Purina Pro Plan: 13
- Cennamo: 12
- Farmina: 12
- Ambrosia: 11
- Harper & Bone: 11
- Naturea: 11
- Amanova: 10
- Gemon: 10
- Leonardo: 10
- Carnilove: 9
- Ownat: 9
- Orijen: 8
- Acana: 7
- Equilibrio: 7
- Kudo: 7
- Taste of the Wild: 7
- Canagan: 6
- Dr. Clauder: 6
- Hi: 6
- Pro-Nutrition (Flatazor): 6
- Brekkies: 5
- Friskies: 5
- Hill's Prescription Diet: 5
- Matisse: 5
- Pedigree: 5
- Royal Canin Veterinary Diet: 5
- Tonus Dog Chow: 5
- Trainer: 5
- Wellness Core: 5
- Anima: 3
- Barking Heads: 3
- Bedog: 3
- BEWI: 3
- Calibra: 3
- Ecopet Natural: 3
- GranataPet: 3
- Hill's Science Plan: 3
- Monge: 3
- Optima Nova: 3
- Royal Canin Size: 3
- Wolf of Wilderness: 3
- Bozita: 2
- Briantos: 2
- Cibau: 2
- Enjoy: 2
- Nature: 2
- ProChoice: 2
- Profine: 2
- Schesir: 2
- Trendline: 2
- Trovet: 2
- Vet Expert: 2
- Wellfed: 2
- ACANA: 1
- AdPet: 1
- Akvatera: 1
- Banters: 1
- Belcando Mastercraft: 1
- Black Olympus: 1
- Cat Vital: 1
- Fish4Dogs: 1
- Frolic: 1
- Greca Cat: 1
- Markus Mühle: 1
- Meowing Heads: 1
- Meradog: 1
- Prince: 1
- Royal Canin Breed: 1
- Vidok: 1
- Whiskas: 1

## Most Common Reasons

- display_name_can_be_standardized: 645
- display_name_contains_pack_size: 612
- formula_name_can_be_canonicalized: 139
- display_name_missing_brand: 67
- formula_starts_with_brand: 4
- formula_contains_pack_size: 1

## Admin Workflow

Use the CSV as a review queue. High priority rows should not be imported until the suggested title is manually accepted or replaced. Medium priority rows are usually pack-size or duplicated-brand cleanup. Low priority rows are mostly consistency cleanup.