import type { ChatbotLocale, ChatbotPetContext } from "@/lib/chatbot/types";

export type ChatbotSafetyWarning = {
  code: string;
  severity: "hard_stop" | "medical_handoff" | "warning" | "info";
  message: string;
};

type SafetyRule = {
  code: string;
  severity: "hard_stop" | "medical_handoff" | "warning";
  patterns: RegExp[];
  message: Record<ChatbotLocale, string>;
};

function normalizeSafetyText(value: string) {
  return value
    .toLocaleLowerCase("el-GR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function rx(pattern: string) {
  return new RegExp(pattern, "iu");
}

const englishNoUrineContext = rx(
  "(no\\s+urine|can(?:not|'?t)\\s+(?:pee|urinate)|unable\\s+to\\s+(?:pee|urinate)|not\\s+(?:peeing|urinating)|straining|blocked|urinary\\s+blockage)"
);

const greekPatterns = {
  catContext: rx("(γατ|γατο|γατα|γατος|γατουλα|γατακι|αρσενικος γατος|gat[ao]?s?|gata|gati|cat)"),
  noUrine: rx(
    "(δεν|δε).{0,20}(ουρησει|ουρει|ουρα|ουρ|κατουρησει|κατουρα|κατουρ|κανει\\s*τσισα|τσισ)|δεν\\s*βγαινουν\\s*(ουρα|τσισα)|προσπαθ.{0,35}(ουρησει|κατουρησει|κανει\\s*τσισα|ουρ|κατουρ|τσισ)|δυσκολ.{0,35}(ουρησει|κατουρησει|ουρ|κατουρ|τσισ)|\\bden\\b.{0,30}(mporei|borei|vgainei|vgazei|kanei).{0,35}(our|katour|tsis|pee)|prospath.{0,45}(our|katour|tsis|pee)|diskol.{0,45}(our|katour|tsis|pee)|αποφραξ|φραγμ|blocked|straining"
  ),
  blood: rx(
    "\\bαιμα\\b|αιματ\\w+|με\\s+αιμα|αιμα\\s+(στα|στα\\s+κοπρανα|στα\\s+ουρα)|κοπρανα\\s+με\\s+αιμα|ουρα\\s+με\\s+αιμα|\\baima\\b|oura\\s+me\\s+aima|koprana\\s+me\\s+aima|bloody|blood"
  ),
  persistentVomiting: rx(
    "(συνεχ|πολλ|επιμον|καθε|επαναλαμβαν).{0,45}εμετ|εμετ.{0,45}(συνεχ|πολλ|μερες|ωρες|φορες|persistent|repeated)|(synech|polla|epimon|kathe|epanalamvan).{0,45}emet|emet.{0,45}(synech|polla|meres|ores|fores|persistent|repeated)"
  ),
  notEatingUrgent: rx(
    "(δεν|δε)\\s+τρωει\\s+.{0,70}(καθολου|24|48|ωρ|ημερ|μερες|δυο\\s+μερες|2\\s+μερες)|\\bden\\b\\s+tr(o|w)ei\\s+.{0,70}(katholou|24|48|ores|imer|meres|dyo\\s+meres|2\\s+meres)|ανορεξ|χωρις\\s+ορεξη\\s+.{0,40}(24|48|ωρ|ημερ|μερες)|not\\s+eating\\s+(at\\s+all|for|24|48|\\d+\\s*(h|hr|hrs|hour|hours|day|days))"
  ),
  severePainOrCollapse: rx(
    "κατερρευ|καταρρευσ|collapse|collapsed|εντον\\w*\\s+.{0,25}πονο|ποναει\\s+πολυ|πονο\\w*\\s+.{0,25}κοιλι|διπλωνεται\\s+.{0,25}πονο|severe\\s+(abdominal\\s+)?pain"
  ),
  notDrinking: rx(
    "(δεν|δε)\\s+πινει\\s+.{0,35}(καθολου)|χωρις\\s+νερο|αφυδατ|not\\s+drinking(?!\\s+much)|dehydrat"
  ),
  lowWaterIntake: rx(
    "(δεν|δε)\\s+πινει\\s+.{0,35}(αρκετ|πολυ|νερο)|πινει\\s+λιγο\\s+νερο|low\\s+water\\s+intake|not\\s+drinking\\s+much"
  ),
  severeAllergy: rx(
    "πρηξ\\w*\\s+.{0,30}(μουτρ|προσωπ)|δυσκολ\\w*\\s+.{0,30}αναπν|πνιγ|σοβαρ\\w*\\s+.{0,30}αλλεργ|swollen\\s+face|difficulty\\s+breathing|severe\\s+allerg"
  ),
  renal: rx("νεφρ|ουρια|κρεατιν|ckd|iris|kidney|renal"),
  urinary: rx("ουρολογ|κυστιτ|λιθ|στρουβ|οξαλ|κρυσταλλ|flutd|urinary|cystitis|struvite|oxalate|crystal"),
  pancreatitis: rx("παγκρεατ|pancreatitis"),
  diabetes: rx("διαβητ|diabetes|diabetic"),
  hepatic: rx("ηπατ|συκωτ|liver|hepatic"),
  cardiac: rx("καρδιο|καρδιακ|καρδια|heart\\s+(disease|failure|condition)|cardiac"),
  medication: rx("φαρμακ|φαρμακευτικ[α-ω]*\\s+αγωγ|ινσουλιν|medication|medicine|insulin"),
  therapeuticDiet: rx(
    "θεραπευτικ[α-ω]*\\s+.{0,20}τροφ|κλινικ[α-ω]*\\s+.{0,20}τροφ|κτηνιατρικ[α-ω]*\\s+.{0,20}τροφ|διαιτα\\s+αποκλεισμου|veterinary\\s+diet|therapeutic\\s+diet|prescription\\s+diet|elimination\\s+diet"
  ),
  allergy: rx("αλλεργ|υδρολυ|allerg|hydroly"),
};

const negatedAllergyContext = new RegExp(
  [
    "(?:δεν|δε)\\s+(?:εχει|παρουσιαζει)\\s+(?:καμια\\s+)?(?:γνωστ[α-ω]*\\s+)?(?:τροφικ[α-ω]*\\s+)?αλλεργ[α-ω]*",
    "(?:δεν|δε)\\s+ειναι\\s+αλλεργ[α-ω]*",
    "χωρις\\s+(?:γνωστ[α-ω]*\\s+)?(?:τροφικ[α-ω]*\\s+)?αλλεργ[α-ω]*",
    "καμια\\s+(?:γνωστ[α-ω]*\\s+)?(?:τροφικ[α-ω]*\\s+)?αλλεργ[α-ω]*",
    "\\b(?:has\\s+|have\\s+|with\\s+)?no\\s+(?:known\\s+)?(?:food\\s+)?allerg\\w*",
    "\\bdoes\\s+not\\s+have\\s+(?:any\\s+)?(?:known\\s+)?(?:food\\s+)?allerg\\w*",
    "\\bnot\\s+allergic\\b",
  ].join("|"),
  "giu"
);

function withoutNegatedAllergyContext(value: string) {
  return value.replace(negatedAllergyContext, " ");
}

function hasPositiveAllergyContext(value: string) {
  return greekPatterns.allergy.test(withoutNegatedAllergyContext(value));
}

function isMeaningfulAllergyValue(value: unknown) {
  const normalized = normalizeSafetyText(String(value ?? ""));
  if (!normalized) return false;

  return withoutNegatedAllergyContext(normalized)
    .replace(/[\s.,;:!?/_-]+/g, "")
    .trim().length > 0;
}

const SAFETY_RULES: SafetyRule[] = [
  {
    code: "male_cat_no_urine",
    severity: "hard_stop",
    patterns: [
      /male\s+cat.*(no\s+urine|can't\s+pee|cannot\s+pee|straining|blocked)/iu,
      /cat.*(cannot\s+urinate|can't\s+urinate|blocked|urinary\s+blockage|no\s+urine)/iu,
      rx("(αρσενικ|γατος|γατα|γατ).{0,120}(δεν|δε|προσπαθ|δυσκολ|αποφραξ|φραγμ).{0,80}(ουρ|κατουρ|τσισ|blocked|straining)"),
      rx("(gatos|gata|gati|cat).{0,120}(den|de|prospath|diskol|blocked|straining).{0,80}(our|katour|tsis|pee|urine)"),
    ],
    message: {
      el: "Αν γάτα, ειδικά αρσενικός γάτος, ζορίζεται ή δεν μπορεί να ουρήσει, αυτό μπορεί να είναι επείγον. Μην περιμένεις αλλαγή τροφής. Επικοινώνησε άμεσα με κτηνίατρο ή εφημερεύουσα κλινική.",
      en: "If a cat, especially a male cat, is straining or cannot urinate, this can be an emergency. Do not wait on a food change. Contact a veterinarian or emergency clinic now.",
    },
  },
  {
    code: "blood_seen",
    severity: "hard_stop",
    patterns: [/blood/iu, greekPatterns.blood],
    message: {
      el: "Αίμα σε ούρα, διάρροια ή κόπρανα χρειάζεται κτηνιατρικό έλεγχο πριν μιλήσουμε για αλλαγή τροφής.",
      en: "Blood in urine, diarrhea, or stool needs veterinary assessment before food changes.",
    },
  },
  {
    code: "persistent_vomiting",
    severity: "hard_stop",
    patterns: [
      /persistent\s+vomit/iu,
      /repeated\s+vomit/iu,
      /vomiting\s+for/iu,
      greekPatterns.persistentVomiting,
    ],
    message: {
      el: "Συνεχείς ή επαναλαμβανόμενοι εμετοί δεν πρέπει να αντιμετωπίζονται μόνο με τροφή. Μίλα με κτηνίατρο πριν κάνεις διατροφική αλλαγή.",
      en: "Persistent vomiting should not be managed by diet alone. Speak with a veterinarian before changing food.",
    },
  },
  {
    code: "not_eating",
    severity: "hard_stop",
    patterns: [
      /not\s+eating(?:\s*$|\s+(?:at\s+all|anything|for|\d+\s*(?:h|hr|hrs|hour|hours|day|days)))/iu,
      /won't\s+eat/iu,
      /no\s+appetite/iu,
      greekPatterns.notEatingUrgent,
    ],
    message: {
      el: "Αν δεν τρώει, ειδικά αν είναι γάτα ή κρατάει πάνω από 24 ώρες, χρειάζεται γρήγορη κτηνιατρική καθοδήγηση πριν από οποιαδήποτε πρόταση τροφής.",
      en: "Not eating, especially in cats or for more than 24 hours, needs prompt veterinary guidance before food advice.",
    },
  },
  {
    code: "collapse_or_severe_pain",
    severity: "hard_stop",
    patterns: [
      /collapse/iu,
      /collapsed/iu,
      /severe\s+abdominal\s+pain/iu,
      /severe\s+pain/iu,
      greekPatterns.severePainOrCollapse,
    ],
    message: {
      el: "Κατάρρευση ή έντονος πόνος είναι επείγον σημάδι. Χρειάζεται άμεση κτηνιατρική εκτίμηση.",
      en: "Collapse or severe pain is an emergency sign. Seek veterinary care now.",
    },
  },
  {
    code: "not_drinking",
    severity: "hard_stop",
    patterns: [/not\s+drinking(?!\s+much)/iu, /no\s+water/iu, greekPatterns.notDrinking],
    message: {
      el: "Αν δεν πίνει καθόλου νερό ή δείχνει αφυδατωμένο, χρειάζεται κτηνιατρική εκτίμηση πριν από διατροφική σύσταση.",
      en: "If the pet is not drinking or seems dehydrated, veterinary assessment should come before food advice.",
    },
  },
  {
    code: "low_water_intake",
    severity: "warning",
    patterns: [greekPatterns.lowWaterIntake],
    message: {
      el: "Αν πίνει λιγότερο νερό από το συνηθισμένο, κράτα το υπό παρακολούθηση και μίλα με κτηνίατρο αν συνεχιστεί ή συνδυάζεται με αδιαθεσία. Η τροφή μπορεί να συζητηθεί, αλλά όχι σαν διάγνωση.",
      en: "If water intake is lower than usual, monitor it and speak with a veterinarian if it persists or comes with illness signs. Food can be discussed, but not as a diagnosis.",
    },
  },
  {
    code: "severe_allergy",
    severity: "hard_stop",
    patterns: [
      /swollen\s+face/iu,
      /difficulty\s+breathing/iu,
      /severe\s+allergy/iu,
      greekPatterns.severeAllergy,
    ],
    message: {
      el: "Πρήξιμο στο πρόσωπο ή δυσκολία στην αναπνοή μπορεί να είναι σοβαρή αλλεργική αντίδραση και χρειάζεται άμεση βοήθεια.",
      en: "Facial swelling or breathing difficulty can be a severe allergic reaction and needs urgent help.",
    },
  },
  {
    code: "renal",
    severity: "medical_handoff",
    patterns: [/renal/iu, /kidney/iu, /ckd/iu, greekPatterns.renal],
    message: {
      el: "Για νεφρική νόσο, η τροφή και η ποσότητα πρέπει να επιλέγονται από κτηνίατρο με βάση το στάδιο, τις εξετάσεις, την όρεξη και την πορεία βάρους.",
      en: "For renal disease, food and portion decisions need a veterinarian who can review disease stage, tests, appetite, and weight trend.",
    },
  },
  {
    code: "urinary_condition",
    severity: "medical_handoff",
    patterns: [greekPatterns.urinary],
    message: {
      el: "Ουρολογικό ιστορικό, κρύσταλλοι ή λίθοι χρειάζονται κτηνιατρική διάγνωση πριν επιλεγεί τροφή, επειδή διαφορετικές αιτίες απαιτούν διαφορετική διαχείριση.",
      en: "Urinary history, crystals, or stones need veterinary diagnosis before choosing food because different causes require different management.",
    },
  },
  {
    code: "pancreatitis",
    severity: "medical_handoff",
    patterns: [/pancreatitis/iu, greekPatterns.pancreatitis],
    message: {
      el: "Η παγκρεατίτιδα χρειάζεται κτηνιατρικά καθοδηγούμενη επιλογή τροφής και εξατομικευμένο έλεγχο λιπαρών.",
      en: "Pancreatitis needs veterinarian-directed food selection and an individual fat review.",
    },
  },
  {
    code: "diabetes",
    severity: "medical_handoff",
    patterns: [/diabetes/iu, /diabetic/iu, greekPatterns.diabetes],
    message: {
      el: "Ο διαβήτης χρειάζεται πρόγραμμα σίτισης που συντονίζεται με κτηνίατρο και με την αγωγή. Δεν είναι ασφαλής μια αυτόματη αλλαγή προϊόντος ή ποσότητας.",
      en: "Diabetes needs a feeding plan coordinated with a veterinarian and medication. An automatic product or portion change is not appropriate.",
    },
  },
  {
    code: "hepatic_condition",
    severity: "medical_handoff",
    patterns: [greekPatterns.hepatic],
    message: {
      el: "Ηπατική νόσος ή πρόβλημα στο συκώτι χρειάζεται κτηνιατρική αξιολόγηση πριν από επιλογή τροφής ή ποσότητας.",
      en: "Liver disease or a hepatic condition needs veterinary assessment before food or portion selection.",
    },
  },
  {
    code: "cardiac_condition",
    severity: "medical_handoff",
    patterns: [greekPatterns.cardiac],
    message: {
      el: "Καρδιολογική πάθηση χρειάζεται κτηνιατρική αξιολόγηση πριν από διατροφική αλλαγή, ιδιαίτερα για νάτριο, φάρμακα και συνολική πρόσληψη.",
      en: "A cardiac condition needs veterinary assessment before a diet change, especially for sodium, medication, and total intake.",
    },
  },
  {
    code: "medication_context",
    severity: "medical_handoff",
    patterns: [greekPatterns.medication],
    message: {
      el: "Όταν υπάρχει φαρμακευτική αγωγή, η αλλαγή τροφής ή ποσότητας πρέπει να ελεγχθεί από τον κτηνίατρο που παρακολουθεί το ζώο.",
      en: "When medication is involved, food or portion changes need review by the veterinarian treating the pet.",
    },
  },
  {
    code: "therapeutic_diet",
    severity: "medical_handoff",
    patterns: [greekPatterns.therapeuticDiet],
    message: {
      el: "Θεραπευτική, κλινική ή κτηνιατρική δίαιτα δεν αντικαθίσταται ούτε επιλέγεται αυτόματα χωρίς κτηνιατρική οδηγία.",
      en: "A therapeutic, clinical, or veterinary diet should not be selected or replaced automatically without veterinary direction.",
    },
  },
  {
    code: "allergy_context",
    severity: "medical_handoff",
    patterns: [greekPatterns.allergy],
    message: {
      el: "Υποψία ή δηλωμένη τροφική αλλεργία χρειάζεται κτηνιατρικά οργανωμένη διερεύνηση. Δεν θα τη μετατρέψω σε αυτόματη διάγνωση ή δίαιτα αποκλεισμού.",
      en: "A suspected or declared food allergy needs a veterinarian-led assessment. I will not turn it into an automatic diagnosis or elimination diet.",
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
  const text = normalizeSafetyText(textFrom(message, pet));
  const warnings: ChatbotSafetyWarning[] = [];

  for (const rule of SAFETY_RULES) {
    const matched = rule.patterns.some((pattern) => pattern.test(text));
    if (!matched) continue;

    if (rule.code === "male_cat_no_urine") {
      const catContext =
        greekPatterns.catContext.test(text) ||
        text.includes("cat") ||
        pet?.species === "cat";
      const noUrineContext =
        greekPatterns.noUrine.test(text) || englishNoUrineContext.test(text);
      if (!catContext || !noUrineContext) continue;
    }

    if (rule.code === "allergy_context" && !hasPositiveAllergyContext(text)) {
      continue;
    }

    warnings.push({
      code: rule.code,
      severity: rule.severity,
      message: rule.message[locale],
    });
  }

  if ((pet?.allergies ?? []).some(isMeaningfulAllergyValue)) {
    warnings.push({
      code: "allergy_context",
      severity: "medical_handoff",
      message:
        locale === "el"
          ? "Υποψία ή δηλωμένη τροφική αλλεργία χρειάζεται κτηνιατρικά οργανωμένη διερεύνηση. Δεν θα τη μετατρέψω σε αυτόματη διάγνωση ή δίαιτα αποκλεισμού."
          : "A suspected or declared food allergy needs a veterinarian-led assessment. I will not turn it into an automatic diagnosis or elimination diet.",
    });
  }

  if (warnings.length > 0) {
    warnings.push({
      code: "no_diagnosis_or_treatment",
      severity: "info",
      message:
        locale === "el"
          ? "Μπορώ να βοηθήσω με γενικές πληροφορίες επιλογής τροφής, αλλά δεν κάνω διάγνωση ή θεραπεία."
          : "I can help with general food-selection information, but I cannot diagnose or treat.",
    });
  }

  return dedupeWarnings(warnings);
}

function dedupeWarnings(warnings: ChatbotSafetyWarning[]) {
  const seen = new Set<string>();
  return warnings.filter((warning) => {
    if (seen.has(warning.code)) return false;
    seen.add(warning.code);
    return true;
  });
}

export function hasHardStop(warnings: ChatbotSafetyWarning[]) {
  return warnings.some((warning) => warning.severity === "hard_stop");
}

export function hasMedicalHandoff(warnings: ChatbotSafetyWarning[]) {
  return warnings.some((warning) => warning.severity === "medical_handoff");
}

export function blocksFoodRecommendations(warnings: ChatbotSafetyWarning[]) {
  return warnings.some(
    (warning) =>
      warning.severity === "hard_stop" || warning.severity === "medical_handoff"
  );
}

export function shouldInterruptForSafety(warnings: ChatbotSafetyWarning[]) {
  return warnings.some(
    (warning) =>
      warning.severity === "hard_stop" ||
      warning.severity === "medical_handoff" ||
      warning.severity === "warning"
  );
}

export function formatSafetyInterruptMessage(
  warnings: ChatbotSafetyWarning[],
  locale: ChatbotLocale = "el"
) {
  const hardStops = warnings.filter((warning) => warning.severity === "hard_stop");
  const medicalHandoffs = warnings.filter(
    (warning) => warning.severity === "medical_handoff"
  );
  const visibleWarnings =
    hardStops.length > 0
      ? hardStops
      : medicalHandoffs.length > 0
        ? medicalHandoffs
        : warnings.filter((warning) => warning.severity === "warning");
  const hasEmergency = hardStops.length > 0;
  const needsMedicalHandoff = !hasEmergency && medicalHandoffs.length > 0;
  const intro =
    locale === "el"
      ? hasEmergency
        ? "Πριν μιλήσουμε για τροφή, αυτό χρειάζεται άμεση προσοχή:"
        : needsMedicalHandoff
          ? "Πριν συνεχίσουμε σε επιλογή προϊόντος, χρειάζεται κτηνιατρική καθοδήγηση:"
          : "Πριν συνεχίσουμε σαν απλή επιλογή τροφής, κράτα αυτό:"
      : hasEmergency
        ? "Before we talk about food, this needs immediate attention:"
        : needsMedicalHandoff
          ? "Before product selection continues, veterinary guidance is needed:"
          : "Before we continue as a simple food-shopping flow, keep this in mind:";
  const outro =
    locale === "el"
      ? hasEmergency
        ? "Δεν θα σου εμφανίσω προτάσεις τροφών για αυτό το μήνυμα, γιατί πρώτα πρέπει να αποκλειστεί επείγον περιστατικό."
        : needsMedicalHandoff
          ? "Δεν θα εμφανίσω κατάταξη προϊόντων, θερμίδες ή γραμμάρια για αυτό το ιατρικό πλαίσιο. Πάρε μαζί σου το ιστορικό και την τωρινή ετικέτα τροφής στον κτηνίατρο."
          : "Μπορούμε να συνεχίσουμε με γενικές πληροφορίες, αλλά χωρίς να το παρουσιάσουμε ως διάγνωση ή θεραπεία."
      : hasEmergency
        ? "I will not show food recommendations for this message because an urgent issue should be ruled out first."
        : needsMedicalHandoff
          ? "I will not show product rankings, calories, or gram targets for this medical context. Take the history and current food label to the veterinarian."
          : "We can continue with general information, but not present it as diagnosis or treatment.";

  return [
    intro,
    "",
    ...visibleWarnings.map((warning) => `- ${warning.message}`),
    "",
    outro,
  ].join("\n");
}
