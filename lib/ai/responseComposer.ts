import "server-only";

import { getOpenAiClient, getOpenAiModel, isOpenAiConfigured } from "@/lib/ai/openaiServer";
import type { FoodV2ChatbotRecommendationResponse } from "@/lib/food-v2/chatbotRecommendationSummary";

type ComposerLocale = "el" | "en";

export type ChatbotRecommendationComposerInput = {
  locale?: ComposerLocale;
  deterministicText: string;
  cardsFollow?: boolean;
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
    cards_follow: Boolean(input.cardsFollow),
    deterministic_text: input.deterministicText,
  };
}

function fallback(input: ChatbotRecommendationComposerInput, warnings: string[] = []): ChatbotRecommendationComposerResult {
  const customerText = buildCustomerFallbackText(input);

  return {
    text: customerText || input.deterministicText,
    source: "fallback",
    warnings,
  };
}

const GOAL_LABELS_EL: Record<string, string> = {
  allergy: "αποφυγή συστατικών",
  general: "γενική επιλογή",
  growth: "ανάπτυξη",
  premium: "ποιοτική επιλογή",
  renal: "νεφρική υποστήριξη",
  sensitive_digestion: "ευαίσθητη πέψη",
  senior: "senior ανάγκες",
  sterilised: "στειρωμένο κατοικίδιο",
  urinary: "ουρολογική υποστήριξη",
  value: "οικονομική επιλογή",
  weight_control: "έλεγχος βάρους",
};

const GOAL_LABELS_EN: Record<string, string> = {
  allergy: "ingredient avoidance",
  general: "general fit",
  growth: "growth",
  premium: "premium fit",
  renal: "renal support",
  sensitive_digestion: "sensitive digestion",
  senior: "senior needs",
  sterilised: "sterilised pet",
  urinary: "urinary support",
  value: "value fit",
  weight_control: "weight control",
};

function displayFoodName(food: NonNullable<FoodV2ChatbotRecommendationResponse["premium"]>[number]) {
  const brand = String(food.brand ?? "").trim();
  const name = String(food.display_name ?? "").replace(/\s+/g, " ").trim();

  if (!brand) return name;
  if (!name) return brand;
  if (name.toLowerCase().startsWith(brand.toLowerCase())) return name;

  return `${brand} - ${name}`;
}

function formatNumber(value: unknown, digits = 1) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return null;
  return Number(numberValue.toFixed(digits));
}

function nutritionLine(
  food: NonNullable<FoodV2ChatbotRecommendationResponse["premium"]>[number],
  locale: ComposerLocale
) {
  const kcal = formatNumber(food.nutrition?.kcal_per_100g, 1);
  const protein = formatNumber(food.nutrition?.protein_percent, 1);
  const fat = formatNumber(food.nutrition?.fat_percent, 1);
  const fiber = formatNumber(food.nutrition?.fiber_percent, 1);

  const values = [
    kcal !== null ? `${kcal} kcal/100g` : "",
    protein !== null ? `${protein}% ${locale === "el" ? "πρωτεΐνη" : "protein"}` : "",
    fat !== null ? `${fat}% ${locale === "el" ? "λιπαρά" : "fat"}` : "",
    fiber !== null ? `${fiber}% ${locale === "el" ? "ίνες" : "fiber"}` : "",
  ].filter(Boolean);

  return values.length > 0 ? values.join("; ") : null;
}

function simpleReason(
  food: NonNullable<FoodV2ChatbotRecommendationResponse["premium"]>[number],
  locale: ComposerLocale
) {
  const reasons = (food.ranking?.reasons ?? []).join(" ").toLowerCase();
  const cautions = (food.ranking?.cautions ?? []).join(" ").toLowerCase();

  if (reasons.includes("preferred protein") || reasons.includes("preferred flavor")) {
    return locale === "el"
      ? "ταιριάζει με προτίμηση γεύσης/πρωτεΐνης"
      : "matches a preferred flavour or protein";
  }

  if (reasons.includes("excluded ingredients") || reasons.includes("allergens were not detected")) {
    return locale === "el"
      ? "σέβεται τις δηλωμένες αποφυγές συστατικών"
      : "respects the declared ingredient avoidances";
  }

  if (reasons.includes("weight") || reasons.includes("sterilised") || cautions.includes("fat")) {
    return locale === "el"
      ? "έχει λογική για έλεγχο θερμίδων και βάρους"
      : "fits calorie and weight-control thinking";
  }

  if (reasons.includes("sensitive") || reasons.includes("digest")) {
    return locale === "el"
      ? "έχει λογική για πιο ευαίσθητη πέψη"
      : "has a sensible sensitive-digestion positioning";
  }

  if (reasons.includes("senior")) {
    return locale === "el"
      ? "είναι πιο κοντά σε senior ανάγκες"
      : "is closer to senior needs";
  }

  if (reasons.includes("growth") || reasons.includes("puppy") || reasons.includes("kitten")) {
    return locale === "el"
      ? "είναι πιο κοντά στις ανάγκες ανάπτυξης"
      : "is closer to growth needs";
  }

  return locale === "el"
    ? "ταιριάζει στο βασικό προφίλ του κατοικιδίου"
    : "fits the pet's basic profile";
}

