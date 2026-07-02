# Food V2 Format Coverage QA

Site: https://nutritail.ai
Checked: 4
Passed without warnings: 3/4
Wet/canned data gaps: 1
Safe holds: 1

This report keeps wet/canned recommendation coverage visible without blocking CI while the dataset is still growing.
Coverage status separates ready journeys from safe holds, true data gaps, and possible ranking bugs.

## Results

### dog-dry

- Species: dog
- Requested format: dry
- Goal: sterilised
- Coverage status: Visible recommendations
- Total candidates: 312
- Visible premium/value foods: 3
- Hold foods: 10

Top visible foods:
- Happy Dog - Naturcroq Duck & Rice Sterilised
- Happy Dog - Naturcroq Adult Chicken
- Josera - Senior Balance

Held examples:
- Josera - Active Nature (active_formula_for_weight_sensitive_pet, high_energy_fat_weight_sensitive, obesity_active_formula_mismatch, small_sterilised_generic_without_lean_evidence, small_sterilised_rich_formula_mismatch, sterilised_high_energy_fat_mismatch, sterilised_rich_formula_mismatch)
- Josera - Chicken & Rice (small_sterilised_generic_without_lean_evidence, life_stage_mismatch)
- Josera - Gastro Dry (high_energy_fat_weight_sensitive, obesity_high_energy_high_fat, small_sterilised_generic_without_lean_evidence, small_sterilised_rich_formula_mismatch, sterilised_high_energy_fat_mismatch, sterilised_rich_formula_mismatch, therapeutic_food_without_matching_condition)

Warnings:
- None

### dog-wet

- Species: dog
- Requested format: wet
- Goal: general
- Coverage status: Safe hold / needs more matching data
- Total candidates: 1
- Visible premium/value foods: 0
- Hold foods: 1

Top visible foods:
- None

Held examples:
- Schesir - Puppy Με Τόνο & Αλόη Σε Ζελέ (growth_food_for_adult_pet, life_stage_mismatch)

Warnings:
- Wet/canned recommendations are not visible yet; this is a data coverage gap.

### cat-dry

- Species: cat
- Requested format: dry
- Goal: sterilised
- Coverage status: Visible recommendations
- Total candidates: 131
- Visible premium/value foods: 4
- Hold foods: 10

Top visible foods:
- Josera - Josicat Classic Sterilised
- Monge BWild - Bwild Grain Free Sterilised Tuna With Peas
- Josera - Indoor Grain Free Sterilised

Held examples:
- Monge - Adult Light Turkey (therapeutic_food_without_matching_condition)
- Monge - Monoprotein Sterilised Beef
- Monge - Monoprotein Sterilised Codfish

Warnings:
- None

### cat-wet

- Species: cat
- Requested format: wet
- Goal: general
- Coverage status: Visible recommendations
- Total candidates: 5
- Visible premium/value foods: 2
- Hold foods: 3

Top visible foods:
- Purina Pro Plan Veterinary Diets - Nutrisavourtm Sterilised Για Γάτες Με Κοτόπουλο
- Purina Pro Plan Veterinary Diets - STERILISED Cat Βοδινό Σε Σάλτσα

Held examples:
- Purina Pro Plan Veterinary Diets - OM OBESITY MANAGEMENT Cat Κομματάκια Σε Σάλτσα Κοτόπουλο (therapeutic_food_without_matching_condition)
- Purina Pro Plan Veterinary Diets - UR ST/OX URINARY Cat Κομματάκια Σε Σάλτσα Κοτόπουλο (therapeutic_food_without_matching_condition)
- Purina Pro Plan Veterinary Diets - UR ST/OX URINARY Cat Κομματάκια Σε Σάλτσα Σολομός (therapeutic_food_without_matching_condition)

Warnings:
- None
