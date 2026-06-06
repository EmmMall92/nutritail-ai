import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";
import type { Pet } from "@/types/pet";

export type FoodV2RecommendationGoal =
  | "general"
  | "premium"
  | "value"
  | "weight_control"
  | "sensitive_digestion"
  | "allergy"
  | "urinary"
  | "renal"
  | "growth"
  | "sterilised"
  | "senior";

export type FoodV2RankingInput = {
  food: FoodProductV2;
  nutrients: FoodNutrientsV2;
  pet: Pick<
    Pet,
    "species" | "breed" | "age" | "weight" | "activityLevel" | "neutered"
  > & {
    allergies?: string[];
    healthIssues?: string[];
    excludedIngredients?: string[];
    preferredProteins?: string[];
  };
  goal?: FoodV2RecommendationGoal;
};

export type FoodV2RankingSignal = {
  type: "boost" | "caution" | "exclude";
  code: string;
  points: number;
  message: string;
};

export type FoodV2ValueTier = "premium_candidate" | "value_candidate" | "standard";

export type FoodV2RecommendationBucket = "premium" | "value" | "hold";

export type FoodV2RankingResult = {
  formula_key: string;
  display_name: string;
  brand: string;
  total_score: number;
  fit_score: number;
  quality_score: number;
  value_score: number;
  confidence: "high" | "medium" | "low";
  bucket: FoodV2RecommendationBucket;
  value_tier: FoodV2ValueTier;
  reasons: string[];
  cautions: string[];
  signals: FoodV2RankingSignal[];
};

const DOG_SIZE_TERMS = {
  mini: ["mini", "x-small", "extra small", "toy", "very small", "yorkshire", "chihuahua"],
  small: ["small", "mini", "μικροσωμ", "mikrosom", "small breed"],
  medium: ["medium", "μεσαίο", "μεσαίων", "mesaio", "medium breed"],
  large: ["large", "maxi", "large breed", "μεγαλοσωμ", "megalosom"],
  giant: ["giant", "extra large", "x-large", "giant breed", "γιγαντοσωμ"],
} as const;

const BREED_SIZE_TERMS = {
  mini: [
    "chihuahua",
    "pomeranian",
    "yorkshire",
    "yorkie",
    "toy poodle",
    "maltese",
    "μαλτεζ",
  ],
  small: [
    "bichon",
    "cavalier",
    "dachshund",
    "jack russell",
    "shih tzu",
    "westie",
    "beagle",
  ],
  medium: [
    "border collie",
    "cocker",
    "english cocker",
    "french bulldog",
    "bulldog",
    "pointer",
    "setter",
    "shar pei",
  ],
  large: [
    "akita",
    "boxer",
    "dalmatian",
    "doberman",
    "german shepherd",
    "golden retriever",
    "husky",
    "labrador",
    "retriever",
    "rottweiler",
    "weimaraner",
  ],
  giant: [
    "bernese",
    "cane corso",
    "great dane",
    "mastiff",
    "newfoundland",
    "saint bernard",
  ],
} as const;

const ALL_BREED_TERMS = [
  "all breeds",
  "all breed",
  "all sizes",
  "all size",
  "ολων των φυλων",
  "ολες τις φυλες",
  "ολων των μεγεθων",
];

const ALLERGEN_TERMS: Record<string, string[]> = {
  chicken: ["chicken", "poultry", "κοτοπουλο", "kotopoulo"],
  beef: ["beef", "μοσχαρι", "moschari", "moshari"],
  lamb: ["lamb", "αρνι", "arni"],
  pork: ["pork", "χοιρινο", "xoirino", "hoirino"],
  fish: ["fish", "salmon", "tuna", "cod", "sardine", "herring", "ψαρι"],
  salmon: ["salmon", "σολομος", "solomos"],
  duck: ["duck", "παπια", "papia"],
  turkey: ["turkey", "γαλοπουλα", "galopoula"],
  wheat: ["wheat", "σιταρι", "sitar"],
  corn: ["corn", "maize", "καλαμποκι", "kalampoki"],
  soy: ["soy", "soya", "σογια", "sogia"],
  dairy: ["milk", "dairy", "γαλα", "gala"],
  egg: ["egg", "αυγο", "avgo"],
};

const VALUE_MARKERS = [
  "classic",
  "regular",
  "basic",
  "daily",
  "maintenance",
  "adult",
  "premium",
];

