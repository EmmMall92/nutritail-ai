import { ingredientProfiles, nutrientProfiles } from "@/lib/food-intelligence/profiles";

export type FoodIntelligenceInput = {
  species?: "dog" | "cat" | string | null;
  life_stage?: string | null;
  dog_size?: string | null;
  ingredient_tags?: string[];
  health_tags?: string[];
  medical_tags?: string[];
  data_quality_status?: string | null;
  source_priority?: string | null;
  nutrients?: {
    kcal_per_100g?: number | null;
    protein_percent?: number | null;
    fat_percent?: number | null;
    fiber_percent?: number | null;
    calcium_percent?: number | null;
    phosphorus_percent?: number | null;
    magnesium_percent?: number | null;
    sodium_percent?: number | null;
    epa_percent?: number | null;
    dha_percent?: number | null;
    epa_dha_percent?: number | null;
  };
};

export type FoodIntelligenceResult = {
  score: number;
  confidence_level: "high" | "medium" | "low";
  sub_scores: {
    protein_quality: number;
    ingredient_quality: number;
    caloric_density: number;
    mineral_balance: number;
    life_stage_suitability: number;
  };
  food_strengths: string[];
  food_cautions: string[];
  best_use_cases: string[];
  not_ideal_cases: string[];
};

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function allTags(input: FoodIntelligenceInput) {
  return [
    ...(input.ingredient_tags ?? []),
    ...(input.health_tags ?? []),
    ...(input.medical_tags ?? []),
  ].map((tag) => tag.toLowerCase());
}

function hasTag(input: FoodIntelligenceInput, terms: string[]) {
  const tags = allTags(input);
  return tags.some((tag) =>
    terms.some((term) => tag.includes(term.toLowerCase()))
  );
}

function addUnique(result: string[], value: string) {
  if (!result.includes(value)) result.push(value);
}

const animalProteinTags = [
  "chicken",
  "lamb",
  "salmon",
  "duck",
  "beef",
  "fish",
  "turkey",
  "pork",
  "rabbit",
  "tuna",
  "venison",
  "deer",
  "insect",
  "egg",
];

function animalProteinCount(input: FoodIntelligenceInput) {
  const tags = new Set((input.ingredient_tags ?? []).map((tag) => tag.toLowerCase()));
  return animalProteinTags.filter((tag) => tags.has(tag)).length;
}

function calciumPhosphorusRatio(input: FoodIntelligenceInput) {
  const calcium = input.nutrients?.calcium_percent;
  const phosphorus = input.nutrients?.phosphorus_percent;

  if (!hasNumber(calcium) || !hasNumber(phosphorus) || phosphorus <= 0) {
    return null;
  }

  return calcium / phosphorus;
}

function hasOmegaDetail(input: FoodIntelligenceInput) {
  const nutrients = input.nutrients ?? {};

  return (
    hasNumber(nutrients.epa_percent) ||
    hasNumber(nutrients.dha_percent) ||
    hasNumber(nutrients.epa_dha_percent)
  );
}

function hasSplitEpaDhaDetail(input: FoodIntelligenceInput) {
  const nutrients = input.nutrients ?? {};

  return hasNumber(nutrients.epa_percent) && hasNumber(nutrients.dha_percent);
}

function hasCombinedOnlyEpaDhaDetail(input: FoodIntelligenceInput) {
  const nutrients = input.nutrients ?? {};

  return (
    hasNumber(nutrients.epa_dha_percent) &&
    !hasNumber(nutrients.epa_percent) &&
    !hasNumber(nutrients.dha_percent)
  );
}

function hasEpaRelevantContext(input: FoodIntelligenceInput) {
  return hasTag(input, ["senior", "mature", "joint", "mobility", "skin", "coat", "dermatosis", "renal", "kidney"]);
}

function hasDhaRelevantContext(input: FoodIntelligenceInput) {
  return ["puppy", "kitten"].includes(input.life_stage ?? "") || hasTag(input, ["puppy", "kitten", "growth"]);
}

