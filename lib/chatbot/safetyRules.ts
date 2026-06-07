import type { ChatbotLocale, ChatbotPetContext } from "@/lib/chatbot/types";

export type ChatbotSafetyWarning = {
  code: string;
  severity: "hard_stop" | "warning" | "info";
  message: string;
};

const RED_FLAG_RULES: Array<{
  code: string;
  patterns: RegExp[];
  message: Record<ChatbotLocale, string>;
}> = [
  {
    code: "male_cat_no_urine",
    patterns: [/male\s+cat.*(no\s+urine|can't\s+pee|cannot\s+pee|straining)/i, /γατ.*δεν\s+κατουρ/i],
    message: {
      el: "Αν αρσενική γάτα ζορίζεται ή δεν κατουράει, αυτό μπορεί να είναι επείγον. Επικοινώνησε άμεσα με κτηνίατρο ή κλινική.",
      en: "If a male cat is straining or cannot urinate, this can be an emergency. Contact a veterinarian or emergency clinic now.",
    },
  },
  {
    code: "blood_seen",
    patterns: [/blood/i, /α[ιί]μα/i, /αιμα/i],
    message: {
      el: "Αίμα σε ούρα ή κόπρανα χρειάζεται κτηνιατρικό έλεγχο πριν μιλήσουμε για αλλαγή τροφής.",
      en: "Blood in urine or stool needs veterinary assessment before food changes.",
    },
  },
  {
    code: "persistent_vomiting",
    patterns: [/persistent\s+vomit/i, /vomiting\s+for/i, /συνεχ.*εμετ/i, /πολλ.*εμετ/i],
    message: {
      el: "Επίμονος εμετός δεν πρέπει να αντιμετωπιστεί μόνο με τροφή. Μίλα με κτηνίατρο.",
      en: "Persistent vomiting should not be managed by diet alone. Speak with a veterinarian.",
    },
  },
  {
    code: "not_eating",
    patterns: [/not\s+eating/i, /won't\s+eat/i, /δεν\s+τρ[ωώ]/i],
    message: {
      el: "Αν δεν τρώει, ειδικά γάτα, χρειάζεται γρήγορη κτηνιατρική καθοδήγηση.",
      en: "Not eating, especially in cats, needs prompt veterinary guidance.",
    },
  },
  {
    code: "collapse_or_severe_pain",
    patterns: [/collapse/i, /severe\s+abdominal\s+pain/i, /κατερρευ/i, /έντονο\s+πονο/i, /εντονο\s+πονο/i],
    message: {
      el: "Κατάρρευση ή έντονος πόνος είναι επείγον σημάδι. Πήγαινε σε κτηνίατρο άμεσα.",
      en: "Collapse or severe pain is an emergency sign. Seek veterinary care now.",
    },
  },
  {
    code: "severe_allergy",
    patterns: [/swollen\s+face/i, /difficulty\s+breathing/i, /severe\s+allergy/i, /πρησμ.*μουτρ/i, /δυσκολ.*αναπνο/i],
    message: {
      el: "Σοβαρή αλλεργική αντίδραση ή δυσκολία στην αναπνοή είναι επείγον περιστατικό.",
      en: "A severe allergic reaction or breathing difficulty is an emergency.",
    },
  },
];

const VET_REFERRAL_RULES: Array<{
  code: string;
  patterns: RegExp[];
  message: Record<ChatbotLocale, string>;
}> = [
  {
    code: "renal",
    patterns: [/renal/i, /kidney/i, /ckd/i, /νεφρ/i],
    message: {
      el: "Για νεφρικό περιστατικό, η επιλογή τροφής πρέπει να γίνει με κτηνίατρο και έλεγχο φωσφόρου.",
      en: "For renal disease, diet choice should be veterinarian-guided and phosphorus-aware.",
    },
  },
  {
    code: "pancreatitis",
    patterns: [/pancreatitis/i, /παγκρεα/i],
    message: {
      el: "Η παγκρεατίτιδα χρειάζεται κτηνιατρική καθοδήγηση και προσεκτικό έλεγχο λιπαρών.",
      en: "Pancreatitis needs veterinarian guidance and careful fat control.",
    },
  },
  {
    code: "diabetes",
    patterns: [/diabetes/i, /diabetic/i, /διαβητ/i],
    message: {
      el: "Ο διαβήτης χρειάζεται πρόγραμμα με κτηνίατρο, όχι απλή αλλαγή τροφής.",
      en: "Diabetes needs a veterinarian-guided plan, not a casual food switch.",
    },
  },
];

function textFrom(message: string, pet?: ChatbotPetContext | null) {
  return [
    message,
    pet?.species,
    pet?.vetDiagnosis,
    ...(pet?.healthIssues ?? []),
    ...(pet?.allergies ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

export function detectSafetyWarnings({
  message,
  pet,
  locale = "el",
}: {
  message: string;
  pet?: ChatbotPetContext | null;
  locale?: ChatbotLocale;
}): ChatbotSafetyWarning[] {
  const text = textFrom(message, pet);
  const warnings: ChatbotSafetyWarning[] = [];

  for (const rule of RED_FLAG_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      warnings.push({
        code: rule.code,
        severity: "hard_stop",
        message: rule.message[locale],
      });
    }
  }

  for (const rule of VET_REFERRAL_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      warnings.push({
        code: rule.code,
        severity: "warning",
        message: rule.message[locale],
      });
    }
  }

  if (warnings.length > 0) {
    warnings.push({
      code: "no_diagnosis_or_treatment",
      severity: "info",
      message:
        locale === "el"
          ? "Μπορώ να βοηθήσω με διατροφική καθοδήγηση, αλλά δεν κάνω διάγνωση ή θεραπεία."
          : "I can help with nutrition guidance, but I cannot diagnose or treat.",
    });
  }

  return warnings;
}

export function hasHardStop(warnings: ChatbotSafetyWarning[]) {
  return warnings.some((warning) => warning.severity === "hard_stop");
}
