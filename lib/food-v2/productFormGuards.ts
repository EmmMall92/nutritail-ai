import type { FoodProductV2 } from "@/types/food-v2";

const NON_COMPLETE_FOOD_TERMS = [
  "chew",
  "chews",
  "crunchies",
  "denties",
  "fortiflora",
  "knuspies",
  "loopies",
  "meat bites",
  "meat chunks",
  "meat hearts",
  "multivitamin",
  "multivitamins",
  "natural defences",
  "skin and coat+",
  "supplement",
  "supplements",
  "treat",
  "treats",
  "snack",
  "snacks",
  "λιχουδια",
  "λιχουδιες",
  "συμπληρωμα",
  "συμπληρωματα",
];

function normalizeText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/[^a-z0-9α-ω+]+/giu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function hasNonCompleteFoodTerm(value: string) {
  const text = normalizeText(value);
  return NON_COMPLETE_FOOD_TERMS.some((term) =>
    text.includes(normalizeText(term))
  );
}

export function isLikelyNonCompleteFoodProduct(
  product: Pick<
    FoodProductV2,
    "brand" | "formula_name" | "display_name" | "format" | "formula_key"
  >
) {
  if (product.format === "treat" || product.format === "supplement") return true;

  const identityText = [
    product.brand,
    product.formula_name,
    product.display_name,
    product.formula_key,
  ].join(" ");

  return hasNonCompleteFoodTerm(identityText);
}

export function customerRecommendationFoodFormGuardReason(
  product: Pick<
    FoodProductV2,
    "brand" | "formula_name" | "display_name" | "format" | "formula_key"
  >
) {
  if (!isLikelyNonCompleteFoodProduct(product)) return null;

  return "Hold from customer-facing food recommendations because the product looks like a treat, snack, chew, or supplement rather than a complete food.";
}
