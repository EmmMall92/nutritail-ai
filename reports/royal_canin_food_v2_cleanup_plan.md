# Royal Canin Food V2 Cleanup Plan

Generated: 2026-06-18T20:36:32.100Z

## Summary

- Brand rows: 159
- Readiness status: review_before_import
- Duplicate groups to review: 56
- Title cleanup rows: 14
- Nutrient backfill rows: 159
- Life-stage conflict rows: 6
- Official rows: 63
- Retailer rows: 96
- Missing calcium/phosphorus rows: 143
- Estimated kcal rows: 78

## Recommended Order

1. Review duplicate groups first, especially official-plus-retailer overlaps. Keep the best official formula row as survivor and use retailer/photo rows only as evidence or backfill.
2. Clean customer-facing formula titles after dedupe, so pack sizes and retailer wording do not leak into recommendations.
3. Fix life-stage conflicts before import; an Adult cat food marked kitten or senior dog food marked puppy can distort recommendations.
4. Backfill calcium/phosphorus and replace estimated kcal where official page, PDF, label photo, or accepted retailer evidence is available.
5. Re-run Food V2 recommendation QA after each Royal Canin cleanup batch.

## Top Duplicate Groups

1. Royal Canin Maxi Ageing 8+ 15kg | rows=4; candidates=1; sources=retailer|official|unknown; action=Prefer official source for survivor; keep retailer/photo rows only as evidence/backfill.
2. Royal Canin Bulldog Puppy | rows=3; candidates=2; sources=official|retailer|manual_photo; action=Use conflict check before commit. Import only one survivor for this canonical identity.
3. Royal Canin Chihuahua Adult | rows=3; candidates=2; sources=official|retailer|manual_photo; action=Use conflict check before commit. Import only one survivor for this canonical identity.
4. Royal Canin Chihuahua Puppy | rows=3; candidates=2; sources=official|retailer|manual_photo; action=Use conflict check before commit. Import only one survivor for this canonical identity.
5. Royal Canin French Bulldog Adult | rows=3; candidates=2; sources=official|retailer|manual_photo; action=Use conflict check before commit. Import only one survivor for this canonical identity.
6. Royal Canin Giant Adult 4kg | rows=3; candidates=1; sources=retailer|official|manual_photo; action=Prefer official source for survivor; keep retailer/photo rows only as evidence/backfill.
7. Royal Canin JUNIOR - GIANT | rows=3; candidates=1; sources=official|unknown; action=Prefer official source for survivor; keep retailer/photo rows only as evidence/backfill.
8. Royal Canin Maxi Adult 3kg | rows=3; candidates=1; sources=retailer|official|manual_photo; action=Prefer official source for survivor; keep retailer/photo rows only as evidence/backfill.
9. Royal Canin Medium Adult 3kg | rows=3; candidates=1; sources=retailer|official|manual_photo; action=Prefer official source for survivor; keep retailer/photo rows only as evidence/backfill.
10. Royal Canin Shih Tzu Adult | rows=3; candidates=2; sources=official|retailer|manual_photo; action=Use conflict check before commit. Import only one survivor for this canonical identity.
11. Royal Canin West Highland White Terrier Adult | rows=3; candidates=2; sources=official|retailer|manual_photo; action=Use conflict check before commit. Import only one survivor for this canonical identity.
12. Royal Canin Medium Starter 4kg | rows=3; candidates=1; sources=retailer|unknown; action=Safe to use best row as survivor if title and pack-size differences look expected.
13. Royal Canin Yorkshire Junior 1.5kg | rows=3; candidates=1; sources=retailer|unknown; action=Safe to use best row as survivor if title and pack-size differences look expected.
14. Royal Canin Beagle Adult | rows=2; candidates=2; sources=official|retailer; action=Use conflict check before commit. Import only one survivor for this canonical identity.
15. Royal Canin Boxer Adult | rows=2; candidates=2; sources=official|retailer; action=Use conflict check before commit. Import only one survivor for this canonical identity.

## Top Title Cleanup Rows

