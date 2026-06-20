import type { FoodProductV2 } from "@/types/food-v2";

export type IngredientFitSignal = {
  type: "boost" | "caution" | "exclude";
  code: string;
  points: number;
  message: string;
};

export type IngredientFitInput = {
  food: Pick<
    FoodProductV2,
    | "brand"
    | "formula_name"
    | "display_name"
    | "life_stage"
    | "dog_size"
    | "breed_target"
    | "medical_tags"
    | "commercial_tags"
    | "primary_animal_proteins"
    | "carbohydrate_sources"
    | "ingredients"
    | "ingredient_text"
  >;
  goal: "general" | "allergy" | "sensitive_digestion";
  allergies?: string[];
  excludedIngredients?: string[];
  preferredProteins?: string[];
};

export const INGREDIENT_SCIENTIFIC_PRINCIPLES = [
  {
    id: "ingredient_history_matters",
    principle:
      "Ingredient interpretation should use the pet's exposure and tolerance history instead of assuming one protein is universally better.",
  },
  {
    id: "allergen_conflict_is_hard_filter",
    principle:
      "Declared allergy or strict avoidance conflicts should remove a food from recommendation shortlists when detected.",
  },
  {
    id: "hydrolysed_and_limited_ingredient_are_contextual",
    principle:
      "Hydrolysed, monoprotein and limited-ingredient positioning can support allergy or GI reasoning, but they do not diagnose disease.",
  },
] as const;

export const INGREDIENT_DECISION_RULES = [
  {
    id: "avoid_declared_allergens",
    when: ["declared allergen", "ingredient detected"],
    then: "Exclude the food before scoring convenience or preference signals.",
  },
  {
    id: "respect_disliked_or_avoided_protein",
    when: ["explicit dislike or avoidance", "ingredient detected"],
    then: "Exclude the food even if the formula is otherwise high quality.",
  },
  {
    id: "preference_is_secondary",
    when: ["preferred flavor present", "no conflict detected"],
    then: "Boost the food, but never override allergy, species, life-stage or size filters.",
  },
] as const;

export const INGREDIENT_RECOMMENDATION_LOGIC = [
  "Hard-filter known allergens and explicit exclusions first.",
  "Boost preferred proteins only when the formula name or declared primary proteins match.",
  "Treat broad terms such as poultry or animal derivatives as lower-confidence when allergy precision is required.",
] as const;

export const INGREDIENT_CONTRAINDICATIONS = [
  {
    id: "broad_animal_terms_in_allergy_case",
    rule:
      "Broad animal-source wording should reduce confidence in allergy contexts because the exact exposure may be unclear.",
  },
] as const;

export const INGREDIENT_UNCERTAINTY_RULES = [
  {
    id: "missing_ingredient_text",
    rule:
      "If ingredient text is missing, allergen avoidance confidence is lower even when product tags look suitable.",
  },
] as const;

