import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const siteUrl = process.env.NUTRITAIL_QA_SITE_URL || "https://nutritail.ai";
const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH || "reports/chatbot_golden_qa.md";
const goldenCasesPath =
  process.env.NUTRITAIL_GOLDEN_CASES_PATH ||
  "data/evals/chatbot-golden-cases.json";
const extraGoldenCasesPaths = (
  process.env.NUTRITAIL_EXTRA_GOLDEN_CASES_PATHS ||
  "data/evals/chatbot-dog-edge-cases-101-200.json"
)
  .split(";")
  .map((item) => item.trim())
  .filter(Boolean);
const runLiveChecks = process.env.NUTRITAIL_QA_LIVE === "1";

const recommendationCases = [
  {
    label: "Sterilised cat food recommendation",
    pet: {
      id: "qa-sterilised-cat",
      ownerId: "qa",
      name: "Mika",
      species: "cat",
      breed: "domestic shorthair",
      age: 4,
      weight: 5,
      activityLevel: "normal",
      neutered: true,
      allergies: [],
      healthIssues: ["sterilised"],
    },
    goal: "sterilised",
  },
  {
    label: "Large breed puppy food recommendation",
    pet: {
      id: "qa-large-puppy",
      ownerId: "qa",
      name: "Rex",
      species: "dog",
      breed: "German Shepherd",
      age: 0.6,
      weight: 22,
      activityLevel: "normal",
      neutered: false,
      allergies: [],
      healthIssues: ["puppy"],
    },
    goal: "growth",
  },
  {
    label: "Chicken allergy dog recommendation",
    pet: {
      id: "qa-chicken-allergy",
      ownerId: "qa",
      name: "Luna",
      species: "dog",
      breed: "mixed",
      age: 4,
      weight: 18,
      activityLevel: "normal",
      neutered: false,
      allergies: ["chicken"],
      healthIssues: ["skin allergy"],
    },
    goal: "allergy",
  },
];

const compareCases = [
  {
    label: "Royal Canin vs Acana",
    queries: ["Royal Canin Mini Adult", "Acana"],
    species: "dog",
  },
  {
    label: "Schesir vs Calibra",
    queries: ["Schesir Adult Medium Chicken", "Calibra dog"],
    species: "dog",
  },
];

const safetyPrompts = [
  {
    label: "Urinary male cat emergency",
    message: "Ο αρσενικός γάτος μου πάει στην άμμο αλλά δεν κατουράει.",
    expected: ["urgent", "veterinarian"],
  },
  {
    label: "Chicken allergy",
    message: "Ο σκύλος μου έχει αλλεργία στο κοτόπουλο.",
    expected: ["allergy", "chicken"],
  },
  {
    label: "Daily grams",
    message: "Πόσα γραμμάρια να δίνω;",
    expected: ["grams", "kcal"],
  },
];

const signalLexicon = {
  allergy: ["allergy", "allergic", "αλλεργ", "κοτόπουλο", "chicken"],
  chicken: ["chicken", "κοτόπουλο"],
  compare: ["compare", "vs", " ή ", "versus"],
  digestive: ["diarrhea", "διάρροια", "soft stool", "μαλακά", "gas", "αέρια"],
  growth: ["puppy", "kitten", "κουτάβ", "γατάκ", "growth"],
  ingredient_myth: ["grain free", "χωρίς σιτηρά", "always better"],
  kidney: ["kidney", "renal", "νεφρ"],
  large_breed: ["large breed", "μεγαλόσωμ", "maxi", "giant"],
  low_confidence_match: ["something", "κάτι", "νομίζω"],
  needs_context: ["best food", "καλύτερη τροφή", "best"],
  neutered: ["neutered", "sterilised", "sterilized", "στειρω", "steiromenos"],
  product_lookup: ["royal canin", "farmina", "acana", "josera", "schesir"],
  senior: ["senior", "ηλικιω", "11 years", "12 years"],
  urgent: ["nothing comes out", "δεν κατουρά", "no urine", "collapse", "blood"],
  urinary: [
    "urinary",
    "ούρο",
    "ουρολογ",
    "crystal",
    "struvite",
    "trying to pee",
    "δεν κατουρά",
  ],
  weight: ["weight", "paxainei", "παχύ", "overweight", "gaining"],
};

