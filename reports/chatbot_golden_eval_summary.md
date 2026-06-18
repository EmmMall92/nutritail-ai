# Chatbot Golden Eval Summary

Generated: 2026-06-18T20:12:38.167Z

## Result

PASS

Cases: 156
Passed: 156
Failed: 0

## Coverage

Signals covered: active, allergy, avoidance, budget, cardiac, chewing, chicken, compare, diabetes, digestive, feeding_behavior, fussy, growth, hairball, homemade, hydration, ingredient_myth, joint, kidney, large_breed, liver, low_confidence_match, multi_pet, muscle, needs_context, neutered, pancreatitis, photo, portion_size, premium, product_lookup, recovery, reproduction, rescue, senior, skin_coat, transition, travel, urgent, urinary, weight, wet_food
Missing signals: none

Safety levels covered: caution, normal, urgent
Missing safety levels: none

## Cases

- PASS greeklish-weight-neutered: normal / weight, neutered; inferred=normal / neutered, weight
- PASS greek-sterilised-cat-food: normal / neutered; inferred=normal / 
- PASS cat-urinary-red-flag: urgent / urinary, urgent; inferred=urgent / urgent, urinary
- PASS greek-cat-urinary-red-flag: urgent / urinary, urgent; inferred=caution / urinary
- PASS greek-gi-sensitivity: caution / digestive; inferred=caution / digestive
- PASS suspected-food-allergy: caution / allergy, chicken; inferred=caution / allergy, chicken
- PASS greek-chicken-allergy: caution / allergy, chicken; inferred=caution / allergy, chicken
- PASS kidney-protein-conflict: caution / kidney; inferred=caution / kidney
- PASS large-puppy-growth: normal / growth, large_breed; inferred=normal / growth, large_breed
- PASS greek-large-puppy-growth: normal / growth, large_breed; inferred=normal / 
- PASS compare-products: normal / compare, product_lookup; inferred=normal / compare, product_lookup
- PASS greek-compare-brands: normal / compare, product_lookup; inferred=normal / product_lookup
- PASS low-confidence-product: normal / low_confidence_match; inferred=normal / low_confidence_match, product_lookup
- PASS grain-myth: normal / ingredient_myth; inferred=normal / ingredient_myth
- PASS best-food-vague: normal / needs_context; inferred=normal / needs_context
- PASS senior-kidney-context: caution / senior, kidney; inferred=caution / kidney, senior
- PASS greeklish-urinary-dog: caution / urinary; inferred=caution / urinary
- PASS large-puppy-product-lookup: normal / growth, large_breed, compare, product_lookup; inferred=normal / compare, growth, large_breed, product_lookup
- PASS neutered-treat-calories: normal / neutered, weight; inferred=normal / neutered, weight
- PASS greek-daily-grams: normal / portion_size; inferred=normal / 
- PASS sterilised-small-dog-maintenance-el: normal / neutered, weight; inferred=normal / 
- PASS chicken-like-salmon-avoid-el: normal / chicken, avoidance; inferred=normal / chicken
- PASS budget-good-food-el: normal / budget; inferred=normal / 
- PASS premium-food-request-el: normal / premium; inferred=normal / 
- PASS fussy-dog-el: normal / fussy; inferred=normal / 
- PASS food-transition-el: normal / transition; inferred=normal / 
- PASS pancreatitis-dog-en: caution / pancreatitis; inferred=normal / 
- PASS diabetic-dog-el: caution / diabetes; inferred=normal / 
- PASS cat-hairball-el: normal / hairball; inferred=normal / 
- PASS kitten-food-el: normal / growth; inferred=normal / 
- PASS sterilised-cat-overweight-en: normal / neutered, weight; inferred=normal / neutered, weight
- PASS cat-not-eating-red-flag-el: urgent / urgent; inferred=normal / 
- PASS bloody-diarrhea-el: urgent / digestive, urgent; inferred=caution / digestive
- PASS vomiting-persistent-en: urgent / digestive, urgent; inferred=normal / 
- PASS senior-dog-weight-loss-el: caution / senior, weight; inferred=normal / 
- PASS active-working-dog-en: normal / active; inferred=normal / 
- PASS large-dog-small-breed-risk-el: normal / large_breed; inferred=normal / 
- PASS photo-label-extraction-el: normal / photo; inferred=normal / 
- PASS current-food-match-uncertain-el: normal / product_lookup, low_confidence_match; inferred=normal / low_confidence_match, product_lookup
- PASS royal-vs-acana-with-pet-context-el: normal / compare, product_lookup, neutered; inferred=normal / product_lookup
- PASS farmina-vs-josera-budget-en: normal / compare, product_lookup, budget; inferred=normal / compare, product_lookup
- PASS renal-cat-el: caution / kidney; inferred=caution / kidney
- PASS urinary-cat-prevention-el: caution / urinary; inferred=caution / urinary
- PASS allergy-elimination-trial-en: caution / allergy; inferred=caution / allergy
- PASS avoid-beef-lamb-el: normal / avoidance; inferred=normal / 
- PASS sensitive-stool-puppy-el: caution / growth, digestive; inferred=normal / 
- PASS how-much-water-cat-el: normal / hydration; inferred=normal / 
- PASS treats-and-weight-loss-en: normal / weight; inferred=normal / weight
- PASS supplements-joint-senior-el: caution / senior, joint; inferred=normal / senior
- PASS homemade-diet-el: caution / homemade; inferred=normal / 
- PASS pregnant-cat-el: caution / growth; inferred=normal / 
- PASS customer-smoke-compare-royal-acana-el: normal / compare, product_lookup; inferred=normal / compare, product_lookup
- PASS customer-smoke-sterilised-portion-el: normal / neutered, weight; inferred=normal / 
- PASS customer-smoke-chicken-allergy-el: caution / allergy, chicken; inferred=caution / allergy, chicken
- PASS customer-smoke-large-puppy-el: normal / growth, large_breed; inferred=normal / 
- PASS customer-smoke-urinary-male-cat-el: urgent / urinary, urgent; inferred=caution / urinary
- PASS dog-101-husky-summer-low-appetite: caution / active; inferred=normal / 
- PASS dog-102-husky-working-mountain: normal / active; inferred=normal / 
- PASS dog-103-akita-chicken-sensitive: caution / allergy, chicken, large_breed; inferred=normal / chicken
- PASS dog-104-boxer-gas: caution / digestive, large_breed; inferred=caution / digestive
- PASS dog-105-rottweiler-8m: normal / growth, large_breed; inferred=normal / 
- PASS dog-106-cane-corso-12m: normal / growth, large_breed; inferred=normal / 
- PASS dog-107-great-dane-7m: normal / growth, large_breed; inferred=normal / 
- PASS dog-108-saint-bernard-puppy: normal / growth, large_breed; inferred=normal / 
- PASS dog-109-doberman-athletic: normal / active, large_breed; inferred=normal / 
- PASS dog-110-malinois-training: normal / active; inferred=normal / 
- PASS dog-111-hunting-high-calorie: normal / active; inferred=normal / 
- PASS dog-112-apartment-only: normal / weight; inferred=normal / 
- PASS dog-113-agility: normal / active; inferred=normal / 
- PASS dog-114-daily-swimming: normal / active; inferred=normal / 
- PASS dog-115-runs-10k: normal / active; inferred=normal / 
- PASS dog-116-just-neutered: normal / neutered; inferred=normal / 
- PASS dog-117-gained-after-neuter: normal / neutered, weight; inferred=normal / 
- PASS dog-118-unexplained-weight-loss: caution / weight; inferred=normal / 
- PASS dog-119-begging: normal / weight; inferred=normal / 
- PASS dog-120-eats-fast: normal / feeding_behavior; inferred=normal / 
- PASS dog-121-vomits-empty-stomach: caution / digestive; inferred=normal / 
- PASS dog-122-morning-vomit: caution / digestive; inferred=normal / 
- PASS dog-123-eats-grass: normal / digestive; inferred=normal / 
- PASS dog-124-coprophagia: caution / feeding_behavior; inferred=normal / 
- PASS dog-125-licks-paws: caution / allergy; inferred=normal / 
- PASS dog-126-itches-after-food: caution / allergy; inferred=normal / 
- PASS dog-127-bites-tail: caution / allergy; inferred=normal / 
- PASS dog-128-ear-infections: caution / allergy; inferred=normal / 
- PASS dog-129-chronic-itch: caution / allergy; inferred=normal / 
- PASS dog-130-poor-coat: caution / skin_coat; inferred=normal / 
- PASS dog-131-constipation: caution / digestive; inferred=normal / 
- PASS dog-132-chronic-soft-stool: caution / digestive; inferred=normal / 
- PASS dog-133-ibd: caution / digestive; inferred=normal / 
- PASS dog-134-epi: caution / digestive; inferred=normal / 
- PASS dog-135-gastritis: caution / digestive; inferred=normal / 
- PASS dog-136-food-intolerance: caution / allergy, digestive; inferred=normal / 
- PASS dog-137-no-dairy: normal / avoidance; inferred=normal / 
- PASS dog-138-no-legumes: normal / avoidance; inferred=normal / 
- PASS dog-139-no-rice: normal / avoidance; inferred=normal / 
- PASS dog-140-no-lamb: normal / avoidance; inferred=normal / 
- PASS dog-141-chicken-turkey-allergy: caution / allergy, chicken; inferred=caution / allergy, chicken
- PASS dog-142-salmon-allergy: caution / allergy; inferred=caution / allergy
- PASS dog-143-beef-allergy: caution / allergy; inferred=caution / allergy
- PASS dog-144-wheat-allergy: caution / allergy; inferred=caution / allergy
- PASS dog-145-corn-allergy: caution / allergy; inferred=caution / allergy
- PASS dog-146-many-ingredient-allergy: caution / allergy; inferred=caution / allergy
- PASS dog-147-fish-only: normal / avoidance; inferred=normal / 
- PASS dog-148-wet-only: normal / wet_food; inferred=normal / 
- PASS dog-149-refuses-dry: normal / fussy; inferred=normal / 
- PASS dog-150-eats-with-wet: normal / fussy; inferred=normal / 
- PASS dog-151-urinary-problem: caution / urinary; inferred=normal / 
- PASS dog-152-struvite-history: caution / urinary; inferred=normal / 
- PASS dog-153-oxalate-history: caution / urinary; inferred=normal / 
- PASS dog-154-ckd: caution / kidney; inferred=caution / kidney
- PASS dog-155-high-urea: caution / kidney; inferred=normal / 
- PASS dog-156-high-creatinine: caution / kidney; inferred=normal / 
- PASS dog-157-liver-disease: caution / liver; inferred=normal / 
- PASS dog-158-high-liver-enzymes: caution / liver; inferred=normal / 
- PASS dog-159-cholecystitis: caution / liver; inferred=normal / 
- PASS dog-160-heart-disease: caution / cardiac; inferred=normal / 
- PASS dog-161-arthritis: caution / joint; inferred=normal / 
- PASS dog-162-hip-dysplasia: caution / joint; inferred=normal / 
- PASS dog-163-elbow-dysplasia: caution / joint; inferred=normal / 
- PASS dog-164-cruciate-surgery: caution / joint; inferred=normal / 
- PASS dog-165-chronic-joint-pain: caution / joint; inferred=normal / 
- PASS dog-166-low-muscle: caution / senior; inferred=normal / 
- PASS dog-167-post-op-recovery: caution / recovery; inferred=normal / 
- PASS dog-168-after-hospital: caution / recovery; inferred=normal / 
- PASS dog-169-needs-weight-gain: caution / weight; inferred=normal / 
- PASS dog-170-needs-muscle-gain: caution / muscle; inferred=normal / 
- PASS dog-171-pregnant: caution / growth; inferred=normal / 
- PASS dog-172-lactating-six-puppies: caution / growth; inferred=normal / 
- PASS dog-173-lactating-ten-puppies: caution / growth; inferred=normal / 
- PASS dog-174-post-weaning-dam: caution / reproduction; inferred=normal / 
- PASS dog-175-orphan-puppy: caution / growth; inferred=normal / 
- PASS dog-176-just-weaned-puppy: normal / growth; inferred=normal / 
- PASS dog-177-very-small-puppy: normal / growth; inferred=normal / 
- PASS dog-178-giant-puppy: normal / growth, large_breed; inferred=normal / 
- PASS dog-179-poor-growth-puppy: caution / growth; inferred=normal / 
- PASS dog-180-thin-puppy: caution / growth, weight; inferred=normal / 
- PASS dog-181-sixteen-year-old: normal / senior; inferred=normal / 
- PASS dog-182-seventeen-year-old: normal / senior; inferred=normal / 
- PASS dog-183-cognitive-dysfunction: caution / senior; inferred=normal / 
- PASS dog-184-smell-food-poorly: caution / senior; inferred=normal / 
- PASS dog-185-no-teeth: normal / senior; inferred=normal / 
- PASS dog-186-chokes-large-kibble: caution / chewing; inferred=normal / 
- PASS dog-187-low-activity-age: normal / senior; inferred=normal / 
- PASS dog-188-sleeps-20-hours: caution / senior; inferred=normal / 
- PASS dog-189-low-appetite-age: caution / senior; inferred=normal / 
- PASS dog-190-easy-chewing: normal / senior; inferred=normal / 
- PASS dog-191-hot-climate: normal / hydration; inferred=normal / 
- PASS dog-192-cold-climate: normal / active; inferred=normal / 
- PASS dog-193-outside-only: normal / active; inferred=normal / 
- PASS dog-194-apartment-no-yard: normal / weight; inferred=normal / 
- PASS dog-195-farm-dog: normal / active; inferred=normal / 
- PASS dog-196-travels-often: normal / travel; inferred=normal / 
- PASS dog-197-changes-country: normal / travel; inferred=normal / 
- PASS dog-198-multi-dog-home: normal / multi_pet; inferred=normal / 
- PASS dog-199-rescue-unknown-history: caution / rescue; inferred=normal / 
- PASS dog-200-rescue-malnourished: caution / weight; inferred=normal / 