function hasWeightAwareNutrition(input: FoodIntelligenceInput) {
  const nutrients = input.nutrients ?? {};

  return (
    hasNumber(nutrients.kcal_per_100g) &&
    nutrients.kcal_per_100g <= 350 &&
    hasNumber(nutrients.fat_percent) &&
    nutrients.fat_percent <= 12
  );
}

function hasEnergyDenseNutrition(input: FoodIntelligenceInput) {
  const nutrients = input.nutrients ?? {};

  return (
    hasNumber(nutrients.kcal_per_100g) &&
    nutrients.kcal_per_100g >= 380 &&
    hasNumber(nutrients.fat_percent) &&
    nutrients.fat_percent >= 16
  );
}

function hasHairballFiberSupport(input: FoodIntelligenceInput) {
  const fiber = input.nutrients?.fiber_percent;

  return (
    hasTag(input, ["hairball"]) &&
    hasNumber(fiber) &&
    fiber >= 4
  );
}

function hasFussyEaterContext(input: FoodIntelligenceInput) {
  return hasTag(input, [
    "fussy",
    "picky",
    "appetite",
    "palatable",
    "palatability",
    "aroma",
    "savoury",
    "savory",
  ]);
}

function hasFussyPalatabilitySupport(input: FoodIntelligenceInput) {
  const fat = input.nutrients?.fat_percent;

  return (
    hasFussyEaterContext(input) &&
    (animalProteinCount(input) >= 1 ||
      hasTag(input, ["fresh", "hydrolysed", "hydrolyzed", "digest", "fish_oil"]) ||
      (hasNumber(fat) && fat >= 12))
  );
}

function hasChewingEaseContext(input: FoodIntelligenceInput) {
  return hasTag(input, [
    "easy_chewing",
    "easy_to_chew",
    "small_kibble",
    "kibble_size",
    "dental",
    "oral",
    "tooth",
    "teeth",
    "senior_dental",
  ]);
}

function hasChewingEaseSupport(input: FoodIntelligenceInput) {
  const size = String(input.dog_size ?? "").toLowerCase();

  return (
    hasChewingEaseContext(input) &&
    (hasTag(input, ["small_kibble", "mini", "xsmall", "small_breed", "easy_chewing", "easy_to_chew"]) ||
      size.includes("mini") ||
      size.includes("small") ||
      size.includes("xsmall"))
  );
}

function hasHotWeatherContext(input: FoodIntelligenceInput) {
  return hasTag(input, [
    "summer",
    "hot_weather",
    "hot_climate",
    "heat",
    "heatwave",
    "warm_weather",
    "καλοκαιρι",
    "ζεστη",
  ]);
}

function hasLowAppetiteContext(input: FoodIntelligenceInput) {
  return hasTag(input, [
    "low_appetite",
    "reduced_appetite",
    "poor_appetite",
    "eats_little",
    "picky",
    "fussy",
    "appetite",
    "μειωμενη_ορεξη",
  ]);
}

function hasSummerLowAppetiteContext(input: FoodIntelligenceInput) {
  return hasHotWeatherContext(input) && hasLowAppetiteContext(input);
}

function hasSummerLowAppetiteSupport(input: FoodIntelligenceInput) {
  const nutrients = input.nutrients ?? {};

  return (
    hasSummerLowAppetiteContext(input) &&
    hasNumber(nutrients.kcal_per_100g) &&
    nutrients.kcal_per_100g >= 355 &&
    (!hasNumber(nutrients.fat_percent) || nutrients.fat_percent >= 10)
  );
}

function isLargeBreedGrowthContext(input: FoodIntelligenceInput) {
  const size = String(input.dog_size ?? "").toLowerCase();

  return (
    input.species === "dog" &&
    input.life_stage === "puppy" &&
    (size.includes("large") ||
      size.includes("giant") ||
      hasTag(input, ["large_breed", "giant_breed", "maxi"]))
  );
}