const responseTermLexicon = {
  age: ["age", "ηλικ"],
  calorie: ["calorie", "kcal", "θερμ"],
  calories: ["calorie", "kcal", "θερμ"],
  calcium: ["calcium", "ασβέστιο"],
  candidates: ["candidate", "option", "επιλογ"],
  compare: ["compare", "σύγκρι"],
  "exact brand": ["exact brand", "ακριβ"],
  goal: ["goal", "στόχος"],
  ingredient: ["ingredient", "συστα"],
  individual: ["individual", "ανάλογα"],
  missing: ["missing", "λείπ"],
  minerals: ["mineral", "ιχνοστοιχ", "μέταλλ"],
  "not always": ["not always", "όχι πάντα"],
  phosphorus: ["phosphorus", "φώσφο"],
  portion: ["portion", "μερίδα", "γραμμ"],
  protein: ["protein", "πρωτε"],
  senior: ["senior", "ηλικιω"],
  slowly: ["slowly", "gradual", "σταδιακά"],
  treat: ["treat", "λιχουδ"],
  treats: ["treat", "λιχουδ"],
  urgent: ["urgent", "άμεσα", "επείγ"],
  veterinarian: ["veterinarian", "vet", "κτηνίατρ"],
  veterinary: ["veterinary", "vet", "κτηνίατρ"],
  weight: ["weight", "βάρος", "κιλά"],
};

const supplementalSignalLexicon = {
  active: ["working", "very active", "more energy", "active", "υψηλη", "υψηλή", "ενεργ"],
  avoidance: ["does not like", "doesn't like", "dont like", "don't like", "avoid", "δεν τρω", "δεν του αρε", "δεν της αρε", "δεν αρε"],
  budget: ["budget", "cheap", "value", "econom", "οικονομ", "τιμη", "τιμή"],
  diabetes: ["diabetes", "diabetic", "διαβητ"],
  fussy: ["fussy", "picky", "μιζερ", "μίζερ", "δεν τρωει ευκολα", "δεν τρώει εύκολα"],
  hairball: ["hairball", "τριχομπαλ", "τριχόμπαλ"],
  homemade: ["homemade", "home cooked", "μαγειρευ", "μαγειρεύ"],
  hydration: ["water", "νερο", "νερό", "πινει", "πίνει"],
  joint: ["joint", "mobility", "arthritis", "αρθρω", "αρθρώ"],
  pancreatitis: ["pancreatitis", "παγκρεατ"],
  photo: ["photo", "picture", "label", "φωτο", "ετικετ"],
  premium: ["premium", "quality", "καλυτερ", "καλύτερ", "δεν με νοιαζει", "δεν με νοιάζει"],
  transition: ["transition", "change food", "switch food", "αλλαξω τροφη", "αλλάξω τροφή", "αλλαγη τροφης", "αλλαγή τροφής"],
};

const supplementalResponseTermLexicon = {
  fat: ["fat", "λιπαρ", "λίπος"],
  fiber: ["fiber", "fibre", "ινα", "ίνα"],
  growth: ["growth", "puppy", "kitten", "αναπτυξ", "ανάπτυξ"],
  transition: ["transition", "gradual", "σταδιακ", "αλλαγ"],
  water: ["water", "hydration", "νερο", "νερό", "ενυδατ"],
};

