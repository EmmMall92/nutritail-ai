# Royal Canin Food V2 Cleanup Plan

Generated: 2026-06-18T22:28:57.798Z

## Summary

- Brand rows: 29
- Readiness status: review_before_import
- Duplicate groups to review: 56
- Title cleanup rows: 12
- Nutrient backfill rows: 29
- Life-stage conflict rows: 0
- Official rows: 0
- Retailer rows: 29
- Missing calcium/phosphorus rows: 21
- Estimated kcal rows: 23

## Recommended Order

1. Review duplicate groups first, especially official-plus-retailer overlaps. Keep the best official formula row as survivor and use retailer/photo rows only as evidence or backfill.
2. Clean customer-facing formula titles after dedupe, so pack sizes and retailer wording do not leak into recommendations.
3. Fix life-stage conflicts before import; an Adult cat food marked kitten or senior dog food marked puppy can distort recommendations.
4. Backfill calcium/phosphorus and replace estimated kcal where official page, PDF, label photo, or accepted retailer evidence is available.
5. Re-run Food V2 recommendation QA after each Royal Canin cleanup batch.

## Top Duplicate Groups

1. Royal Canin Maxi Ageing 8+ | rows=4; candidates=1; survivor=royal-canin-maxi-ageing-8-dog-dry-gr-official; sources=retailer|official|unknown; action=Prefer official row over current retailer best row; keep the rest as evidence/backfill.
2. Royal Canin Bulldog Puppy | rows=3; candidates=2; survivor=royal-canin-bulldog-puppy-dog-dry-gr-official; sources=official|retailer|manual_photo; action=Keep current best row as canonical survivor (official).
3. Royal Canin Chihuahua Adult | rows=3; candidates=2; survivor=royal-canin-chihuahua-adult-dog-dry-gr-official; sources=official|retailer|manual_photo; action=Keep current best row as canonical survivor (official).
4. Royal Canin Chihuahua Puppy | rows=3; candidates=2; survivor=royal-canin-chihuahua-puppy-dog-dry-gr-official; sources=official|retailer|manual_photo; action=Keep current best row as canonical survivor (official).
5. Royal Canin French Bulldog Adult | rows=3; candidates=2; survivor=royal-canin-french-bulldog-adult-dog-dry-gr-official; sources=official|retailer|manual_photo; action=Keep current best row as canonical survivor (official).
6. Royal Canin Giant Adult | rows=3; candidates=1; survivor=royal-canin-giant-adult-dog-dry-gr-official; sources=retailer|official|manual_photo; action=Prefer official row over current retailer best row; keep the rest as evidence/backfill.
7. Royal Canin Junior Giant | rows=3; candidates=1; survivor=royal-canin-junior-giant-dog-dry-gr-official; sources=official|unknown; action=Keep current best row as canonical survivor (official).
8. Royal Canin Maxi Adult | rows=3; candidates=1; survivor=royal-canin-maxi-adult-dog-dry-gr-official; sources=retailer|official|manual_photo; action=Prefer official row over current retailer best row; keep the rest as evidence/backfill.
9. Royal Canin Medium Adult | rows=3; candidates=1; survivor=royal-canin-medium-adult-dog-dry-gr-official; sources=retailer|official|manual_photo; action=Prefer official row over current retailer best row; keep the rest as evidence/backfill.
10. Royal Canin Shih Tzu Adult | rows=3; candidates=2; survivor=royal-canin-shih-tzu-adult-dog-dry-gr-official; sources=official|retailer|manual_photo; action=Keep current best row as canonical survivor (official).
11. Royal Canin West Highland White Terrier Adult | rows=3; candidates=2; survivor=royal-canin-west-highland-white-terrier-adult-dog-dry-gr-official; sources=official|retailer|manual_photo; action=Keep current best row as canonical survivor (official).
12. Royal Canin Medium Starter | rows=3; candidates=1; survivor=royal-canin-medium-starter-dog-dry-gr-gatoskilo; sources=retailer|unknown; action=Keep current best row as canonical survivor (retailer).
13. Royal Canin Yorkshire Junior | rows=3; candidates=1; survivor=royal-canin-yorkshire-junior-dog-dry-gr-gatoskilo; sources=retailer|unknown; action=Keep current best row as canonical survivor (retailer).
14. Royal Canin Beagle Adult | rows=2; candidates=2; survivor=royal-canin-beagle-adult-dog-dry-gr-official; sources=official|retailer; action=Keep current best row as canonical survivor (official).
15. Royal Canin Boxer Adult | rows=2; candidates=2; survivor=royal-canin-boxer-adult-dog-dry-gr-official; sources=official|retailer; action=Keep current best row as canonical survivor (official).

## Top Title Cleanup Rows

