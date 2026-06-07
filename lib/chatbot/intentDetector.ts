import type { ChatbotIntent } from "@/lib/chatbot/types";

const INTENT_PATTERNS: Array<{
  intent: ChatbotIntent;
  patterns: RegExp[];
}> = [
  {
    intent: "medical_red_flag",
    patterns: [
      /δεν\s+κατουρ/i,
      /δεν\s+ουρ/i,
      /no\s+urine/i,
      /can't\s+pee/i,
      /cannot\s+pee/i,
      /straining/i,
      /blood/i,
      /αιμα/i,
      /αίμα/i,
      /collapse/i,
      /κατερρευ/i,
      /not\s+eating/i,
      /δεν\s+τρω/i,
      /severe\s+pain/i,
    ],
  },
  {
    intent: "brand_comparison",
    patterns: [
      /\bvs\b/i,
      /versus/i,
      /compare/i,
      /σύγκρι/i,
      /συγκρι/i,
      /ή\s+.+\?/i,
      /royal\s+canin.+acana/i,
      /acana.+royal\s+canin/i,
    ],
  },
  {
    intent: "portion_size",
    patterns: [/πόσα\s+γραμ/i, /ποσα\s+γραμ/i, /grams/i, /how\s+much/i, /portion/i, /δοσολογ/i],
  },
  {
    intent: "food_transition",
    patterns: [/αλλαγ[ηή]\s+τροφ/i, /transition/i, /switch\s+food/i, /αλλαξω\s+τροφ/i],
  },
  {
    intent: "allergy",
    patterns: [/αλλεργ/i, /allerg/i, /κοτοπουλ/i, /kotopoulo/i, /chicken/i, /δεν\s+τρωει/i],
  },
  {
    intent: "sensitive_digestion",
    patterns: [
      /μαλακ[αά]\s+κακ/i,
      /διάρρο/i,
      /διαρρο/i,
      /sensitive\s+digestion/i,
      /sensitive\s+stomach/i,
      /τον\s+πειρ[αά]ζει/i,
      /gas/i,
      /κλαν/i,
      /vomit/i,
      /εμετ/i,
    ],
  },
  {
    intent: "pancreatitis",
    patterns: [/pancreatitis/i, /παγκρεα/i],
  },
  {
    intent: "renal",
    patterns: [/renal/i, /kidney/i, /ckd/i, /νεφρ/i],
  },
  {
    intent: "urinary",
    patterns: [/ουρολογ/i, /urinary/i, /struvite/i, /oxalate/i, /κρυσταλλ/i, /κατουρ/i],
  },
  {
    intent: "obesity",
    patterns: [/παχ[υύ]/i, /χοντρ/i, /obes/i, /overweight/i, /weight\s+loss/i, /αδυνατ/i],
  },
  {
    intent: "puppy_growth",
    patterns: [/κουτ[αά]β/i, /puppy/i, /junior/i, /μεγαλ[οό]σωμ/i, /large\s+breed\s+puppy/i],
  },
  {
    intent: "kitten_growth",
    patterns: [/γατ[αά]κι/i, /kitten/i],
  },
  {
    intent: "senior",
    patterns: [/senior/i, /ηλικιωμ/i, /7\+|8\+|10\+/i],
  },
  {
    intent: "active_working",
    patterns: [/working/i, /active/i, /hunting/i, /κυνηγ/i, /πολυ\s+ενεργ/i],
  },
  {
    intent: "treats",
    patterns: [/treat/i, /λιχουδι/i, /snack/i],
  },
  {
    intent: "supplements",
    patterns: [/supplement/i, /συμπληρωμ/i, /βιταμιν/i],
  },
  {
    intent: "sterilised",
    patterns: [/στειρωμ/i, /sterili[sz]ed/i, /neutered/i, /castrated/i],
  },
  {
    intent: "hairball",
    patterns: [/hairball/i, /τριχο/i],
  },
  {
    intent: "fussy_eater",
    patterns: [/fussy/i, /picky/i, /δυσκολ/i, /δεν\s+του\s+αρεσ/i, /δεν\s+τρωει/i],
  },
  {
    intent: "photo_grounding",
    patterns: [/photo/i, /φωτο/i, /label/i, /ετικετ/i, /συσκευασ/i],
  },
  {
    intent: "sales_checkout",
    patterns: [/αγορά/i, /αγορα/i, /buy/i, /checkout/i, /παρω\s+τωρα/i],
  },
  {
    intent: "ingredient_question",
    patterns: [/ingredient/i, /συστατικ/i, /composition/i, /αναλυτικ/i, /περιεχει/i],
  },
  {
    intent: "food_recommendation",
    patterns: [
      /τι\s+τροφ[ηή]\s+να\s+π[αά]ρω/i,
      /ποια\s+τροφ/i,
      /best\s+food/i,
      /recommend/i,
      /καλ[ηή]\s+τροφ/i,
      /οικονομικ/i,
      /premium/i,
    ],
  },
];

function normalizeMessage(message: string) {
  return message
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function detectUserIntent(message: string): ChatbotIntent {
  const text = normalizeMessage(message);

  if (!text) return "unclear_message";

  for (const candidate of INTENT_PATTERNS) {
    if (candidate.patterns.some((pattern) => pattern.test(text))) {
      return candidate.intent;
    }
  }

  return "unclear_message";
}
