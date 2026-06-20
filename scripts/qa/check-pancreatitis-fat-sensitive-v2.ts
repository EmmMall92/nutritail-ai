import { rankFoodV2ForPet } from "@/lib/food-v2/recommendationRanking";
import { evaluatePancreatitisFitRules } from "@/lib/nutrition-v2/pancreatitisRules";
import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";
import type { Pet } from "@/types/pet";

const baseFood: FoodProductV2 = {
  id: "qa-pancreatitis-food",
  brand: "QA Vet",
  formula_key: "qa-pancreatitis-food",
  formula_name: "QA Food",
  display_name: "QA Food",
  species: "dog",
  format: "dry",
  life_stage: "adult",
  dog_size: "medium",
  breed_target: null,
  medical_tags: [],
  commercial_tags: [],
  ingredient_text: "duck, rice, beet pulp, minerals",
  ingredients: ["duck", "rice", "beet pulp", "minerals"],
  primary_animal_proteins: ["duck"],
  carbohydrate_sources: ["rice"],
  fat_sources: [],
  fiber_sources: ["beet pulp"],
  data_quality_status: "verified",
  source_priority: "official",
  data_source_url: null,
  source_notes: null,
  kcal_per_100g: 350,
  kcal_per_kg: null,
  created_at: "",
  updated_at: "",
};

const baseNutrients: FoodNutrientsV2 = {
  protein_percent: 24,
  fat_percent: 8,
  fiber_percent: 3,
  calcium_percent: 1,
  phosphorus_percent: 0.8,
};

const pancreatitisDog: Pick<
  Pet,
  "species" | "breed" | "age" | "weight" | "activityLevel" | "neutered"
> & { allergies: string[]; healthIssues: string[] } = {
  species: "dog",
  breed: "",
  age: 6,
  weight: 16,
  activityLevel: "normal",
  neutered: true,
  allergies: [],
  healthIssues: ["pancreatitis history"],
};

const fatSensitiveDog = {
  ...pancreatitisDog,
  healthIssues: ["fat sensitivity", "vomits after rich fatty food"],
};

function food(overrides: Partial<FoodProductV2>): FoodProductV2 {
  return { ...baseFood, ...overrides };
}

function nutrients(overrides: Partial<FoodNutrientsV2> = {}): FoodNutrientsV2 {
  return { ...baseNutrients, ...overrides };
}

function codes(result: ReturnType<typeof rankFoodV2ForPet>) {
  return result.signals.map((signal) => signal.code);
}

function assert(condition: unknown, message: string, details?: unknown) {
  if (condition) return;
  console.error(message);
  if (details) console.error(JSON.stringify(details, null, 2));
  process.exit(1);
}

const directLowFat = evaluatePancreatitisFitRules({
  food: {
    medical_tags: ["pancreatitis"],
    commercial_tags: ["low_fat", "gastrointestinal"],
  },
  nutrients: { fat_percent: 8, fiber_percent: 3 },
  context: "pancreatitis",
  positioning: {
    digestive: true,
    lowFat: true,
    pancreatitis: true,
  },
});
assert(
  directLowFat.some((signal) => signal.code === "pancreatitis_low_fat_fit") &&
    directLowFat.some((signal) => signal.code === "pancreatitis_requires_vet"),
  "Pancreatitis direct rules should keep vet framing and boost true low-fat fit.",
  directLowFat
);

const directMissingFat = evaluatePancreatitisFitRules({
  food: {
    medical_tags: ["pancreatitis"],
    commercial_tags: ["gastrointestinal"],
  },
  nutrients: { fat_percent: null, fiber_percent: 3 },
  context: "pancreatitis",
  positioning: {
    digestive: true,
    lowFat: false,
    pancreatitis: true,
  },
});
assert(
  directMissingFat.some((signal) => signal.code === "pancreatitis_missing_fat"),
  "Pancreatitis direct rules should caution when fat data is missing.",
  directMissingFat
);