function proteinQuality(input: FoodIntelligenceInput) {
  const protein = input.nutrients?.protein_percent;
  const ingredientTags = input.ingredient_tags ?? [];
  let score = 35;

  if (hasNumber(protein)) {
    if (protein >= 24) score += 25;
    else if (protein >= 18) score += 15;
    else score += 5;
  }

  if (
    ingredientTags.some((tag) =>
      ["chicken", "lamb", "salmon", "duck", "beef", "fish", "turkey"].includes(tag)
    )
  ) {
    score += 20;
  }

  return clamp(score);
}

function ingredientQuality(input: FoodIntelligenceInput) {
  const tags = input.ingredient_tags ?? [];
  let score = 45;

  if (tags.length >= 3) score += 15;
  if (tags.includes("digestive_support")) score += 10;
  if (tags.includes("functional_support")) score += 10;
  if (tags.includes("grain_free")) score += 3;

  return clamp(score);
}

function caloricDensity(input: FoodIntelligenceInput) {
  const kcal = input.nutrients?.kcal_per_100g;
  if (!hasNumber(kcal)) return 45;
  if (kcal < 320) return 65;
  if (kcal <= 410) return 80;
  return 55;
}

function mineralBalance(input: FoodIntelligenceInput) {
  const calcium = input.nutrients?.calcium_percent;
  const phosphorus = input.nutrients?.phosphorus_percent;
  const magnesium = input.nutrients?.magnesium_percent;
  const sodium = input.nutrients?.sodium_percent;
  let score = 35;

  if (hasNumber(calcium)) score += 18;
  if (hasNumber(phosphorus)) score += 18;
  if (hasNumber(magnesium)) score += 12;
  if (hasNumber(sodium)) score += 12;

  if (hasNumber(calcium) && hasNumber(phosphorus) && phosphorus > 0) {
    const ratio = calcium / phosphorus;
    if (ratio >= 1 && ratio <= 2) score += 5;
    if (ratio < 0.8 || ratio > 2.2) score -= 15;
  }

  return clamp(score);
}

function lifeStageSuitability(input: FoodIntelligenceInput) {
  const tags = [...(input.health_tags ?? []), ...(input.medical_tags ?? [])];
  let score = 55;

  if (input.life_stage && input.life_stage !== "unknown") score += 15;
  if (input.life_stage === "puppy" && tags.includes("puppy")) score += 15;
  if (input.life_stage === "kitten" && tags.includes("kitten")) score += 15;
  if (input.life_stage === "senior" && tags.includes("senior")) score += 10;
  if (input.dog_size && input.dog_size !== "unknown") score += 5;

  return clamp(score);
}

function confidence(input: FoodIntelligenceInput, score: number): "high" | "medium" | "low" {
  const nutrients = input.nutrients ?? {};
  const knownCore = [
    nutrients.kcal_per_100g,
    nutrients.protein_percent,
    nutrients.fat_percent,
    nutrients.fiber_percent,
  ].filter(hasNumber).length;
  const verified = input.data_quality_status === "verified";

  if (verified && knownCore >= 4 && score >= 70) return "high";
  if (knownCore >= 3 && input.data_quality_status !== "unknown") return "medium";
  return "low";
}