1. Royal Canin Vet Diet Cat GastroIntestinal Fibre Response 2kg | issue=medical_claim_used_as_name; source=retailer; action=Keep the medical claim in tags/notes; formula_name should be the official product line.
2. Royal Canin Vet Diet Cat GastroIntestinal Moderate Calorie 2kg | issue=medical_claim_used_as_name; source=retailer; action=Keep the medical claim in tags/notes; formula_name should be the official product line.
3. Royal Canin Vet Diet Dog GastroIntestinal High Fibre 2kg | issue=medical_claim_used_as_name; source=retailer; action=Keep the medical claim in tags/notes; formula_name should be the official product line.
4. Royal Canin Vet Diet Dog GastroIntestinal Low Fat 1.5kg | issue=medical_claim_used_as_name; source=retailer; action=Keep the medical claim in tags/notes; formula_name should be the official product line.
5. Royal Canin Vet Diet Dog Urinary UC Low P 2kg | issue=medical_claim_used_as_name; source=retailer; action=Keep the medical claim in tags/notes; formula_name should be the official product line.
6. Royal Canin Vet Diet Urinary S/O Small Dog 1.5kg | issue=medical_claim_used_as_name; source=retailer; action=Keep the medical claim in tags/notes; formula_name should be the official product line.
7. Royal Canin Vet Diet Cat GastroIntestinal Fibre Response 2kg | issue=retailer_title_needs_human_review; source=retailer; action=Retailer title has quality warnings; prefer official/PDF title or manual canonicalization.
8. Royal Canin Vet Diet Cat GastroIntestinal Moderate Calorie 2kg | issue=retailer_title_needs_human_review; source=retailer; action=Retailer title has quality warnings; prefer official/PDF title or manual canonicalization.
9. Royal Canin Vet Diet Dog GastroIntestinal High Fibre 2kg | issue=retailer_title_needs_human_review; source=retailer; action=Retailer title has quality warnings; prefer official/PDF title or manual canonicalization.
10. Royal Canin Vet Diet Dog GastroIntestinal Low Fat 1.5kg | issue=retailer_title_needs_human_review; source=retailer; action=Retailer title has quality warnings; prefer official/PDF title or manual canonicalization.
11. Royal Canin Vet Diet Dog Urinary UC Low P 2kg | issue=retailer_title_needs_human_review; source=retailer; action=Retailer title has quality warnings; prefer official/PDF title or manual canonicalization.
12. Royal Canin Vet Diet Urinary S/O Small Dog 1.5kg | issue=retailer_title_needs_human_review; source=retailer; action=Retailer title has quality warnings; prefer official/PDF title or manual canonicalization.

## Life-Stage Conflicts To Fix Before Import


## Top Nutrient Backfill Rows

1. Royal Canin Vet Diet Dog Urinary UC Low P 2kg | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=urinary
2. Royal Canin Maxi Puppy 3kg | gaps=calcium_percent|phosphorus_percent; replace=none; context=puppy
3. Royal Canin Medium Puppy 3kg | gaps=calcium_percent|phosphorus_percent; replace=none; context=puppy
4. Royal Canin Vet Diet Puppy GastroIntestinal 1kg | gaps=phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=puppy
5. Royal Canin Vet Diet Small Dog Renal 1.5kg | gaps=calcium_percent; replace=kcal_per_100g|moisture_percent; context=renal
6. Royal Canin Vet Diet Dog Anallergenic 3kg | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=general
7. Royal Canin Vet Diet Dog Hypoallergenic 2kg | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=general
8. Royal Canin Vet Diet Dog Hypoallergenic Moderate Calorie 14kg | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=general
9. Royal Canin Vet Diet Dog GastroIntestinal High Fibre 2kg | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=general
10. Royal Canin Vet Diet Small Dog Skin Care 2kg | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=general
11. Royal Canin Jack Russell Terrier Adult 3kg | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=general
12. Royal Canin Vet Diet Dog GastroIntestinal Low Fat 1.5kg | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=general
13. Royal Canin Vet Diet Dog Hepatic 1.5kg | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=general
14. Royal Canin Vet Diet Dog Satiety Weight Management 1.5kg | gaps=calcium_percent|phosphorus_percent; replace=none; context=weight_control
15. Royal Canin Vet Diet Dog Sensitivity Control 1.5kg | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=general
16. Royal Canin Vet Diet Cat Hypoallergenic 2.5kg | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=general
17. Royal Canin Vet Diet Dog Renal 2kg | gaps=none; replace=kcal_per_100g|moisture_percent; context=renal
18. Royal Canin Vet Diet Cat GastroIntestinal 2kg | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=general
19. Royal Canin Vet Diet Dog GastroIntestinal 2kg | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=general
20. Royal Canin Maxi Starter 15kg | gaps=calcium_percent|phosphorus_percent; replace=none; context=general

## Outputs

- Duplicate queue: data/review/royal_canin_food_v2_duplicate_cleanup.csv
- Title queue: data/review/royal_canin_food_v2_title_cleanup.csv
- Nutrient queue: data/review/royal_canin_food_v2_nutrient_backfill.csv