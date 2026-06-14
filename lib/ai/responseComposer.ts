import "server-only";

import { getOpenAiClient, getOpenAiModel, isOpenAiConfigured } from "@/lib/ai/openaiServer";
import type { FoodV2ChatbotRecommendationResponse } from "@/lib/food-v2/chatbotRecommendationSummary";

type ComposerLocale = "el" | "en";

export type ChatbotRecommendationComposerInput = {
  locale?: ComposerLocale;
  deterministicText: string;
  petSummary?: {
    species?: "dog" | "cat";
    name?: string;
    weightKg?: number;
    ageYears?: number;
    activityLevel?: string;
    neutered?: boolean;
    weightGoal?: string;
    healthIssues?: string[];
    preferredProteins?: string[];
    excludedIngredients?: string[];
  };
  recommendation: FoodV2ChatbotRecommendationResponse;
  timeoutMs?: number;
};

export type ChatbotRecommendationComposerResult = {
  text: string;
  source: "openai" | "fallback";
  warnings: string[];
};

function compactFood(food: NonNullable<FoodV2ChatbotRecommendationResponse["premium"]>[number]) {
  return {
    brand: food.brand ?? null,
    name: food.display_name ?? null,
    score: food.ranking?.total_score ?? null,
    reasons: food.ranking?.reasons?.slice(0, 3) ?? [],
    cautions: food.ranking?.cautions?.slice(0, 3) ?? [],
    nutrition: {
      kcal_per_100g: food.nutrition?.kcal_per_100g ?? null,
      protein_percent: food.nutrition?.protein_percent ?? null,
      fat_percent: food.nutrition?.fat_percent ?? null,
      fiber_percent: food.nutrition?.fiber_percent ?? null,
      calcium_percent: food.nutrition?.calcium_percent ?? null,
      phosphorus_percent: food.nutrition?.phosphorus_percent ?? null,
    },
  };
}

function buildGroundedPayload(input: ChatbotRecommendationComposerInput) {
  const premium = input.recommendation.premium ?? [];
  const value = input.recommendation.value ?? [];

  return {
    locale: input.locale ?? "el",
    pet: input.petSummary ?? {},
    goal: input.recommendation.goal ?? "general",
    premium: premium.slice(0, 3).map(compactFood),
    value: value.slice(0, 3).map(compactFood),
    notes: input.recommendation.notes?.slice(0, 4) ?? [],
    deterministic_text: input.deterministicText,
  };
}

function fallback(input: ChatbotRecommendationComposerInput, warnings: string[] = []): ChatbotRecommendationComposerResult {
  return {
    text: input.deterministicText,
    source: "fallback",
    warnings,
  };
}

function removeBackOfficeLines(text: string) {
  return text
    .split(/\r?\n/)
    .filter((line) => {
      const normalized = line.toLowerCase();
      return ![
        "source:",
        "data quality",
        "needs_review",
        "source tier",
        "retailer source",
        "quality:",
      ].some((term) => normalized.includes(term));
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function hasAtLeastOneKnownFood(text: string, input: ChatbotRecommendationComposerInput) {
  const foods = [...(input.recommendation.premium ?? []), ...(input.recommendation.value ?? [])];
  if (foods.length === 0) return true;

  return foods.slice(0, 4).some((food) => {
    const name = String(food.display_name ?? "").trim();
    if (!name) return false;
    return text.toLowerCase().includes(name.toLowerCase());
  });
}

export async function composeChatbotRecommendationResponse(
  input: ChatbotRecommendationComposerInput
): Promise<ChatbotRecommendationComposerResult> {
  if (!input.deterministicText.trim()) {
    return fallback(input, ["missing_deterministic_text"]);
  }

  if (!isOpenAiConfigured()) {
    return fallback(input, ["openai_not_configured"]);
  }

  const client = getOpenAiClient();
  if (!client) return fallback(input, ["openai_client_unavailable"]);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 9000);
  const locale = input.locale ?? "el";
  const groundedPayload = buildGroundedPayload(input);

  try {
    const response = await client.responses.create(
      {
        model: getOpenAiModel(),
        input: [
          {
            role: "system",
            content:
              "You are NutriTail's customer-facing pet nutrition response composer. Database facts and deterministic rules are the only source of truth. Do not invent foods, scores, calories, nutrients, diagnoses, treatments, or medical claims. Hide backend fields such as source tier, needs_review, data quality, and review status from customers. Keep the answer warm, short, practical, and easy to scan. Mention veterinary advice only for medical risk situations. Return plain text only.",
          },
          {
            role: "user",
            content: `Write the final chatbot recommendation in ${locale === "el" ? "Greek" : "English"}.\n\nRules:\n- Use only the foods and numbers in this JSON.\n- Preserve exact food names.\n- Present first 2-3 strongest options and up to 2 value alternatives.\n- Explain RER/MER only if they already appear in deterministic_text.\n- End with one clear next step: choose a food to calculate grams/day.\n- Do not include backend review/source-quality wording.\n\nGrounded JSON:\n${JSON.stringify(groundedPayload)}`,
          },
        ],
        temperature: 0.2,
        max_output_tokens: 900,
      },
      { signal: controller.signal }
    );

    const text = removeBackOfficeLines(response.output_text ?? "");
    if (text.length < 80) return fallback(input, ["composer_output_too_short"]);
    if (!hasAtLeastOneKnownFood(text, input)) {
      return fallback(input, ["composer_did_not_preserve_known_food"]);
    }

    return {
      text,
      source: "openai",
      warnings: [],
    };
  } catch {
    return fallback(input, ["composer_failed"]);
  } finally {
    clearTimeout(timeout);
  }
}
