import type { Pet } from "@/types/pet";

export type Advice = {
  title: string;
  description: string;
};

const WEIGHT_TERMS = ["obesity", "overweight", "weight", "παχ", "βάρος"];
const KIDNEY_TERMS = ["kidney", "renal", "ckd", "νεφρ"];
const URINARY_TERMS = ["urinary", "uti", "crystal", "struvite", "ουρο", "κατουρ"];
const GI_TERMS = [
  "vomit",
  "diarrhea",
  "diarrhoea",
  "stool",
  "gas",
  "digest",
  "γαστρ",
  "διαρ",
  "εμετ",
];
const ALLERGY_TERMS = ["allergy", "allergic", "itch", "skin", "ear", "αλλεργ"];

function hasTerm(values: string[] | undefined, terms: string[]) {
  const text = (values ?? []).join(" ").toLowerCase();

  return terms.some((term) => text.includes(term));
}

function pushAdvice(advice: Advice[], nextAdvice: Advice) {
  if (!advice.some((item) => item.title === nextAdvice.title)) {
    advice.push(nextAdvice);
  }
}

export function generateNutritionAdvice(pet: Pet): Advice[] {
  const advice: Advice[] = [];
  const healthIssues = pet.healthIssues ?? [];

  if (pet.age >= 7) {
    pushAdvice(advice, {
      title: "Senior Nutrition",
      description:
        "Older pets need monitoring for appetite, weight trend, muscle condition, and digestibility. Do not assume a light diet is best if the pet is losing weight.",
    });
  }

  if (hasTerm(healthIssues, WEIGHT_TERMS) || pet.neutered) {
    pushAdvice(advice, {
      title: "Weight Control",
      description:
        "Neutered or weight-prone pets often need calorie control, measured portions, and treat calories kept within the daily target.",
    });
  }

  if (hasTerm(healthIssues, KIDNEY_TERMS)) {
    pushAdvice(advice, {
      title: "Kidney Support",
      description:
        "Kidney cases should prioritize veterinary monitoring and confirmed phosphorus, sodium, appetite, hydration, and weight trends before choosing a food.",
    });
  }

  if (hasTerm(healthIssues, URINARY_TERMS)) {
    pushAdvice(advice, {
      title: "Urinary Caution",
      description:
        pet.species === "cat"
          ? "For cats, straining, repeated litter-box trips, pain, blood, or little/no urine can be urgent. Food advice should not delay veterinary care."
          : "Urinary diet choice should match the diagnosis and urine findings, not only one mineral value or a marketing claim.",
    });
  }

  if (hasTerm(healthIssues, GI_TERMS)) {
    pushAdvice(advice, {
      title: "Digestive Support",
      description:
        "Digestive signs usually need a slow transition, consistent feeding, and monitoring. Severe, persistent, or weight-loss-associated symptoms should be reviewed by a veterinarian.",
    });
  }

  if ((pet.allergies && pet.allergies.length > 0) || hasTerm(healthIssues, ALLERGY_TERMS)) {
    pushAdvice(advice, {
      title: "Food Allergies",
      description:
        "Suspected food allergy is best handled with exposure history and a structured elimination or hydrolysed-diet trial, not by guessing from symptoms alone.",
    });
  }

  if (pet.activityLevel === "high") {
    pushAdvice(advice, {
      title: "High Activity",
      description:
        "Highly active pets may require increased calories and protein levels.",
    });
  }

  return advice;
}
