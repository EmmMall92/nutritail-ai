import { rankFoodV2ForPet } from "@/lib/food-v2/recommendationRanking";
import type { FoodProductV2 } from "@/types/food-v2";
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
  dog_size: "large",
  breed_target: null,
  medical_tags: [],
  commercial_tags: [],
  ingredient_text: "duck, rice, fat, fiber, minerals",
  ingredients: ["duck", "rice", "fat", "fiber", "minerals"],
  primary_animal_proteins: ["duck"],
  carbohydrate_sources: ["rice"],
  fat_sources: [],
  fiber_sources: [],
  data_quality_status: "verified",
  source_priority: "official",
  data_source_url: null,
  source_notes: null,
  kcal_per_100g: null,
  kcal_per_kg: null,
  created_at: "",
  updated_at: "",
};

const highActivityDog: Pick<
  Pet,
  "species" | "breed" | "age" | "weight" | "activityLevel" | "neutered"
> & { allergies: string[]; healthIssues: string[] } = {
  species: "dog",
  breed: "Belgian Malinois",
  age: 3,
  weight: 28,
  activityLevel: "high",
  neutered: false,
  allergies: [],
  healthIssues: ["working dog", "daily training"],
};

function signalCodes(result: ReturnType<typeof rankFoodV2ForPet>) {
  return result.signals.map((signal) => signal.code);
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const lightSterilised = rankFoodV2ForPet({
  food: {
    ...baseFood,
    formula_key: "light-sterilised",
    display_name: "Large Light Sterilised",
    commercial_tags: ["sterilised", "light"],
    kcal_per_100g: 332,
  },
  nutrients: {
    protein_percent: 22,
    fat_percent: 9,
    fiber_percent: 3,
  },
  pet: highActivityDog,
  goal: "general",
});

const activePerformance = rankFoodV2ForPet({
  food: {
    ...baseFood,
    formula_key: "active-performance",
    display_name: "Large Adult Active",
    commercial_tags: ["active", "performance"],
    kcal_per_100g: 395,
  },
  nutrients: {
    protein_percent: 28,
    fat_percent: 18,
    fiber_percent: 2,
  },
  pet: highActivityDog,
  goal: "general",
});

const weightGainHighActivityDog = {
  ...highActivityDog,
  healthIssues: ["working dog", "daily training", "needs weight gain"],
};

const lightSterilisedForGain = rankFoodV2ForPet({
  food: {
    ...baseFood,
    formula_key: "light-sterilised-gain",
    display_name: "Large Light Sterilised",
    commercial_tags: ["sterilised", "light"],
    kcal_per_100g: 344,
  },
  nutrients: {
    protein_percent: 30,
    fat_percent: 11,
    fiber_percent: 5.7,
  },
  pet: weightGainHighActivityDog,
  goal: "general",
});

assert(
  lightSterilised.bucket === "hold",
  "Light/sterilised formula should be held for a high-activity dog when weight loss is not the goal."
);
assert(
  signalCodes(lightSterilised).includes("light_formula_for_high_activity_pet"),
  "Light/sterilised high-activity mismatch should emit a clear signal."
);
assert(
  activePerformance.bucket !== "hold",
  "Active/performance formula should remain usable for a high-activity dog."
);
assert(
  signalCodes(activePerformance).includes("active_formula_activity_fit"),
  "Active/performance formula should receive the active activity fit signal."
);
assert(
  signalCodes(activePerformance).includes("energy_density_for_high_activity"),
  "High-activity formula should receive energy-density support."
);
assert(
  lightSterilisedForGain.bucket === "hold",
  "Light/sterilised formula should be held for high-activity dogs that need weight gain."
);
assert(
  !signalCodes(lightSterilisedForGain).includes("sterilised_fit"),
  "Weight-gain context must not be treated as a weight-control or sterilised fit."
);

console.log(
  JSON.stringify(
    {
      checked: 3,
      passed: 3,
      light_sterilised: {
        bucket: lightSterilised.bucket,
        score: lightSterilised.total_score,
        signals: signalCodes(lightSterilised),
      },
      active_performance: {
        bucket: activePerformance.bucket,
        score: activePerformance.total_score,
        signals: signalCodes(activePerformance),
      },
      light_sterilised_for_gain: {
        bucket: lightSterilisedForGain.bucket,
        score: lightSterilisedForGain.total_score,
        signals: signalCodes(lightSterilisedForGain),
      },
    },
    null,
    2
  )
);