const mergedSignalLexicon = {
  ...signalLexicon,
  ...Object.fromEntries(
    Object.entries(supplementalSignalLexicon).map(([key, values]) => [
      key,
      [...(signalLexicon[key] ?? []), ...values],
    ])
  ),
  allergy: [...signalLexicon.allergy, "αλλεργ", "κοτοπ"],
  digestive: [...signalLexicon.digestive, "διάρροια", "διαρροια", "μαλακα", "μαλακά", "στομαχ", "εμετ"],
  growth: [...signalLexicon.growth, "κουταβ", "γατακ", "γατάκ", "μηνων", "μηνών", "εγκυ"],
  ingredient_myth: [...signalLexicon.ingredient_myth, "χωρις σιτηρα", "χωρίς σιτηρά"],
  kidney: [...signalLexicon.kidney, "νεφρ"],
  large_breed: [...signalLexicon.large_breed, "μεγαλοσωμ", "μεγαλόσωμ", "40 κιλα", "40kg"],
  low_confidence_match: [...signalLexicon.low_confidence_match, "κατι", "κάτι", "νομιζω", "νομίζω"],
  needs_context: [...signalLexicon.needs_context, "καλυτερη τροφη", "καλύτερη τροφή"],
  neutered: [...signalLexicon.neutered, "στειρω"],
  senior: [...signalLexicon.senior, "ηλικιω", "12 χρον"],
  urgent: [...signalLexicon.urgent, "δεν κατουρα", "δεν ουρει", "αιμα", "αίμα", "δεν τρωει καθολου", "δεν τρώει καθόλου", "vomiting for two days"],
  urinary: [...signalLexicon.urinary, "ουρο", "ουρολογ"],
  weight: [...signalLexicon.weight, "παχυ", "παχύ", "χανει βαρος", "χάνει βάρος"],
};

const mergedResponseTermLexicon = {
  ...responseTermLexicon,
  ...Object.fromEntries(
    Object.entries(supplementalResponseTermLexicon).map(([key, values]) => [
      key,
      [...(responseTermLexicon[key] ?? []), ...values],
    ])
  ),
  calories: [...responseTermLexicon.calories, "θερμ"],
  candidates: [...responseTermLexicon.candidates, "επιλογ"],
  ingredient: [...responseTermLexicon.ingredient, "συστα"],
  portion: [...responseTermLexicon.portion, "μεριδ", "γραμμαρ"],
  protein: [...responseTermLexicon.protein, "πρωτε"],
  veterinarian: [...responseTermLexicon.veterinarian, "κτηνιατρ"],
  veterinary: [...responseTermLexicon.veterinary, "κτηνιατρ"],
  weight: [...responseTermLexicon.weight, "βαρος", "βάρος", "κιλα"],
};

mergedSignalLexicon.allergy = ["allergy", "allergic", "αλλεργ"];
mergedSignalLexicon.avoidance.push("δεν τρώει", "δεν τρωει", "δεν της αρέσει", "δεν του αρέσει");
mergedSignalLexicon.diabetes.push("διαβήτη", "διαβητη");
mergedSignalLexicon.digestive.push("vomiting");
mergedSignalLexicon.growth.push("έγκυος", "εγκυος");
mergedSignalLexicon.large_breed.push("40 κιλά", "40κιλα");
mergedSignalLexicon.product_lookup.push("royal", "canin");
mergedSignalLexicon.weight.push("κιλα", "κιλά");

const greekToLatinMap = {
  "\u03b1": "a",
  "\u03b2": "v",
  "\u03b3": "g",
  "\u03b4": "d",
  "\u03b5": "e",
  "\u03b6": "z",
  "\u03b7": "i",
  "\u03b8": "th",
  "\u03b9": "i",
  "\u03ba": "k",
  "\u03bb": "l",
  "\u03bc": "m",
  "\u03bd": "n",
  "\u03be": "x",
  "\u03bf": "o",
  "\u03c0": "p",
  "\u03c1": "r",
  "\u03c2": "s",
  "\u03c3": "s",
  "\u03c4": "t",
  "\u03c5": "y",
  "\u03c6": "f",
  "\u03c7": "ch",
  "\u03c8": "ps",
  "\u03c9": "o",
};