function foodBullet(
  food: NonNullable<FoodV2ChatbotRecommendationResponse["premium"]>[number],
  index: number,
  locale: ComposerLocale
) {
  const name = displayFoodName(food);
  const score = formatNumber(food.ranking?.total_score, 0);
  const nutrition = nutritionLine(food, locale);
  const reason = simpleReason(food, locale);

  if (locale === "el") {
    return [
      `${index}. ${name}${score !== null ? ` (${score}/100)` : ""}`,
      `   Γιατί: ${reason}.`,
      nutrition ? `   Με μια ματιά: ${nutrition}.` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `${index}. ${name}${score !== null ? ` (${score}/100)` : ""}`,
    `   Why: ${reason}.`,
    nutrition ? `   At a glance: ${nutrition}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildCustomerFallbackText(input: ChatbotRecommendationComposerInput) {
  const locale = input.locale ?? "el";
  const premium = input.recommendation.premium ?? [];
  const value = input.recommendation.value ?? [];
  const foods = [...premium.slice(0, 3), ...value.slice(0, 2)].filter((food) =>
    String(food.display_name ?? "").trim()
  );

  if (foods.length === 0) return "";

  if (input.cardsFollow) {
    const goal = String(input.recommendation.goal ?? "general");
    const goalLabel = locale === "el" ? (GOAL_LABELS_EL[goal] ?? goal) : (GOAL_LABELS_EN[goal] ?? goal);
    const topFood = displayFoodName(foods[0]);
    const topReason = simpleReason(foods[0], locale);

    if (locale === "el") {
      return [
        "Έτοιμο. Με βάση τα στοιχεία του κατοικιδίου, έβαλα τις καλύτερες επιλογές από κάτω σε κάρτες.",
        "",
        `Στόχος: ${goalLabel}.`,
        `Πρώτη κατεύθυνση: ${topFood}, γιατί ${topReason}.`,
        "",
        "Πάτησε μία κάρτα για να υπολογίσω περίπου γραμμάρια/ημέρα και να κρατήσω την επιλογή στην ανάλυση.",
      ].join("\n");
    }

    return [
      "Done. Based on this pet profile, I placed the best options below as cards.",
      "",
      `Goal: ${goalLabel}.`,
      `First direction: ${topFood}, because it ${topReason}.`,
      "",
      "Tap one card to estimate grams/day and keep that food in the analysis.",
    ].join("\n");
  }

  const goal = String(input.recommendation.goal ?? "general");
  const goalLabel = locale === "el" ? (GOAL_LABELS_EL[goal] ?? goal) : (GOAL_LABELS_EN[goal] ?? goal);
  const petName = input.petSummary?.name?.trim();

  if (locale === "el") {
    return [
      petName
        ? `Για ${petName}, θα ξεκινούσα με αυτές τις επιλογές:`
        : "Θα ξεκινούσα με αυτές τις επιλογές:",
      "",
      `Στόχος: ${goalLabel}.`,
      "",
      foods.map((food, index) => foodBullet(food, index + 1, locale)).join("\n\n"),
      "",
      "Το πιο πρακτικό επόμενο βήμα: πάτησε μία τροφή από τις επιλογές από κάτω για να υπολογίσω περίπου γραμμάρια/ημέρα.",
      "Αν υπάρχουν ουρολογικά, νεφρικά, διαβήτης, παγκρεατίτιδα, έντονος εμετός, διάρροια, αίμα ή ανορεξία, μίλα πρώτα με κτηνίατρο.",
    ].join("\n");
  }

  return [
    petName ? `For ${petName}, I would start with these options:` : "I would start with these options:",
    "",
    `Goal: ${goalLabel}.`,
    "",
    foods.map((food, index) => foodBullet(food, index + 1, locale)).join("\n\n"),
    "",
    "Best next step: tap one food below and I can estimate grams/day.",
    "For urinary, kidney, diabetes, pancreatitis, severe vomiting, diarrhea, blood, or not eating, speak with a veterinarian first.",
  ].join("\n");
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
  if (input.cardsFollow) return true;

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
              "You are NutriTail's customer-facing pet nutrition response composer. Database facts and deterministic rules are the only source of truth. Do not invent foods, scores, calories, nutrients, diagnoses, treatments, or medical claims. Hide backend fields such as source tier, needs_review, data quality, review status, source, confidence internals, and missing field lists. Write like an experienced petshop nutrition advisor: practical, warm, concise, and easy to scan. Give a clear shortlist, not a back-office audit. Mention veterinary advice only for medical risk situations. Return plain text only.",
          },
          {
            role: "user",
            content: `Write the final chatbot recommendation in ${locale === "el" ? "Greek" : "English"}.\n\nRules:\n- Use only the foods and numbers in this JSON.\n- Preserve exact food names when you mention a food.\n- Do not add new brands, foods, scores, nutrients, or claims.\n- Do not include backend review/source-quality wording.\n- Do not say needs_review, source tier, retailer, missing nutrition fields, data quality, confidence internals, or source.\n- If cards_follow is true, write a compact intro only: goal, one top direction, and one clear next step. Do not list every food because selectable cards appear below.\n- If cards_follow is false, present 2-3 strongest options and up to 2 value alternatives only if available.\n- For each food you mention, explain one customer-friendly reason and one short nutrition snapshot if numbers exist.\n- Do not over-explain the internal score. If you mention a score, keep it secondary.\n- Explain RER/MER only if they already appear in deterministic_text.\n- End with one clear next step: tap/choose a food to calculate grams/day.\n\nGrounded JSON:\n${JSON.stringify(groundedPayload)}`,
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
