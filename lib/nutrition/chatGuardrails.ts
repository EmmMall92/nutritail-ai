export type ChatGuardrailInput = {
  species?: string | null;
  age?: number | null;
  weightGoal?: string | null;
  healthIssues?: string[] | null;
  allergies?: string[] | null;
};

export type ChatGuardrailResult = {
  safetyNotes: string[];
  followUpQuestions: string[];
  confidenceNotes: string[];
  hasUrgentSignal: boolean;
};

const URINARY_TERMS = [
  "urinary",
  "uti",
  "struvite",
  "crystal",
  "block",
  "blocked",
  "pee",
  "peeing",
  "urine",
  "ουρο",
  "κατουρ",
];

const KIDNEY_TERMS = ["kidney", "renal", "ckd", "νεφρ"];
const GI_TERMS = [
  "vomit",
  "vomiting",
  "diarrhea",
  "diarrhoea",
  "loose stool",
  "gas",
  "gi",
  "gastro",
  "εμετ",
  "διαρ",
];
const ALLERGY_TERMS = [
  "allergy",
  "allergic",
  "itch",
  "scratch",
  "skin",
  "ear",
  "hot spot",
  "αλλεργ",
  "φαγουρ",
  "ξυν",
];

function includesAnyTerm(values: string[] | null | undefined, terms: string[]) {
  const text = (values ?? []).join(" ").toLowerCase();

  return terms.some((term) => text.includes(term));
}

export function generateChatGuardrails(
  input: ChatGuardrailInput
): ChatGuardrailResult {
  const safetyNotes: string[] = [];
  const followUpQuestions: string[] = [];
  const confidenceNotes: string[] = [];
  let hasUrgentSignal = false;

  const healthIssues = input.healthIssues ?? [];
  const allergies = input.allergies ?? [];
  const species = String(input.species ?? "").toLowerCase();

  const hasUrinarySignal = includesAnyTerm(healthIssues, URINARY_TERMS);
  const hasKidneySignal = includesAnyTerm(healthIssues, KIDNEY_TERMS);
  const hasGiSignal = includesAnyTerm(healthIssues, GI_TERMS);
  const hasAllergySignal =
    includesAnyTerm(healthIssues, ALLERGY_TERMS) || allergies.length > 0;

  if (hasUrinarySignal) {
    if (species === "cat") {
      hasUrgentSignal = true;
      safetyNotes.push(
        "If this is a cat with repeated litter-box trips, straining, pain, blood, or little/no urine, treat it as urgent and contact a veterinarian now."
      );
    } else {
      safetyNotes.push(
        "For urinary concerns, diet choice should be matched to the exact diagnosis and urine findings, not only to magnesium or marketing claims."
      );
    }

    followUpQuestions.push(
      "Has a veterinarian confirmed the urinary issue and recommended a specific diet type?"
    );
  }

  if (hasKidneySignal) {
    safetyNotes.push(
      "For kidney or renal disease, food choice should be guided by veterinary monitoring, especially phosphorus level, appetite, weight trend, and hydration."
    );
    confidenceNotes.push(
      "I will avoid treating high protein as automatically better when kidney issues are mentioned."
    );
  }

  if (hasGiSignal) {
    safetyNotes.push(
      "For vomiting, diarrhea, or strong digestive discomfort, switch foods slowly and speak with a veterinarian if symptoms are severe, persistent, or paired with weight loss."
    );
    followUpQuestions.push(
      "How long have the digestive symptoms been happening, and did they start after a food change?"
    );
  }

  if (hasAllergySignal) {
    safetyNotes.push(
      "For suspected food allergy, ingredient history matters; an elimination trial or hydrolysed diet plan is more reliable than guessing from one symptom."
    );
    confidenceNotes.push(
      "I can flag possible ingredient exposures, but I should not diagnose allergy from chat alone."
    );
  }

  if (input.weightGoal === "loss") {
    confidenceNotes.push(
      "For weight loss, calorie control and treat calories matter as much as the formula choice."
    );
  }

  return {
    safetyNotes: [...new Set(safetyNotes)],
    followUpQuestions: [...new Set(followUpQuestions)].slice(0, 2),
    confidenceNotes: [...new Set(confidenceNotes)],
    hasUrgentSignal,
  };
}

export function formatChatGuardrails(result: ChatGuardrailResult) {
  const sections: string[] = [];

  if (result.safetyNotes.length > 0) {
    sections.push(
      `Safety notes:\n${result.safetyNotes.map((item) => `- ${item}`).join("\n")}`
    );
  }

  if (result.confidenceNotes.length > 0) {
    sections.push(
      `Confidence notes:\n${result.confidenceNotes
        .map((item) => `- ${item}`)
        .join("\n")}`
    );
  }

  if (result.followUpQuestions.length > 0) {
    sections.push(
      `Useful follow-up questions:\n${result.followUpQuestions
        .map((item) => `- ${item}`)
        .join("\n")}`
    );
  }

  return sections.join("\n\n");
}