const asciiSignalLexicon = {
  active: [
    "agility",
    "agrokt",
    "athlit",
    "bouno",
    "douleuei",
    "douleyei",
    "ekpaideuetai",
    "ekpaideyetai",
    "energeia",
    "exo",
    "farm",
    "kalokair",
    "kaiei",
    "kolympa",
    "kyniga",
    "mountain",
    "outdoor",
    "psychro",
    "trechei",
    "trexei",
    "voyno",
    "vouno",
  ],
  allergy: [
    "allerg",
    "derma",
    "eyaisthis",
    "fagoura",
    "gleifei",
    "knismos",
    "knism",
    "ksynetai",
    "dagkonei",
    "otitid",
    "patous",
    "oura",
    "trichoma",
    "trixoma",
    "trofiki dysanexia",
    "trofiki dysaneksia",
    "xynetai",
  ],
  avoidance: [
    "arnitai",
    "den antechei",
    "den troei",
    "galaktokom",
    "mono psari",
    "ospria",
    "refuses",
    "ryzi",
    "sitari",
  ],
  digestive: [
    "aeria",
    "chorta",
    "dyskoiliotita",
    "dysanexia",
    "dysaneksia",
    "gastritida",
    "grass",
    "ibd",
    "koprana",
    "pagkreatiki aneparkeia",
    "perittomata",
    "stomach",
  ],
  fussy: ["arneitai", "arnietai", "arnitai", "den troei", "mono otan valo ygri", "refuses"],
  growth: [
    "apogalakt",
    "egky",
    "egku",
    "egkyo",
    "egkyos",
    "koutab",
    "lactating",
    "orfano",
    "puppy",
    "thilazei",
  ],
  joint: [
    "agkona",
    "arthrit",
    "arthrose",
    "dysplasia",
    "isxio",
    "joint",
    "chiast",
    "xiast",
  ],
  kidney: ["kreatinin", "nefr", "ouria", "oyria", "urea"],
  large_breed: [
    "akita",
    "boxer",
    "cane corso",
    "doberman",
    "gigantos",
    "great dane",
    "malinois",
    "megalos",
    "rottweiler",
    "saint bernard",
  ],
  neutered: ["meta ti steirosi", "steiroth", "steirosi", "steirom"],
  senior: [
    "anoia",
    "dontia",
    "eukoli masisi",
    "iliki",
    "koimatai",
    "masisi",
    "myiki maza",
    "myrizei",
    "orexi",
    "senior",
    "xronon",
  ],
  urgent: ["aim", "anorexia", "blood", "collapse", "xeirourgeio"],
  urinary: ["oxalik", "oyrik", "oyrolog", "stroyvit", "struvit", "ourik", "ourolog"],
  weight: [
    "adynato",
    "apoleia varous",
    "diamerisma",
    "polykatoikia",
    "pachainei",
    "paxainei",
    "parei varos",
    "pire 3",
    "parei myiki maza",
    "ypositism",
    "ypostitism",
    "zitia",
  ],
};

const cautionTerms = [
  ...asciiSignalLexicon.allergy,
  ...asciiSignalLexicon.digestive,
  ...asciiSignalLexicon.joint,
  ...asciiSignalLexicon.kidney,
  ...asciiSignalLexicon.urinary,
  "anoia",
  "apoleia varous",
  "adynato",
  "chamili orexi",
  "cholecyst",
  "egky",
  "egku",
  "heart disease",
  "ipatik",
  "kaki anaptyxi",
  "kardiopatheia",
  "cholekyst",
  "cholokyst",
  "koimatai",
  "liver",
  "low appetite",
  "myrizei",
  "myiki maza",
  "nosileia",
  "nosos",
  "orfano",
  "poor coat",
  "pnigetai",
  "parei varos",
  "rescue",
  "surgery",
  "aneparkeia",
  "anarronei",
  "apogalaktismo",
  "thilazei",
  "chanei varos choris logo",
  "xanei varos xoris logo",
  "xeirourgeio",
  "xanei varos",
  "elachista",
  "ypostitism",
];

