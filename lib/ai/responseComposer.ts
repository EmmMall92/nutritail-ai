import "server-only";

import { getOpenAiClient, getOpenAiModel, isOpenAiConfigured } from "@/lib/ai/openaiServer";
import type { FoodV2ChatbotRecommendationResponse } from "@/lib/food-v2/chatbotRecommendationSummary";
import {
  customerFoodDisplayName,
  customerFoodName,
} from "@/lib/food-v2/customerFoodName";

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
  return customerFoodName(food);
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
      ? "ταιριάζει με την προτίμηση γεύσης ή πρωτεΐνης"
      : "matches a preferred flavour or protein";
  }

  if (reasons.includes("weight") || reasons.includes("sterilised") || cautions.includes("fat")) {
    return locale === "el"
      ? "έχει λογική για έλεγχο θερμίδων και βάρους"
      : "fits calorie and weight-control thinking";
  }

  if (reasons.includes("excluded ingredients") || reasons.includes("allergens were not detected")) {
    return locale === "el"
      ? "σέβεται τις δηλωμένες αποφυγές συστατικών"
      : "respects the declared ingredient avoidances";
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

function simpleCaution(
  food: NonNullable<FoodV2ChatbotRecommendationResponse["premium"]>[number],
  locale: ComposerLocale
) {
  const text = (food.ranking?.cautions ?? []).join(" ").toLowerCase();
  if (!text) return null;

  if (text.includes("fat") || text.includes("energy") || text.includes("calories")) {
    return locale === "el"
      ? "θέλει σωστή μερίδα, ειδικά αν υπάρχει τάση για βάρος"
      : "portion size should be measured carefully, especially if weight is a concern";
  }

  if (text.includes("large-breed") || text.includes("calcium") || text.includes("phosphorus")) {
    return locale === "el"
      ? "σε μεγαλόσωμο κουτάβι θέλουμε προσοχή σε ασβέστιο και φώσφορο"
      : "large-breed puppies need extra care around calcium and phosphorus";
  }

  if (text.includes("pancreatitis") || text.includes("pancreatic")) {
    return locale === "el"
      ? "σε ιστορικό παγκρεατίτιδας η επιλογή τροφής πρέπει να γίνει με κτηνιατρική καθοδήγηση και προσοχή στα λιπαρά"
      : "pancreatitis history needs veterinarian-guided diet choice and careful fat review";
  }

  if (text.includes("senior")) {
    return locale === "el"
      ? "σε senior ζώο παρακολουθούμε βάρος, όρεξη και μυϊκή κατάσταση"
      : "for senior pets, monitor weight, appetite, and muscle condition";
  }

  if (text.includes("renal") || text.includes("kidney")) {
    return locale === "el"
      ? "σε νεφρικό θέμα η τελική επιλογή πρέπει να γίνεται με κτηνίατρο"
      : "renal cases should be diet-guided with a veterinarian";
  }

  if (text.includes("urinary")) {
    return locale === "el"
      ? "σε ουρολογικό ιστορικό χρειάζεται επιβεβαίωση από κτηνίατρο"
      : "urinary history should be confirmed with a veterinarian";
  }

  return null;
}

function compactFood(
  food: NonNullable<FoodV2ChatbotRecommendationResponse["premium"]>[number],
  locale: ComposerLocale
) {
  return {
    brand: food.brand ?? null,
    name: customerFoodDisplayName(food) || food.display_name || null,
    customer_name: customerFoodName(food),
    customer_reason: simpleReason(food, locale),
    customer_caution: simpleCaution(food, locale),
    nutrition_snapshot: nutritionLine(food, locale),
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
  const locale = input.locale ?? "el";

  return {
    locale,
    pet: input.petSummary ?? {},
    goal: input.recommendation.goal ?? "general",
    premium: premium.slice(0, 3).map((food) => compactFood(food, locale)),
    value: value.slice(0, 3).map((food) => compactFood(food, locale)),
    notes: input.recommendation.notes?.slice(0, 4) ?? [],
    cards_follow: Boolean(input.cardsFollow),
    deterministic_text: input.deterministicText,
  };
}

function foodBullet(
  food: NonNullable<FoodV2ChatbotRecommendationResponse["premium"]>[number],
  index: number,
  locale: ComposerLocale
) {
  const name = displayFoodName(food);
  const nutrition = nutritionLine(food, locale);
  const reason = simpleReason(food, locale);

  if (locale === "el") {
    return [
      `${index}. ${name}`,
      `   Γιατί: ${reason}.`,
      nutrition ? `   Με μια ματιά: ${nutrition}.` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `${index}. ${name}`,
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

  const goal = String(input.recommendation.goal ?? "general");
  const goalLabel = locale === "el" ? (GOAL_LABELS_EL[goal] ?? goal) : (GOAL_LABELS_EN[goal] ?? goal);
  const topFood = displayFoodName(foods[0]);
  const topReason = simpleReason(foods[0], locale);

  if (input.cardsFollow) {
    if (locale === "el") {
      return [
        "Έτοιμο. Οι πιο κατάλληλες επιλογές είναι στις κάρτες από κάτω.",
        "",
        `Τι κοιτάμε: ${goalLabel}.`,
        `Καλύτερη αφετηρία: ${topFood} - ${topReason}.`,
        "",
        "Πάτησε μία κάρτα για να δεις περίπου γραμμάρια/ημέρα.",
      ].join("\n");
    }

    return [
      "Done. The strongest matches are in the cards below.",
      "",
      `What we are optimizing for: ${goalLabel}.`,
      `Best starting point: ${topFood} - it ${topReason}.`,
      "",
      "Tap one card to see estimated grams/day.",
    ].join("\n");
  }

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
      "Επόμενο βήμα: διάλεξε μία τροφή από τις κάρτες για να δεις περίπου γραμμάρια/ημέρα.",
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
    "Next step: choose one food card to see estimated grams/day.",
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
        "needs review",
        "missing nutrition",
        "confidence internals",
        "πηγή:",
        "ποιότητα:",
        "χρειάζεται review",
        "θέλει review",
      ].some((term) => normalized.includes(term));
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function polishCustomerFacingLanguage(text: string, locale: ComposerLocale) {
  if (locale !== "el") return text;

  return text
    .replace(/\bWeight Control\b/g, "Έλεγχος βάρους")
    .replace(/\bSenior Nutrition\b/g, "Διατροφή senior")
    .replace(/\bHigh Activity\b/g, "Υψηλή δραστηριότητα")
    .replace(
      /Fat is not low enough to be a first pick for a sterilised or weight-control case\./gi,
      "Τα λιπαρά δεν είναι αρκετά χαμηλά για να είναι πρώτη επιλογή σε στειρωμένο ή επιρρεπές σε βάρος ζώο."
    )
    .replace(
      /Active\/performance food does not fit this weight-loss context\./gi,
      "Τροφή active/performance δεν είναι καλή πρώτη επιλογή για στόχο απώλειας βάρους."
    )
    .replace(
      /Low-fat formulas are not a credible first pick for active weight-gain cases\./gi,
      "Τροφές με πολύ χαμηλά λιπαρά δεν είναι ιδανική πρώτη επιλογή για δραστήριο ζώο που χρειάζεται αύξηση βάρους."
    )
    .replace(/\bMatches adult life stage\b/gi, "ταιριάζει σε ενήλικο ζώο")
    .replace(/\bIngredient data is available\b/gi, "υπάρχουν στοιχεία συστατικών");
}

function fallback(input: ChatbotRecommendationComposerInput, warnings: string[] = []): ChatbotRecommendationComposerResult {
  const locale = input.locale ?? "el";
  const customerText = polishCustomerFacingLanguage(
    buildCustomerFallbackText(input),
    locale
  );

  return {
    text: customerText || input.deterministicText,
    source: "fallback",
    warnings,
  };
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
              "You are NutriTail's customer-facing pet nutrition response composer. Database facts and deterministic rules are the only source of truth. Do not invent foods, scores, calories, nutrients, diagnoses, treatments, or medical claims. Hide backend fields such as source tier, needs_review, data quality, review status, source, confidence internals, and missing field lists. Prefer customer_reason, customer_caution, and nutrition_snapshot over raw internal wording. Write like an experienced petshop nutrition advisor: practical, warm, concise, and easy to scan. Give a clear customer shortlist, not a back-office audit. When selectable food cards follow, write only a short intro and next action; the cards are the recommendation UI. Do not tell the user to save in that intro because the save flow appears below the cards. Mention veterinary advice only for medical risk situations. Return plain text only.",
          },
          {
            role: "user",
            content: `Write the final chatbot recommendation in ${locale === "el" ? "Greek" : "English"}.\n\nRules:\n- Use only the foods and numbers in this JSON.\n- Preserve exact food names when you mention a food.\n- Do not add new brands, foods, scores, nutrients, or claims.\n- Do not include backend review/source-quality wording.\n- Do not say needs_review, source tier, retailer, missing nutrition fields, data quality, confidence internals, or source.\n- If cards_follow is true, write a compact intro only: goal, one top direction, and one clear next step to tap/choose a food card. Do not list every food because selectable cards appear below.\n- If cards_follow is true, keep the answer under 90 words and do not repeat card details.\n- If cards_follow is true, do not tell the user to save the plan in this intro.\n- If cards_follow is false, present 2-3 strongest options and up to 2 value alternatives only if available.\n- For each food you mention, explain one customer-friendly reason and one short nutrition snapshot if numbers exist.\n- Do not mention internal scores or numeric ranking labels.\n- Keep customer wording simple: no backend wording, no audit language, no long caveat blocks.\n- Explain RER/MER only if they already appear in deterministic_text.\n- End with one clear next step: tap/choose a food to calculate grams/day.\n\nGrounded JSON:\n${JSON.stringify(groundedPayload)}`,
          },
        ],
        temperature: 0.2,
        max_output_tokens: 900,
      },
      { signal: controller.signal }
    );

    const text = polishCustomerFacingLanguage(
      removeBackOfficeLines(response.output_text ?? ""),
      locale
    );
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
