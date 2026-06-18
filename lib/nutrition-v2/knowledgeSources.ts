export type NutritionKnowledgeUse =
  | "decision_rules"
  | "nutrition_logic"
  | "disease_nutrition"
  | "growth_nutrition"
  | "senior_nutrition";

export type NutritionKnowledgeSourceId =
  | "CANINE_FELINE_NUTRITION_BOOK"
  | "SMALL_ANIMAL_CLINICAL_NUTRITION"
  | "WSAVA"
  | "FEDIAF"
  | "NRC"
  | "WALTHAM"
  | "TUFTS_VETERINARY_NUTRITION"
  | "UC_DAVIS_VETERINARY_NUTRITION"
  | "VETFOLIO"
  | "WIKIVET";

export type NutritionKnowledgeSource = {
  id: NutritionKnowledgeSourceId;
  priority: number;
  displayName: string;
  allowedUses: NutritionKnowledgeUse[];
  policyNotes: string[];
};

export const NUTRITAIL_KNOWLEDGE_ALLOWED_USES = [
  "decision_rules",
  "nutrition_logic",
  "disease_nutrition",
  "growth_nutrition",
  "senior_nutrition",
] as const satisfies readonly NutritionKnowledgeUse[];

export const NUTRITAIL_KNOWLEDGE_SOURCE_POLICY = {
  copyrightRule:
    "Do not copy source text. Convert source concepts into NutriTail-owned structured rules, cautions, and confidence logic.",
  clinicalRule:
    "Use clinical sources for decision support only. The chatbot must not diagnose, prescribe treatment, or override veterinary care.",
  rankingRule:
    "OpenAI may explain approved rules, but Food V2 and deterministic NutriTail logic remain the source of truth for ranking foods.",
} as const;

export const NUTRITAIL_KNOWLEDGE_SOURCES = [
  {
    id: "CANINE_FELINE_NUTRITION_BOOK",
    priority: 1,
    displayName: "Canine and Feline Nutrition",
    allowedUses: [...NUTRITAIL_KNOWLEDGE_ALLOWED_USES],
    policyNotes: ["Use as the first source for core nutrition concepts and decision logic."],
  },
  {
    id: "SMALL_ANIMAL_CLINICAL_NUTRITION",
    priority: 2,
    displayName: "Small Animal Clinical Nutrition",
    allowedUses: [...NUTRITAIL_KNOWLEDGE_ALLOWED_USES],
    policyNotes: [
      "Use as the primary clinical nutrition textbook layer for disease, growth, senior, and feeding-management rules.",
      "Store only NutriTail-owned structured rules and source-map metadata; do not copy book text.",
    ],
  },
  {
    id: "WSAVA",
    priority: 3,
    displayName: "WSAVA",
    allowedUses: [...NUTRITAIL_KNOWLEDGE_ALLOWED_USES],
    policyNotes: ["Use for nutrition assessment, owner communication, and safety framing."],
  },
  {
    id: "FEDIAF",
    priority: 4,
    displayName: "FEDIAF",
    allowedUses: [...NUTRITAIL_KNOWLEDGE_ALLOWED_USES],
    policyNotes: ["Use for EU labeling, nutrient guidance, and market-relevant interpretation."],
  },
  {
    id: "NRC",
    priority: 5,
    displayName: "NRC",
    allowedUses: [...NUTRITAIL_KNOWLEDGE_ALLOWED_USES],
    policyNotes: ["Use for nutrient requirement logic and scientific cross-checks."],
  },
  {
    id: "WALTHAM",
    priority: 6,
    displayName: "Waltham",
    allowedUses: [...NUTRITAIL_KNOWLEDGE_ALLOWED_USES],
    policyNotes: ["Use for practical companion-animal nutrition concepts."],
  },
  {
    id: "TUFTS_VETERINARY_NUTRITION",
    priority: 7,
    displayName: "Tufts Veterinary Nutrition",
    allowedUses: [...NUTRITAIL_KNOWLEDGE_ALLOWED_USES],
    policyNotes: ["Use for client-facing veterinary nutrition explanations and safety nuance."],
  },
  {
    id: "UC_DAVIS_VETERINARY_NUTRITION",
    priority: 8,
    displayName: "UC Davis Veterinary Nutrition",
    allowedUses: [...NUTRITAIL_KNOWLEDGE_ALLOWED_USES],
    policyNotes: ["Use for specialist veterinary nutrition logic and clinical caution."],
  },
  {
    id: "VETFOLIO",
    priority: 9,
    displayName: "VetFolio",
    allowedUses: [...NUTRITAIL_KNOWLEDGE_ALLOWED_USES],
    policyNotes: ["Use as supporting veterinary education material when higher-priority sources are insufficient."],
  },
  {
    id: "WIKIVET",
    priority: 10,
    displayName: "WikiVet",
    allowedUses: [...NUTRITAIL_KNOWLEDGE_ALLOWED_USES],
    policyNotes: ["Use as tertiary support only, not as the first source for clinical rules."],
  },
] as const satisfies readonly NutritionKnowledgeSource[];

export function getKnowledgeSource(id: NutritionKnowledgeSourceId) {
  return NUTRITAIL_KNOWLEDGE_SOURCES.find((source) => source.id === id) ?? null;
}

export function getKnowledgeSourcePriority(id: NutritionKnowledgeSourceId) {
  return getKnowledgeSource(id)?.priority ?? Number.POSITIVE_INFINITY;
}

export function sortKnowledgeSourcesByPriority(
  ids: readonly NutritionKnowledgeSourceId[]
) {
  return [...ids].sort(
    (left, right) =>
      getKnowledgeSourcePriority(left) - getKnowledgeSourcePriority(right)
  );
}

export function isKnowledgeUseAllowed(
  sourceId: NutritionKnowledgeSourceId,
  use: NutritionKnowledgeUse
) {
  return getKnowledgeSource(sourceId)?.allowedUses.includes(use) ?? false;
}
