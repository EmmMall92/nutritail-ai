import type { FoodV2RecommendationGoal } from "@/lib/food-v2/recommendationRanking";

export type FoodV2ChatbotRecommendationItem = {
  brand?: string | null;
  display_name?: string | null;
  data_quality_status?: string | null;
  source_priority?: string | null;
  missing_nutrition_fields?: string[];
  ranking?: {
    total_score?: number | null;
    confidence?: "high" | "medium" | "low";
    reasons?: string[];
    cautions?: string[];
  } | null;
  nutrition_confidence?: {
    label?: string;
    score?: number;
    missing_core_fields?: string[];
    missing_mineral_fields?: string[];
    missing_optional_fields?: string[];
  } | null;
  nutrition?: Record<string, number | null | undefined> | null;
};

export type FoodV2ChatbotRecommendationResponse = {
  goal?: FoodV2RecommendationGoal;
  total_candidates?: number;
  premium?: FoodV2ChatbotRecommendationItem[];
  value?: FoodV2ChatbotRecommendationItem[];
  notes?: string[];
};

export type FoodV2ChatbotPetContext = {
  species?: "dog" | "cat";
  age?: number;
  neutered?: boolean;
  healthIssues?: string[];
  allergies?: string[];
  weightGoal?: "maintain" | "loss" | "gain";
};

