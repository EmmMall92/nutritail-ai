# Food V2 Recommendation Safety Audit

Generated: 2026-06-19T03:07:13.143Z

## Summary

- Candidate rows reviewed: 552
- Output CSV: data/review/food_v2_recommendation_safety_audit.csv

## By Recommendation Status

- cautious_enable_only: 311
- hold_until_backfill: 102
- review_before_enable: 67
- do_not_enable: 47
- eligible_after_admin_choice: 25

## By Risk Level

- low: 267
- medium: 238
- high: 47

## Top Holds / Cautious Rows

- Amanova - Amanova Adult Cat Turkey Delight 1.5kg Grain Free: do_not_enable; risk=high; blockers=calcium_percent; context=weight_control
- Amanova - Amanova Dog Puppy Digestive Divine Rabbit 2kg Grain Free: do_not_enable; risk=high; blockers=calcium_percent; context=puppy
- Amanova - Amanova Kitten Exquisite Chicken 1.5kg Low Grain: do_not_enable; risk=high; blockers=calcium_percent; context=kitten
- Ambrosia - Ambrosia Mediterranean Diet Grain Free Puppy Fresh Sardine & Herring 1,5kg: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=puppy
- Brekkies - Brekkies Cat Adult Special Care Urinary 20kg: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=urinary
- Dr. Clauder - Dr Clauder's High Premium Cat Sterilised/Senior/Light 10kg: do_not_enable; risk=high; blockers=calcium_percent; context=weight_control|senior
- Fish4Dogs - Fish4dogs Finest Salmon Senior Small 6kg: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=senior
- Happy Cat - Happy Cat Minkas Junior Care 1.5kg: do_not_enable; risk=high; blockers=phosphorus_percent; context=kitten
- Josera - Josera LOOPIES WITH BEEF: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=senior
- Josera - Josera LOOPIES WITH LAMB: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=senior
- Josera - Josera LOOPIES WITH POULTRY: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=senior
- Purina Pro Plan - Purina Pro Plan Veterinary Diets Small & Mini Dog OM Obesity Management 1.3kg: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=obesity
- Purina Pro Plan - Purina Pro Plan Veterinary Diets Small Dog EN Gastrointestinal 1.5kg: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=none
- Reflex - Reflex Plus Breed Pomeranian Adult Hypoallergenic 2kg: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=none
- Reflex - Reflex Plus Breed Pomeranian Puppy Hypoallergenic 1.5kg: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=puppy
- Reflex - Reflex Plus Breed Poodle Adult Hypoallergenic 2kg: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=none
- Reflex - Reflex Plus Breed Poodle Puppy Hypoallergenic 1.5kg: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=puppy
- Reflex - Reflex Plus Breed Yorkshire Terrier Adult Hypoallergenic 2kg: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=none
- Reflex - Reflex Plus Kitten Chicken 1.5kg: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=kitten
- Reflex - Reflex Plus Medium / Large Junior Lamb 12kg: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=puppy
- Royal Canin - Royal Canin Jack Russell Terrier Adult 3kg: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=none
- Royal Canin - Royal Canin Maxi Puppy 3kg: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=puppy
- Royal Canin - Royal Canin Maxi Starter 15kg: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=none
- Royal Canin - Royal Canin Medium Puppy 3kg: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=puppy
- Royal Canin - Royal Canin Mini Starter 1kg: do_not_enable; risk=high; blockers=calcium_percent|phosphorus_percent; context=none

## Rule

Do not enable medical, growth, senior, urinary, renal, obesity or weight-control formulas for confident recommendations when blocker nutrients are missing. Estimated kcal is acceptable only with cautious wording unless official kcal is later found.