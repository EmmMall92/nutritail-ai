import type { FoodV2RecommendationGoal } from "@/lib/food-v2/recommendationRanking";

export type FoodV2ChatbotRecommendationItem = {
  brand?: string | null;
  display_name?: string | null;
  data_quality_status?: string | null;
  ranking?: {
    total_score?: number | null;
    confidence?: "high" | "medium" | "low";
    reasons?: string[];
    cautions?: string[];
  } | null;
  nutrition_confidence?: {
    label?: string;
    score?: number;
  } | null;
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

function formatFood(food: FoodV2ChatbotRecommendationItem, index: number) {
  const score = food.ranking?.total_score;
  const confidence = food.ranking?.confidence ?? "medium";
  const nutritionConfidence = food.nutrition_confidence?.label;
  const reasons = (food.ranking?.reasons ?? [])
    .filter((reason) => !reason.toLowerCase().includes("matches the pet species"))
    .slice(0, 2);

  return `${index}. ${foodName(food) || "Unnamed food"}${
    typeof score === "number" ? ` (${score}/100, ${confidence} confidence)` : ""
  }${nutritionConfidence ? ` - ${nutritionConfidence}` : ""}${
    reasons.length > 0 ? `\n   Why: ${reasons.join("; ")}` : ""
  }`;
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
