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

const activeEnduranceProteinSupport = rankFoodV2ForPet({
  food: {
    ...baseFood,
    formula_key: "active-endurance-protein",
    display_name: "Large Adult Endurance Trail",
    commercial_tags: ["endurance"],
    kcal_per_100g: 390,
  },
  nutrients: {
    protein_percent: 27,
    fat_percent: 17,
    fiber_percent: 2.5,
  },
  pet: highActivityDog,
  goal: "general",
});

const lowEnergyMaintenance = rankFoodV2ForPet({
  food: {
    ...baseFood,
    formula_key: "low-energy-maintenance",
    display_name: "Large Adult Maintenance",
    commercial_tags: ["adult"],
    kcal_per_100g: 340,
  },
  nutrients: {
    protein_percent: 23,
    fat_percent: 10,
    fiber_percent: 3,
  },
  pet: highActivityDog,
  goal: "general",
});

const lowProteinMaintenance = rankFoodV2ForPet({
  food: {
    ...baseFood,
    formula_key: "low-protein-maintenance",
    display_name: "Large Adult Maintenance",
    commercial_tags: ["adult"],
    kcal_per_100g: 370,
  },
  nutrients: {
    protein_percent: 19,
    fat_percent: 15,
    fiber_percent: 3,
  },
  pet: highActivityDog,
  goal: "general",
});