1. Royal Canin Vet Diet Cat GastroIntestinal Fibre Response 2kg | issue=medical_claim_used_as_name; source=retailer; action=Keep the medical claim in tags/notes; formula_name should be the official product line.
2. Royal Canin Vet Diet Cat GastroIntestinal Moderate Calorie 2kg | issue=medical_claim_used_as_name; source=retailer; action=Keep the medical claim in tags/notes; formula_name should be the official product line.
3. Royal Canin Vet Diet Cat Urinary S/O Moderate Calorie 1.5kg | issue=medical_claim_used_as_name; source=retailer; action=Keep the medical claim in tags/notes; formula_name should be the official product line.
4. Royal Canin Vet Diet Dog GastroIntestinal High Fibre 2kg | issue=medical_claim_used_as_name; source=retailer; action=Keep the medical claim in tags/notes; formula_name should be the official product line.
5. Royal Canin Vet Diet Dog GastroIntestinal Low Fat 1.5kg | issue=medical_claim_used_as_name; source=retailer; action=Keep the medical claim in tags/notes; formula_name should be the official product line.
6. Royal Canin Vet Diet Dog Urinary UC Low P 2kg | issue=medical_claim_used_as_name; source=retailer; action=Keep the medical claim in tags/notes; formula_name should be the official product line.
7. Royal Canin Vet Diet Urinary S/O Small Dog 1.5kg | issue=medical_claim_used_as_name; source=retailer; action=Keep the medical claim in tags/notes; formula_name should be the official product line.
8. Royal Canin Vet Diet Cat GastroIntestinal Fibre Response 2kg | issue=retailer_title_needs_human_review; source=retailer; action=Retailer title has quality warnings; prefer official/PDF title or manual canonicalization.
9. Royal Canin Vet Diet Cat GastroIntestinal Moderate Calorie 2kg | issue=retailer_title_needs_human_review; source=retailer; action=Retailer title has quality warnings; prefer official/PDF title or manual canonicalization.
10. Royal Canin Vet Diet Cat Urinary S/O Moderate Calorie 1.5kg | issue=retailer_title_needs_human_review; source=retailer; action=Retailer title has quality warnings; prefer official/PDF title or manual canonicalization.
11. Royal Canin Vet Diet Dog GastroIntestinal High Fibre 2kg | issue=retailer_title_needs_human_review; source=retailer; action=Retailer title has quality warnings; prefer official/PDF title or manual canonicalization.
12. Royal Canin Vet Diet Dog GastroIntestinal Low Fat 1.5kg | issue=retailer_title_needs_human_review; source=retailer; action=Retailer title has quality warnings; prefer official/PDF title or manual canonicalization.
13. Royal Canin Vet Diet Dog Urinary UC Low P 2kg | issue=retailer_title_needs_human_review; source=retailer; action=Retailer title has quality warnings; prefer official/PDF title or manual canonicalization.
14. Royal Canin Vet Diet Urinary S/O Small Dog 1.5kg | issue=retailer_title_needs_human_review; source=retailer; action=Retailer title has quality warnings; prefer official/PDF title or manual canonicalization.

## Life-Stage Conflicts To Fix Before Import

1. Royal Canin Urinary Care 400g | current_stage=kitten; context=urinary|kitten; source=retailer; formula=royal-canin-urinary-care-cat-dry-gr-gatoskilo
2. Royal Canin Fit 32 10kg | current_stage=kitten; context=kitten; source=retailer; formula=royal-canin-fit-32-cat-dry-gr-gatoskilo
3. Royal Canin Indoor 27 400g | current_stage=kitten; context=kitten; source=retailer; formula=royal-canin-indoor-27-cat-dry-gr-gatoskilo
4. Royal Canin Light Weight Care 400g | current_stage=kitten; context=weight_control|kitten; source=retailer; formula=royal-canin-light-weight-care-cat-dry-gr-gatoskilo
5. Royal Canin Persian Adult 400g | current_stage=kitten; context=kitten; source=retailer; formula=royal-canin-persian-adult-cat-dry-gr-gatoskilo
6. Royal Canin Sensible 400gr | current_stage=kitten; context=kitten; source=retailer; formula=royal-canin-sensible-cat-dry-gr-gatoskilo

## Top Nutrient Backfill Rows

1. Royal Canin Urinary Care 400g | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=urinary|kitten
2. Royal Canin Mini Urinary Care | gaps=calcium_percent|phosphorus_percent; replace=none; context=urinary|senior
3. Royal Canin Medium Adult 7+ 4kg | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=senior
4. Royal Canin Maxi light Weight Care | gaps=calcium_percent|phosphorus_percent; replace=none; context=weight_control|senior
5. Royal Canin Medium Light Weight Care | gaps=calcium_percent|phosphorus_percent; replace=none; context=weight_control|senior
6. Royal Canin Mini Light Weight Care | gaps=calcium_percent|phosphorus_percent; replace=none; context=weight_control|senior
7. Royal Canin Baby Cat 400gr | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=kitten
8. Royal Canin Cocker Junior 3kg | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=puppy
9. Royal Canin Dental Care 400g | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=kitten
10. Royal Canin Digestive Care 400gr | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=kitten
11. Royal Canin Fit 32 10kg | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=kitten
12. Royal Canin Hair & Skin Care 400g | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=kitten
13. Royal Canin Hairball Care 400g | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=kitten
14. Royal Canin Indoor 27 400g | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=kitten
15. Royal Canin Kitten 400gr | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=kitten
16. Royal Canin Light Weight Care 400g | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=weight_control|kitten
17. Royal Canin Persian Adult 400g | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=kitten
18. Royal Canin Poodle Junior 3kg | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=puppy
19. Royal Canin Pug Junior 1.5kg | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=puppy
20. Royal Canin Rottweiler Junior 12kg | gaps=calcium_percent|phosphorus_percent; replace=kcal_per_100g|moisture_percent; context=puppy

## Outputs

- Duplicate queue: data/review/royal_canin_food_v2_duplicate_cleanup.csv
- Title queue: data/review/royal_canin_food_v2_title_cleanup.csv
- Nutrient queue: data/review/royal_canin_food_v2_nutrient_backfill.csv