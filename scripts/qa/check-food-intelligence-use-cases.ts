import { evaluateFoodIntelligence } from "@/lib/food-intelligence/evaluateFood";

function assert(condition: boolean, message: string, details?: unknown) {
  if (condition) return;

  console.error(message);
  if (details) console.error(details);
  process.exit(1);
}

const sterilisedLight = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "adult",
  dog_size: "small",
  health_tags: ["sterilised", "weight_control"],
  ingredient_tags: ["chicken", "rice"],
  medical_tags: [],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 332,
    protein_percent: 26,
    fat_percent: 9,
    fiber_percent: 5.5,
    calcium_percent: 1.1,
    phosphorus_percent: 0.8,
    magnesium_percent: 0.08,
  },
});

assert(
  sterilisedLight.best_use_cases.includes("calorie_aware_feeding"),
  "Expected calorie_aware_feeding for lower-kcal, lower-fat sterilised food.",
  sterilisedLight
);
assert(
  sterilisedLight.food_strengths.some((item) => item.includes("Fiber level")),
  "Expected fiber strength for satiety/stool support.",
  sterilisedLight
);

const activeFood = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "adult",
  dog_size: "large",
  health_tags: ["active"],
  ingredient_tags: ["chicken"],
  medical_tags: [],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 402,
    protein_percent: 30,
    fat_percent: 18,
    fiber_percent: 2.5,
    calcium_percent: 1.2,
    phosphorus_percent: 0.9,
  },
});

assert(
  activeFood.best_use_cases.includes("active_working"),
  "Expected active_working for active/high-energy food.",
  activeFood
);
assert(
  activeFood.not_ideal_cases.includes("low_activity_sterilised_without_portion_control"),
  "Expected high-calorie food to be marked as not ideal for low-activity/sterilised pets without portion control.",
  activeFood
);

const seniorMobility = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "senior",
  dog_size: "medium",
  health_tags: ["senior"],
  ingredient_tags: ["fish"],
  medical_tags: ["mobility"],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 350,
    protein_percent: 25,
    fat_percent: 12,
    fiber_percent: 3,
    calcium_percent: 1.1,
    phosphorus_percent: 0.8,
    epa_dha_percent: 0.3,
  },
});

assert(
  seniorMobility.best_use_cases.includes("senior_mobility"),
  "Expected senior_mobility when senior/mobility positioning has EPA-DHA data.",
  seniorMobility
);

const puppyGrowth = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "puppy",
  dog_size: "large",
  health_tags: ["puppy"],
  ingredient_tags: ["chicken"],
  medical_tags: [],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 380,
    protein_percent: 30,
    fat_percent: 15,
    fiber_percent: 2.8,
    calcium_percent: 1.2,
    phosphorus_percent: 0.9,
    dha_percent: 0.08,
  },
});

assert(
  puppyGrowth.best_use_cases.includes("growth_development"),
  "Expected growth_development for puppy food with DHA.",
  puppyGrowth
);

const renalFood = evaluateFoodIntelligence({
  species: "cat",
  life_stage: "senior",
  health_tags: ["senior"],
  ingredient_tags: ["fish"],
  medical_tags: ["renal"],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 390,
    protein_percent: 24,
    fat_percent: 16,
    fiber_percent: 2,
    phosphorus_percent: 0.45,
  },
});

assert(
  renalFood.best_use_cases.includes("renal_phosphorus_review"),
  "Expected renal_phosphorus_review for renal-positioned food with phosphorus data.",
  renalFood
);

const lowFatPancreatitisReview = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "adult",
  health_tags: ["sensitive_digestion"],
  ingredient_tags: ["turkey", "rice"],
  medical_tags: ["pancreatitis"],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 330,
    protein_percent: 24,
    fat_percent: 8,
    fiber_percent: 3,
    calcium_percent: 1,
    phosphorus_percent: 0.8,
  },
});

assert(
  lowFatPancreatitisReview.best_use_cases.includes("low_fat_pancreatitis_review"),
  "Expected low_fat_pancreatitis_review for pancreatitis-positioned food with low fat data.",
  lowFatPancreatitisReview
);

const highFatPancreatitisMismatch = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "adult",
  health_tags: ["sensitive_digestion"],
  ingredient_tags: ["chicken", "salmon"],
  medical_tags: ["pancreatitis"],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 410,
    protein_percent: 29,
    fat_percent: 18,
    fiber_percent: 2.5,
    calcium_percent: 1.2,
    phosphorus_percent: 0.9,
  },
});

assert(
  highFatPancreatitisMismatch.not_ideal_cases.includes("pancreatitis_without_low_fat_review"),
  "Expected high-fat pancreatitis-sensitive food to be flagged as not ideal without low-fat review.",
  highFatPancreatitisMismatch
);

const limitedProteinAllergyReview = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "adult",
  health_tags: ["allergy"],
  ingredient_tags: ["duck", "rice"],
  medical_tags: ["dermatosis"],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 360,
    protein_percent: 25,
    fat_percent: 13,
    fiber_percent: 2.8,
    calcium_percent: 1.1,
    phosphorus_percent: 0.8,
  },
});

assert(
  limitedProteinAllergyReview.best_use_cases.includes("limited_protein_allergy_review"),
  "Expected limited_protein_allergy_review for allergy-positioned food with one clear animal protein tag.",
  limitedProteinAllergyReview
);

console.log("Food intelligence use-case QA passed.");
