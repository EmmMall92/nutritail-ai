import { getDialogueTemplate } from "@/lib/chatbot/dialoguePlaybook";
import type {
  ChatbotIntent,
  ChatbotLocale,
  ChatbotPetContext,
  PetField,
} from "@/lib/chatbot/types";

export type PetDataCompletenessResult = {
  missing_fields: PetField[];
  next_question: string | null;
  can_continue: boolean;
};

function hasField(pet: ChatbotPetContext | null | undefined, field: PetField) {
  if (!pet) return false;

  const value = pet[field as keyof ChatbotPetContext];

  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  if (typeof value === "boolean") return true;

  return value !== null && value !== undefined;
}

function optionalForIntent(intent: ChatbotIntent, field: PetField) {
  if (intent === "food_recommendation" && field === "healthIssues") return true;
  if (intent === "food_recommendation" && field === "allergies") return true;
  if (intent === "brand_comparison" && field === "healthIssues") return true;
  if (intent === "brand_comparison" && field === "allergies") return true;
  if (intent === "sterilised" && field === "bodyCondition") return true;

  return false;
}

export function checkPetDataCompleteness(
  pet: ChatbotPetContext | null | undefined,
  intent: ChatbotIntent,
  locale: ChatbotLocale = "el"
): PetDataCompletenessResult {
  const template = getDialogueTemplate(intent);
  const missingFields = template.required_pet_fields.filter(
    (field) => !hasField(pet, field) && !optionalForIntent(intent, field)
  );
  const nextField = missingFields[0];

  return {
    missing_fields: missingFields,
    next_question: nextField
      ? template.follow_up_questions[locale]?.[nextField] ??
        template.follow_up_questions.en?.[nextField] ??
        null
      : null,
    can_continue: missingFields.length === 0,
  };
}