const INGREDIENT_ALIASES: Record<string, string[]> = {
  chicken: ["chicken", "poultry", "kotopoulo", "κοτοπουλο", "κοτόπουλο"],
  poultry: ["poultry", "chicken", "turkey", "poulerika", "πουλερικα", "πουλερικά"],
  turkey: ["turkey", "galopoula", "γαλοπουλα", "γαλοπούλα"],
  duck: ["duck", "papia", "παπια", "πάπια"],
  beef: ["beef", "moschari", "moshari", "μοσχαρι", "μοσχάρι"],
  lamb: ["lamb", "arni", "αρνι", "αρνί"],
  pork: ["pork", "xoirino", "hoirino", "χοιρινο", "χοιρινό"],
  rabbit: ["rabbit", "kouneli", "κουνελι", "κουνέλι"],
  venison: ["venison", "deer", "elafi", "ελαφι", "ελάφι"],
  insect: ["insect", "entomo", "εντομο", "έντομο"],
  fish: [
    "fish",
    "salmon",
    "tuna",
    "cod",
    "codfish",
    "sardine",
    "herring",
    "anchovy",
    "trout",
    "whitefish",
    "psari",
    "ψαρι",
    "ψάρι",
  ],
  salmon: ["salmon", "solomos", "σολομος", "σολομός"],
  tuna: ["tuna", "tonos", "τονος", "τόνος"],
  cod: ["cod", "codfish", "bakaliaros", "μπακαλιαρος", "μπακαλιάρος"],
  sardine: ["sardine", "sardela", "σαρδελα", "σαρδέλα"],
  herring: ["herring", "rega", "ρεγγα", "ρέγγα"],
  trout: ["trout", "pestrofa", "πεστροφα", "πέστροφα"],
  egg: ["egg", "avgo", "αυγο", "αυγό"],
  dairy: ["milk", "dairy", "gala", "γαλα", "γάλα"],
  wheat: ["wheat", "sitar", "sitari", "σιταρι", "σιτάρι"],
  corn: ["corn", "maize", "kalampoki", "καλαμποκι", "καλαμπόκι"],
  rice: ["rice", "rizi", "ryzi", "ρυζι", "ρύζι"],
  pea: ["pea", "peas", "araka", "αρακα", "αρακά"],
  potato: ["potato", "potatoes", "patata", "πατατα", "πατάτα"],
  soy: ["soy", "soya", "sogia", "σογια", "σόγια"],
  legumes: [
    "legume",
    "legumes",
    "pea",
    "peas",
    "lentil",
    "lentils",
    "chickpea",
    "chickpeas",
    "bean",
    "beans",
    "οσπριο",
    "οσπρια",
    "όσπριο",
    "όσπρια",
    "φακη",
    "φακές",
    "ρεβυθ",
  ],
  grain: [
    "grain",
    "grains",
    "cereal",
    "cereals",
    "wheat",
    "corn",
    "maize",
    "barley",
    "oats",
    "σιτηρο",
    "σιτηρα",
    "σιτηρά",
    "δημητριακ",
  ],
};

const BROAD_ANIMAL_TERMS = [
  "poultry",
  "animal protein",
  "animal proteins",
  "animal derivatives",
  "meat and animal",
  "meat derivatives",
  "animal fat",
  "animal fats",
  "πουλερ",
  "ζωικ",
];

const ALLERGY_POSITIONING_TERMS = [
  "hypo",
  "monoprotein",
  "single protein",
  "hypoallergenic",
  "anallergenic",
  "hydrolysed",
  "hydrolyzed",
  "dermatosis",
  "sensitivity",
  "sensitive skin",
];

const GI_POSITIONING_TERMS = [
  "digestive",
  "gastro",
  "gastrointestinal",
  "intestinal",
  "sensitive digestion",
  "sensitive stomach",
  "hypoallergenic",
  "hydrolysed",
  "hydrolyzed",
];

const DIGESTIVE_SUPPORT_TERMS = [
  "fos",
  "mos",
  "inulin",
  "chicory",
  "psyllium",
  "beet pulp",
  "prebiotic",
  "probiotic",
  "yeast",
];

function normalizeText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9α-ω]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function termsFor(value: string) {
  const normalized = normalizeText(value);
  return INGREDIENT_ALIASES[normalized] ?? [normalized];
}

function includesAny(text: string, terms: readonly string[]) {
  return terms.some((term) => text.includes(normalizeText(term)));
}

function allIngredientText(food: IngredientFitInput["food"]) {
  return normalizeText(
    [
      food.brand,
      food.formula_name,
      food.display_name,
      food.life_stage,
      food.dog_size,
      food.breed_target,
      food.ingredient_text,
      ...(food.medical_tags ?? []),
      ...(food.commercial_tags ?? []),
      ...(food.primary_animal_proteins ?? []),
      ...(food.carbohydrate_sources ?? []),
      ...(food.ingredients ?? []),
    ].join(" ")
  );
}

function preferredProteinText(food: IngredientFitInput["food"]) {
  return normalizeText(
    [
      food.formula_name,
      food.display_name,
      ...(food.primary_animal_proteins ?? []),
    ].join(" ")
  );
}

function hasIngredient(text: string, value: string) {
  return termsFor(value).some((term) => text.includes(normalizeText(term)));
}

function matchingValues(text: string, values: readonly string[]) {
  return [...new Set(values.map(normalizeText).filter(Boolean))].filter((value) =>
    hasIngredient(text, value)
  );
}

