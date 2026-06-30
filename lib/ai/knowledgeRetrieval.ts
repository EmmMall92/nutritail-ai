import {
  NUTRITAIL_KNOWLEDGE_SOURCE_POLICY,
  NUTRITAIL_KNOWLEDGE_SOURCES,
} from "@/lib/nutrition-v2/knowledgeSources";
import { nutrientProfiles } from "@/lib/food-intelligence/profiles";

export type ChatbotKnowledgeIntent =
  | "general"
  | "weight_control"
  | "sterilised"
  | "growth"
  | "senior"
  | "renal"
  | "urinary"
  | "sensitive_digestion"
  | "allergy"
  | "pancreatitis"
  | "active_working";

const INTENT_KNOWLEDGE_POINTS: Record<ChatbotKnowledgeIntent, string[]> = {
  general: [
    "Start with species, life stage, weight, activity, neuter status, health context, and preference constraints.",
    "Complete and appropriate food matters more than marketing language.",
  ],
  weight_control: [
    "Calorie target, measured portions, treat calories, protein support, and satiety/fiber signals matter.",
    "Do not let active/performance foods outrank calorie-aware options for sedentary or sterilised pets.",
  ],
  sterilised: [
    "Sterilised pets often need calorie awareness and measured portions, not automatic severe restriction.",
    "Prefer visible sterilised, light, or weight-aware positioning when the pet is low activity or weight-prone.",
  ],
  growth: [
    "Growth foods must match puppy/kitten needs.",
    "Large-breed puppies need careful calcium, phosphorus, and energy-density logic.",
    "DHA is useful context when it is published, but exact values must not be inferred.",
  ],
  senior: [
    "Senior pets need weight trend, appetite, muscle condition, chewing ability, and digestibility context.",
    "Do not assume light food is best if the senior pet is losing weight or has low appetite.",
  ],
  renal: [
    "Renal cases need veterinarian-directed diet selection and phosphorus-aware interpretation.",
    "Do not recommend high protein as a default advantage for renal disease.",
  ],
  urinary: [
    "Urinary recommendations depend on veterinary diagnosis, stone/crystal type, hydration, and mineral context.",
    "Male cat straining/no urine is an emergency and stops shopping mode.",
  ],
  sensitive_digestion: [
    "Digestive support should consider stool quality, vomiting, transition speed, fiber, and ingredient history.",
    "Persistent vomiting, diarrhea, blood, or weight loss needs veterinary guidance.",
  ],
  allergy: [
    "Suspected food allergy is not diagnosed by chat; elimination-trial or hydrolysed/novel-protein logic is veterinarian-guided.",
    "Declared excluded ingredients are hard constraints for food ranking.",
  ],
  pancreatitis: [
    "Pancreatitis or fat-sensitive history needs veterinarian guidance and careful fat control.",
    "High-fat foods should not be first picks for this history.",
  ],
  active_working: [
    "Working and highly active pets may need higher calorie density and protein context.",
    "This logic must not spill into low-activity, sterilised, or weight-loss contexts.",
  ],
};

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function buildNutritionKnowledgeContext(intents: ChatbotKnowledgeIntent[]) {
  const selectedIntents = unique(
    intents.length > 0 ? intents : ["general"]
  ) as ChatbotKnowledgeIntent[];
  const points = unique(
    selectedIntents.flatMap((intent) => INTENT_KNOWLEDGE_POINTS[intent])
  );
  const nutrients = nutrientProfiles
    .filter((profile) =>
      profile.useful_for.some((use) =>
        selectedIntents.some((intent) => use.includes(intent) || intent.includes(use))
      )
    )
    .slice(0, 8)
    .map((profile) => ({
      field: profile.field,
      role: profile.role,
      useful_for: profile.useful_for,
      cautions: profile.cautions,
    }));

  return {
    source_policy: NUTRITAIL_KNOWLEDGE_SOURCE_POLICY,
    source_priority: NUTRITAIL_KNOWLEDGE_SOURCES.map((source) => ({
      id: source.id,
      priority: source.priority,
      displayName: source.displayName,
    })),
    intents: selectedIntents,
    principles: points,
    nutrient_profiles: nutrients,
    guardrails: [
      "This context explains NutriTail rules; it does not authorize OpenAI to rank foods.",
      "Use concepts only. Do not copy source text.",
      "Exact nutrient values must come from Food V2 payload, not from knowledge context.",
      "Brand-level knowledge can explain positioning, but product comparisons must use retrieved Food V2 rows.",
      "If NutriTail did not resolve the exact formula, ask for a label/photo instead of filling gaps from model memory.",
    ],
  };
}

export function inferKnowledgeIntents(input: {
  goal?: string | null;
  petSummary?: {
    healthIssues?: string[];
    weightGoal?: string;
    neutered?: boolean;
    activityLevel?: string;
  };
}) {
  const text = [
    input.goal,
    input.petSummary?.weightGoal,
    input.petSummary?.activityLevel,
    ...(input.petSummary?.healthIssues ?? []),
  ]
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  const intents: ChatbotKnowledgeIntent[] = ["general"];

  if (input.goal === "sterilised" || input.petSummary?.neutered) intents.push("sterilised");
  if (
    input.goal === "weight_control" ||
    input.petSummary?.weightGoal === "loss" ||
    /weight|obesity|overweight|παχ|βαρ/.test(text)
  ) {
    intents.push("weight_control");
  }
  if (input.goal === "growth" || /puppy|kitten|growth|κουταβ|γατακ/.test(text)) {
    intents.push("growth");
  }
  if (input.goal === "senior" || /senior|mature|ηλικιω|γερ/.test(text)) {
    intents.push("senior");
  }
  if (input.goal === "renal" || /renal|kidney|νεφρ|ουρια|κρεατιν/.test(text)) {
    intents.push("renal");
  }
  if (input.goal === "urinary" || /urinary|struvite|oxalate|ουρο|στρουβ|οξαλ/.test(text)) {
    intents.push("urinary");
  }
  if (
    input.goal === "sensitive_digestion" ||
    /digest|gastro|diarr|vomit|stool|πεψ|διαρ|εμετ|κοπρ/.test(text)
  ) {
    intents.push("sensitive_digestion");
  }
  if (input.goal === "allergy" || /allerg|itch|skin|αλλεργ|φαγουρ|δερμ/.test(text)) {
    intents.push("allergy");
  }
  if (/pancrea|παγκρεα/.test(text)) intents.push("pancreatitis");
  if (
    input.petSummary?.activityLevel === "high" ||
    /active|working|agility|hunt|βουν|κυνηγ|εκπαιδ/.test(text)
  ) {
    intents.push("active_working");
  }

  return unique(intents) as ChatbotKnowledgeIntent[];
}