const PREMIUM_MARKERS = [
  "veterinary",
  "vet",
  "grain free",
  "monoprotein",
  "hypoallergenic",
  "sensitive",
  "digestive",
  "urinary",
  "renal",
  "puppy",
  "kitten",
  "sterilised",
  "breed",
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

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function textFor(food: FoodProductV2) {
  return normalizeText(
    [
      food.brand,
      food.formula_name,
      food.display_name,
      food.life_stage,
      food.dog_size,
      food.breed_target,
      ...(food.medical_tags ?? []),
      ...(food.commercial_tags ?? []),
      ...(food.primary_animal_proteins ?? []),
      ...(food.carbohydrate_sources ?? []),
      ...(food.ingredients ?? []),
    ].join(" ")
  );
}

function petLifeStage(pet: FoodV2RankingInput["pet"]) {
  if (pet.species === "cat") {
    if (pet.age < 1) return "kitten";
    if (pet.age >= 10) return "senior";
    return "adult";
  }

  if (pet.age < 1) return "puppy";
  if (pet.age >= 8) return "senior";
  return "adult";
}

function isLargeBreedDog(pet: FoodV2RankingInput["pet"]) {
  return (
    pet.species === "dog" &&
    (pet.weight >= 25 || ["large", "giant"].includes(breedSizeFromText(pet.breed) ?? ""))
  );
}

function breedSizeFromText(value: unknown) {
  const text = normalizeText(value);
  for (const [size, terms] of Object.entries(BREED_SIZE_TERMS)) {
    if (hasAny(text, terms)) return size;
  }
  return null;
}

function expectedDogSize(pet: FoodV2RankingInput["pet"]) {
  if (pet.species !== "dog") return null;
  const breedSize = breedSizeFromText(pet.breed);

  if (!hasNumber(pet.weight) || pet.weight <= 0) return breedSize;
  if (pet.weight <= 5) return "mini";
  if (pet.weight <= 10) return "small";
  if (pet.weight <= 25) return "medium";
  if (pet.weight <= 45) return "large";
  return "giant";
}

function dogSizeDistance(expected: string, foodSize: string) {
  const order = ["mini", "small", "medium", "large", "giant"];
  const expectedIndex = order.indexOf(expected);
  const foodIndex = order.indexOf(foodSize);

  if (expectedIndex === -1 || foodIndex === -1) return 0;
  return Math.abs(expectedIndex - foodIndex);
}

function inferDogSizeFromFoodText(food: FoodProductV2) {
  const text = textFor(food);

  if (hasAny(text, ALL_BREED_TERMS)) return "all";
  if (hasAny(text, ["giant breed", "giant dog", "giant adult"])) return "giant";
  if (hasAny(text, ["large breed", "large dog", "maxi", "large adult"])) {
    return "large";
  }
  if (hasAny(text, ["medium breed", "medium dog", "medium adult"])) {
    return "medium";
  }
  if (hasAny(text, ["small breed", "small dog", "small adult"])) return "small";
  if (hasAny(text, ["mini breed", "mini dog", "mini adult", "x small"])) {
    return "mini";
  }
  const breedSize = breedSizeFromText(text);
  if (breedSize) return breedSize;

  return null;
}

function addSignal(
  signals: FoodV2RankingSignal[],
  type: FoodV2RankingSignal["type"],
  code: string,
  points: number,
  message: string
) {
  signals.push({ type, code, points, message });
}

function containsAllergen(food: FoodProductV2, allergies: string[]) {
  const foodText = textFor(food);
  return allergies.some((allergy) => {
    const normalized = normalizeText(allergy);
    const terms = ALLERGEN_TERMS[normalized] ?? [normalized];
    return terms.some((term) => foodText.includes(normalizeText(term)));
  });
}

function containsIngredientTerm(food: FoodProductV2, values: string[]) {
  const foodText = textFor(food);

  return values.some((value) => {
    const normalized = normalizeText(value);
    const terms = ALLERGEN_TERMS[normalized] ?? [normalized];

    return terms.some((term) => foodText.includes(normalizeText(term)));
  });
}

function hasAny(text: string, terms: readonly string[]) {
  return terms.some((term) => text.includes(normalizeText(term)));
}

function lifeStageMatches(food: FoodProductV2, stage: string) {
  if (food.life_stage === "all_life_stages") return true;
  if (stage === "puppy") return food.life_stage === "puppy";
  if (stage === "kitten") return food.life_stage === "kitten";
  return food.life_stage === stage;
}

function scoreQuality(food: FoodProductV2, nutrients: FoodNutrientsV2) {
  let score = 0;
  const signals: FoodV2RankingSignal[] = [];
  const coreFields = [
    food.kcal_per_100g,
    nutrients.protein_percent,
    nutrients.fat_percent,
    nutrients.fiber_percent,
  ];
  const mineralFields = [
    nutrients.calcium_percent,
    nutrients.phosphorus_percent,
    nutrients.sodium_percent,
    nutrients.magnesium_percent,
  ];

  score += coreFields.filter(hasNumber).length * 7;
  score += mineralFields.filter(hasNumber).length * 4;

  if (food.ingredients.length >= 5) {
    score += 14;
    addSignal(signals, "boost", "ingredients_available", 14, "Ingredient data is available.");
  } else {
    addSignal(signals, "caution", "ingredients_limited", -8, "Ingredient data is limited.");
  }

  if (food.data_quality_status === "verified") {
    score += 18;
    addSignal(signals, "boost", "verified_row", 18, "Uses verified Food V2 data.");
  } else if (food.data_quality_status === "needs_review") {
    score += 8;
    addSignal(signals, "caution", "needs_review", -6, "Data is usable but still needs review.");
  }

  if (food.source_priority === "official") {
    score += 14;
    addSignal(signals, "boost", "official_source", 14, "Official source has priority.");
  } else if (food.source_priority === "retailer") {
    score += 8;
    addSignal(signals, "caution", "retailer_source", -3, "Retailer source should be worded cautiously.");
  } else if (food.source_priority === "manual_photo") {
    score += 10;
    addSignal(signals, "boost", "label_photo_source", 10, "Label/photo source supports the row.");
  }

  if (hasNumber(nutrients.epa_percent) || hasNumber(nutrients.dha_percent)) {
    score += 5;
    addSignal(signals, "boost", "epa_dha_available", 5, "EPA/DHA data improves nutrition reasoning.");
  } else if (hasNumber(nutrients.epa_dha_percent)) {
    score += 4;
    addSignal(signals, "boost", "combined_epa_dha_available", 4, "Combined EPA/DHA data is available.");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    signals,
  };
}

function scoreFit(input: FoodV2RankingInput) {
  const { food, nutrients, pet, goal = "general" } = input;
  const signals: FoodV2RankingSignal[] = [];
  const haystack = textFor(food);
  const stage = petLifeStage(pet);
  let score = 0;

  if (food.species === pet.species) {
    score += 35;
    addSignal(signals, "boost", "species_match", 35, "Matches the pet species.");
  } else {
    addSignal(signals, "exclude", "species_mismatch", -100, "Different species.");
  }

  if (lifeStageMatches(food, stage)) {
    score += 18;
    addSignal(signals, "boost", "life_stage_match", 18, `Matches ${stage} life stage.`);
  } else {
    addSignal(signals, "caution", "life_stage_mismatch", -15, `Not an exact ${stage} life-stage match.`);
  }

  if (pet.species === "dog") {
    const expectedSize = expectedDogSize(pet);
    const declaredSize =
      food.dog_size && food.dog_size !== "unknown" && food.dog_size !== "all"
        ? food.dog_size
        : inferDogSizeFromFoodText(food);
    const sizeTerms =
      DOG_SIZE_TERMS[declaredSize as keyof typeof DOG_SIZE_TERMS] ?? [];
    const sizeDistance =
      expectedSize && declaredSize ? dogSizeDistance(expectedSize, declaredSize) : 0;
    const sizeMatches =
      food.dog_size === "all" ||
      declaredSize === "all" ||
      !declaredSize ||
      (isLargeBreedDog(pet) && ["large", "giant"].includes(declaredSize)) ||
      hasAny(normalizeText(pet.breed), [...sizeTerms, declaredSize]) ||
      declaredSize === expectedSize;

    if (sizeMatches) {
      if (declaredSize || food.dog_size === "all") {
        score += 7;
        addSignal(signals, "boost", "size_match", 7, "Matches size or breed-size positioning.");
      }
    } else if (expectedSize && sizeDistance >= 2) {
      score -= 35;
      addSignal(
        signals,
        "exclude",
        "dog_size_mismatch",
        -100,
        `Excluded because ${declaredSize} food does not fit a ${expectedSize} dog.`
      );
    } else if (expectedSize && sizeDistance === 1) {
      score -= 12;
      addSignal(
        signals,
        "caution",
        "adjacent_dog_size_mismatch",
        -12,
        `Breed-size positioning is ${declaredSize}, while this dog looks ${expectedSize}.`
      );
    }
  }

  if (pet.neutered || goal === "sterilised") {
    if (hasAny(haystack, ["sterilised", "neutered", "light", "weight"])) {
      score += 10;
      addSignal(signals, "boost", "sterilised_fit", 10, "Useful positioning for a sterilised pet.");
    }
    if (hasNumber(food.kcal_per_100g) && food.kcal_per_100g > 410) {
      score -= 8;
      addSignal(signals, "caution", "energy_dense_neutered", -8, "Energy density may be high for a sterilised pet.");
    }
  }

  if (goal === "weight_control" || hasAny(normalizeText((pet.healthIssues ?? []).join(" ")), ["weight", "obesity", "overweight"])) {
    if (hasAny(haystack, ["light", "weight", "satiety", "obesity", "sterilised"])) {
      score += 16;
      addSignal(signals, "boost", "weight_goal_fit", 16, "Positioned for weight control.");
    }
    if (hasNumber(food.kcal_per_100g) && food.kcal_per_100g <= 360) score += 6;
    if (hasNumber(nutrients.fat_percent) && nutrients.fat_percent >= 18) {
      score -= 10;
      addSignal(signals, "caution", "higher_fat_weight_goal", -10, "Fat looks high for a weight-control goal.");
    }
  }

  if (goal === "sensitive_digestion" || hasAny(normalizeText((pet.healthIssues ?? []).join(" ")), ["digest", "sensitive", "diarrhea", "stool", "gas"])) {
    if (hasAny(haystack, ["digestive", "gastro", "intestinal", "sensitive", "hypoallergenic"])) {
      score += 16;
      addSignal(signals, "boost", "gi_goal_fit", 16, "Positioned for sensitive digestion.");
    }
    if (hasAny(haystack, ["fos", "mos", "inulin", "chicory", "psyllium", "beet pulp"])) {
      score += 5;
      addSignal(signals, "boost", "digestive_support_ingredients", 5, "Includes digestive-support ingredients.");
    }
  }

  if (goal === "allergy" || (pet.allergies ?? []).length > 0) {
    if (containsAllergen(food, pet.allergies ?? [])) {
      addSignal(signals, "exclude", "allergen_conflict", -100, "Ingredients appear to contain a declared allergen.");
    } else if ((pet.allergies ?? []).length > 0) {
      score += 18;
      addSignal(signals, "boost", "allergen_not_detected", 18, "Declared allergens were not detected in the ingredient text.");
    }
    if (hasAny(haystack, ["monoprotein", "hypoallergenic", "hydrolysed", "hydrolyzed"])) {
      score += 10;
      addSignal(signals, "boost", "allergy_positioning", 10, "Has allergy-friendly positioning.");
    }
  }

  if ((pet.excludedIngredients ?? []).length > 0) {
    if (containsIngredientTerm(food, pet.excludedIngredients ?? [])) {
      addSignal(
        signals,
        "exclude",
        "excluded_ingredient_preference",
        -100,
        "Excluded because it contains an ingredient or flavor the pet should avoid."
      );
    } else {
      score += 8;
      addSignal(
        signals,
        "boost",
        "excluded_ingredients_not_detected",
        8,
        "Avoided the pet's excluded ingredients or flavors."
      );
    }
  }

  if ((pet.preferredProteins ?? []).length > 0) {
    if (containsIngredientTerm(food, pet.preferredProteins ?? [])) {
      score += 8;
      addSignal(
        signals,
        "boost",
        "preferred_protein_match",
        8,
        "Matches a preferred protein or flavor."
      );
    } else {
      addSignal(
        signals,
        "caution",
        "preferred_protein_missing",
        -4,
        "Does not clearly match the pet's preferred protein or flavor."
      );
    }
  }

  if (goal === "urinary" || hasAny(normalizeText((pet.healthIssues ?? []).join(" ")), ["urinary", "struvite", "crystal"])) {
    if (hasAny(haystack, ["urinary", "struvite", "oxalate"])) {
      score += 20;
      addSignal(signals, "boost", "urinary_positioning", 20, "Positioned for urinary support.");
    }
    if (!hasNumber(nutrients.magnesium_percent) || !hasNumber(nutrients.phosphorus_percent)) {
      addSignal(signals, "caution", "missing_urinary_minerals", -8, "Urinary reasoning is weaker without magnesium and phosphorus.");
    }
  }

  if (goal === "renal" || hasAny(normalizeText((pet.healthIssues ?? []).join(" ")), ["renal", "kidney", "ckd"])) {
    if (hasAny(haystack, ["renal", "kidney", "oxalate"])) {
      score += 20;
      addSignal(signals, "boost", "renal_positioning", 20, "Positioned for renal support.");
    } else {
      addSignal(signals, "caution", "renal_needs_vet_food", -20, "Renal cases need veterinarian-directed diet selection.");
    }
    if (!hasNumber(nutrients.phosphorus_percent)) {
      addSignal(signals, "caution", "missing_phosphorus_renal", -12, "Renal recommendations need phosphorus data.");
    }
  }

  if (goal === "growth" || stage === "puppy" || stage === "kitten") {
    if (lifeStageMatches(food, stage)) score += 10;
    if (hasNumber(nutrients.dha_percent) || hasNumber(nutrients.epa_dha_percent)) {
      score += 6;
      addSignal(signals, "boost", "growth_dha", 6, "DHA/EPA-DHA data supports growth reasoning.");
    }
    if (isLargeBreedDog(pet) && (!hasNumber(nutrients.calcium_percent) || !hasNumber(nutrients.phosphorus_percent))) {
      addSignal(signals, "caution", "large_breed_growth_mineral_gap", -14, "Large-breed puppy ranking needs calcium and phosphorus data.");
    }
  }

  if (goal === "senior" || stage === "senior") {
    if (food.life_stage === "senior" || hasAny(haystack, ["senior", "mature", "7+"])) {
      score += 12;
      addSignal(signals, "boost", "senior_positioning", 12, "Positioned for senior pets.");
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    signals,
  };
}

function scoreValue(food: FoodProductV2, fitScore: number, qualityScore: number) {
  const haystack = textFor(food);
  let score = Math.round(fitScore * 0.55 + qualityScore * 0.35);

  if (hasAny(haystack, VALUE_MARKERS)) score += 8;
  if (hasAny(haystack, PREMIUM_MARKERS)) score -= 5;
  if (food.source_priority === "retailer") score += 3;
  if (food.data_quality_status === "verified") score += 5;

  return Math.max(0, Math.min(100, score));
}

function confidenceFor(result: {
  fitScore: number;
  qualityScore: number;
  signals: FoodV2RankingSignal[];
}) {
  const excludes = result.signals.filter((signal) => signal.type === "exclude").length;
  const cautions = result.signals.filter((signal) => signal.type === "caution").length;

  if (excludes > 0 || result.qualityScore < 35) return "low";
  if (cautions >= 3 || result.qualityScore < 60) return "medium";
  return "high";
}

function valueTier(food: FoodProductV2, valueScore: number): FoodV2ValueTier {
  const haystack = textFor(food);
  if (hasAny(haystack, PREMIUM_MARKERS) && valueScore < 82) {
    return "premium_candidate";
  }
  if (valueScore >= 70 && hasAny(haystack, VALUE_MARKERS)) {
    return "value_candidate";
  }
  return "standard";
}

export function rankFoodV2ForPet(input: FoodV2RankingInput): FoodV2RankingResult {
  const quality = scoreQuality(input.food, input.nutrients);
  const fit = scoreFit(input);
  const signals = [...quality.signals, ...fit.signals];
  const fitScore = fit.score;
  const qualityScore = quality.score;
  const valueScore = scoreValue(input.food, fitScore, qualityScore);
  const excludes = signals.some((signal) => signal.type === "exclude");
  const totalScore = excludes
    ? 0
    : Math.round(fitScore * 0.55 + qualityScore * 0.35 + valueScore * 0.1);
  const tier = valueTier(input.food, valueScore);
  const confidence = confidenceFor({ fitScore, qualityScore, signals });

  return {
    formula_key: input.food.formula_key,
    display_name: input.food.display_name,
    brand: input.food.brand,
    total_score: Math.max(0, Math.min(100, totalScore)),
    fit_score: fitScore,
    quality_score: qualityScore,
    value_score: valueScore,
    confidence,
    bucket: excludes ? "hold" : tier === "value_candidate" ? "value" : "premium",
    value_tier: tier,
    reasons: signals
      .filter((signal) => signal.type === "boost")
      .sort((a, b) => b.points - a.points)
      .map((signal) => signal.message)
      .slice(0, 6),
    cautions: signals
      .filter((signal) => signal.type !== "boost")
      .sort((a, b) => a.points - b.points)
      .map((signal) => signal.message)
      .slice(0, 6),
    signals,
  };
}

export function splitFoodV2Recommendations(
  rankings: FoodV2RankingResult[],
  limitPerBucket = 3
) {
  const usable = rankings
    .filter((ranking) => ranking.bucket !== "hold")
    .sort((a, b) => b.total_score - a.total_score);

  return {
    premium: usable
      .filter((ranking) => ranking.bucket === "premium")
      .slice(0, limitPerBucket),
    value: usable
      .filter((ranking) => ranking.bucket === "value")
      .sort((a, b) => b.value_score - a.value_score || b.total_score - a.total_score)
      .slice(0, limitPerBucket),
    hold: rankings
      .filter((ranking) => ranking.bucket === "hold")
      .sort((a, b) => b.quality_score - a.quality_score),
  };
}