function strengths(input: FoodIntelligenceInput) {
  const tags = input.ingredient_tags ?? [];
  const result: string[] = [];
  const nutrients = input.nutrients ?? {};

  for (const profile of ingredientProfiles) {
    if (tags.includes(profile.tag)) result.push(...profile.strengths);
  }

  if (hasNumber(nutrients.kcal_per_100g) && nutrients.kcal_per_100g <= 350) {
    addUnique(result, "Lower calorie density supports measured feeding.");
  }
  if (hasNumber(nutrients.protein_percent) && nutrients.protein_percent >= 28) {
    addUnique(result, "Higher protein level supports lean-mass-aware feeding.");
  }
  if (hasNumber(nutrients.fiber_percent) && nutrients.fiber_percent >= 5) {
    addUnique(result, "Fiber level can support satiety or stool quality.");
  }
  if (
    hasWeightAwareNutrition(input) &&
    hasTag(input, ["sterilised", "sterilized", "neutered", "light", "weight_control"])
  ) {
    addUnique(result, "Calorie and fat profile fits weight-aware feeding.");
  }
  if (hasEnergyDenseNutrition(input) && hasTag(input, ["active", "performance", "sport", "working"])) {
    addUnique(result, "Energy and fat profile can support active or working dogs.");
  }
  if (hasNumber(nutrients.fat_percent) && nutrients.fat_percent >= 16) {
    addUnique(result, "Higher fat level can support active or weight-gain contexts.");
  }
  if (hasOmegaDetail(input)) {
    addUnique(result, "Declared EPA/DHA improves omega-3 reasoning.");
  }
  if (hasSplitEpaDhaDetail(input)) {
    addUnique(result, "EPA and DHA are declared separately, which gives stronger omega-3 interpretation.");
  }
  if (hasCombinedOnlyEpaDhaDetail(input)) {
    addUnique(result, "Combined EPA/DHA is declared, so omega-3 support can still be considered.");
  }
  if (hasEpaRelevantContext(input) && hasNumber(nutrients.epa_percent)) {
    addUnique(result, "Declared EPA supports skin, mobility, or renal omega-3 review.");
  }
  if (hasDhaRelevantContext(input) && hasNumber(nutrients.dha_percent)) {
    addUnique(result, "Declared DHA supports growth and neuro-visual development review.");
  }
  if (hasNumber(nutrients.calcium_percent) && hasNumber(nutrients.phosphorus_percent)) {
    addUnique(result, "Calcium and phosphorus are available for mineral review.");
  }
  if (
    hasTag(input, ["urinary", "struvite", "oxalate"]) &&
    hasNumber(nutrients.magnesium_percent) &&
    hasNumber(nutrients.phosphorus_percent) &&
    hasNumber(nutrients.sodium_percent)
  ) {
    addUnique(result, "Magnesium, phosphorus and sodium are available for urinary mineral review.");
  }
  if (
    hasTag(input, ["renal", "kidney"]) &&
    hasNumber(nutrients.phosphorus_percent) &&
    hasNumber(nutrients.sodium_percent)
  ) {
    addUnique(result, "Phosphorus and sodium are available for renal mineral review.");
  }
  if (
    animalProteinCount(input) === 1 &&
    hasTag(input, ["allergy", "hypoallergenic", "monoprotein", "sensitive", "dermatosis"])
  ) {
    addUnique(result, "Single clear animal protein can support ingredient-avoidance planning.");
  }
  if (hasHairballFiberSupport(input)) {
    addUnique(result, "Fiber level supports hairball-control positioning.");
  }
  if (hasFussyPalatabilitySupport(input)) {
    addUnique(result, "Palatability signals can help fussy-eater trials.");
  }
  if (hasChewingEaseSupport(input)) {
    addUnique(result, "Small-breed or easy-chew positioning can help pets that struggle with large kibble.");
  }
  if (hasSummerLowAppetiteSupport(input)) {
    addUnique(result, "Moderate energy density can help when seasonal heat reduces how much the pet eats.");
  }
  if (
    input.species === "cat" &&
    hasTag(input, ["indoor", "sterilised", "sterilized", "neutered"]) &&
    hasWeightAwareNutrition(input)
  ) {
    addUnique(result, "Calorie and fat profile fits indoor or sterilised cat feeding.");
  }

  for (const profile of nutrientProfiles) {
    const field = profile.field as keyof NonNullable<FoodIntelligenceInput["nutrients"]>;
    if (hasNumber(input.nutrients?.[field])) {
      result.push(`${profile.field}: ${profile.role}`);
    }
  }

  if (input.source_priority === "official") result.push("Backed by official source priority.");
  if (input.data_quality_status === "verified") result.push("Verified Food V2 row.");

  return [...new Set(result)].slice(0, 8);
}

