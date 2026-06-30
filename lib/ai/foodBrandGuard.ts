import {
  customerFoodDisplayName,
  customerFoodName,
} from "@/lib/food-v2/customerFoodName";

type GuardedFoodNameInput = {
  brand?: string | null;
  display_name?: string | null;
  formula_name?: string | null;
};

export const NUTRITAIL_GUARDED_FOOD_BRANDS = [
  "aatu",
  "acana",
  "ambrosia",
  "barking heads",
  "belcando",
  "briantos",
  "brit",
  "calibra",
  "farmina",
  "gemon",
  "happy dog",
  "hill's",
  "hills",
  "josera",
  "lechat",
  "monge",
  "n&d",
  "orijen",
  "prestige",
  "pro plan",
  "prochoice",
  "purina",
  "royal canin",
  "sam's field",
  "sams field",
  "schesir",
  "simba",
  "special dog",
  "trovet",
  "unica",
  "vet expert",
  "virbac",
  "wellness core",
] as const;

export function normalizeComposerGuardText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function allowedFoodGuardText(foods: GuardedFoodNameInput[]) {
  return foods
    .slice(0, 6)
    .flatMap((food) => [
      food.brand,
      food.display_name,
      customerFoodDisplayName(food),
      customerFoodName(food),
    ])
    .filter(Boolean)
    .map(normalizeComposerGuardText)
    .join(" ");
}

export function mentionsUnallowedGuardedBrand(
  text: string,
  foods: GuardedFoodNameInput[]
) {
  if (foods.length === 0) return false;

  const outputText = normalizeComposerGuardText(text);
  const allowedText = allowedFoodGuardText(foods);
  if (!outputText || !allowedText) return false;

  return NUTRITAIL_GUARDED_FOOD_BRANDS.some((brand) => {
    const normalizedBrand = normalizeComposerGuardText(brand);
    return outputText.includes(normalizedBrand) && !allowedText.includes(normalizedBrand);
  });
}

export function mentionsAtLeastOneAllowedFood(
  text: string,
  foods: GuardedFoodNameInput[],
  limit = 4
) {
  if (foods.length === 0) return true;

  const normalizedText = normalizeComposerGuardText(text);

  return foods.slice(0, limit).some((food) => {
    const names = [
      food.display_name,
      customerFoodDisplayName(food),
      customerFoodName(food),
    ]
      .map(normalizeComposerGuardText)
      .filter(Boolean);

    return names.some((name) => normalizedText.includes(name));
  });
}
