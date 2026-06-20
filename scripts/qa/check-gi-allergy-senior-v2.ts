import { rankFoodV2ForPet } from "@/lib/food-v2/recommendationRanking";
import { evaluateGiRules } from "@/lib/nutrition-v2/giRules";
import { evaluateSeniorFitRules } from "@/lib/nutrition-v2/seniorRules";
import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";
import type { Pet } from "@/types/pet";

const baseFood: FoodProductV2 = {
  id: "qa-food",
  brand: "QA",
  formula_key: "qa-food",
  formula_name: "QA Food",
  display_name: "QA Food",
  species: "dog",
  format: "dry",
  life_stage: "adult",
  dog_size: "small",
  breed_target: null,
  medical_tags: [],
  commercial_tags: [],
  ingredient_text: "duck, rice, beet pulp, chicory, minerals",
  ingredients: ["duck", "rice", "beet pulp", "chicory", "minerals"],
  primary_animal_proteins: ["duck"],
  carbohydrate_sources: ["rice"],
  fat_sources: [],
  fiber_sources: ["beet pulp", "chicory"],
  data_quality_status: "verified",
  source_priority: "official",
  data_source_url: null,
  source_notes: null,
  kcal_per_100g: 360,
  kcal_per_kg: null,
  created_at: "",
  updated_at: "",
};

const baseNutrients: FoodNutrientsV2 = {
  protein_percent: 24,
  fat_percent: 12,
  fiber_percent: 3.2,
  calcium_percent: 1,
  phosphorus_percent: 0.8,
};

const adultDog: Pick<
  Pet,
  "species" | "breed" | "age" | "weight" | "activityLevel" | "neutered"