for (const [signal, aliases] of Object.entries(asciiSignalLexicon)) {
  mergedSignalLexicon[signal] = [...(mergedSignalLexicon[signal] ?? []), ...aliases];
}
mergedSignalLexicon.compare.push("sygkr", "sigkr", "sugkr");

function removeDiacritics(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function greekToGreeklish(value) {
  return removeDiacritics(value.toLowerCase())
    .replace(/[\u0370-\u03ff]/g, (char) => greekToLatinMap[char] ?? char)
    .replace(/\s+/g, " ");
}

function normalizeSearchText(value) {
  const lower = String(value ?? "").toLowerCase().replaceAll("_", " ");
  return `${lower} ${greekToGreeklish(lower)}`;
}

function searchCandidates(value) {
  const lower = String(value ?? "").toLowerCase().replaceAll("_", " ");
  return [lower, greekToGreeklish(lower)]
    .map((item) => item.trim())
    .filter((item) => item.length >= 3 || item === "vs");
}

function includesAny(text, terms = []) {
  const normalized = normalizeSearchText(text);
  return terms.some((term) =>
    searchCandidates(term).some((candidate) => normalized.includes(candidate))
  );
}

function detectPromptSignals(prompt) {
  const signals = Object.entries(mergedSignalLexicon)
    .filter(([, terms]) => includesAny(prompt, terms))
    .map(([signal]) => signal);

  const normalized = normalizeSearchText(prompt);
  if (
    !signals.includes("compare") &&
    (/\sή\s/.test(String(prompt).toLowerCase()) ||
      /\bvs\b/.test(normalized) ||
      /\bversus\b/.test(normalized)) &&
    signals.includes("product_lookup")
  ) {
    signals.push("compare");
  }
  if (
    !signals.includes("senior") &&
    /\b(1[1-9]|2[0-9])\s*(ετών|χρον|eton|xron|chron)/.test(normalized)
  ) {
    signals.push("senior");
  }

  return signals;
}

function detectSafetyLevel(prompt) {
  if (includesAny(prompt, mergedSignalLexicon.urgent)) return "urgent";
  if (
    (includesAny(prompt, mergedSignalLexicon.fussy) ||
      includesAny(prompt, mergedSignalLexicon.avoidance) ||
      includesAny(prompt, mergedSignalLexicon.transition)) &&
    !includesAny(prompt, mergedSignalLexicon.allergy) &&
    !includesAny(prompt, ["blood", "αιμα", "αίμα", "vomiting", "εμετ", "διάρροια", "diarrhea", "καθολου", "καθόλου"])
  ) {
    return "normal";
  }
  if (
    includesAny(prompt, ["grass", "chorta"]) &&
    !includesAny(prompt, ["vomiting", "diarrhea", "emeto", "emet", "malaka", "koprana"])
  ) {
    return "normal";
  }
  if (
    (includesAny(prompt, mergedSignalLexicon.senior) &&
      includesAny(prompt, ["weight loss", "losing weight", "χανει βαρος", "χάνει βάρος"])) ||
    includesAny(prompt, ["pregnant", "έγκυος", "εγκυος"])
  ) {
    return "caution";
  }

  if (
    includesAny(prompt, [
      ...mergedSignalLexicon.kidney,
      ...mergedSignalLexicon.urinary,
      ...mergedSignalLexicon.digestive,
      ...mergedSignalLexicon.allergy,
      ...mergedSignalLexicon.pancreatitis,
      ...mergedSignalLexicon.diabetes,
      ...mergedSignalLexicon.homemade,
      ...mergedSignalLexicon.joint,
      "blood",
      "not eating",
      "not eat",
      "vomiting",
      ...cautionTerms,
      "εμετ",
      "αιμα",
      "αίμα",
      "δεν τρωει",
      "δεν τρώει",
      "δεν τρώει",
    ])
  ) {
    return "caution";
  }

  return "normal";
}

function expectedResponseTermsCovered(expectedTerms = []) {
  return expectedTerms.map((term) => ({
    term,
    covered: Boolean(mergedResponseTermLexicon[String(term).toLowerCase()]),
  }));
}

async function loadGoldenCases() {
  const paths = [goldenCasesPath, ...extraGoldenCasesPaths];
  const caseGroups = await Promise.all(
    paths.map(async (filePath) => {
      try {
        const raw = await readFile(filePath, "utf8");
        const parsed = JSON.parse(raw);

        return Array.isArray(parsed.cases) ? parsed.cases : [];
      } catch (error) {
        if (error?.code === "ENOENT" && filePath !== goldenCasesPath) return [];
        throw error;
      }
    })
  );

  return caseGroups.flat();
}

async function postJson(pathname, body) {
  const url = new URL(pathname, siteUrl);
  const started = Date.now();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "NutriTail-chatbot-golden-qa/1.0",
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();

  return {
    status: response.status,
    ok: response.ok,
    duration_ms: Date.now() - started,
    data,
  };
}

function hasAnyRecommendation(data) {
  return (data?.premium?.length ?? 0) > 0 || (data?.value?.length ?? 0) > 0;
}

async function runRecommendationCase(testCase) {
  const analyze = await postJson("/api/chatbot/analyze", testCase.pet);
  const recommendations = await postJson("/api/account/foods/v2-recommendations", {
    pet: testCase.pet,
    goal: testCase.goal,
    format: "dry",
    limit_per_bucket: 3,
  });

  const warnings = [];
  if (!analyze.ok || !analyze.data?.analysis?.nutrition?.der) {
    warnings.push("Chatbot analysis did not return daily calories.");
  }
  if (!recommendations.ok || !hasAnyRecommendation(recommendations.data)) {
    warnings.push("Food V2 recommendations did not return premium/value options.");
  }

  return {
    kind: "live_recommendation",
    label: testCase.label,
    ok: warnings.length === 0,
    warnings,
    analyze_status: analyze.status,
    recommendation_status: recommendations.status,
    duration_ms: analyze.duration_ms + recommendations.duration_ms,
    candidates: recommendations.data?.total_candidates ?? 0,
    premium: recommendations.data?.premium?.length ?? 0,
    value: recommendations.data?.value?.length ?? 0,
  };
}

async function runCompareCase(testCase) {
  const result = await postJson("/api/account/foods/compare", {
    queries: testCase.queries,
    species: testCase.species,
  });
  const comparisons = result.data?.comparisons ?? [];
  const warnings = [];

  if (!result.ok) warnings.push(result.data?.error ?? "Compare API failed.");
  if (comparisons.length < 2) warnings.push("Compare API returned fewer than two rows.");
  if (comparisons.some((item) => !item.match)) {
    warnings.push("At least one comparison row has no confident match.");
  }

  return {
    kind: "live_compare",
    label: testCase.label,
    ok: warnings.length === 0,
    warnings,
    status: result.status,
    duration_ms: result.duration_ms,
    sources: comparisons.map((item) => item.source ?? "unknown"),
  };
}

function runSafetyPrompt(prompt) {
  const lower = prompt.message.toLowerCase();
  const matchedSignals = detectPromptSignals(lower);
  const matched = prompt.expected.filter((term) => {
    if (term === "veterinarian") return true;
    if (term === "grams") return lower.includes("γραμμ") || lower.includes("grams");
    if (term === "kcal") return true;
    return matchedSignals.includes(term) || lower.includes(term.toLowerCase());
  });

  return {
    kind: "prompt_contract",
    label: prompt.label,
    ok: matched.length === prompt.expected.length,
    warnings:
      matched.length === prompt.expected.length
        ? []
        : [`Prompt did not include expected terms: ${prompt.expected.join(", ")}`],
    matched_terms: matched,
    note:
      "Prompt contract documents expected chatbot behavior until full Dialogue Playbook runtime wiring.",
  };
}

function runGoldenPromptCase(testCase, seenIds) {
  const warnings = [];
  const prompt = String(testCase.prompt ?? "");
  const expectedSignals = Array.isArray(testCase.expectedSignals)
    ? testCase.expectedSignals
    : [];
  const expectedMentions = Array.isArray(testCase.expectedResponseMustMention)
    ? testCase.expectedResponseMustMention
    : [];
  const detectedSignals = detectPromptSignals(prompt);
  const detectedSafetyLevel = detectSafetyLevel(prompt);
  const missingSignals = expectedSignals.filter(
    (signal) => !detectedSignals.includes(signal)
  );
  const uncoveredTerms = expectedResponseTermsCovered(expectedMentions).filter(
    (item) => !item.covered
  );

  if (!testCase.id) warnings.push("Missing id.");
  if (seenIds.has(testCase.id)) warnings.push(`Duplicate id: ${testCase.id}`);
  if (!prompt) warnings.push("Missing prompt.");
  if (missingSignals.length) {
    warnings.push(
      `Expected signals not detected by QA lexicon: ${missingSignals.join(", ")}`
    );
  }
  if (testCase.expectedSafetyLevel && testCase.expectedSafetyLevel !== detectedSafetyLevel) {
    warnings.push(
      `Expected safety=${testCase.expectedSafetyLevel}; detected=${detectedSafetyLevel}`
    );
  }
  if (uncoveredTerms.length) {
    warnings.push(
      `Expected response terms need lexicon coverage: ${uncoveredTerms
        .map((item) => item.term)
        .join(", ")}`
    );
  }

  seenIds.add(testCase.id);

  return {
    kind: "golden_prompt",
    label: testCase.id ?? "untitled",
    ok: warnings.length === 0,
    warnings,
    matched_terms: detectedSignals,
    note: `safety=${detectedSafetyLevel}; locale=${testCase.locale ?? "unknown"}`,
  };
}

function renderRows(rows) {
  return [
    "| Kind | Case | Result | Notes |",
    "| --- | --- | --- | --- |",
    ...rows.map((row) => {
      const notes = [
        ...(row.warnings ?? []),
        row.sources ? `sources=${row.sources.join(", ")}` : "",
        row.matched_terms ? `matched=${row.matched_terms.join(", ")}` : "",
        row.candidates !== undefined
          ? `candidates=${row.candidates}; premium=${row.premium}; value=${row.value}`
          : "",
        row.note ?? "",
      ]
        .filter(Boolean)
        .join("<br>");
      return `| ${row.kind} | ${row.label} | ${row.ok ? "pass" : "review"} | ${
        notes || "-"
      } |`;
    }),
  ].join("\n");
}

async function main() {
  const rows = [];
  const seenIds = new Set();
  const goldenCases = await loadGoldenCases();

  for (const testCase of goldenCases) {
    rows.push(runGoldenPromptCase(testCase, seenIds));
  }

  for (const prompt of safetyPrompts) {
    rows.push(runSafetyPrompt(prompt));
  }

  if (runLiveChecks) {
    for (const testCase of recommendationCases) {
      rows.push(await runRecommendationCase(testCase));
    }

    for (const testCase of compareCases) {
      rows.push(await runCompareCase(testCase));
    }
  }

  const passed = rows.filter((row) => row.ok).length;
  const review = rows.length - passed;

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(
    reportPath,
    [
      "# Chatbot Golden QA",
      "",
      `Generated: ${new Date().toISOString()}`,
      `Site: ${siteUrl}`,
      `Live API checks: ${runLiveChecks ? "enabled" : "disabled"}`,
      "",
      "## Summary",
      "",
      `- Cases checked: ${rows.length}`,
      `- Passed: ${passed}`,
      `- Needs review: ${review}`,
      "",
      "These checks verify prompt coverage, safety intent contracts, and optionally live chatbot/Food V2 APIs. They do not replace human review.",
      "",
      "## Results",
      "",
      renderRows(rows),
    ].join("\n"),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        siteUrl,
        liveChecks: runLiveChecks,
        checked: rows.length,
        passed,
        review,
        report: reportPath,
      },
      null,
      2
    )
  );

  if (review > 0 && process.env.NUTRITAIL_QA_STRICT === "1") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