const GOAL_LABELS: Record<FoodV2RecommendationGoal, string> = {
  general: "general fit",
  premium: "premium fit",
  value: "value fit",
  weight_control: "weight control",
  sensitive_digestion: "sensitive digestion",
  allergy: "allergy or ingredient avoidance",
  urinary: "urinary support",
  renal: "renal support",
  growth: "growth",
  sterilised: "sterilised pet",
  senior: "senior pet",
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hasAny(values: string[] | undefined, terms: string[]) {
  const text = normalizeText((values ?? []).join(" "));
  return terms.some((term) => text.includes(normalizeText(term)));
}

export function goalFromPetContext(
  pet: FoodV2ChatbotPetContext
): FoodV2RecommendationGoal {
  if ((pet.allergies ?? []).length > 0) return "allergy";
  if (hasAny(pet.healthIssues, ["urinary", "struvite", "crystal", "pee"])) {
    return "urinary";
  }
  if (hasAny(pet.healthIssues, ["renal", "kidney", "ckd"])) return "renal";
  if (
    hasAny(pet.healthIssues, [
      "digest",
      "gastro",
      "intestinal",
      "sensitive stomach",
      "diarrhea",
      "gas",
    ])
  ) {
    return "sensitive_digestion";
  }
  if (pet.weightGoal === "loss" || hasAny(pet.healthIssues, ["weight", "obesity"])) {
    return "weight_control";
  }
  if (
    (pet.species === "dog" && typeof pet.age === "number" && pet.age < 1) ||
    (pet.species === "cat" && typeof pet.age === "number" && pet.age < 1)
  ) {
    return "growth";
  }
  if (
    (pet.species === "dog" && typeof pet.age === "number" && pet.age >= 8) ||
    (pet.species === "cat" && typeof pet.age === "number" && pet.age >= 10)
  ) {
    return "senior";
  }
  if (pet.neutered) return "sterilised";

  return "general";
}

function foodName(food: FoodV2ChatbotRecommendationItem) {
  const brand = String(food.brand ?? "").trim();
  const displayName = String(food.display_name ?? "").trim();

  if (brand && displayName.toLowerCase().startsWith(brand.toLowerCase())) {
    return displayName;
  }

  return [brand, displayName].filter(Boolean).join(" - ");
}

function sourceLabel(food: FoodV2ChatbotRecommendationItem) {
  const parts = ["source: Food V2"];
  const quality = String(food.data_quality_status ?? "").trim();
  const source = String(food.source_priority ?? "").trim();

  if (quality) parts.push(`quality: ${quality}`);
  if (source) parts.push(`source tier: ${source}`);

  return parts.join("; ");
}

function missingNutritionFields(food: FoodV2ChatbotRecommendationItem) {
  const explicit = food.missing_nutrition_fields ?? [];
  const confidenceMissing = [
    ...(food.nutrition_confidence?.missing_core_fields ?? []),
    ...(food.nutrition_confidence?.missing_mineral_fields ?? []),
  ];

  if (explicit.length > 0 || confidenceMissing.length > 0) {
    return [...new Set([...explicit, ...confidenceMissing])].slice(0, 6);
  }

  const nutrition = food.nutrition;
  if (!nutrition) return [];

  return [
    "kcal_per_100g",
    "protein_percent",
    "fat_percent",
    "fiber_percent",
    "calcium_percent",
    "phosphorus_percent",
    "sodium_percent",
    "magnesium_percent",
  ].filter((field) => nutrition[field] === null || nutrition[field] === undefined);
}

function cautiousDataQualityNote(food: FoodV2ChatbotRecommendationItem) {
  if (food.data_quality_status !== "needs_review") return "";

  return "   Note: this row still needs review, so treat it as a candidate rather than a final answer.";
}

function formatFood(food: FoodV2ChatbotRecommendationItem, index: number) {
  const score = food.ranking?.total_score;
  const confidence = food.ranking?.confidence ?? "medium";
  const nutritionConfidence = food.nutrition_confidence?.label;
  const missing = missingNutritionFields(food);
  const reasons = (food.ranking?.reasons ?? [])
    .filter((reason) => !reason.toLowerCase().includes("matches the pet species"))
    .slice(0, 2);

  return [
    `${index}. ${foodName(food) || "Unnamed food"}${
      typeof score === "number" ? ` (${score}/100, ${confidence} confidence)` : ""
    }${nutritionConfidence ? ` - ${nutritionConfidence}` : ""}`,
    `   ${sourceLabel(food)}`,
    missing.length > 0 ? `   Missing nutrition: ${missing.join(", ")}` : "",
    reasons.length > 0 ? `   Why: ${reasons.join("; ")}` : "",
    cautiousDataQualityNote(food),
  ]
    .filter(Boolean)
    .join("\n");
}

function formatTopPick(food: FoodV2ChatbotRecommendationItem | undefined) {
  if (!food) return "";

  const score = food.ranking?.total_score;
  const firstReason = food.ranking?.reasons?.find(
    (reason) => !reason.toLowerCase().includes("matches the pet species")
  );

  return [
    `Top pick: ${foodName(food) || "Unnamed food"}${
      typeof score === "number" ? ` (${score}/100)` : ""
    }.`,
    sourceLabel(food),
    cautiousDataQualityNote(food).trim(),
    firstReason ? `Why: ${firstReason}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function uniqueShortCautions(values: string[]) {
  const seen = new Set<string>();
  const ignored = new Set([
    "Value ranking is a proxy until price data is available.",
    "Medical-condition matches are ranking support, not diagnosis or treatment.",
  ]);

  return values
    .map((value) => value.trim())
    .filter((value) => value && !ignored.has(value))
    .filter((value) => {
      const key = normalizeText(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

export function formatFoodV2ChatbotRecommendationSummary(
  response: FoodV2ChatbotRecommendationResponse
) {
  const premium = response.premium ?? [];
  const value = response.value ?? [];
  const goal = response.goal ?? "general";

  if (premium.length === 0 && value.length === 0) {
    return "";
  }

  const blocks = [
    "Food shortlist from the NutriTail nutrition database:",
    "",
    `Goal: ${GOAL_LABELS[goal] ?? goal}`,
    formatTopPick(premium[0] ?? value[0]),
  ];

  if (premium.length > 0) {
    blocks.push(
      "",
      "Best nutrition fits:",
      premium.slice(0, 3).map(formatFood).join("\n")
    );
  }

  if (value.length > 0) {
    blocks.push(
      "",
      "Value-style options:",
      value.slice(0, 3).map(formatFood).join("\n")
    );
  }

  const cautions = [
    ...premium.flatMap((food) => food.ranking?.cautions ?? []),
    ...value.flatMap((food) => food.ranking?.cautions ?? []),
    ...(response.notes ?? []),
  ];
  const uniqueCautions = uniqueShortCautions(cautions);

  if (uniqueCautions.length > 0) {
    blocks.push(
      "",
      "Cautions:",
      uniqueCautions.map((caution) => `- ${caution}`).join("\n")
    );
  }

  blocks.push(
    "",
    "Use this as a shopping shortlist, not a diagnosis or treatment plan. For urinary, kidney, diabetes, pancreatitis, severe allergy, vomiting, diarrhea, blood, or not eating, speak with a veterinarian first."
  );

  return blocks.join("\n");
}
