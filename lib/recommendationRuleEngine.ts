import { getPetLifeStage } from "@/lib/petLifeStage";
import type { Food } from "@/types/food";
import type { Pet } from "@/types/pet";

export type RecommendationRuleSignal = {
  type: "boost" | "caution" | "exclude";
  code: string;
  message: string;
  points: number;
};

export type RecommendationRuleResult = {
  suitabilityScore: number;
  signals: RecommendationRuleSignal[];
  excluded: boolean;
};

const WEIGHT_TERMS = [
  "obesity",
  "overweight",
  "weight",
  "παχ",
  "βάρος",
  "pax",
  "varos",
];
const KIDNEY_TERMS = ["kidney", "renal", "ckd", "νεφρ", "nefr", "nefro"];
const URINARY_TERMS = [
  "urinary",
  "struvite",
  "crystal",
  "uti",
  "ουρο",
  "ouro",
  "ourin",
];
const GI_TERMS = [
  "sensitive",
  "digestion",
  "digestive",
  "diarrhea",
  "diarrhoea",
  "vomit",
  "gas",
  "stool",
  "γαστρ",
  "διαρ",
  "εμετ",
  "gastr",
  "diarr",
  "emet",
];
const ALLERGY_TERMS = [
  "allergy",
  "allergic",
  "itch",
  "skin",
  "ear",
  "αλλεργ",
  "φαγουρ",
  "allerg",
  "fagour",
];
const LARGE_BREED_TERMS = [
  "large",
  "giant",
  "maxi",
  "labrador",
  "golden",
  "german shepherd",
  "rottweiler",
  "great dane",
  "mastiff",
  "large breed",
  "giant breed",
  "megalo",
  "megalos",
  "gigas",
  "gigant",
];

function normalizeClinicalText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function textIncludesAny(values: string[] | undefined, terms: string[]) {
  const text = normalizeClinicalText((values ?? []).join(" "));

  return terms.some((term) => text.includes(normalizeClinicalText(term)));
}

function foodText(food: Food) {
  return normalizeClinicalText(
    [
      food.brand,
      food.name,
      food.lifeStage,
      food.activitySupport,
      ...(food.healthSupport ?? []),
      ...(food.tags ?? []),
      ...(food.ingredients ?? []),
    ].join(" ")
  );
}

function nutrientValue(primary?: number | null, fallback?: number | null) {
  if (primary !== null && primary !== undefined) return primary;
  if (fallback !== null && fallback !== undefined) return fallback;
  return null;
}

function addSignal(
  signals: RecommendationRuleSignal[],
  signal: RecommendationRuleSignal
) {
  signals.push(signal);
}

function containsDeclaredAllergen(food: Food, allergies: string[]) {
  const ingredients = (food.ingredients ?? []).join(" ").toLowerCase();

  return allergies.some((allergy) =>
    ingredients.includes(allergy.toLowerCase())
  );
}

function isLargeBreedDog(pet: Pet) {
  if (pet.species !== "dog") return false;

  const breedText = normalizeClinicalText(pet.breed ?? "");
  const breedLooksLarge = LARGE_BREED_TERMS.some((term) =>
    breedText.includes(normalizeClinicalText(term))
  );

  return breedLooksLarge || pet.weight >= 25;
}

