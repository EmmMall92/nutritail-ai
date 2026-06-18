import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";
import type { Pet } from "@/types/pet";
import {
  scoringWeightsForScenario,
  type RecommendationScenario,
} from "@/lib/nutrition-rules/rulesRegistry";
import { evaluateFeedingFitRules } from "@/lib/nutrition-v2/feedingRules";
import { evaluateGrowthFitRules } from "@/lib/nutrition-v2/growthRules";
import { evaluateIngredientFitRules } from "@/lib/nutrition-v2/ingredientRules";
import { evaluateObesityFitRules } from "@/lib/nutrition-v2/obesityRules";
import { evaluateRenalRules } from "@/lib/nutrition-v2/renalRules";
import { evaluateSeniorFitRules } from "@/lib/nutrition-v2/seniorRules";
import { evaluateUrinaryRules } from "@/lib/nutrition-v2/urinaryRules";

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

const THERAPEUTIC_TERMS = [
  "vet",
  "veterinary",
  "vetsolution",
  "renal",
  "urinary",
  "struvite",
  "oxalate",
  "diabetic",
  "diabetes",
  "gastro",
  "hepatic",
  "liver",
  "pancreatic",
  "pancreatitis",
  "cardiac",
  "obesity",
  "gastrointestinal",
  "hypoallergenic",
  "anallergenic",
  "dermatosis",
];

const GOAL_THERAPEUTIC_TERMS: Record<FoodV2RecommendationGoal, string[]> = {
  general: [],
  premium: [],
  value: [],
  sterilised: [],
  senior: [],
  growth: [],
  weight_control: ["obesity", "satiety", "weight"],
  sensitive_digestion: ["gastrointestinal", "gastro", "digestive", "sensitivity"],
  allergy: ["hypoallergenic", "anallergenic", "sensitivity", "dermatosis", "skin"],
  urinary: ["urinary", "struvite", "oxalate"],
  renal: ["renal", "kidney"],
};

