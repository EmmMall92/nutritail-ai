export const dialogueCorpusSchemaVersion = "1.0.0";

export const dialogueDifficulties = ["easy", "medium", "hard", "expert"] as const;
export const dialogueLanguages = ["el", "en", "mixed", "greeklish"] as const;
export const dialogueSpecies = ["dog", "cat"] as const;
export const customerIntents = [
  "recommendation",
  "comparison",
  "feeding_amount",
  "transition",
  "emergency",
  "follow_up",
] as const;
export const customerKnowledgeLevels = ["beginner", "normal", "advanced"] as const;
export const customerTones = [
  "polite",
  "anxious",
  "confused",
  "demanding",
  "price_sensitive",
] as const;

export type DialogueDifficulty = (typeof dialogueDifficulties)[number];
export type DialogueLanguage = (typeof dialogueLanguages)[number];
export type DialogueSpecies = (typeof dialogueSpecies)[number];
export type CustomerIntent = (typeof customerIntents)[number];
export type CustomerKnowledgeLevel = (typeof customerKnowledgeLevels)[number];
export type CustomerTone = (typeof customerTones)[number];

export type DialogueRole = "user" | "assistant_expected_behavior";

export type DialogueTurn = {
  role: DialogueRole;
  content: string;
};

export type DialoguePetFactsExpected = {
  species: DialogueSpecies | null;
  breed: string | null;
  age_months: number | null;
  age_years: number | null;
  weight_kg: number | null;
  expected_adult_weight_kg: number | null;
  neutered: boolean | null;
  life_stage: string | null;
  activity_level: string | null;
  body_condition: string | null;
  health_conditions: string[];
  allergies: string[];
  sensitivities: string[];
  food_preferences: string[];
  feeding_format_preference: string | null;
  budget_preference: string | null;
  owner_goal: string | null;
  urgency_flags: string[];
};

export type DialogueCustomerProfile = {
  intent: CustomerIntent;
  knowledge_level: CustomerKnowledgeLevel;
  tone: CustomerTone;
};

export type DialogueExpectedBehavior = {
  should_interrupt: boolean;
  should_ask_followup: boolean;
  max_followup_questions_before_recommendation: number;
  must_not_do: string[];
  required_rules: string[];
  required_tags: string[];
};

export type DialogueEvaluation = {
  fact_extraction_must_include: string[];
  safety_must_trigger: string[];
  retrieval_must_filter_by: string[];
  ranking_should_prefer: string[];
  answer_quality_checks: string[];
};

export type DialogueCorpusItem = {
  id: string;
  species: DialogueSpecies;
  category: string;
  difficulty: DialogueDifficulty;
  language: DialogueLanguage;
  customer_profile: DialogueCustomerProfile;
  pet_facts_expected: DialoguePetFactsExpected;
  expected_behavior: DialogueExpectedBehavior;
  conversation: DialogueTurn[];
  evaluation: DialogueEvaluation;
};

export const dialogueCorpusFiles = [
  "dogs/puppies.json",
  "dogs/adults.json",
  "dogs/seniors.json",
  "dogs/sterilised.json",
  "dogs/intact.json",
  "dogs/medical.json",
  "dogs/emergency.json",
  "dogs/comparisons.json",
  "dogs/feeding.json",
  "cats/kittens.json",
  "cats/adults.json",
  "cats/seniors.json",
  "cats/sterilised.json",
  "cats/intact.json",
  "cats/urinary.json",
  "cats/renal.json",
  "cats/obesity.json",
  "cats/emergency.json",
  "cats/feeding.json",
  "mixed/multi_pet.json",
  "mixed/budget.json",
  "mixed/premium.json",
  "mixed/picky_eaters.json",
  "mixed/food_transition.json",
] as const;

export const requiredMustNotDo = [
  "invent_foods",
  "invent_nutrients",
  "override_rules",
  "ask_unnecessary_questions",
] as const;
