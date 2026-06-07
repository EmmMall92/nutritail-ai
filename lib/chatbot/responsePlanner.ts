import { getDialogueTemplate } from "@/lib/chatbot/dialoguePlaybook";
import { detectUserIntent } from "@/lib/chatbot/intentDetector";
import { checkPetDataCompleteness } from "@/lib/chatbot/petDataCompleteness";
import { detectSafetyWarnings, hasHardStop } from "@/lib/chatbot/safetyRules";
import { detectMessageLocale, uncertaintyForMissingData } from "@/lib/chatbot/humanTone";
import type {
  ChatbotIntent,
  ChatbotPetContext,
  MatchedFoodForPlanning,
  PlannedResponseSection,
} from "@/lib/chatbot/types";

export type PlannedChatbotResponse = {
  intent: ChatbotIntent;
  missing_fields: string[];
  should_ask_followup: boolean;
  followup_question: string | null;
  eligible_foods: MatchedFoodForPlanning[];
  rejected_foods: Array<{
    food: MatchedFoodForPlanning;
    reasons: string[];
  }>;
  safety_warnings: ReturnType<typeof detectSafetyWarnings>;
  response_sections: PlannedResponseSection[];
  confidence_level: "high" | "medium" | "low";
};

function foodLabel(food: MatchedFoodForPlanning) {
  return [food.brand, food.display_name ?? food.name].filter(Boolean).join(" - ");
}

function foodText(food: MatchedFoodForPlanning) {
  return [
    food.brand,
    food.name,
    food.display_name,
    food.species,
    food.life_stage,
    food.dog_size,
    food.data_quality_status,
    food.source_priority,
    ...(food.medical_tags ?? []),
    ...(food.commercial_tags ?? []),
    Array.isArray(food.ingredients) ? food.ingredients.join(" ") : food.ingredients,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function rejectReasons(
  food: MatchedFoodForPlanning,
  pet: ChatbotPetContext | null | undefined,
  intent: ChatbotIntent
) {
  const reasons: string[] = [];
  const text = foodText(food);

  if (pet?.species && food.species && pet.species !== food.species) {
    reasons.push("species_mismatch");
  }

  for (const allergy of pet?.allergies ?? []) {
    if (allergy && text.includes(String(allergy).toLowerCase())) {
      reasons.push(`allergen_conflict:${allergy}`);
    }
  }

  if (
    (intent === "renal" || intent === "urinary") &&
    food.data_quality_status === "needs_review"
  ) {
    reasons.push("medical_context_needs_stronger_data");
  }

  if ((food.missing_nutrition_fields ?? []).length >= 3) {
    reasons.push("too_many_missing_nutrition_fields");
  }

  return reasons;
}

function confidenceFor({
  missingCount,
  safetyWarnings,
  eligibleFoods,
}: {
  missingCount: number;
  safetyWarnings: ReturnType<typeof detectSafetyWarnings>;
  eligibleFoods: MatchedFoodForPlanning[];
}): "high" | "medium" | "low" {
  if (hasHardStop(safetyWarnings)) return "low";
  if (missingCount >= 2) return "low";
  if (eligibleFoods.length === 0) return "low";
  if (
    eligibleFoods.some(
      (food) =>
        food.data_quality_status === "verified" ||
        food.ranking?.confidence === "high"
    )
  ) {
    return missingCount === 0 ? "high" : "medium";
  }
  return "medium";
}

export function planChatbotResponse({
  message,
  pet,
  matchedFoods = [],
  intent,
}: {
  message: string;
  pet?: ChatbotPetContext | null;
  matchedFoods?: MatchedFoodForPlanning[];
  intent?: ChatbotIntent;
}): PlannedChatbotResponse {
  const detectedIntent = intent ?? detectUserIntent(message);
  const locale = detectMessageLocale(message);
  const template = getDialogueTemplate(detectedIntent);
  const completeness = checkPetDataCompleteness(pet, detectedIntent, locale);
  const safetyWarnings = detectSafetyWarnings({ message, pet, locale });
  const rejectedFoods = matchedFoods
    .map((food) => ({ food, reasons: rejectReasons(food, pet, detectedIntent) }))
    .filter((item) => item.reasons.length > 0);
  const rejectedIds = new Set(rejectedFoods.map((item) => item.food.id ?? foodLabel(item.food)));
  const eligibleFoods = matchedFoods.filter(
    (food) => !rejectedIds.has(food.id ?? foodLabel(food))
  );

  const responseSections: PlannedResponseSection[] = [];

  if (safetyWarnings.length > 0) {
    responseSections.push({
      title: locale === "el" ? "Ασφάλεια πρώτα" : "Safety first",
      bullets: safetyWarnings.map((warning) => warning.message),
    });
  }

  if (completeness.next_question) {
    responseSections.push({
      title: locale === "el" ? "Επόμενη ερώτηση" : "Next question",
      bullets: [completeness.next_question],
    });
  }

  if (!hasHardStop(safetyWarnings) && eligibleFoods.length > 0) {
    responseSections.push({
      title: locale === "el" ? "Τροφές που μπορούν να συζητηθούν" : "Foods to consider",
      bullets: eligibleFoods.slice(0, 3).map((food) => foodLabel(food) || "Unnamed food"),
    });
  }

  const uncertainty = uncertaintyForMissingData(completeness.missing_fields, locale);
  if (uncertainty) {
    responseSections.push({
      title: locale === "el" ? "Βαθμός βεβαιότητας" : "Confidence",
      bullets: [uncertainty],
    });
  }

  responseSections.push({
    title: locale === "el" ? "Δομή απάντησης" : "Answer structure",
    bullets: template.response_sections,
  });

  return {
    intent: detectedIntent,
    missing_fields: completeness.missing_fields,
    should_ask_followup:
      completeness.missing_fields.length > 0 && !hasHardStop(safetyWarnings),
    followup_question: hasHardStop(safetyWarnings) ? null : completeness.next_question,
    eligible_foods: hasHardStop(safetyWarnings) ? [] : eligibleFoods,
    rejected_foods: rejectedFoods,
    safety_warnings: safetyWarnings,
    response_sections: responseSections,
    confidence_level: confidenceFor({
      missingCount: completeness.missing_fields.length,
      safetyWarnings,
      eligibleFoods,
    }),
  };
}