const VALUE_MARKERS = [
  "classic",
  "regular",
  "basic",
  "daily",
  "everyday",
  "essential",
  "maintenance",
  "adult",
  "standard",
  "complete",
  "balance",
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

const VALUE_PENALTY_MARKERS = [
  "veterinary",
  "vet ",
  "vet-",
  "prescription",
  "renal",
  "urinary",
  "hepatic",
  "diabetic",
  "gastrointestinal",
  "hypoallergenic",
  "hydrolysed",
  "hydrolyzed",
  "dermatosis",
  "cardiac",
  "mobility",
  "monoprotein",
  "grain free",
  "breed specific",
  "puppy",
  "kitten",
  "junior",
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

  if (
    pet.age < 1 ||
    (pet.age <= 1 &&
      (pet.weight >= 25 ||
        ["large", "giant"].includes(breedSizeFromText(pet.breed) ?? "")))
  ) {
    return "puppy";
  }
  if (pet.age >= 8) return "senior";
  return "adult";
}

function isLargeBreedDog(pet: FoodV2RankingInput["pet"]) {
  return (
    pet.species === "dog" &&
    (pet.weight >= 25 ||
      (pet.age < 1 && pet.weight >= 18) ||
      ["large", "giant"].includes(breedSizeFromText(pet.breed) ?? ""))
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

function isHardDogSizeMismatch(
  pet: FoodV2RankingInput["pet"],
  expectedSize: string | null,
  declaredSize: string | null
) {
  if (!expectedSize || !declaredSize || declaredSize === "all") return false;

  const distance = dogSizeDistance(expectedSize, declaredSize);
  if (distance >= 2) return true;

  if (
    pet.species === "dog" &&
    hasNumber(pet.weight) &&
    pet.weight >= 35 &&
    expectedSize === "large" &&
    declaredSize === "medium"
  ) {
    return true;
  }

  if (
    pet.species === "dog" &&
    hasNumber(pet.weight) &&
    pet.weight >= 8 &&
    expectedSize === "small" &&
    declaredSize === "mini"
  ) {
    return true;
  }

  if (
    pet.species === "dog" &&
    expectedSize === "giant" &&
    ["small", "medium"].includes(declaredSize)
  ) {
    return true;
  }

  return false;
}

function inferDogSizeFromFoodText(food: FoodProductV2) {
  const text = textFor(food);

  if (hasAny(text, ["giant breed", "giant dog", "giant adult"])) return "giant";
  if (hasAny(text, ["large breed", "large dog", "maxi", "large adult"]) || hasWord(text, "large")) {
    return "large";
  }
  if (hasAny(text, ["medium breed", "medium dog", "medium adult"]) || hasWord(text, "medium")) {
    return "medium";
  }
  if (hasAny(text, ["xsmall", "x-small", "extra small", "x small", "mini breed", "mini dog", "mini adult"]) || hasWord(text, "mini")) {
    return "mini";
  }
  if (hasAny(text, ["small breed", "small dog", "small adult"]) || hasWord(text, "small")) return "small";
  const breedSize = breedSizeFromText(text);
  if (breedSize) return breedSize;
  if (hasAny(text, ALL_BREED_TERMS)) return "all";

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

function hasAny(text: string, terms: readonly string[]) {
  return terms.some((term) => text.includes(normalizeText(term)));
}

function hasContradictingSpeciesLabel(food: FoodProductV2, petSpecies: "dog" | "cat") {
  const text = normalizeText([food.brand, food.display_name, food.formula_name].join(" "));

  if (petSpecies === "dog") {
    return hasAny(text, ["feline", "cat", "γάτα", "γατα", "gato"]);
  }

  return hasAny(text, ["canine", "dog", "σκύλος", "σκυλος", "skylos"]);
}

function hasWord(text: string, word: string) {
  return text.split(" ").includes(normalizeText(word));
}

function hasTherapeuticPositioning(foodText: string) {
  return hasAny(foodText, THERAPEUTIC_TERMS);
}

function hasActivePositioning(foodText: string) {
  return hasAny(foodText, ["active", "performance", "energy", "sport", "working"]);
}

function hasWeightControlPositioning(foodText: string) {
  return hasAny(foodText, ["light", "weight", "satiety", "obesity", "sterilised", "sterilized", "neutered"]);
}

function hasRenalPositioning(foodText: string) {
  return hasAny(foodText, ["renal", "kidney"]);
}

function hasUrinaryPositioning(foodText: string) {
  return hasAny(foodText, ["urinary", "struvite", "oxalate"]);
}

function hasSeniorPositioning(food: FoodProductV2, foodText: string) {
  return (
    food.life_stage === "senior" ||
    hasAny(foodText, ["senior", "mature", "ageing", "aging", "7+", "8+", "10+", "12+"])
  );
}

function therapeuticPositioningFitsGoal(
  foodText: string,
  goal: FoodV2RecommendationGoal,
  healthIssues: string[]
) {
  const allowedTerms = [
    ...(GOAL_THERAPEUTIC_TERMS[goal] ?? []),
    ...healthIssues,
  ];

  return allowedTerms.length > 0 && hasAny(foodText, allowedTerms);
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
  const applyRuleSignals = (ruleSignals: FoodV2RankingSignal[]) => {
    ruleSignals.forEach((signal) => {
      if (signal.type !== "exclude") score += signal.points;
      addSignal(signals, signal.type, signal.code, signal.points, signal.message);
    });
  };
  const applyLegacyRuleLabels = (
    labels: { boosts: string[]; cautions: string[] },
    mapping: Record<string, FoodV2RankingSignal>
  ) => {
    labels.boosts.forEach((code) => {
      const signal = mapping[code];
      if (!signal) return;
      score += signal.points;
      addSignal(signals, signal.type, signal.code, signal.points, signal.message);
    });
    labels.cautions.forEach((code) => {
      const signal = mapping[code];
      if (!signal) return;
      if (signal.type !== "exclude") score += signal.points;
      addSignal(signals, signal.type, signal.code, signal.points, signal.message);
    });
  };

  if (food.species === pet.species) {
    score += 35;
    addSignal(signals, "boost", "species_match", 35, "Matches the pet species.");
  } else {
    addSignal(signals, "exclude", "species_mismatch", -100, "Different species.");
  }

  if (hasContradictingSpeciesLabel(food, pet.species)) {
    addSignal(
      signals,
      "exclude",
      "contradicting_species_label",
      -100,
      "Excluded because the product title appears to target a different species."
    );
  }

  if (lifeStageMatches(food, stage)) {
    score += 18;
    addSignal(signals, "boost", "life_stage_match", 18, `Matches ${stage} life stage.`);
  } else {
    addSignal(signals, "caution", "life_stage_mismatch", -15, `Not an exact ${stage} life-stage match.`);
    if (["adult", "senior"].includes(stage) && ["puppy", "kitten"].includes(food.life_stage)) {
      addSignal(
        signals,
        "exclude",
        "growth_food_for_adult_pet",
        -100,
        `Excluded because ${food.life_stage} food does not fit a ${stage} pet.`
      );
    }
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
    } else if (isHardDogSizeMismatch(pet, expectedSize, declaredSize)) {
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

  if (
    hasTherapeuticPositioning(haystack) &&
    !therapeuticPositioningFitsGoal(haystack, goal, pet.healthIssues ?? [])
  ) {
    addSignal(
      signals,
      "exclude",
      "therapeutic_food_without_matching_condition",
      -100,
      "Excluded because veterinary/therapeutic positioning does not match the pet's stated goal or health context."
    );
  }

  applyRuleSignals(
    evaluateFeedingFitRules({
      food,
      nutrients,
      pet,
      goal,
      positioning: {
        active: hasActivePositioning(haystack),
        weightControl: hasWeightControlPositioning(haystack),
      },
    })
  );

  applyRuleSignals(
    evaluateObesityFitRules({
      food,
      nutrients,
      pet,
      goal:
        goal === "weight_control" || goal === "sterilised" || goal === "senior"
          ? goal
          : "general",
      positioning: {
        active: hasActivePositioning(haystack),
        weightControl: hasWeightControlPositioning(haystack),
      },
    })
  );

  applyRuleSignals(
    evaluateIngredientFitRules({
      food,
      goal:
        goal === "allergy" || goal === "sensitive_digestion"
          ? goal
          : "general",
      allergies: pet.allergies,
      excludedIngredients: pet.excludedIngredients,
      preferredProteins: pet.preferredProteins,
    })
  );

  if (goal === "urinary" || hasAny(normalizeText((pet.healthIssues ?? []).join(" ")), ["urinary", "struvite", "crystal"])) {
    const hasUrinary = hasUrinaryPositioning(haystack);
    const hasRenalOnly = hasRenalPositioning(haystack) && !hasUrinary;

    if (hasUrinary) {
      score += 20;
      addSignal(signals, "boost", "urinary_positioning", 20, "Positioned for urinary support.");
    } else if (goal === "urinary") {
      addSignal(
        signals,
        "exclude",
        "urinary_goal_without_urinary_positioning",
        -100,
        "Excluded because urinary cases need urinary-positioned foods before a confident shortlist."
      );
    }
    if (goal === "urinary" && hasRenalOnly) {
      addSignal(
        signals,
        "exclude",
        "urinary_renal_mismatch",
        -100,
        "Excluded because renal positioning does not replace urinary/stone-specific diet support."
      );
    }
    if (!hasNumber(nutrients.magnesium_percent) || !hasNumber(nutrients.phosphorus_percent)) {
      addSignal(signals, "caution", "missing_urinary_minerals", -8, "Urinary reasoning is weaker without magnesium and phosphorus.");
    }
    applyLegacyRuleLabels(
      evaluateUrinaryRules(
        {
          species: food.species,
          medical_tags: food.medical_tags,
          source_priority: food.source_priority,
        },
        nutrients
      ),
      {
        urinary_formula_positioning: {
          type: "boost",
          code: "urinary_formula_positioning",
          points: 8,
          message: "Medical tags confirm urinary formula positioning.",
        },
        missing_magnesium_for_urinary_review: {
          type: "caution",
          code: "missing_magnesium_for_urinary_review",
          points: -4,
          message: "Magnesium data is missing for urinary review.",
        },
        missing_phosphorus_for_urinary_review: {
          type: "caution",
          code: "missing_phosphorus_for_urinary_review",
          points: -4,
          message: "Phosphorus data is missing for urinary review.",
        },
        urinary_claim_needs_strong_source: {
          type: "caution",
          code: "urinary_claim_needs_strong_source",
          points: -4,
          message: "Urinary claims are stronger with official source data.",
        },
      }
    );
  }

  if (goal === "renal" || hasAny(normalizeText((pet.healthIssues ?? []).join(" ")), ["renal", "kidney", "ckd"])) {
    const hasRenal = hasRenalPositioning(haystack);
    const hasUrinaryOnlyPositioning =
      hasUrinaryPositioning(haystack) && !hasRenal;

    if (hasRenal) {
      score += 24;
      addSignal(signals, "boost", "renal_positioning", 24, "Positioned for renal support.");
    } else {
      addSignal(
        signals,
        goal === "renal" ? "exclude" : "caution",
        "renal_needs_vet_food",
        goal === "renal" ? -100 : -20,
        "Renal cases need veterinarian-directed renal diet selection."
      );
    }
    if (hasUrinaryOnlyPositioning) {
      addSignal(
        signals,
        "exclude",
        "renal_urinary_mismatch",
        -100,
        "Excluded because urinary/oxalate positioning does not replace renal diet support."
      );
    }
    if (!hasNumber(nutrients.phosphorus_percent)) {
      addSignal(signals, "caution", "missing_phosphorus_renal", -12, "Renal recommendations need phosphorus data.");
    }
    applyLegacyRuleLabels(
      evaluateRenalRules(
        {
          medical_tags: food.medical_tags,
          source_priority: food.source_priority,
        },
        nutrients
      ),
      {
        renal_formula_positioning: {
          type: "boost",
          code: "renal_formula_positioning",
          points: 10,
          message: "Medical tags confirm renal formula positioning.",
        },
        epa_dha_renal_support_signal: {
          type: "boost",
          code: "epa_dha_renal_support_signal",
          points: 4,
          message: "EPA/DHA data supports renal fatty-acid context.",
        },
        missing_phosphorus_for_renal_review: {
          type: "caution",
          code: "missing_phosphorus_for_renal_review",
          points: -8,
          message: "Phosphorus data is missing for renal review.",
        },
        high_protein_not_renal_default: {
          type: "caution",
          code: "high_protein_not_renal_default",
          points: -10,
          message: "High protein is not a default renal-diet advantage without vet context.",
        },
        renal_claim_needs_strong_source: {
          type: "caution",
          code: "renal_claim_needs_strong_source",
          points: -6,
          message: "Renal claims are stronger with official source data.",
        },
      }
    );
  }

  if (goal === "growth" || stage === "puppy" || stage === "kitten") {
    applyRuleSignals(
      evaluateGrowthFitRules({
        food,
        nutrients,
        petStage: stage,
        lifeStageMatches: lifeStageMatches(food, stage),
        isLargeBreedDog: isLargeBreedDog(pet),
        positioning: {
          largeBreedGrowth: hasAny(haystack, [
            "large breed",
            "maxi",
            "giant",
            "large puppy",
            "puppy large",
          ]),
          genericGrowth: hasAny(haystack, ["puppy", "junior", "kitten"]),
        },
      })
    );
  }

  if (goal === "senior" || stage === "senior") {
    applyRuleSignals(
      evaluateSeniorFitRules({
        food,
        nutrients,
        pet,
        stage,
        goal:
          goal === "weight_control" || goal === "sterilised" || goal === "senior"
            ? goal
            : "general",
        positioning: {
          active: hasActivePositioning(haystack),
          senior: hasSeniorPositioning(food, haystack),
          weightControl: hasWeightControlPositioning(haystack),
        },
      })
    );
  }

  let adjustedScore = score;
  if (goal === "sterilised") {
    if (hasNumber(food.kcal_per_100g) && food.kcal_per_100g > 340) {
      adjustedScore -= 30;
    }
    if (hasNumber(nutrients.fat_percent) && nutrients.fat_percent > 10) {
      adjustedScore -= 20;
    }
  }

  return {
    score: Math.max(0, Math.min(100, adjustedScore)),
    signals,
  };
}

function scoreValue(food: FoodProductV2, fitScore: number, qualityScore: number) {
  const haystack = textFor(food);
  let score = Math.round(fitScore * 0.55 + qualityScore * 0.35);

  if (hasAny(haystack, VALUE_MARKERS)) score += 10;
  if (hasAny(haystack, PREMIUM_MARKERS)) score -= 6;
  if (hasAny(haystack, VALUE_PENALTY_MARKERS)) score -= 14;
  if (food.source_priority === "retailer") score += 2;
  if (food.source_priority === "official") score += 2;
  if (food.data_quality_status === "verified") score += 5;
  if (food.data_quality_status === "needs_review") score -= 4;
  if (food.life_stage === "adult" && !hasAny(haystack, ["senior", "puppy", "junior", "kitten"])) {
    score += 4;
  }

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

function valueTier(
  food: FoodProductV2,
  valueScore: number,
  fitScore: number,
  qualityScore: number
): FoodV2ValueTier {
  const haystack = textFor(food);

  if (fitScore < 58 || qualityScore < 42) {
    return "standard";
  }
  if (hasAny(haystack, VALUE_PENALTY_MARKERS)) {
    return "premium_candidate";
  }
  if (hasAny(haystack, PREMIUM_MARKERS) && valueScore < 82) {
    return "premium_candidate";
  }
  if (valueScore >= 72 && hasAny(haystack, VALUE_MARKERS)) {
    return "value_candidate";
  }
  return "standard";
}

function scenarioForGoal(goal: FoodV2RecommendationGoal | undefined): RecommendationScenario {
  if (goal === "growth") return "growth";
  if (goal === "sterilised") return "sterilised";
  if (goal === "weight_control") return "weight_control";
  if (goal === "sensitive_digestion") return "sensitive_digestion";
  if (goal === "allergy") return "allergy";
  if (goal === "urinary") return "urinary";
  if (goal === "renal") return "renal";
  if (goal === "senior") return "senior";
  return "general";
}

function weightedTotalScore(input: {
  goal?: FoodV2RecommendationGoal;
  fitScore: number;
  qualityScore: number;
  valueScore: number;
}) {
  const weights = scoringWeightsForScenario(scenarioForGoal(input.goal));
  const fitWeight = weights.clinical_fit + weights.life_stage_size_fit;
  const qualityWeight = weights.nutrient_fit + weights.data_quality;
  const valueWeight = weights.feeding_method_flavor_fit + weights.owner_constraint_fit;
  const totalWeight = fitWeight + qualityWeight + valueWeight;

  if (totalWeight <= 0) return 0;

  return Math.round(
    (input.fitScore * fitWeight +
      input.qualityScore * qualityWeight +
      input.valueScore * valueWeight) /
      totalWeight
  );
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
    : weightedTotalScore({
        goal: input.goal,
        fitScore,
        qualityScore,
        valueScore,
      });
  const tier = valueTier(input.food, valueScore, fitScore, qualityScore);
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
