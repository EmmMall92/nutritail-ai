export const NUTRITAIL_CHATBOT_TRAINING_ROADMAP = [
  {
    phase: "prompt_instructions",
    status: "active",
    purpose:
      "Control tone, language, answer shape, and forbidden behavior without changing nutrition decisions.",
  },
  {
    phase: "knowledge_retrieval",
    status: "active",
    purpose:
      "Provide source-prioritized nutrition principles and Food V2 facts as grounded context.",
  },
  {
    phase: "deterministic_rules",
    status: "active",
    purpose:
      "NutriTail rules decide safety, exclusions, allergy conflicts, life-stage fit, and ranking.",
  },
  {
    phase: "golden_test_cases",
    status: "active",
    purpose:
      "Use dog/cat scenario banks to find weak points and turn failures into rules, prompt updates, or data fixes.",
  },
  {
    phase: "fine_tuning",
    status: "later",
    purpose:
      "Only for stable tone/format consistency after golden QA is mature; not for food ranking or medical decisions.",
  },
] as const;

export const NUTRITAIL_FINE_TUNING_NOT_NOW_REASONS = [
  "The food database and ranking rules are still improving.",
  "Nutrition correctness must stay deterministic and auditable.",
  "Fine-tuning would not reliably keep product facts current.",
  "Golden QA and retrieval give faster, safer improvement loops for this stage.",
] as const;