export function evaluateFoodRecommendationRules(
  food: Food,
  pet: Pet
): RecommendationRuleResult {
  const signals: RecommendationRuleSignal[] = [];
  let suitabilityScore = 0;

  const petLifeStage = getPetLifeStage(pet);
  const healthIssues = pet.healthIssues ?? [];
  const allergies = pet.allergies ?? [];
  const lowerFoodText = foodText(food);
  const largeBreedDog = isLargeBreedDog(pet);

  const protein = nutrientValue(food.proteinPercent, food.protein);
  const fat = nutrientValue(food.fatPercent, food.fat);
  const fiber = nutrientValue(food.fiberPercent, food.fiber);
  const kcal = food.kcalPer100g ?? null;
  const calcium = nutrientValue(food.calciumPercent, food.calcium);
  const phosphorus = nutrientValue(food.phosphorusPercent, food.phosphorus);
  const sodium = nutrientValue(food.sodiumPercent, food.sodium);
  const magnesium = nutrientValue(food.magnesiumPercent, food.magnesium);

  if (food.species !== pet.species) {
    addSignal(signals, {
      type: "exclude",
      code: "species_mismatch",
      message: "Excluded because it is for a different species.",
      points: -100,
    });
  } else {
    suitabilityScore += 25;
    addSignal(signals, {
      type: "boost",
      code: "species_match",
      message: "Matches the pet species.",
      points: 25,
    });
  }

  if (food.lifeStage === "all" || food.lifeStage === petLifeStage) {
    suitabilityScore += 20;
    addSignal(signals, {
      type: "boost",
      code: "life_stage_match",
      message: `Matches the ${petLifeStage} life stage.`,
      points: 20,
    });
  } else {
    suitabilityScore -= 18;
    addSignal(signals, {
      type: "caution",
      code: "life_stage_mismatch",
      message: `Life stage is ${food.lifeStage}, not ${petLifeStage}.`,
      points: -18,
    });
  }

  if (food.activitySupport === "all" || food.activitySupport === pet.activityLevel) {
    suitabilityScore += 8;
    addSignal(signals, {
      type: "boost",
      code: "activity_match",
      message: `Fits ${pet.activityLevel} activity level.`,
      points: 8,
    });
  }

  if (allergies.length > 0) {
    if (containsDeclaredAllergen(food, allergies)) {
      addSignal(signals, {
        type: "exclude",
        code: "declared_allergen_conflict",
        message: "Excluded because ingredients appear to contain a declared allergen.",
        points: -100,
      });
    } else {
      suitabilityScore += 10;
      addSignal(signals, {
        type: "boost",
        code: "declared_allergens_not_found",
        message: "No declared allergens were found in the ingredient list.",
        points: 10,
      });
    }
  }

  const hasWeightConcern = textIncludesAny(healthIssues, WEIGHT_TERMS);
  if (hasWeightConcern || pet.neutered) {
    if (pet.neutered) {
      suitabilityScore += 4;
      addSignal(signals, {
        type: "boost",
        code: "neutered_weight_awareness",
        message: "Neutered pets benefit from calorie-aware food selection.",
        points: 4,
      });
    }

    if (kcal !== null && kcal <= 370) {
      suitabilityScore += 8;
      addSignal(signals, {
        type: "boost",
        code: "moderate_calories",
        message: "Moderate calorie density can help portion control.",
        points: 8,
      });
    } else if (kcal !== null && kcal >= 410) {
      suitabilityScore -= 7;
      addSignal(signals, {
        type: "caution",
        code: "energy_dense_weight_risk",
        message: "Higher calorie density needs careful portions for weight-prone pets.",
        points: -7,
      });
    } else if (kcal === null) {
      suitabilityScore -= 3;
      addSignal(signals, {
        type: "caution",
        code: "weight_kcal_missing",
        message: "Calorie data is missing, so weight-management confidence is lower.",
        points: -3,
      });
    }

    if (fat !== null && fat <= 14) {
      suitabilityScore += 7;
      addSignal(signals, {
        type: "boost",
        code: "lower_fat_for_weight_control",
        message: "Lower fat level may support weight management.",
        points: 7,
      });
    } else if (fat !== null && fat >= 20) {
      suitabilityScore -= 10;
      addSignal(signals, {
        type: "caution",
        code: "high_fat_weight_risk",
        message: "High fat level needs strict portion control for weight-prone pets.",
        points: -10,
      });
    }

    if (fiber !== null && fiber >= 5) {
      suitabilityScore += 6;
      addSignal(signals, {
        type: "boost",
        code: "fiber_satiety",
        message: "Higher fiber may help satiety.",
        points: 6,
      });
    }
  }

  if (textIncludesAny(healthIssues, KIDNEY_TERMS)) {
    if (lowerFoodText.includes("renal") || lowerFoodText.includes("kidney")) {
      suitabilityScore += 18;
      addSignal(signals, {
        type: "boost",
        code: "renal_positioning",
        message: "Food is positioned for renal/kidney support.",
        points: 18,
      });
    }

    if (phosphorus !== null && phosphorus <= 0.6) {
      suitabilityScore += 12;
      addSignal(signals, {
        type: "boost",
        code: "lower_phosphorus",
        message: "Lower phosphorus is more appropriate for kidney support.",
        points: 12,
      });
    } else {
      suitabilityScore -= 8;
      addSignal(signals, {
        type: "caution",
        code: "kidney_phosphorus_missing_or_high",
        message: "Kidney cases need confirmed phosphorus before confident recommendation.",
        points: -8,
      });
    }

    if (protein !== null && protein >= 32 && !lowerFoodText.includes("renal")) {
      suitabilityScore -= 8;
      addSignal(signals, {
        type: "caution",
        code: "high_protein_kidney_context",
        message: "High protein should not be treated as automatically better in kidney cases.",
        points: -8,
      });
    }
  }

  if (textIncludesAny(healthIssues, URINARY_TERMS)) {
    if (lowerFoodText.includes("urinary")) {
      suitabilityScore += 16;
      addSignal(signals, {
        type: "boost",
        code: "urinary_positioning",
        message: "Food is positioned for urinary support.",
        points: 16,
      });
    }

    if (magnesium !== null && magnesium <= 0.09) {
      suitabilityScore += 6;
      addSignal(signals, {
        type: "boost",
        code: "controlled_magnesium",
        message: "Controlled magnesium may support urinary-sensitive pets.",
        points: 6,
      });
    }

    if (sodium === null || magnesium === null) {
      suitabilityScore -= 5;
      addSignal(signals, {
        type: "caution",
        code: "urinary_minerals_missing",
        message: "Urinary cases need sodium and magnesium context before confident advice.",
        points: -5,
      });
    }

    if (magnesium !== null && magnesium > 0.12) {
      suitabilityScore -= 6;
      addSignal(signals, {
        type: "caution",
        code: "urinary_magnesium_high",
        message: "Magnesium is not especially low for urinary-sensitive context.",
        points: -6,
      });
    }

    if (sodium !== null && sodium > 0.6) {
      suitabilityScore -= 4;
      addSignal(signals, {
        type: "caution",
        code: "urinary_sodium_high",
        message: "Higher sodium should be reviewed carefully in urinary cases.",
        points: -4,
      });
    }
  }

  if (textIncludesAny(healthIssues, GI_TERMS)) {
    if (
      lowerFoodText.includes("digest") ||
      lowerFoodText.includes("sensitive") ||
      lowerFoodText.includes("gastro")
    ) {
      suitabilityScore += 12;
      addSignal(signals, {
        type: "boost",
        code: "digestive_positioning",
        message: "Food has digestive or sensitive-stomach positioning.",
        points: 12,
      });
    }

    if (
      lowerFoodText.includes("fos") ||
      lowerFoodText.includes("mos") ||
      lowerFoodText.includes("prebiotic") ||
      lowerFoodText.includes("beet pulp") ||
      lowerFoodText.includes("psyllium")
    ) {
      suitabilityScore += 6;
      addSignal(signals, {
        type: "boost",
        code: "digestive_support_ingredients",
        message: "Ingredient list includes digestive-support signals.",
        points: 6,
      });
    }

    if (fat !== null && fat >= 20) {
      suitabilityScore -= 4;
      addSignal(signals, {
        type: "caution",
        code: "gi_high_fat_caution",
        message: "Higher fat can be a caution for some sensitive-digestion pets.",
        points: -4,
      });
    }
  }

  if (textIncludesAny(healthIssues, ALLERGY_TERMS)) {
    if (
      lowerFoodText.includes("hydroly") ||
      lowerFoodText.includes("hypoallergenic")
    ) {
      suitabilityScore += 14;
      addSignal(signals, {
        type: "boost",
        code: "allergy_trial_positioning",
        message: "Food has hydrolysed or hypoallergenic positioning.",
        points: 14,
      });
    } else {
      suitabilityScore -= 4;
      addSignal(signals, {
        type: "caution",
        code: "allergy_trial_uncertain",
        message: "Suspected allergy needs exposure history or a structured elimination trial.",
        points: -4,
      });
    }
  }

  if (petLifeStage === "young" && pet.species === "dog") {
    if (calcium !== null && phosphorus !== null && phosphorus > 0) {
      const ratio = calcium / phosphorus;
      const idealGrowthRatio = largeBreedDog
        ? ratio >= 1.1 && ratio <= 1.6
        : ratio >= 1 && ratio <= 2;

      if (idealGrowthRatio) {
        suitabilityScore += largeBreedDog ? 8 : 5;
        addSignal(signals, {
          type: "boost",
          code: "growth_calcium_phosphorus_present",
          message: largeBreedDog
            ? "Calcium/phosphorus data is available for large-breed growth review."
            : "Calcium and phosphorus are available for growth-stage review.",
          points: largeBreedDog ? 8 : 5,
        });
      } else {
        suitabilityScore -= largeBreedDog ? 14 : 10;
        addSignal(signals, {
          type: "caution",
          code: "growth_calcium_phosphorus_ratio",
          message: largeBreedDog
            ? "Large-breed puppy calcium/phosphorus ratio needs closer review."
            : "Calcium/phosphorus ratio needs closer review for growth.",
          points: largeBreedDog ? -14 : -10,
        });
      }
    } else {
      suitabilityScore -= largeBreedDog ? 12 : 8;
      addSignal(signals, {
        type: "caution",
        code: "growth_minerals_missing",
        message: largeBreedDog
          ? "Large-breed puppy recommendations need calcium and phosphorus data."
          : "Puppy recommendations need calcium and phosphorus data.",
        points: largeBreedDog ? -12 : -8,
      });
    }

    if (largeBreedDog && kcal !== null && kcal >= 410) {
      suitabilityScore -= 5;
      addSignal(signals, {
        type: "caution",
        code: "large_puppy_energy_density",
        message: "Energy-dense food needs careful feeding for large-breed growth.",
        points: -5,
      });
    }
  }

  if (petLifeStage === "senior") {
    if (lowerFoodText.includes("senior") || lowerFoodText.includes("ageing")) {
      suitabilityScore += 8;
      addSignal(signals, {
        type: "boost",
        code: "senior_positioning",
        message: "Food is positioned for senior pets.",
        points: 8,
      });
    }

    if (phosphorus !== null && phosphorus <= 0.8) {
      suitabilityScore += 4;
      addSignal(signals, {
        type: "boost",
        code: "senior_phosphorus_awareness",
        message: "Phosphorus is available and not especially high for senior review.",
        points: 4,
      });
    } else if (phosphorus === null) {
      suitabilityScore -= 3;
      addSignal(signals, {
        type: "caution",
        code: "senior_phosphorus_missing",
        message: "Senior recommendations are stronger when phosphorus is known.",
        points: -3,
      });
    }
  }

  const excluded = signals.some((signal) => signal.type === "exclude");

  return {
    suitabilityScore: excluded
      ? 0
      : Math.max(0, Math.min(100, suitabilityScore)),
    signals,
    excluded,
  };
}
