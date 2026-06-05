# Food V2 Recommendation Safety Audit

Generated: 2026-06-05T18:07:55.181Z

## Summary

- Candidate rows reviewed: 801
- Output CSV: data/review/food_v2_recommendation_safety_audit.csv

## By Recommendation Status

- cautious_enable_only: 360
- do_not_enable: 158
- hold_until_backfill: 147
- review_before_enable: 105
- eligible_after_admin_choice: 31

## By Risk Level

- medium: 332
- low: 311
- high: 158

## Top Holds / Cautious Rows

- Amanova - Amanova Adult Cat Turkey Delight 1.5kg Grain Free: do_not_enable; risk=high; blockers=calcium_percent; context=weight_control
- Amanova - Amanova Dog Puppy Digestive Divine Rabbit 2kg Grain Free: do_not_enable; risk=high; blockers=calcium_percent; context=puppy
- Amanova - Amanova Kitten Exquisite Chicken 1.5kg Low Grain: do_not_enable; risk=high; blockers=calcium_percent; context=kitten
- Ambrosia - Ambrosia Mediterranean Diet Grain Free Puppy Fresh Sardine & Herring 1,5kg: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=puppy
- Brekkies - Brekkies Cat Adult Special Care Urinary 20kg: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=urinary
- Dr. Clauder - Dr Clauder's High Premium Cat Sterilised/Senior/Light 10kg: do_not_enable; risk=high; blockers=calcium_percent; context=weight_control|senior
- Fish4Dogs - Fish4dogs Finest Salmon Senior Small 6kg: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=senior
- Happy Cat - Happy Cat Minkas Junior Care 1.5kg: do_not_enable; risk=high; blockers=phosphorus_percent; context=kitten
- Josera - Josera Fiesta Plus 900gr: do_not_enable; risk=high; blockers=calcium_percent; context=senior
- Josera - Josera Kitten 2kg: do_not_enable; risk=high; blockers=calcium_percent; context=kitten
- Josera - Josera Leger Light Adult/Senior 10kg: do_not_enable; risk=high; blockers=calcium_percent; context=weight_control|senior
- Josera - Josera Light & Vital Adult 12.5kg: do_not_enable; risk=high; blockers=calcium_percent; context=weight_control
- Josera - Josera LOOPIES WITH BEEF: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=senior
- Josera - Josera LOOPIES WITH LAMB: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=senior
- Josera - Josera LOOPIES WITH POULTRY: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=senior
- Josera - Josera Marinesse Hypoallergenic Adult 2kg: do_not_enable; risk=high; blockers=calcium_percent; context=none
- Josera - Josera MEAT HEARTS TURKEY: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=senior
- Josera - Josera Medium/Maxi Sensi Junior 12.5kg: do_not_enable; risk=high; blockers=calcium_percent; context=puppy
- Josera - Josera Senior 2kg: do_not_enable; risk=high; blockers=calcium_percent; context=senior
- Josera - Josera Senior Balance 12.5kg: do_not_enable; risk=high; blockers=calcium_percent; context=senior
- Orijen - Orijen Cat & Kitten Fit & Trim 1.8kg: do_not_enable; risk=high; blockers=phosphorus_percent; context=kitten
- Orijen - Orijen Regional Red 1.8kg: do_not_enable; risk=high; blockers=phosphorus_percent; context=renal|kitten
- Purina Pro Plan - Purina Pro Plan Renal Plus Sterilised Σολομός 10kg: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=renal
- Purina Pro Plan - Purina Pro Plan Veterinary Diets Cat HA Hypoallergenic 1.3kg: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=none
- Purina Pro Plan - Purina Pro Plan Veterinary Diets Cat HP Hepatic 1.5kg: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=none

## Rule

Do not enable medical, growth, senior, urinary, renal, obesity or weight-control formulas for confident recommendations when blocker nutrients are missing. Estimated kcal is acceptable only with cautious wording unless official kcal is later found.