> & {
  allergies: string[];
  healthIssues: string[];
  excludedIngredients?: string[];
  preferredProteins?: string[];
} = {
  species: "dog",
  breed: "",
  age: 5,
  weight: 10,
  activityLevel: "normal",
  neutered: true,
  allergies: [],
  healthIssues: [],
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

const directGi = evaluateGiRules(
  {
    medical_tags: ["gi_support"],
    commercial_tags: ["sensitive_digestion"],
    fiber_sources: ["beet pulp", "chicory"],
    primary_animal_proteins: ["hydrolysed salmon"],
  },
  { fiber_percent: 3.5 }
);
assert(
  directGi.boosts.includes("digestibility_support_context") &&
    directGi.boosts.includes("measured_moderate_fiber_context") &&
    directGi.boosts.includes("allergy_or_hydrolysed_context"),
  "GI v2 should reward digestibility support, measured moderate fiber, and hydrolysed context.",
  directGi
);

const giDog = {
  ...adultDog,
  healthIssues: ["chronic soft stool", "gas"],
};

const digestiveFood = rankFoodV2ForPet({
  food: food({
    formula_key: "qa-digestive-rice-prebiotic",
    display_name: "QA Digestive Sensitive Duck Rice",
    formula_name: "Digestive Sensitive Duck Rice",
    medical_tags: ["gi_support"],
    commercial_tags: ["sensitive_digestion"],
    ingredient_text: "duck, rice, beet pulp, chicory, prebiotics, minerals",
    ingredients: ["duck", "rice", "beet pulp", "chicory", "prebiotics", "minerals"],
    fiber_sources: ["beet pulp", "chicory"],
  }),
  nutrients: nutrients({ fiber_percent: 3.2 }),
  pet: giDog,
  goal: "general",
});

const genericFood = rankFoodV2ForPet({
  food: food({
    formula_key: "qa-generic-adult",
    display_name: "QA Adult Maintenance",
    formula_name: "Adult Maintenance",
    ingredient_text: "duck, potato, animal fat, minerals",
    ingredients: ["duck", "potato", "animal fat", "minerals"],
    carbohydrate_sources: ["potato"],
    fiber_sources: [],
  }),
  nutrients: nutrients({ fiber_percent: null }),
  pet: giDog,
  goal: "general",
});

assert(
  codes(digestiveFood).includes("digestive_support_positioning") &&
    codes(digestiveFood).includes("digestibility_support_context"),
  "GI symptom context should surface digestive support signals even under general goal.",
  digestiveFood
);
assert(
  codes(genericFood).includes("gi_symptoms_without_digestive_positioning"),
  "Generic food should be cautioned when the pet has GI symptoms.",
  genericFood
);
assert(
  digestiveFood.total_score > genericFood.total_score,
  "Digestive-positioned food should outrank generic food for GI symptoms.",
  { digestiveFood, genericFood }
);

const chickenAllergy = rankFoodV2ForPet({
  food: food({
    formula_key: "qa-chicken-food",
    display_name: "QA Adult Chicken",
    formula_name: "Adult Chicken",
    primary_animal_proteins: ["chicken"],
    ingredient_text: "chicken, rice, poultry fat, minerals",
    ingredients: ["chicken", "rice", "poultry fat", "minerals"],
  }),
  nutrients: nutrients(),
  pet: {
    ...adultDog,
    allergies: ["chicken"],
  },
  goal: "allergy",
});
assert(
  chickenAllergy.bucket === "hold" &&
    codes(chickenAllergy).some((code) => code.startsWith("allergen_conflict:")),
  "Declared chicken allergy should hard-reject chicken formulas.",
  chickenAllergy
);

const lambAvoided = rankFoodV2ForPet({
  food: food({
    formula_key: "qa-lamb-food",
    display_name: "QA Adult Lamb",
    formula_name: "Adult Lamb",
    primary_animal_proteins: ["lamb"],
    ingredient_text: "lamb, rice, minerals",
    ingredients: ["lamb", "rice", "minerals"],
  }),
  nutrients: nutrients(),
  pet: {
    ...adultDog,
    excludedIngredients: ["lamb"],
    preferredProteins: ["chicken"],
  },
  goal: "general",
});
assert(
  lambAvoided.bucket === "hold" &&
    codes(lambAvoided).some((code) => code.startsWith("excluded_ingredient_preference:")),
  "Explicit disliked/avoided lamb should hard-reject lamb formulas even when it is preference, not allergy.",
  lambAvoided
);

const seniorPet = {
  ...adultDog,
  age: 12,
  activityLevel: "low" as const,
  healthIssues: ["low appetite", "losing weight", "chewing difficulty"],
};

const seniorLight = rankFoodV2ForPet({
  food: food({
    formula_key: "qa-senior-light",
    display_name: "QA Senior Light",
    formula_name: "Senior Light",
    life_stage: "senior",
    commercial_tags: ["senior", "light"],
    kcal_per_100g: 320,
  }),
  nutrients: nutrients({ protein_percent: 24, fat_percent: 8, fiber_percent: 6 }),
  pet: seniorPet,
  goal: "senior",
});

const seniorEnergyDense = rankFoodV2ForPet({
  food: food({
    formula_key: "qa-senior-comfort",
    display_name: "QA Senior Comfort",
    formula_name: "Senior Comfort",
    life_stage: "senior",
    commercial_tags: ["senior"],
    kcal_per_100g: 380,
  }),
  nutrients: nutrients({ protein_percent: 27, fat_percent: 14, fiber_percent: 3 }),
  pet: seniorPet,
  goal: "senior",
});

assert(
  codes(seniorLight).includes("senior_appetite_weight_loss_avoid_light_default"),
  "Senior low appetite or weight loss should not default to light food.",
  seniorLight
);
assert(
  codes(seniorEnergyDense).includes("senior_low_appetite_energy_density_support"),
  "Senior low appetite should consider energy density after vet-context caution.",
  seniorEnergyDense
);
assert(
  codes(seniorEnergyDense).includes("senior_chewing_texture_review"),
  "Senior chewing difficulty should request texture/kibble review for dry food.",
  seniorEnergyDense
);

const directSeniorWet = evaluateSeniorFitRules({
  food: food({
    formula_key: "qa-senior-wet",
    display_name: "QA Senior Wet",
    formula_name: "Senior Wet",
    format: "wet",
    life_stage: "senior",
    kcal_per_100g: 105,
  }),
  nutrients: nutrients({ protein_percent: 9, fat_percent: 5 }),
  pet: seniorPet,
  stage: "senior",
  goal: "senior",
  positioning: {
    active: false,
    mobility: false,
    senior: true,
    weightControl: false,
  },
});
assert(
  directSeniorWet.some((signal) => signal.code === "senior_chewing_soft_food_fit"),
  "Senior wet/soft format should be a positive chewing-fit signal.",
  directSeniorWet
);

console.log("GI, allergy/intolerance, and senior v2 QA passed.");
