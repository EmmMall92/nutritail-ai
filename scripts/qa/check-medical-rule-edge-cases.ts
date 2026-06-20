import { rankFoodV2ForPet } from "@/lib/food-v2/recommendationRanking";
import { planFeedingRecommendation } from "@/lib/nutrition-v2/feedingEngine";
import { evaluateRenalRules } from "@/lib/nutrition-v2/renalRules";
import { evaluateUrinaryRules } from "@/lib/nutrition-v2/urinaryRules";
import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";
import type { Pet } from "@/types/pet";

const baseFood: FoodProductV2 = {
  id: "qa-medical-food",
  brand: "QA Vet",
  formula_key: "qa-medical-food",
  formula_name: "QA Medical Food",
  display_name: "QA Medical Food",
  species: "cat",
  format: "dry",
  life_stage: "adult",
  dog_size: null,
  breed_target: null,
  medical_tags: [],
  commercial_tags: [],
  ingredient_text: "rice, egg, fish oil, minerals",
  ingredients: ["rice", "egg", "fish oil", "minerals"],
  primary_animal_proteins: ["egg"],
  carbohydrate_sources: ["rice"],
  fat_sources: ["fish oil"],
  fiber_sources: [],
  data_quality_status: "verified",
  source_priority: "official",
  data_source_url: null,
  source_notes: null,
  kcal_per_100g: 370,
  kcal_per_kg: null,
  created_at: "",
  updated_at: "",
};

const baseNutrients: FoodNutrientsV2 = {
  protein_percent: 24,
  fat_percent: 14,
  fiber_percent: 2.5,
  calcium_percent: 0.8,
  phosphorus_percent: 0.45,
  sodium_percent: 0.28,
  magnesium_percent: 0.07,
  epa_dha_percent: 0.32,
};

const catWithRenalHistory: Pick<
  Pet,
  "species" | "breed" | "age" | "weight" | "activityLevel" | "neutered"
> & { allergies: string[]; healthIssues: string[] } = {
  species: "cat",
  breed: "",
  age: 9,
  weight: 5,
  activityLevel: "low",
  neutered: true,
  allergies: [],
  healthIssues: ["chronic kidney disease"],
};

const catWithUrinaryHistory = {
  ...catWithRenalHistory,
  healthIssues: ["urinary crystals"],
};

function food(overrides: Partial<FoodProductV2>): FoodProductV2 {
  return { ...baseFood, ...overrides };
}

function nutrients(overrides: Partial<FoodNutrientsV2>): FoodNutrientsV2 {
  return { ...baseNutrients, ...overrides };
}

function signalCodes(result: ReturnType<typeof rankFoodV2ForPet>) {
  return result.signals.map((signal) => signal.code);
}

function assert(condition: unknown, message: string, details?: unknown) {
  if (condition) return;
  console.error(message);
  if (details) console.error(details);
  process.exit(1);
}

const renalComplete = evaluateRenalRules(
  food({ medical_tags: ["renal"] }),
  nutrients({ phosphorus_percent: 0.36, sodium_percent: 0.22 })
);
assert(
  renalComplete.boosts.includes("renal_phosphorus_sodium_context"),
  "Renal rules should boost renal foods when phosphorus and sodium are available.",
  renalComplete
);

const renalMissingSodium = evaluateRenalRules(
  food({ medical_tags: ["renal"] }),
  nutrients({ phosphorus_percent: 0.36, sodium_percent: null })
);
assert(
  renalMissingSodium.cautions.includes("missing_sodium_for_renal_context"),
  "Renal rules should caution when renal food has phosphorus but missing sodium.",
  renalMissingSodium
);

const nonRenalHighPhosphorus = evaluateRenalRules(
  food({ medical_tags: [] }),
  nutrients({ phosphorus_percent: 1.05, sodium_percent: 0.32 })
);
assert(
  nonRenalHighPhosphorus.cautions.includes("higher_phosphorus_not_renal_default"),
  "Renal rules should caution against non-renal high-phosphorus foods in renal context.",
  nonRenalHighPhosphorus
);

