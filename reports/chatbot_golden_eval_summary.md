# Chatbot Golden Eval Summary

Generated: 2026-05-27T20:46:48.168Z

## Result

PASS

Cases: 10
Passed: 10
Failed: 0

## Coverage

Signals covered: allergy, chicken, compare, digestive, growth, ingredient_myth, kidney, large_breed, low_confidence_match, needs_context, neutered, product_lookup, urgent, urinary, weight
Missing signals: none

Safety levels covered: caution, normal, urgent
Missing safety levels: none

## Cases

- PASS greeklish-weight-neutered: normal / weight, neutered; inferred=normal / neutered, weight
- PASS cat-urinary-red-flag: urgent / urinary, urgent; inferred=urgent / urgent, urinary
- PASS greek-gi-sensitivity: caution / digestive; inferred=caution / digestive
- PASS suspected-food-allergy: caution / allergy, chicken; inferred=caution / allergy, chicken
- PASS kidney-protein-conflict: caution / kidney; inferred=caution / kidney
- PASS large-puppy-growth: normal / growth, large_breed; inferred=normal / growth, large_breed
- PASS compare-products: normal / compare, product_lookup; inferred=normal / compare, product_lookup
- PASS low-confidence-product: normal / low_confidence_match; inferred=normal / low_confidence_match, product_lookup
- PASS grain-myth: normal / ingredient_myth; inferred=normal / ingredient_myth
- PASS best-food-vague: normal / needs_context; inferred=normal / needs_context