function cautions(input: FoodIntelligenceInput) {
  const tags = input.ingredient_tags ?? [];
  const result: string[] = [];

  for (const profile of ingredientProfiles) {
    if (tags.includes(profile.tag)) result.push(...profile.cautions);
  }

  if (!hasNumber(input.nutrients?.kcal_per_100g)) {
    result.push("Calories are missing, so portion guidance is limited.");
  }
  if (!hasNumber(input.nutrients?.calcium_percent) || !hasNumber(input.nutrients?.phosphorus_percent)) {
    result.push("Calcium/phosphorus data is incomplete for growth or renal-sensitive use.");
  }
  if (input.data_quality_status === "needs_review") {
    result.push("Needs review before confident chatbot claims.");
  }
  if (hasNumber(input.nutrients?.fat_percent) && input.nutrients.fat_percent >= 18) {
    result.push("Fat is high for weight-control or pancreatitis-sensitive contexts.");
  }
  if (
    hasTag(input, ["pancreatitis", "pancreatic"]) &&
    hasNumber(input.nutrients?.fat_percent) &&
    input.nutrients.fat_percent > 12
  ) {
    result.push("Pancreatitis-sensitive use usually needs a veterinarian-guided low-fat decision.");
  }
  if (hasNumber(input.nutrients?.kcal_per_100g) && input.nutrients.kcal_per_100g >= 390) {
    result.push("Calories are high for low-activity or sterilised pets.");
  }
  if (
    hasEnergyDenseNutrition(input) &&
    hasTag(input, ["sterilised", "sterilized", "neutered", "light", "weight_control", "obesity"])
  ) {
    result.push("Energy and fat are too high for a first sterilised or weight-control shortlist.");
  }
  if (
    hasWeightAwareNutrition(input) &&
    hasTag(input, ["active", "performance", "sport", "working"])
  ) {
    result.push("Weight-aware nutrition may underserve genuinely active or working dogs.");
  }
  if (
    input.life_stage === "senior" &&
    !hasTag(input, ["senior", "mature", "joint", "mobility"]) &&
    !hasOmegaDetail(input)
  ) {
    result.push("Senior use is weaker without senior positioning or declared mobility/omega detail.");
  }
  if (
    hasTag(input, ["renal", "kidney"]) &&
    !hasNumber(input.nutrients?.phosphorus_percent)
  ) {
    result.push("Renal-positioned use needs phosphorus data.");
  }
  if (
    hasTag(input, ["renal", "kidney"]) &&
    hasNumber(input.nutrients?.phosphorus_percent) &&
    !hasNumber(input.nutrients?.sodium_percent)
  ) {
    result.push("Renal-positioned use is stronger with sodium context as well as phosphorus.");
  }
  if (
    hasTag(input, ["urinary", "struvite", "oxalate"]) &&
    (!hasNumber(input.nutrients?.magnesium_percent) || !hasNumber(input.nutrients?.phosphorus_percent))
  ) {
    result.push("Urinary-positioned use needs magnesium and phosphorus context.");
  }
  if (
    hasTag(input, ["urinary", "struvite", "oxalate"]) &&
    hasNumber(input.nutrients?.magnesium_percent) &&
    hasNumber(input.nutrients?.phosphorus_percent) &&
    !hasNumber(input.nutrients?.sodium_percent)
  ) {
    result.push("Urinary-positioned use is stronger when sodium is available too.");
  }
  if (
    hasTag(input, ["skin", "coat", "dermatosis", "itch"]) &&
    !hasOmegaDetail(input)
  ) {
    result.push("Skin/coat positioning is weaker without declared EPA/DHA detail.");
  }
  if (
    hasCombinedOnlyEpaDhaDetail(input) &&
    (hasEpaRelevantContext(input) || hasDhaRelevantContext(input))
  ) {
    result.push("EPA/DHA is combined rather than split, so omega interpretation is useful but less precise.");
  }
  if (
    hasTag(input, ["hairball"]) &&
    (!hasNumber(input.nutrients?.fiber_percent) || input.nutrients.fiber_percent < 4)
  ) {
    result.push("Hairball positioning is weaker without a clear fiber-support level.");
  }
  if (hasFussyEaterContext(input) && !hasFussyPalatabilitySupport(input)) {
    result.push("Fussy-eater positioning is weaker without clear palatability or animal-protein signals.");
  }
  if (hasChewingEaseContext(input) && !hasChewingEaseSupport(input)) {
    result.push("Chewing-ease use is weaker without small-kibble or easy-chew positioning.");
  }
  if (hasSummerLowAppetiteContext(input)) {
    result.push("Seasonal low appetite needs hydration and body-weight monitoring.");
  }
  if (
    hasSummerLowAppetiteContext(input) &&
    ((hasNumber(input.nutrients?.kcal_per_100g) && input.nutrients.kcal_per_100g <= 335) ||
      (hasNumber(input.nutrients?.fat_percent) && input.nutrients.fat_percent <= 9))
  ) {
    result.push("Light or very low-energy nutrition is weaker when the pet already eats little in hot weather.");
  }

  return [...new Set(result)].slice(0, 8);
}