function ingredientTermsOverlap(a: string, b: string) {
  const aTerms = termsFor(a).map(normalizeText).filter(Boolean);
  const bTerms = termsFor(b).map(normalizeText).filter(Boolean);

  return aTerms.some((aTerm) =>
    bTerms.some(
      (bTerm) =>
        aTerm === bTerm ||
        (aTerm.length >= 4 && bTerm.includes(aTerm)) ||
        (bTerm.length >= 4 && aTerm.includes(bTerm))
    )
  );
}

function removeAvoidedFromPreferred(
  preferred: readonly string[],
  avoided: readonly string[]
) {
  return preferred.filter(
    (preference) =>
      !avoided.some((avoidedIngredient) =>
        ingredientTermsOverlap(preference, avoidedIngredient)
      )
  );
}

export function evaluateIngredientFitRules(input: IngredientFitInput) {
  const signals: IngredientFitSignal[] = [];
  const text = allIngredientText(input.food);
  const preferenceText = preferredProteinText(input.food);
  const allergies = input.allergies ?? [];
  const excluded = input.excludedIngredients ?? [];
  const avoided = [...allergies, ...excluded];
  const preferred = removeAvoidedFromPreferred(input.preferredProteins ?? [], avoided);
  const allergyMatches = matchingValues(text, allergies);
  const excludedMatches = matchingValues(text, excluded);

  for (const match of allergyMatches) {
    signals.push({
      type: "exclude",
      code: `allergen_conflict:${match}`,
      points: -100,
      message: "Ingredients appear to contain a declared allergen.",
    });
  }

  for (const match of excludedMatches) {
    signals.push({
      type: "exclude",
      code: `excluded_ingredient_preference:${match}`,
      points: -100,
      message:
        "Excluded because it contains an ingredient or flavor the pet should avoid.",
    });
  }

  if (allergies.length > 0 && allergyMatches.length === 0) {
    signals.push({
      type: "boost",
      code: "allergen_not_detected",
      points: 18,
      message: "Declared allergens were not detected in the ingredient text.",
    });
  }

  if (excluded.length > 0 && excludedMatches.length === 0) {
    signals.push({
      type: "boost",
      code: "excluded_ingredients_not_detected",
      points: 2,
      message: "Avoided the pet's excluded ingredients or flavors.",
    });
  }

  if (preferred.length > 0) {
    const preferredMatches = matchingValues(preferenceText, preferred);

    if (preferredMatches.length > 0) {
      signals.push({
        type: "boost",
        code: "preferred_protein_match",
        points: 20,
        message: "Matches a preferred protein or flavor.",
      });
    } else {
      signals.push({
        type: "caution",
        code: "preferred_protein_missing",
        points: -10,
        message: "Does not clearly match the pet's preferred protein or flavor.",
      });
    }
  }

  if (input.goal === "allergy") {
    if (includesAny(text, ALLERGY_POSITIONING_TERMS)) {
      signals.push({
        type: "boost",
        code: "allergy_positioning",
        points: 18,
        message: "Has allergy-friendly positioning.",
      });
    }

    if (includesAny(text, BROAD_ANIMAL_TERMS) && allergies.length > 0) {
      signals.push({
        type: "caution",
        code: "broad_animal_terms_allergy_uncertainty",
        points: -10,
        message:
          "Broad animal-source wording lowers confidence for strict allergy avoidance.",
      });
    }

    if (!input.food.ingredient_text && input.food.ingredients.length === 0) {
      signals.push({
        type: "caution",
        code: "missing_ingredient_text_allergy",
        points: -18,
        message: "Ingredient text is missing, so allergy confidence is low.",
      });
    }
  }

  if (input.goal === "sensitive_digestion") {
    if (includesAny(text, GI_POSITIONING_TERMS)) {
      signals.push({
        type: "boost",
        code: "gi_goal_fit",
        points: 16,
        message: "Positioned for sensitive digestion.",
      });
    }

    if (includesAny(text, DIGESTIVE_SUPPORT_TERMS)) {
      signals.push({
        type: "boost",
        code: "digestive_support_ingredients",
        points: 5,
        message: "Includes digestive-support ingredients.",
      });
    }
  }

  return signals;
}