const modestEnergyMaintenance = rankFoodV2ForPet({
  food: {
    ...baseFood,
    formula_key: "modest-energy-maintenance",
    display_name: "Large Adult Maintenance",
    commercial_tags: ["adult"],
    kcal_per_100g: 348,
  },
  nutrients: {
    protein_percent: 24,
    fat_percent: 14,
    fiber_percent: 2.5,
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

const lowFatActiveForGain = rankFoodV2ForPet({
  food: {
    ...baseFood,
    formula_key: "low-fat-active-gain",
    display_name: "Large Adult Sport",
    commercial_tags: ["active", "performance"],
    kcal_per_100g: 420,
  },
  nutrients: {
    protein_percent: 28,
    fat_percent: 2.5,
    fiber_percent: 3,
  },
  pet: weightGainHighActivityDog,
  goal: "general",
});

const lowEnergyMaintenanceForGain = rankFoodV2ForPet({
  food: {
    ...baseFood,
    formula_key: "low-energy-maintenance-gain",
    display_name: "Large Adult Maintenance",
    commercial_tags: ["adult"],
    kcal_per_100g: 340,
  },
  nutrients: {
    protein_percent: 24,
    fat_percent: 10,
    fiber_percent: 3,
  },
  pet: weightGainHighActivityDog,
  goal: "general",
});

const lowProteinMaintenanceForGain = rankFoodV2ForPet({
  food: {
    ...baseFood,
    formula_key: "low-protein-maintenance-gain",
    display_name: "Large Adult Maintenance",
    commercial_tags: ["adult"],
    kcal_per_100g: 385,
  },
  nutrients: {
    protein_percent: 19,
    fat_percent: 16,
    fiber_percent: 3,
  },
  pet: weightGainHighActivityDog,
  goal: "general",
});

const strictWeightControlModerateEnergy = rankFoodV2ForPet({
  food: {
    ...baseFood,
    formula_key: "strict-weight-moderate-energy",
    display_name: "Large Adult Maintenance",
    commercial_tags: ["adult"],
    kcal_per_100g: 370,
  },
  nutrients: {
    protein_percent: 25,
    fat_percent: 12,
    fiber_percent: 4,
  },
  pet: {
    ...highActivityDog,
    activityLevel: "low",
    neutered: true,
    healthIssues: ["recently sterilised", "weight maintenance"],
  },
  goal: "sterilised",
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
  signalCodes(activeEnduranceProteinSupport).includes("active_formula_activity_fit"),
  "Endurance/trail positioning should count as active positioning."
);
assert(
  signalCodes(activeEnduranceProteinSupport).includes("protein_supports_active_pet"),
  "Active-positioned food should receive protein support for high-activity dogs."
);
assert(
  signalCodes(activeEnduranceProteinSupport).includes("protein_supports_high_activity"),
  "High-activity food should receive a general protein support signal."
);
assert(
  signalCodes(lowEnergyMaintenance).includes("low_energy_formula_for_high_activity_pet"),
  "Low-energy maintenance food should be marked as weaker for high-activity dogs."
);
assert(
  signalCodes(lowProteinMaintenance).includes("low_protein_formula_for_high_activity_pet"),
  "Low-protein maintenance food should be marked as weaker for high-activity dogs."
);
assert(
  activePerformance.total_score > lowEnergyMaintenance.total_score,
  "Active/performance formula should outrank low-energy maintenance food for high-activity dogs."
);
assert(
  signalCodes(modestEnergyMaintenance).includes("modest_energy_formula_for_high_activity_pet"),
  "Modest-energy maintenance food should be marked as weaker for high-activity dogs."
);
assert(
  signalCodes(modestEnergyMaintenance).includes("high_activity_without_active_positioning"),
  "Generic maintenance food should be marked as weaker than visible active/performance foods for high-activity dogs."
);
assert(
  activePerformance.total_score > modestEnergyMaintenance.total_score,
  "Active/performance formula should outrank modest-energy maintenance food for high-activity dogs."
);
assert(
  lightSterilisedForGain.bucket === "hold",
  "Light/sterilised formula should be held for high-activity dogs that need weight gain."
);
assert(
  !signalCodes(lightSterilisedForGain).includes("sterilised_fit"),
  "Weight-gain context must not be treated as a weight-control or sterilised fit."
);
assert(
  lowFatActiveForGain.bucket === "hold",
  "Low-fat formula should be held for active dogs that need weight gain, even when the title says sport."
);
assert(
  signalCodes(lowFatActiveForGain).includes("low_fat_formula_for_active_gain_pet"),
  "Active weight-gain low-fat mismatch should emit a clear blocking signal."
);
assert(
  lowEnergyMaintenanceForGain.bucket === "hold",
  "Low-energy maintenance food should be held for active dogs that need weight gain."
);
assert(
  signalCodes(lowEnergyMaintenanceForGain).includes("low_energy_formula_for_high_activity_pet"),
  "Low-energy weight-gain mismatch should emit a clear blocking signal."
);
assert(
  lowProteinMaintenanceForGain.bucket === "hold",
  "Low-protein maintenance food should be held for active dogs that need weight gain."
);
assert(
  signalCodes(lowProteinMaintenanceForGain).includes("low_protein_formula_for_high_activity_pet"),
  "Low-protein active weight-gain mismatch should emit a clear blocking signal."
);
assert(
  signalCodes(strictWeightControlModerateEnergy).includes(
    "moderate_high_energy_strict_weight_context"
  ),
  "Strict sterilised/weight-control contexts should caution foods around 370 kcal/100g instead of boosting them as acceptable."
);
assert(
  !signalCodes(strictWeightControlModerateEnergy).includes("acceptable_energy_neutered"),
  "Strict sterilised/weight-control contexts should not give acceptable-energy boost above 360 kcal/100g."
);

console.log(
  JSON.stringify(
    {
      checked: 14,
      passed: 14,
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
      active_endurance_protein_support: {
        bucket: activeEnduranceProteinSupport.bucket,
        score: activeEnduranceProteinSupport.total_score,
        signals: signalCodes(activeEnduranceProteinSupport),
      },
      low_energy_maintenance: {
        bucket: lowEnergyMaintenance.bucket,
        score: lowEnergyMaintenance.total_score,
        signals: signalCodes(lowEnergyMaintenance),
      },
      modest_energy_maintenance: {
        bucket: modestEnergyMaintenance.bucket,
        score: modestEnergyMaintenance.total_score,
        signals: signalCodes(modestEnergyMaintenance),
      },
      low_protein_maintenance: {
        bucket: lowProteinMaintenance.bucket,
        score: lowProteinMaintenance.total_score,
        signals: signalCodes(lowProteinMaintenance),
      },
      light_sterilised_for_gain: {
        bucket: lightSterilisedForGain.bucket,
        score: lightSterilisedForGain.total_score,
        signals: signalCodes(lightSterilisedForGain),
      },
      low_fat_active_for_gain: {
        bucket: lowFatActiveForGain.bucket,
        score: lowFatActiveForGain.total_score,
        signals: signalCodes(lowFatActiveForGain),
      },
      low_energy_maintenance_for_gain: {
        bucket: lowEnergyMaintenanceForGain.bucket,
        score: lowEnergyMaintenanceForGain.total_score,
        signals: signalCodes(lowEnergyMaintenanceForGain),
      },
      low_protein_maintenance_for_gain: {
        bucket: lowProteinMaintenanceForGain.bucket,
        score: lowProteinMaintenanceForGain.total_score,
        signals: signalCodes(lowProteinMaintenanceForGain),
      },
      strict_weight_control_moderate_energy: {
        bucket: strictWeightControlModerateEnergy.bucket,
        score: strictWeightControlModerateEnergy.total_score,
        signals: signalCodes(strictWeightControlModerateEnergy),
      },
    },
    null,
    2
  )
);