function bestUseCases(input: FoodIntelligenceInput) {
  const nutrients = input.nutrients ?? {};
  const result = [
    ...(input.health_tags ?? []),
    ...(input.medical_tags ?? []),
    input.life_stage && input.life_stage !== "unknown" ? input.life_stage : "",
  ].filter(Boolean);

  if (
    hasTag(input, ["sterilised", "sterilized", "neutered", "weight_control", "obesity"]) ||
    hasWeightAwareNutrition(input)
  ) {
    addUnique(result, "calorie_aware_feeding");
  }
  if (
    hasTag(input, ["sterilised", "sterilized", "neutered"]) &&
    hasWeightAwareNutrition(input)
  ) {
    addUnique(result, "sterilised_weight_management");
  }
  if (
    hasTag(input, ["active", "performance", "sport", "working"]) ||
    hasEnergyDenseNutrition(input)
  ) {
    addUnique(result, "active_working");
  }
  if (
    hasTag(input, ["active", "performance", "sport", "working"]) &&
    hasEnergyDenseNutrition(input)
  ) {
    addUnique(result, "high_activity_energy_support");
  }
  if (
    (input.life_stage === "senior" || hasTag(input, ["senior", "mature", "joint", "mobility"])) &&
    (hasOmegaDetail(input) || hasTag(input, ["joint", "mobility"]))
  ) {
    addUnique(result, "senior_mobility");
  }
  if (
    hasEpaRelevantContext(input) &&
    (hasNumber(nutrients.epa_percent) || hasNumber(nutrients.epa_dha_percent))
  ) {
    addUnique(result, "epa_omega_review");
  }
  if (
    (input.life_stage === "senior" || hasTag(input, ["senior", "mature"])) &&
    hasNumber(nutrients.protein_percent) &&
    nutrients.protein_percent >= 24
  ) {
    addUnique(result, "senior_muscle_monitoring");
  }
  if (
    ["puppy", "kitten"].includes(input.life_stage ?? "") &&
    (hasNumber(nutrients.dha_percent) || hasNumber(nutrients.epa_dha_percent))
  ) {
    addUnique(result, "growth_development");
  }
  if (
    hasDhaRelevantContext(input) &&
    (hasNumber(nutrients.dha_percent) || hasNumber(nutrients.epa_dha_percent))
  ) {
    addUnique(result, "dha_growth_review");
  }
  const caPRatio = calciumPhosphorusRatio(input);
  if (
    isLargeBreedGrowthContext(input) &&
    caPRatio !== null &&
    caPRatio >= 1 &&
    caPRatio <= 1.8
  ) {
    addUnique(result, "large_breed_growth_mineral_review");
  }
  if (
    hasTag(input, ["urinary", "struvite", "oxalate"]) &&
    hasNumber(nutrients.magnesium_percent) &&
    hasNumber(nutrients.phosphorus_percent)
  ) {
    addUnique(result, "urinary_mineral_review");
  }
  if (
    hasTag(input, ["urinary", "struvite", "oxalate"]) &&
    hasNumber(nutrients.magnesium_percent) &&
    hasNumber(nutrients.phosphorus_percent) &&
    hasNumber(nutrients.sodium_percent)
  ) {
    addUnique(result, "urinary_complete_mineral_review");
  }
  if (
    hasTag(input, ["renal", "kidney"]) &&
    hasNumber(nutrients.phosphorus_percent)
  ) {
    addUnique(result, "renal_phosphorus_review");
  }
  if (
    hasTag(input, ["renal", "kidney"]) &&
    hasNumber(nutrients.phosphorus_percent) &&
    hasNumber(nutrients.sodium_percent)
  ) {
    addUnique(result, "renal_mineral_review");
  }
  if (
    hasTag(input, ["pancreatitis", "pancreatic", "low_fat"]) &&
    hasNumber(nutrients.fat_percent) &&
    nutrients.fat_percent <= 10
  ) {
    addUnique(result, "low_fat_pancreatitis_review");
  }
  if (
    hasTag(input, ["allergy", "hypoallergenic", "intolerance", "dermatosis"]) &&
    animalProteinCount(input) === 1
  ) {
    addUnique(result, "limited_protein_allergy_review");
  }
  if (
    hasTag(input, ["sensitive_digestion", "digestive", "gastro", "intestinal"]) &&
    (hasTag(input, ["rice", "prebiotic", "digestive_support"]) ||
      (hasNumber(nutrients.fiber_percent) && nutrients.fiber_percent >= 2))
  ) {
    addUnique(result, "digestive_tolerance_review");
  }
  if (
    hasTag(input, ["skin", "coat", "dermatosis", "itch"]) &&
    hasOmegaDetail(input)
  ) {
    addUnique(result, "skin_coat_omega_review");
  }
  if (hasHairballFiberSupport(input)) {
    addUnique(result, "hairball_fiber_support");
  }
  if (
    input.species === "cat" &&
    hasTag(input, ["indoor", "sterilised", "sterilized", "neutered"]) &&
    hasWeightAwareNutrition(input)
  ) {
    addUnique(result, "indoor_sterilised_weight_management");
  }
  if (hasFussyPalatabilitySupport(input)) {
    addUnique(result, "fussy_eater_palatability_trial");
  }
  if (hasChewingEaseSupport(input)) {
    addUnique(result, "easy_chewing_kibble_review");
  }
  if (hasSummerLowAppetiteSupport(input)) {
    addUnique(result, "summer_low_appetite_feeding_review");
  }

  return [...new Set(result)].slice(0, 8);
}

