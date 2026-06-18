import {
  customerRecommendationFoodFormGuardReason,
  isLikelyNonCompleteFoodProduct,
} from "@/lib/food-v2/productFormGuards";

const cases = [
  {
    label: "Josera Denties is held from complete-food recommendations",
    product: {
      brand: "Josera",
      formula_name: "Denties with Duck & Carrot",
      display_name: "Josera Denties with Duck & Carrot",
      format: "dry",
      formula_key: "josera-denties-with-duck-carrot-dog-dry-eu-official",
    },
    expected: true,
  },
  {
    label: "Josera Loopies is held from complete-food recommendations",
    product: {
      brand: "Josera",
      formula_name: "Loopies with Beef",
      display_name: "Josera Loopies with Beef",
      format: "dry",
      formula_key: "josera-loopies-with-beef-dog-dry-eu-official",
    },
    expected: true,
  },
  {
    label: "Purina supplement is held from complete-food recommendations",
    product: {
      brand: "Purina Pro Plan",
      formula_name: "Multivitamins+ supplement",
      display_name: "PRO PLAN Multivitamins+ Supplement",
      format: "supplement",
      formula_key: "purina-pro-plan-multivitamins-supplement-dog",
    },
    expected: true,
  },
  {
    label: "Josera Active Nature remains eligible for dry-food ranking",
    product: {
      brand: "Josera",
      formula_name: "Active Nature",
      display_name: "Josera Active Nature",
      format: "dry",
      formula_key: "josera-active-nature-dog-dry-eu-official",
    },
    expected: false,
  },
  {
    label: "Josera Help Renal remains eligible for medical dry-food ranking",
    product: {
      brand: "Josera",
      formula_name: "Help Renal",
      display_name: "Josera Help Renal",
      format: "dry",
      formula_key: "josera-help-renal-dog-dry-eu-official",
    },
    expected: false,
  },
] as const;

const failures = cases.flatMap((testCase) => {
  const actual = isLikelyNonCompleteFoodProduct(testCase.product);
  const reason = customerRecommendationFoodFormGuardReason(testCase.product);
  const reasonMismatch = actual && !reason;

  if (actual !== testCase.expected || reasonMismatch) {
    return [
      `${testCase.label}: expected ${testCase.expected}, got ${actual}; reason=${reason ?? "missing"}`,
    ];
  }

  return [];
});

if (failures.length > 0) {
  console.error("Food V2 product-form guard QA failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Food V2 product-form guard QA passed.");
