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
  return [food.brand, food.display_name].filter(Boolean).join(" - ");
}

function formatFood(food: FoodV2ChatbotRecommendationItem, index: number) {
  const score = food.ranking?.total_score;
  const confidence = food.ranking?.confidence ?? "medium";
  const nutritionConfidence = food.nutrition_confidence?.label;
  const reasons = (food.ranking?.reasons ?? []).slice(0, 2);

  return `${index}. ${foodName(food) || "Unnamed food"}${
    typeof score === "number" ? ` (${score}/100, ${confidence} confidence)` : ""
  }${nutritionConfidence ? ` - ${nutritionConfidence}` : ""}${
    reasons.length > 0 ? `\n   Why: ${reasons.join("; ")}` : ""
  }`;
}

export function formatFoodV2ChatbotRecommendationSummary(
  response: FoodV2ChatbotRecommendationResponse
) {
  const premium = response.premium ?? [];
  const value = response.value ?? [];

  if (premium.length === 0 && value.length === 0) {
    return "";
  }

  const blocks = [
    "Food V2 recommendations from the nutrition database:",
    "",
    `Goal detected: ${response.goal ?? "general"}`,
    `Candidates checked: ${response.total_candidates ?? 0}`,
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
  const uniqueCautions = [...new Set(cautions)].slice(0, 4);

  if (uniqueCautions.length > 0) {
    blocks.push(
      "",
      "Cautions:",
      uniqueCautions.map((caution) => `- ${caution}`).join("\n")
    );
  }

  blocks.push(
    "",
    "This is a ranked shortlist, not a diagnosis or treatment plan. For urinary, kidney, diabetes, pancreatitis, severe allergy, vomiting, diarrhea, blood, or not eating, use veterinarian guidance first."
  );

  return blocks.join("\n");
}