function notIdealCases(input: FoodIntelligenceInput) {
  const cases: string[] = [];
  const fat = input.nutrients?.fat_percent;
  const kcal = input.nutrients?.kcal_per_100g;

  if (hasNumber(fat) && fat >= 18) cases.push("weight_loss_without_portion_control");
  if (hasNumber(kcal) && kcal >= 390) cases.push("low_activity_sterilised_without_portion_control");
  if (
    hasEnergyDenseNutrition(input) &&
    hasTag(input, ["sterilised", "sterilized", "neutered", "light", "weight_control"])
  ) {
    cases.push("sterilised_weight_control_energy_mismatch");
  }
  if (
    hasWeightAwareNutrition(input) &&
    hasTag(input, ["active", "performance", "sport", "working"])
  ) {
    cases.push("active_working_without_energy_support");
  }
  if (!hasNumber(input.nutrients?.phosphorus_percent)) cases.push("renal_decision_without_phosphorus");
  if (!hasNumber(input.nutrients?.magnesium_percent)) cases.push("urinary_decision_without_magnesium");
  if (
    hasTag(input, ["renal", "kidney"]) &&
    hasNumber(input.nutrients?.phosphorus_percent) &&
    !hasNumber(input.nutrients?.sodium_percent)
  ) {
    cases.push("renal_decision_without_sodium_context");
  }
  if (
    hasTag(input, ["urinary", "struvite", "oxalate"]) &&
    (!hasNumber(input.nutrients?.magnesium_percent) ||
      !hasNumber(input.nutrients?.phosphorus_percent) ||
      !hasNumber(input.nutrients?.sodium_percent))
  ) {
    cases.push("urinary_decision_without_full_mineral_review");
  }
  if (
    ["puppy", "kitten"].includes(input.life_stage ?? "") &&
    (!hasNumber(input.nutrients?.calcium_percent) || !hasNumber(input.nutrients?.phosphorus_percent))
  ) {
    cases.push("growth_without_mineral_review");
  }
  const caPRatio = calciumPhosphorusRatio(input);
  if (
    isLargeBreedGrowthContext(input) &&
    (caPRatio === null || caPRatio < 1 || caPRatio > 1.8)
  ) {
    cases.push("large_breed_growth_without_mineral_review");
  }
  if (
    hasTag(input, ["pancreatitis", "pancreatic"]) &&
    hasNumber(fat) &&
    fat > 12
  ) {
    cases.push("pancreatitis_without_low_fat_review");
  }
  if (
    hasTag(input, ["allergy", "hypoallergenic", "intolerance", "dermatosis"]) &&
    animalProteinCount(input) > 2
  ) {
    cases.push("strict_allergy_trial_with_many_proteins");
  }
  if (
    hasTag(input, ["skin", "coat", "dermatosis", "itch"]) &&
    !hasOmegaDetail(input)
  ) {
    cases.push("skin_coat_without_omega_detail");
  }
  if (
    hasCombinedOnlyEpaDhaDetail(input) &&
    (hasEpaRelevantContext(input) || hasDhaRelevantContext(input))
  ) {
    cases.push("omega_detail_combined_not_split");
  }
  if (
    input.life_stage === "senior" &&
    !hasTag(input, ["senior", "mature", "joint", "mobility"]) &&
    !hasOmegaDetail(input)
  ) {
    cases.push("senior_without_clear_senior_or_mobility_support");
  }
  if (
    hasTag(input, ["hairball"]) &&
    (!hasNumber(input.nutrients?.fiber_percent) || input.nutrients.fiber_percent < 4)
  ) {
    cases.push("hairball_without_fiber_support");
  }
  if (hasFussyEaterContext(input) && !hasFussyPalatabilitySupport(input)) {
    cases.push("fussy_eater_without_palatability_support");
  }
  if (hasChewingEaseContext(input) && !hasChewingEaseSupport(input)) {
    cases.push("chewing_difficulty_without_small_kibble_support");
  }
  if (
    hasSummerLowAppetiteContext(input) &&
    ((hasNumber(kcal) && kcal <= 335) || (hasNumber(fat) && fat <= 9))
  ) {
    cases.push("summer_low_appetite_without_energy_support");
  }
  if (input.ingredient_tags?.includes("chicken")) cases.push("chicken_allergy");

  return [...new Set(cases)].slice(0, 8);
}

export function evaluateFoodIntelligence(input: FoodIntelligenceInput): FoodIntelligenceResult {
  const subScores = {
    protein_quality: proteinQuality(input),
    ingredient_quality: ingredientQuality(input),
    caloric_density: caloricDensity(input),
    mineral_balance: mineralBalance(input),
    life_stage_suitability: lifeStageSuitability(input),
  };
  const score = clamp(
    subScores.protein_quality * 0.22 +
      subScores.ingredient_quality * 0.2 +
      subScores.caloric_density * 0.18 +
      subScores.mineral_balance * 0.22 +
      subScores.life_stage_suitability * 0.18
  );

  return {
    score,
    confidence_level: confidence(input, score),
    sub_scores: subScores,
    food_strengths: strengths(input),
    food_cautions: cautions(input),
    best_use_cases: bestUseCases(input),
    not_ideal_cases: notIdealCases(input),
  };
}
