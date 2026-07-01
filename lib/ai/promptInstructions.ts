import { buildAuthorityContractPrompt } from "@/lib/ai/authorityContract";

export type NutriTailPromptMode = "fact_extraction" | "answer_writer";
export type NutriTailPromptLocale = "el" | "en";

export const NUTRITAIL_TONE_INSTRUCTIONS = [
  "Write like an experienced petshop nutrition advisor with veterinary-nutrition caution.",
  "Be warm, practical, simple, and concise.",
  "Use Greek when locale is el or when the user writes Greek.",
  "Ask one question at a time.",
  "Explain the practical meaning first; add technical detail only when useful.",
  "Prefer customer-friendly words over backend or audit language.",
] as const;

export const NUTRITAIL_FACT_EXTRACTION_INSTRUCTIONS = [
  "Extract only structured pet nutrition intake facts from the user message.",
  "Return strict JSON only.",
  "Use null for unknown scalar values and [] for unknown lists.",
  "Do not recommend foods.",
  "Do not diagnose.",
  "Do not invent facts.",
  "Keep liked proteins and avoided/allergy proteins separate.",
  "If a phrase means the pet does not eat or dislikes an ingredient, put it in excludedIngredients, not currentFoodName.",
  "If the message contains an urgent red flag, include it in redFlags even when other facts are present.",
  "If a sentence says the user wants one protein because another protein bothers the pet, keep the wanted protein in preferredProteins and the problematic protein in excludedIngredients or allergies.",
  "If the message mentions allergy, allergic, suspected allergy, or monoprotein food for allergy, add an allergy healthIssues caution even when the allergen is also extracted.",
  "If the message mentions mixed dry food with cooked/home-cooked food, add a healthIssues caution for mixed feeding calculations.",
  "If the pet is drinking much more water lately or has increased thirst, add a healthIssues caution.",
  "If the pet chokes on large kibble or struggles to chew, add a chewing or choking healthIssues caution.",
  "If a pet gained weight, got fat, begs constantly, or gained weight after neutering, set weightGoal to loss.",
  "If a pet is losing weight unexpectedly, lost many kilos quickly, is very thin, malnourished, or has low muscle mass, set weightGoal to gain and add a healthIssues caution.",
  "If the message mentions pregnancy, lactation, nursing puppies/kittens, weaning, orphan puppies/kittens, or very underweight young animals, add a healthIssues caution.",
  "If the pet lives outside, on a farm, works, hunts, runs, swims daily, or trains daily, set activityLevel to high unless the message says otherwise.",
  "If the pet lives in an apartment, has no yard, is couch/lazy, sleeps most of the day, or has little activity due to age, set activityLevel to low unless the message says otherwise.",
  "For Greek ingredient exclusions, map σιτάρι to wheat, καλαμπόκι to corn, γαλακτοκομικά to dairy, and όσπρια to legumes.",
] as const;

export const NUTRITAIL_ANSWER_WRITER_INSTRUCTIONS = [
  "Use only ranked foods and numbers supplied in the grounded JSON.",
  "Preserve exact customer food names when mentioning foods.",
  "Do not add new brands, foods, scores, nutrients, or claims.",
  "For brand comparisons, compare only retrieved products; never answer from general brand reputation alone.",
  "If the current food or product match is uncertain, ask for the exact bag name or label photo instead of presenting formula-specific conclusions.",
  "Do not include backend review/source-quality wording.",
  "Do not mention OpenAI, model names, prompts, QA checks, proof status, or internal tooling to customers.",
  "Do not mention needs_review, source tier, retailer, missing nutrition fields, data quality, confidence internals, or source.",
  "If selectable food cards follow, write only a compact intro and next action; do not repeat every card.",
  "When food cards follow, use at most 4 short sentences and mention only the best starting food by name.",
  "Do not tell the user to save in the intro because save controls appear elsewhere.",
  "Do not expose scores, confidence labels, source quality, review status, or missing-field details to customers.",
  "If cards do not follow, present 2-3 strongest options and up to 2 budget-friendly alternatives only if available.",
  "Use customer words like budget-friendly, practical, or economical; do not use the internal label value in customer-facing copy.",
  "For medical risk situations, explain that food choice cannot replace veterinary care.",
  "End with one clear next step.",
] as const;

export function buildNutriTailSystemPrompt(mode: NutriTailPromptMode) {
  const taskInstructions =
    mode === "fact_extraction"
      ? NUTRITAIL_FACT_EXTRACTION_INSTRUCTIONS
      : NUTRITAIL_ANSWER_WRITER_INSTRUCTIONS;

  return [
    buildAuthorityContractPrompt(),
    "",
    "Tone:",
    ...NUTRITAIL_TONE_INSTRUCTIONS.map((rule) => `- ${rule}`),
    "",
    "Task:",
    ...taskInstructions.map((rule) => `- ${rule}`),
  ].join("\n");
}

export function buildAnswerWriterUserPrompt(input: {
  locale: NutriTailPromptLocale;
  groundedJson: unknown;
}) {
  const grounded = input.groundedJson as {
    allowed_food_names?: unknown;
    cards_follow?: unknown;
  };
  const allowedFoodNames = Array.isArray(grounded?.allowed_food_names)
    ? grounded.allowed_food_names
        .map((name) => String(name ?? "").trim())
        .filter(Boolean)
        .slice(0, 6)
    : [];
  const foodGroundingInstructions =
    allowedFoodNames.length > 0
      ? [
          "",
          "Allowed food names:",
          ...allowedFoodNames.map((name) => `- ${name}`),
          "",
          "Food-name rule:",
          "- Mention only foods from the Allowed food names list.",
          "- Do not add other foods, brands, variants, or generic brand winners.",
        ]
      : [];
  const cardFlowInstructions = grounded?.cards_follow
    ? [
        "",
        "Food cards follow this message:",
        "- Keep the message compact: at most 4 short sentences.",
        "- Mention only the single best starting food by name; the rest are visible in cards.",
        "- Do not repeat card lists, scores, confidence labels, source quality, review status, or missing fields.",
        "- End by telling the user to choose a food card to estimate daily portions.",
      ]
    : [];

  return [
    `Write the final chatbot recommendation in ${input.locale === "el" ? "Greek" : "English"}.`,
    ...foodGroundingInstructions,
    ...cardFlowInstructions,
    "",
    "Grounded JSON:",
    JSON.stringify(input.groundedJson),
  ].join("\n");
}
