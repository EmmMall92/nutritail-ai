# Josera Food V2 Title Cleanup Plan

Generated: 2026-06-18T22:33:44.830Z

## Summary

- Title rows to review: 69
- Duplicate groups to keep in mind: 13
- Output CSV: data/review/josera_food_v2_title_cleanup.csv

## By Product Form Risk

- possible_treat_or_snack: 16
- dry_food_candidate: 53

## By Issue Type

- formula_name_starts_with_brand: 68
- medical_claim_used_as_name: 1

## Top Cleanup Rows

1. Josera DENTIES WITH DUCK & CARROT -> Josera Denties with Duck & Carrot; risk=possible_treat_or_snack; action=Hold from dry-food recommendations until product form is verified as complete dry food or treat.
2. Josera DENTIES WITH POULTRY & BLUEBERRY -> Josera Denties with Poultry & Blueberry; risk=possible_treat_or_snack; action=Hold from dry-food recommendations until product form is verified as complete dry food or treat.
3. Josera DENTIES WITH TURKEY & APPLE -> Josera Denties with Turkey & Apple; risk=possible_treat_or_snack; action=Hold from dry-food recommendations until product form is verified as complete dry food or treat.
4. Josera KNUSPIES -> Josera Knuspies; risk=possible_treat_or_snack; action=Hold from dry-food recommendations until product form is verified as complete dry food or treat.
5. Josera LOOPIES WITH BEEF -> Josera Loopies with Beef; risk=possible_treat_or_snack; action=Hold from dry-food recommendations until product form is verified as complete dry food or treat.
6. Josera LOOPIES WITH LAMB -> Josera Loopies with Lamb; risk=possible_treat_or_snack; action=Hold from dry-food recommendations until product form is verified as complete dry food or treat.
7. Josera LOOPIES WITH POULTRY -> Josera Loopies with Poultry; risk=possible_treat_or_snack; action=Hold from dry-food recommendations until product form is verified as complete dry food or treat.
8. Josera MEAT BITES MINI BEEF -> Josera Meat Bites Mini Beef; risk=possible_treat_or_snack; action=Hold from dry-food recommendations until product form is verified as complete dry food or treat.
9. Josera MEAT BITES MINI CHICKEN -> Josera Meat Bites Mini Chicken; risk=possible_treat_or_snack; action=Hold from dry-food recommendations until product form is verified as complete dry food or treat.
10. Josera MEAT BITES MINI TURKEY -> Josera Meat Bites Mini Turkey; risk=possible_treat_or_snack; action=Hold from dry-food recommendations until product form is verified as complete dry food or treat.
11. Josera MEAT CHUNKS BEEF -> Josera Meat Chunks Beef; risk=possible_treat_or_snack; action=Hold from dry-food recommendations until product form is verified as complete dry food or treat.
12. Josera MEAT CHUNKS CHICKEN -> Josera Meat Chunks Chicken; risk=possible_treat_or_snack; action=Hold from dry-food recommendations until product form is verified as complete dry food or treat.
13. Josera MEAT CHUNKS TURKEY -> Josera Meat Chunks Turkey; risk=possible_treat_or_snack; action=Hold from dry-food recommendations until product form is verified as complete dry food or treat.
14. Josera MEAT HEARTS BEEF -> Josera Meat Hearts Beef; risk=possible_treat_or_snack; action=Hold from dry-food recommendations until product form is verified as complete dry food or treat.
15. Josera MEAT HEARTS CHICKEN -> Josera Meat Hearts Chicken; risk=possible_treat_or_snack; action=Hold from dry-food recommendations until product form is verified as complete dry food or treat.
16. Josera MEAT HEARTS TURKEY -> Josera Meat Hearts Turkey; risk=possible_treat_or_snack; action=Hold from dry-food recommendations until product form is verified as complete dry food or treat.
17. Josera WEIGHT & DIABETIC DOG DRY -> Josera Help Weight & Diabetic; risk=dry_food_candidate; action=Use the Josera Help product line as the customer title and keep medical positioning in tags/health context.
18. Josera ACTIVE NATURE -> Josera Active Nature; risk=dry_food_candidate; action=Remove duplicated Josera prefix from formula_name; display_name may include the brand once.
19. Josera BALANCE -> Josera Balance; risk=dry_food_candidate; action=Remove duplicated Josera prefix from formula_name; display_name may include the brand once.
20. Josera CHICKEN & RICE -> Josera Chicken & Rice; risk=dry_food_candidate; action=Remove duplicated Josera prefix from formula_name; display_name may include the brand once.
21. Josera DUCK & POTATO -> Josera Duck & Potato; risk=dry_food_candidate; action=Remove duplicated Josera prefix from formula_name; display_name may include the brand once.
22. Josera FESTIVAL -> Josera Festival; risk=dry_food_candidate; action=Remove duplicated Josera prefix from formula_name; display_name may include the brand once.
23. Josera FIESTAPLUS -> Josera FiestaPlus; risk=dry_food_candidate; action=Remove duplicated Josera prefix from formula_name; display_name may include the brand once.
24. Josera GASTRO DOG DRY -> Josera Help Gastrointestinal; risk=dry_food_candidate; action=Remove duplicated Josera prefix from formula_name; display_name may include the brand once.
25. Josera HEART DOG DRY -> Josera Help Heart; risk=dry_food_candidate; action=Remove duplicated Josera prefix from formula_name; display_name may include the brand once.
26. Josera HYPOALLERGENIC DOG DRY -> Josera Help Hypoallergenic; risk=dry_food_candidate; action=Remove duplicated Josera prefix from formula_name; display_name may include the brand once.
27. Josera LIVER DOG DRY -> Josera Help Liver; risk=dry_food_candidate; action=Remove duplicated Josera prefix from formula_name; display_name may include the brand once.
28. Josera RENAL DOG DRY -> Josera Help Renal; risk=dry_food_candidate; action=Remove duplicated Josera prefix from formula_name; display_name may include the brand once.
29. Josera WEIGHT & DIABETIC DOG DRY -> Josera Help Weight & Diabetic; risk=dry_food_candidate; action=Remove duplicated Josera prefix from formula_name; display_name may include the brand once.
30. Josera HIGH PROTEIN CHICKEN -> Josera High Protein Chicken; risk=dry_food_candidate; action=Remove duplicated Josera prefix from formula_name; display_name may include the brand once.

## Customer-Facing Naming Rule

Use `Josera + clean product line/name` once. Do not show duplicated brand names, feeding-table text, pack sizes, or generic medical wording as the main title.

Examples:

- `Josera Active Nature`, not `Josera Active Nature Active Nature Weight Activity / day ...`.
- `Josera Help Renal`, not `Josera Renal Dog Dry` when the Help line is clear from source context.
- Treat/snack candidates should not appear as dry-food recommendations until product form is verified.