const lowFatCandidate = rankFoodV2ForPet({
  food: food({
    formula_key: "qa-low-fat-pancreatitis",
    display_name: "QA Gastro Low Fat",
    formula_name: "Gastro Low Fat",
    medical_tags: ["pancreatitis", "gi_support"],
    commercial_tags: ["low_fat", "gastrointestinal"],
    kcal_per_100g: 330,
  }),
  nutrients: nutrients({ fat_percent: 8, fiber_percent: 3.5 }),
  pet: pancreatitisDog,
  goal: "sensitive_digestion",
});

const highFatDigestive = rankFoodV2ForPet({
  food: food({
    formula_key: "qa-high-fat-digestive",
    display_name: "QA Digestive Rich",
    formula_name: "Digestive Rich",
    medical_tags: ["gi_support"],
    commercial_tags: ["gastrointestinal"],
    kcal_per_100g: 390,
  }),
  nutrients: nutrients({ fat_percent: 15, fiber_percent: 3 }),
  pet: pancreatitisDog,
  goal: "sensitive_digestion",
});

const missingFatCandidate = rankFoodV2ForPet({
  food: food({
    formula_key: "qa-missing-fat-pancreatitis",
    display_name: "QA Digestive Unknown Fat",
    formula_name: "Digestive Unknown Fat",
    medical_tags: ["gi_support"],
    commercial_tags: ["gastrointestinal"],
  }),
  nutrients: nutrients({ fat_percent: null, fiber_percent: 3 }),
  pet: pancreatitisDog,
  goal: "sensitive_digestion",
});

assert(
  codes(lowFatCandidate).includes("pancreatitis_low_fat_fit") &&
    codes(lowFatCandidate).includes("pancreatitis_requires_vet"),
  "Low-fat pancreatitis candidate should be usable but still vet-framed.",
  lowFatCandidate
);
assert(
  highFatDigestive.bucket === "hold" &&
    codes(highFatDigestive).includes("pancreatitis_high_fat_mismatch") &&
    codes(highFatDigestive).includes("digestive_not_low_fat_for_pancreatitis"),
  "Generic digestive food with higher fat should be held for pancreatitis history.",
  highFatDigestive
);
assert(
  codes(missingFatCandidate).includes("pancreatitis_missing_fat"),
  "Pancreatitis candidate with missing fat should carry missing-fat caution.",
  missingFatCandidate
);
assert(
  lowFatCandidate.total_score > highFatDigestive.total_score,
  "Low-fat pancreatitis candidate should outrank high-fat digestive candidate.",
  { lowFatCandidate, highFatDigestive }
);

const fatSensitiveModerate = rankFoodV2ForPet({
  food: food({
    formula_key: "qa-fat-sensitive-moderate",
    display_name: "QA Sensitive Moderate Fat",
    formula_name: "Sensitive Moderate Fat",
    medical_tags: ["gi_support"],
    commercial_tags: ["gastrointestinal"],
  }),
  nutrients: nutrients({ fat_percent: 13, fiber_percent: 3 }),
  pet: fatSensitiveDog,
  goal: "sensitive_digestion",
});

const fatSensitiveHigh = rankFoodV2ForPet({
  food: food({
    formula_key: "qa-fat-sensitive-high",
    display_name: "QA Sensitive High Fat",
    formula_name: "Sensitive High Fat",
    medical_tags: ["gi_support"],
    commercial_tags: ["gastrointestinal"],
  }),
  nutrients: nutrients({ fat_percent: 17, fiber_percent: 3 }),
  pet: fatSensitiveDog,
  goal: "sensitive_digestion",
});

assert(
  codes(fatSensitiveModerate).includes("fat_sensitive_moderate_fat_review") &&
    fatSensitiveModerate.bucket !== "hold",
  "Fat-sensitive moderate-fat candidate should be cautioned but not hard rejected.",
  fatSensitiveModerate
);
assert(
  fatSensitiveHigh.bucket === "hold" &&
    codes(fatSensitiveHigh).includes("fat_sensitive_high_fat_mismatch"),
  "Fat-sensitive high-fat candidate should be held.",
  fatSensitiveHigh
);

console.log("Pancreatitis and fat-sensitive v2 QA passed.");
