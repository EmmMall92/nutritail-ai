// Database = truth, rules = safety, LLM = human explanation,
// dialogue playbook = conversation control.
export type ChatbotIntent =
  | "food_recommendation"
  | "brand_comparison"
  | "ingredient_question"
  | "allergy"
  | "sensitive_digestion"
  | "pancreatitis"
  | "renal"
  | "obesity"
  | "portion_size"
  | "food_transition"
  | "puppy_growth"
  | "kitten_growth"
  | "senior"
  | "active_working"
  | "treats"
  | "supplements"
  | "urinary"
  | "sterilised"
  | "hairball"
  | "fussy_eater"
  | "unclear_message"
  | "medical_red_flag"
  | "photo_grounding"
  | "sales_checkout";

export type IntentGroup =
  | "shopping"
  | "comparison"
  | "ingredient"
  | "medical"
  | "feeding"
  | "life_stage"
  | "behavior"
  | "evidence"
  | "sales"
  | "unclear";

export type ChatbotLocale = "el" | "en";

export type PetField =
  | "species"
  | "age"
  | "weight"
  | "breed"
  | "activityLevel"
  | "neutered"
  | "healthIssues"
  | "allergies"
  | "currentFood"
  | "bodyCondition"
  | "vetDiagnosis";

export type DialogueTemplate = {
  intent: ChatbotIntent;
  intent_group: IntentGroup;
  required_pet_fields: PetField[];
  follow_up_questions: Record<ChatbotLocale, Partial<Record<PetField, string>>>;
  safety_notes: string[];
  response_sections: string[];
  eligible_logic: string[];
  rejected_logic: string[];
  confidence_rules: string[];
};

export type ChatbotPetContext = {
  species?: "dog" | "cat" | string | null;
  age?: number | null;
  weight?: number | null;
  breed?: string | null;
  activityLevel?: "low" | "normal" | "high" | string | null;
  neutered?: boolean | null;
  healthIssues?: string[] | null;
  allergies?: string[] | null;
  currentFood?: string | null;
  bodyCondition?: string | null;
  vetDiagnosis?: string | null;
};

export type MatchedFoodForPlanning = {
  id?: string | null;
  brand?: string | null;
  name?: string | null;
  display_name?: string | null;
  species?: string | null;
  life_stage?: string | null;
  dog_size?: string | null;
  data_quality_status?: string | null;
  source_priority?: string | null;
  missing_nutrition_fields?: string[];
  ingredients?: string[] | string | null;
  medical_tags?: string[] | null;
  commercial_tags?: string[] | null;
  ranking?: {
    total_score?: number | null;
    confidence?: "high" | "medium" | "low";
    reasons?: string[];
    cautions?: string[];
  } | null;
};

export type PlannedResponseSection = {
  title: string;
  bullets: string[];
};