const urinaryComplete = evaluateUrinaryRules(
  food({ medical_tags: ["urinary"] }),
  nutrients({ magnesium_percent: 0.06, phosphorus_percent: 0.62, sodium_percent: 0.75 })
);
assert(
  urinaryComplete.boosts.includes("urinary_complete_mineral_context"),
  "Urinary rules should boost urinary foods when magnesium, phosphorus and sodium are available.",
  urinaryComplete
);

const urinaryMissingSodium = evaluateUrinaryRules(
  food({ medical_tags: ["urinary"] }),
  nutrients({ magnesium_percent: 0.06, phosphorus_percent: 0.62, sodium_percent: null })
);
assert(
  urinaryMissingSodium.cautions.includes("missing_sodium_for_urinary_context"),
  "Urinary rules should caution when urinary food has magnesium/phosphorus but missing sodium.",
  urinaryMissingSodium
);

const renalFeedingPlan = planFeedingRecommendation({
  row: {
    food: food({ medical_tags: ["renal"], formula_key: "qa-renal-complete" }),
    nutrients: nutrients({ phosphorus_percent: 0.36, sodium_percent: 0.22 }),
  },
  goal: "renal",
});
assert(
  renalFeedingPlan.boosts.includes("renal_phosphorus_sodium_context"),
  "Feeding engine should expose renal mineral-context boost.",
  renalFeedingPlan
);
assert(
  renalFeedingPlan.safety_notes.includes("renal_goal_requires_veterinary_context"),
  "Feeding engine should keep renal veterinary-context safety note.",
  renalFeedingPlan
);

const urinaryFeedingPlan = planFeedingRecommendation({
  row: {
    food: food({ medical_tags: ["urinary"], formula_key: "qa-urinary-complete" }),
    nutrients: nutrients({ magnesium_percent: 0.06, phosphorus_percent: 0.62, sodium_percent: 0.75 }),
  },
  goal: "urinary",
});
assert(
  urinaryFeedingPlan.boosts.includes("urinary_complete_mineral_context"),
  "Feeding engine should expose urinary complete-mineral-context boost.",
  urinaryFeedingPlan
);
assert(
  urinaryFeedingPlan.safety_notes.includes("urinary_goal_requires_symptom_screening"),
  "Feeding engine should keep urinary symptom-screening safety note.",
  urinaryFeedingPlan
);

const rankedRenal = rankFoodV2ForPet({
  food: food({
    formula_key: "qa-ranked-renal",
    display_name: "QA Renal Support",
    medical_tags: ["renal"],
  }),
  nutrients: nutrients({ phosphorus_percent: 0.36, sodium_percent: 0.22 }),
  pet: catWithRenalHistory,
  goal: "renal",
});
assert(
  signalCodes(rankedRenal).includes("renal_phosphorus_sodium_context"),
  "Food V2 ranking should include renal phosphorus/sodium context.",
  rankedRenal
);

const rankedUrinary = rankFoodV2ForPet({
  food: food({
    formula_key: "qa-ranked-urinary",
    display_name: "QA Urinary Support",
    medical_tags: ["urinary"],
  }),
  nutrients: nutrients({ magnesium_percent: 0.06, phosphorus_percent: 0.62, sodium_percent: 0.75 }),
  pet: catWithUrinaryHistory,
  goal: "urinary",
});
assert(
  signalCodes(rankedUrinary).includes("urinary_complete_mineral_context"),
  "Food V2 ranking should include urinary complete mineral context.",
  rankedUrinary
);

const rankedUrinaryMissingSodium = rankFoodV2ForPet({
  food: food({
    formula_key: "qa-ranked-urinary-missing-sodium",
    display_name: "QA Urinary Support",
    medical_tags: ["urinary"],
  }),
  nutrients: nutrients({ magnesium_percent: 0.06, phosphorus_percent: 0.62, sodium_percent: null }),
  pet: catWithUrinaryHistory,
  goal: "urinary",
});
assert(
  signalCodes(rankedUrinaryMissingSodium).includes("missing_sodium_for_urinary_context"),
  "Food V2 ranking should include urinary missing-sodium context.",
  rankedUrinaryMissingSodium
);

console.log("Medical renal/urinary rule edge cases passed.");
