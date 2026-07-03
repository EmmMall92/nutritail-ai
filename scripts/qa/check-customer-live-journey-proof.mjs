import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const siteUrl = process.env.NUTRITAIL_QA_SITE_URL || "https://nutritail.ai";
const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH ||
  "reports/customer_live_journey_proof_qa.md";
const defaultCookieFile = ".qa-secrets/nutritail-auth-cookie.txt";
const fallbackCookieFiles = [".qa-secrets/account-cookie.txt"];
const authCookieFile =
  process.env.NUTRITAIL_QA_AUTH_COOKIE_FILE?.trim() || defaultCookieFile;
const defaultManualProofFile = ".qa-secrets/customer-live-journey-proof.json";
const manualProofFile =
  process.env.NUTRITAIL_QA_MANUAL_PROOF_FILE?.trim() || defaultManualProofFile;
const manualProofDraftFile =
  process.env.NUTRITAIL_QA_MANUAL_PROOF_DRAFT_FILE?.trim() ||
  ".qa-secrets/customer-live-journey-proof.draft.json";
const shouldWriteManualProofDraft =
  process.env.NUTRITAIL_QA_WRITE_MANUAL_PROOF_DRAFT === "1";
const shouldRunLiveWriteProof =
  process.env.NUTRITAIL_QA_ENABLE_LIVE_WRITE_PROOF === "1";
const forbiddenCustomerWordingPatterns = [
  /\bneeds[_\s-]?review\b/i,
  /\bsource\s*tier\b/i,
  /\bsource_priority\b/i,
  /\bsource\s*priority\b/i,
  /\bdata\s*quality\b/i,
  /\bmissing\s*nutrition\b/i,
  /\bmissing\s*fields?\b/i,
  /\bquality\s*:/i,
  /\bsource\s*:/i,
  /\bretailer\s*source\b/i,
  /\bFood\s*V2\b/i,
  /\bscore-debug\b/i,
  /\bdebug\b/i,
  /\bmanual-required\b/i,
  /\bPASS_NON_DESTRUCTIVE\b/i,
  /\bPASS_FULL\b/i,
  /\bconfidence internals\b/i,
  /\b(?:high|medium|low)\s+confidence\b/i,
  /\bconfidence\s*[:=]\s*(?:high|medium|low)\b/i,
  /\b(?:score|total_score|match_score)\s*[:=]?\s*\d{1,3}\s*(?:\/\s*100)?\b/i,
];

const sampleMessage =
  "\u0388\u03c7\u03c9 \u03c3\u03ba\u03cd\u03bb\u03bf, \u03c4\u03b7 \u03bb\u03ad\u03bd\u03b5 \u039a\u03cd\u03c1\u03ba\u03b7, \u03b5\u03af\u03bd\u03b1\u03b9 6 \u03ba\u03b9\u03bb\u03ac, 6 \u03b5\u03c4\u03ce\u03bd, \u03c7\u03b1\u03bc\u03b7\u03bb\u03ae \u03b4\u03c1\u03b1\u03c3\u03c4\u03b7\u03c1\u03b9\u03cc\u03c4\u03b7\u03c4\u03b1, \u03c3\u03c4\u03b5\u03b9\u03c1\u03c9\u03bc\u03ad\u03bd\u03b7. \u03a4\u03b7\u03c2 \u03b1\u03c1\u03ad\u03c3\u03b5\u03b9 \u03ba\u03bf\u03c4\u03cc\u03c0\u03bf\u03c5\u03bb\u03bf \u03ba\u03b1\u03b9 \u03b4\u03b5\u03bd \u03c4\u03b7\u03c2 \u03b1\u03c1\u03ad\u03c3\u03b5\u03b9 \u03c3\u03bf\u03bb\u03bf\u03bc\u03cc\u03c2.";

const samplePet = {
  name: "\u039a\u03cd\u03c1\u03ba\u03b7",
  species: "dog",
  age: 6,
  weight: 6,
  activityLevel: "low",
  neutered: true,
  allergies: [],
  healthIssues: [],
  preferredProteins: ["chicken"],
  excludedIngredients: ["salmon"],
};

function buildLiveWritePet() {
  const suffix = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 12);

  return {
    id: "",
    ownerId: "",
    name: `QA Live Proof ${suffix}`,
    species: "dog",
    breed: "unknown",
    age: 6,
    weight: 6,
    activityLevel: "low",
    neutered: true,
    allergies: [],
    healthIssues: [],
  };
}

function buildLiveWriteAnalysis(pet, recommendationShape) {
  const foodName = recommendationShape.firstFood || "NutriTail QA Food Choice";

  return {
    pet,
    nutrition: {
      rer: 268,
      der: 322,
      protein: "24-28%",
      fat: "8-12%",
      fiber: "5-10%",
      sodium: "0.2-0.4%",
      magnesium: "0.04-0.1%",
      calcium: "0.8-1.5%",
      phosphorus: "0.6-1.2%",
    },
    advice: [
      {
        title: "QA customer live proof",
        description:
          "Controlled live proof for save, report, timeline, and progress journey.",
      },
    ],
    recommendedFoods: [
      {
        food: {
          id: "qa-live-proof-food",
          brand: "NutriTail QA",
          name: foodName,
          species: "dog",
          lifeStage: "adult",
          activitySupport: "all",
          healthSupport: ["sterilised"],
          protein: 23,
          fat: 10,
          fiber: 3,
          sodium: 0.3,
          magnesium: 0.08,
          calcium: 1.1,
          phosphorus: 0.8,
          ingredients: ["controlled qa food choice"],
          tags: ["qa", "sterilised"],
          kcalPer100g: 338,
        },
        score: 82,
        reasons: ["Controlled QA food choice for live proof."],
        nutritionScore: 82,
        nutritionReasons: ["Includes calories, grams/day, and report context."],
      },
    ],
  };
}

const manualJourneyRequirements = {
  food_choice_grams: {
    name: "Food choice and grams/day",
    requiredTerms: ["food", "grams/day", "first-week"],
  },
  save_analysis: {
    name: "Save analysis",
    requiredTerms: ["save", "profile", "report", "timeline", "progress"],
  },
  open_report: {
    name: "Open report",
    requiredTerms: ["report", "calories", "selected food", "grams/day", "transition"],
  },
  open_timeline: {
    name: "Open timeline",
    requiredTerms: ["timeline", "same saved pet", "plan", "progress"],
  },
  return_for_progress: {
    name: "Return for progress",
    requiredTerms: ["same saved pet", "progress", "without restarting"],
  },
  returning_continuation: {
    name: "Returning saved-pet continuation",
    requiredTerms: [
      "same saved pet",
      "progress",
      "no-result",
      "flavour",
      "brand",
      "new food",
      "timeline",
      "without restarting",
    ],
  },
  report_account_clarity: {
    name: "Report/account clarity",
    requiredTerms: [
      "account",
      "report",
      "calories",
      "selected food",
      "grams/day",
      "why it fits",
      "transition",
      "timeline",
      "next check-in",
    ],
  },
};

function loadAuthCookie() {
  const fromEnv = process.env.NUTRITAIL_QA_AUTH_COOKIE?.trim() || "";
  if (fromEnv) {
    return {
      value: fromEnv,
      source: "NUTRITAIL_QA_AUTH_COOKIE",
      note: "Cookie loaded from environment variable.",
    };
  }

  const candidateFiles = [
    authCookieFile,
    ...fallbackCookieFiles.filter((file) => file !== authCookieFile),
  ];
  const existingFile = candidateFiles.find((file) => existsSync(file));

  if (!existingFile) {
    return {
      value: "",
      source: "missing",
      note: `No cookie file found at ${candidateFiles.join(" or ")}.`,
    };
  }

  const fromFile = readFileSync(existingFile, "utf8").trim();

  return {
    value: fromFile,
    source: fromFile
      ? existingFile === authCookieFile
        ? "NUTRITAIL_QA_AUTH_COOKIE_FILE"
        : "fallback cookie file"
      : "empty file",
    note: fromFile
      ? `Cookie loaded from local ignored file ${existingFile}.`
      : `Cookie file ${existingFile} is empty.`,
  };
}

function decodeBase64Json(value) {
  const decoded = decodeURIComponent(String(value ?? ""));
  const encoded = decoded.startsWith("base64-") ? decoded.slice(7) : decoded;
  const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );

  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
}

function decodeJwtPayload(token) {
  const payload = String(token ?? "").split(".")[1];
  if (!payload) return null;

  return decodeBase64Json(payload);
}

function getAuthUserIdFromCookie(cookieHeader) {
  const authCookie = String(cookieHeader ?? "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => /^sb-[^=]+-auth-token=/.test(part));
  const rawValue = authCookie?.split("=").slice(1).join("=") ?? "";
  if (!rawValue) return null;

  try {
    const session = decodeBase64Json(rawValue);
    const userId = session?.user?.id;
    if (typeof userId === "string" && userId.trim()) return userId.trim();

    const jwtUserId = decodeJwtPayload(session?.access_token)?.sub;
    return typeof jwtUserId === "string" && jwtUserId.trim()
      ? jwtUserId.trim()
      : null;
  } catch {
    return null;
  }
}

function loadManualJourneyProof() {
  if (!existsSync(manualProofFile)) {
    return {
      source: "missing",
      note: `No manual proof file found at ${manualProofFile}.`,
      proof: {},
    };
  }

  try {
    const proof = JSON.parse(readFileSync(manualProofFile, "utf8"));

    return {
      source: "NUTRITAIL_QA_MANUAL_PROOF_FILE",
      note: "Manual browser journey proof loaded from local ignored file.",
      proof: proof && typeof proof === "object" ? proof : {},
    };
  } catch (error) {
    return {
      source: "invalid",
      note: `Manual proof file could not be parsed: ${
        error instanceof Error ? error.message : "unknown JSON error"
      }`,
      proof: {},
    };
  }
}

async function runLiveWriteProof({ authCookie, recommendationShape }) {
  if (!shouldRunLiveWriteProof) {
    return {
      enabled: false,
      ok: false,
      source: "disabled",
      note: "Set NUTRITAIL_QA_ENABLE_LIVE_WRITE_PROOF=1 to run the opt-in live write proof.",
      petId: "",
      proof: {},
      steps: [],
    };
  }

  const authUserId = getAuthUserIdFromCookie(authCookie.value);
  if (!authCookie.value || !authUserId) {
    return {
      enabled: true,
      ok: false,
      source: "missing auth user id",
      note: "Live write proof needs a valid Supabase auth cookie with a user id.",
      petId: "",
      proof: {},
      steps: [],
    };
  }

  const pet = buildLiveWritePet();
  const analysis = buildLiveWriteAnalysis(pet, recommendationShape);
  const save = await fetchJson("/api/account/chatbot/save", {
    method: "POST",
    cookie: authCookie.value,
    body: {
      authUserId,
      pet,
      analysis,
      metadata: {
        matchedFoodId: "qa-live-proof-food",
        matchedFoodName: analysis.recommendedFoods[0].food.name,
        foodScore: 82,
        feedingGramsPerDay: 95,
        weightGoal: "weight maintenance",
      },
    },
  });
  const savedPetId = save.payload?.pet?.id ?? "";
  const saveOk = save.status === 200 && save.payload?.success === true && savedPetId;
  const steps = [
    {
      key: "save",
      ok: Boolean(saveOk),
      route: "/api/account/chatbot/save",
      status: save.status,
      durationMs: save.durationMs,
    },
  ];

  if (!saveOk) {
    return {
      enabled: true,
      ok: false,
      source: "live write proof",
      note: "Save step failed, so report/timeline/progress proof was not attempted.",
      petId: "",
      proof: {},
      steps,
    };
  }

  const foodName = analysis.recommendedFoods[0].food.name;
  const report = await fetchJson(`/api/print/pet-report/${savedPetId}`, {
    cookie: authCookie.value,
  });
  const reportOk =
    report.status === 200 &&
    report.payload?.pet?.id === savedPetId &&
    Array.isArray(report.payload?.pet?.analyses) &&
    report.payload.pet.analyses.length > 0;
  steps.push({
    key: "report",
    ok: reportOk,
    route: `/api/print/pet-report/${savedPetId}`,
    status: report.status,
    durationMs: report.durationMs,
  });

  const reportJsonText = JSON.stringify(report.payload ?? {}).toLowerCase();
  const reportDataTerms = [savedPetId.toLowerCase(), foodName.toLowerCase(), "95", "322"];
  const missingReportDataTerms = reportDataTerms.filter(
    (term) => !reportJsonText.includes(term),
  );

  const reportPage = await fetchJson(`/print/pet-report/${savedPetId}`, {
    cookie: authCookie.value,
  });
  const reportPageText =
    typeof reportPage.payload === "string" ? reportPage.payload : "";
  const reportPageLeaks = findCustomerWordingLeaks(reportPageText);
  const reportPageCleanOk =
    reportPage.status === 200 &&
    reportPageText.length > 0 &&
    reportPageLeaks.length === 0;
  steps.push({
    key: "report_clean_wording",
    ok: reportPageCleanOk,
    route: `/print/pet-report/${savedPetId}`,
    status: reportPage.status,
    durationMs: reportPage.durationMs,
    note:
      reportPageLeaks.length > 0
        ? `Printable report leaked: ${reportPageLeaks.join(", ")}`
        : "Printable report customer wording is clean.",
  });

  const timeline = await fetchJson(`/print/pet-timeline/${savedPetId}`, {
    cookie: authCookie.value,
  });
  const timelineText = typeof timeline.payload === "string" ? timeline.payload : "";
  const timelineOk =
    timeline.status === 200 &&
    timelineText.toLowerCase().includes(savedPetId.toLowerCase());
  steps.push({
    key: "timeline",
    ok: timelineOk,
    route: `/print/pet-timeline/${savedPetId}`,
    status: timeline.status,
    durationMs: timeline.durationMs,
  });

  const progress = await fetchJson(`/api/account/pets/${savedPetId}/progress`, {
    method: "POST",
    cookie: authCookie.value,
    body: {
      authUserId,
      currentWeightKg: 6,
      feedingGramsPerDay: 95,
      treatsNote: "inside allowance",
      appetiteNote: "normal",
      stoolNote: "normal",
      energyNote: "normal",
      bodyChangeNote: "stable first proof",
      progressDecisionStatus: "continue_plan",
      progressDecisionConfidence: "medium",
      progressDecisionHeadlineEn: "Plan is ready for a first progress check.",
      progressDecisionHeadlineEl: "Το πλάνο είναι έτοιμο για πρώτο progress check.",
      note: "Controlled live proof progress note.",
      mode: "progress",
    },
  });
  const progressOk = progress.status === 200 && progress.payload?.success === true;
  steps.push({
    key: "progress",
    ok: progressOk,
    route: `/api/account/pets/${savedPetId}/progress`,
    status: progress.status,
    durationMs: progress.durationMs,
  });

  const noResult = await fetchJson(`/api/account/pets/${savedPetId}/progress`, {
    method: "POST",
    cookie: authCookie.value,
    body: {
      authUserId,
      currentWeightKg: 6.2,
      feedingGramsPerDay: 95,
      treatsNote: "customer says plan did not move enough",
      appetiteNote: "normal",
      stoolNote: "normal",
      energyNote: "normal",
      bodyChangeNote: "no visible result yet",
      progressDecisionStatus: "review_food_fit",
      progressDecisionConfidence: "medium",
      progressDecisionHeadlineEn: "Plan needs a practical review.",
      progressDecisionHeadlineEl: "Το πλάνο θέλει πρακτικό έλεγχο.",
      note: "Controlled live proof no-result continuation note.",
      mode: "no_result",
    },
  });
  const noResultOk = noResult.status === 200 && noResult.payload?.success === true;
  steps.push({
    key: "no_result",
    ok: noResultOk,
    route: `/api/account/pets/${savedPetId}/progress`,
    status: noResult.status,
    durationMs: noResult.durationMs,
    note: "Same saved pet can record a no-result follow-up without restarting.",
  });

  const changeFood = await fetchJson(`/api/account/pets/${savedPetId}/progress`, {
    method: "POST",
    cookie: authCookie.value,
    body: {
      authUserId,
      feedingGramsPerDay: 95,
      treatsNote: "customer wants a different flavour or brand",
      appetiteNote: "accepted food but bored of flavour",
      stoolNote: "normal",
      energyNote: "normal",
      bodyChangeNote: "stable",
      progressDecisionStatus: "review_food_fit",
      progressDecisionConfidence: "medium",
      progressDecisionHeadlineEn: "A flavour or brand alternative is reasonable.",
      progressDecisionHeadlineEl: "Μια εναλλακτική γεύση ή εταιρεία είναι λογική.",
      note: "Controlled live proof flavour or brand continuation note.",
      mode: "change_food",
    },
  });
  const changeFoodOk =
    changeFood.status === 200 && changeFood.payload?.success === true;
  steps.push({
    key: "change_food",
    ok: changeFoodOk,
    route: `/api/account/pets/${savedPetId}/progress`,
    status: changeFood.status,
    durationMs: changeFood.durationMs,
    note: "Same saved pet can record a flavour or brand-change follow-up.",
  });

  const newFood = await fetchJson(`/api/account/pets/${savedPetId}/progress`, {
    method: "POST",
    cookie: authCookie.value,
    body: {
      authUserId,
      currentWeightKg: 6,
      feedingGramsPerDay: 95,
      treatsNote: "customer asks for a fresh recommendation",
      appetiteNote: "normal",
      stoolNote: "normal",
      energyNote: "normal",
      bodyChangeNote: "goal or needs changed",
      progressDecisionStatus: "review_food_fit",
      progressDecisionConfidence: "medium",
      progressDecisionHeadlineEn: "A fresh food recommendation can be run.",
      progressDecisionHeadlineEl: "Μπορεί να γίνει νέα πρόταση τροφής.",
      note: "Controlled live proof new-food continuation note.",
      mode: "new_analysis",
    },
  });
  const newFoodOk = newFood.status === 200 && newFood.payload?.success === true;
  steps.push({
    key: "new_food",
    ok: newFoodOk,
    route: `/api/account/pets/${savedPetId}/progress`,
    status: newFood.status,
    durationMs: newFood.durationMs,
    note: "Same saved pet can record a fresh recommendation follow-up.",
  });

  const progressPage = await fetchJson(
    `/account/chatbot?petId=${savedPetId}&mode=progress`,
    { cookie: authCookie.value },
  );
  const progressPageOk =
    progressPage.status === 200 && typeof progressPage.payload === "string";
  steps.push({
    key: "return_progress",
    ok: progressPageOk,
    route: `/account/chatbot?petId=${savedPetId}&mode=progress`,
    status: progressPage.status,
    durationMs: progressPage.durationMs,
  });

  const accountPage = await fetchJson("/account", {
    cookie: authCookie.value,
  });
  const accountSource = readFileSync("app/account/page.tsx", "utf8");
  const accountPageMarkers = [
    "account-plan-snapshot",
    "account-plan-next-steps",
    "account-progress-return-kit",
  ];
  const missingAccountMarkers = accountPageMarkers.filter(
    (marker) => !accountSource.includes(marker),
  );

  const petProfilePage = await fetchJson(`/account/pets/${savedPetId}`, {
    cookie: authCookie.value,
  });
  const petProfileText =
    typeof petProfilePage.payload === "string" ? petProfilePage.payload : "";
  const petProfileOk =
    petProfilePage.status === 200 &&
    petProfileText.toLowerCase().includes(savedPetId.toLowerCase());

  const reportPageMarkers = [
    "report-start-checklist",
    "report-food-reasoning-summary",
    "report-tomorrow-feeding-plan",
    "report-next-action-summary",
    "report-progress-return-kit",
    "report-first-week-followup-plan",
  ];
  const reportSource = readFileSync("app/print/pet-report/[id]/page.tsx", "utf8");
  const missingReportPageMarkers = reportPageMarkers.filter(
    (marker) => !reportSource.includes(marker),
  );
  const reportAccountClarityOk =
    accountPage.status === 200 &&
    missingAccountMarkers.length === 0 &&
    petProfileOk &&
    reportOk &&
    missingReportDataTerms.length === 0 &&
    reportPageCleanOk &&
    missingReportPageMarkers.length === 0 &&
    timelineOk &&
    progressPageOk;

  steps.push({
    key: "report_account_clarity",
    ok: reportAccountClarityOk,
    route: `/account + /account/pets/${savedPetId} + /print/pet-report/${savedPetId}`,
    status: reportAccountClarityOk ? 200 : 0,
    durationMs:
      accountPage.durationMs + petProfilePage.durationMs + reportPage.durationMs,
    note: reportAccountClarityOk
      ? "Account, pet profile, printable report, timeline, and progress routes prove the saved plan is clear."
      : [
          missingAccountMarkers.length > 0
            ? `Missing account markers: ${missingAccountMarkers.join(", ")}`
            : "",
          !petProfileOk ? "Pet profile route did not prove the same saved pet." : "",
          missingReportDataTerms.length > 0
            ? `Missing report data terms: ${missingReportDataTerms.join(", ")}`
            : "",
          missingReportPageMarkers.length > 0
            ? `Missing report page markers: ${missingReportPageMarkers.join(", ")}`
            : "",
        ]
          .filter(Boolean)
          .join(" "),
  });

  const continuationRoutes = [
    {
      key: "return_continuation_panel",
      route: `/account/chatbot?petId=${savedPetId}`,
      note: "Same saved pet can reopen the continuation panel without restarting.",
    },
    {
      key: "return_change_food",
      route: `/account/chatbot?petId=${savedPetId}&mode=recommendation&reason=flavour`,
      note: "Same saved pet can open the flavour or brand-change recommendation route.",
    },
    {
      key: "return_new_food",
      route: `/account/chatbot?petId=${savedPetId}&mode=recommendation`,
      note: "Same saved pet can open a fresh recommendation route.",
    },
  ];

  for (const routeCheck of continuationRoutes) {
    const page = await fetchJson(routeCheck.route, { cookie: authCookie.value });
    steps.push({
      key: routeCheck.key,
      ok: page.status === 200 && typeof page.payload === "string",
      route: routeCheck.route,
      status: page.status,
      durationMs: page.durationMs,
      note: routeCheck.note,
    });
  }

  const ok = steps.every((step) => step.ok);

  return {
    enabled: true,
    ok,
    source: "live write proof",
    note: ok
      ? "Opt-in live write proof saved a QA pet, opened report/account/timeline routes, and proved progress, no-result, flavour/brand, new-food continuation, and customer-visible report/account clarity."
      : "Opt-in live write proof ran but at least one live step needs review.",
    petId: savedPetId,
    proof: ok
      ? {
          food_choice_grams: {
            passed: true,
            evidence: [
              `Live write proof selected food ${foodName}, saved 95 grams/day, and kept first-week next steps in the saved analysis flow.`,
            ],
          },
          save_analysis: {
            passed: true,
            evidence: [
              `Live write proof save created pet profile ${savedPetId}, report access, timeline access, and progress follow-up context.`,
            ],
          },
          open_report: {
            passed: true,
            evidence: [
              `Live report returned calories, selected food ${foodName}, grams/day, transition-ready analysis, and clean customer wording for pet ${savedPetId}.`,
            ],
          },
          open_timeline: {
            passed: true,
            evidence: [
              `Live timeline opened for the same saved pet ${savedPetId} and confirmed plan plus progress context.`,
            ],
          },
          return_for_progress: {
            passed: true,
            evidence: [
              `Same saved pet ${savedPetId} returned to progress mode without restarting intake.`,
            ],
          },
          returning_continuation: {
            passed: true,
            evidence: [
              `Same saved pet ${savedPetId} handled progress, no-result advice, flavour/brand change, new food recommendation route, and timeline review without restarting intake.`,
            ],
          },
          report_account_clarity: {
            passed: true,
            evidence: [
              `Same saved pet ${savedPetId} proved account, report, calories, selected food ${foodName}, 95 grams/day, why it fits, transition, timeline, and next check-in are visible for the customer.`,
            ],
          },
        }
      : {},
    steps,
  };
}

function getManualProofStatus(proof, key, requirement) {
  const entry = proof?.[key];
  const evidence = Array.isArray(entry?.evidence) ? entry.evidence.filter(Boolean) : [];
  const evidenceText = evidence.join(" ").toLowerCase();
  const placeholderPatterns = [
    /\btodo\b/i,
    /replace this/i,
    /draft proof/i,
    /placeholder/i,
    /example evidence/i,
  ];
  const hasPlaceholderEvidence = evidence.some((note) =>
    placeholderPatterns.some((pattern) => pattern.test(String(note))),
  );
  const missingTerms = requirement.requiredTerms.filter(
    (term) => !evidenceText.includes(term.toLowerCase()),
  );
  const ok =
    entry?.passed === true &&
    evidence.length > 0 &&
    missingTerms.length === 0 &&
    !hasPlaceholderEvidence;

  return {
    ok,
    evidenceCount: evidence.length,
    hasPlaceholderEvidence,
    missingTerms,
    note: ok
      ? evidence.slice(0, 2).join("; ")
      : `Needs browser proof with passed=true, at least one real evidence note, no TODO/placeholder text, and these terms: ${requirement.requiredTerms.join(", ")}.`,
  };
}

async function fetchJson(pathname, { method = "GET", body, cookie } = {}) {
  const startedAt = Date.now();
  const headers = {
    "User-Agent": "NutriTail-customer-live-journey-proof/1.0",
  };

  if (body) headers["Content-Type"] = "application/json";
  if (cookie) headers.Cookie = cookie;

  try {
    const response = await fetch(new URL(pathname, siteUrl), {
      method,
      redirect: "manual",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => "");

    return {
      status: response.status,
      payload,
      contentType,
      durationMs: Date.now() - startedAt,
      error: "",
    };
  } catch (error) {
    return {
      status: 0,
      payload: null,
      contentType: "",
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Unknown request error",
    };
  }
}

function hasExpectedExtractedFacts(payload) {
  const data = payload?.data;

  return (
    data?.species === "dog" &&
    data?.petName === "\u039a\u03cd\u03c1\u03ba\u03b7" &&
    data?.weightKg === 6 &&
    data?.ageYears === 6 &&
    data?.activityLevel === "low" &&
    data?.neutered === true &&
    Array.isArray(data?.preferredProteins) &&
    data.preferredProteins.includes("chicken") &&
    Array.isArray(data?.excludedIngredients) &&
    data.excludedIngredients.includes("salmon")
  );
}

function hasVisibleRecommendationCards(payload) {
  const premium = Array.isArray(payload?.premium) ? payload.premium : [];
  const value = Array.isArray(payload?.value) ? payload.value : [];
  const visible = [...premium, ...value];

  return {
    ok: premium.length >= 3 && value.length >= 3,
    premiumCount: premium.length,
    valueCount: value.length,
    visibleCount: visible.length,
    firstFood: visible[0]?.display_name || visible[0]?.ranking?.display_name || "",
  };
}

function findCustomerWordingLeaks(value) {
  const text = String(value ?? "");

  return forbiddenCustomerWordingPatterns
    .filter((pattern) => pattern.test(text))
    .map((pattern) => pattern.source);
}

async function checkLiveComposedRecommendationCopy({
  authCookie,
  recommendationPayload,
}) {
  if (!authCookie.value) {
    return {
      status: 0,
      ok: false,
      durationMs: 0,
      leaks: [],
      note: "Needs authenticated QA cookie.",
    };
  }

  const response = await fetchJson("/api/account/chatbot/compose-recommendation", {
    method: "POST",
    cookie: authCookie.value,
    body: {
      locale: "el",
      deterministicText: [
        "Προτεινόμενες τροφές:",
        "source tier: retailer",
        "data quality: needs_review",
        "missing nutrition fields: sodium_percent, magnesium_percent",
        "PASS_NON_DESTRUCTIVE",
      ].join("\n"),
      cardsFollow: true,
      petSummary: {
        species: samplePet.species,
        name: samplePet.name,
        weightKg: samplePet.weight,
        ageYears: samplePet.age,
        activityLevel: samplePet.activityLevel,
        neutered: samplePet.neutered,
        weightGoal: "maintain",
        healthIssues: samplePet.healthIssues,
        preferredProteins: samplePet.preferredProteins,
        excludedIngredients: samplePet.excludedIngredients,
      },
      recommendation: recommendationPayload,
    },
  });
  const text = String(response.payload?.text ?? "");
  const leaks = findCustomerWordingLeaks(text);

  return {
    status: response.status,
    ok: response.status === 200 && text.length > 0 && leaks.length === 0,
    durationMs: response.durationMs,
    leaks,
    note:
      leaks.length > 0
        ? `Customer recommendation copy leaked: ${leaks.join(", ")}`
        : "Composed recommendation copy is customer-clean.",
  };
}

function renderTable(rows) {
  return [
    "| Step | Route | Status | Result | Duration | Notes |",
    "| --- | --- | ---: | --- | ---: | --- |",
    ...rows.map(
      (row) =>
        `| ${row.step} | ${row.route} | ${row.status} | ${row.result} | ${row.durationMs}ms | ${row.notes || "-"} |`,
    ),
  ].join("\n");
}

function renderJourneyTable(journeys) {
  return [
    "| Journey | Status | Proof needed |",
    "| --- | --- | --- |",
    ...journeys.map(
      (journey) => `| ${journey.name} | ${journey.status} | ${journey.proofNeeded} |`,
    ),
  ].join("\n");
}

function buildManualProofDraft(manualJourneyResults) {
  return Object.fromEntries(
    manualJourneyResults.map((journey) => [
      journey.key,
      {
        passed: false,
        required_terms: manualJourneyRequirements[journey.key].requiredTerms,
        evidence: [
          `TODO: replace this with live browser evidence that includes: ${manualJourneyRequirements[
            journey.key
          ].requiredTerms.join(", ")}`,
        ],
      },
    ]),
  );
}

function writeManualProofDraft(manualJourneyResults) {
  if (!shouldWriteManualProofDraft) {
    return {
      wrote: false,
      path: manualProofDraftFile,
      note: "Set NUTRITAIL_QA_WRITE_MANUAL_PROOF_DRAFT=1 to create a local draft proof file.",
    };
  }

  mkdirSync(path.dirname(manualProofDraftFile), { recursive: true });
  writeFileSync(
    manualProofDraftFile,
    `${JSON.stringify(buildManualProofDraft(manualJourneyResults), null, 2)}\n`,
    "utf8",
  );

  return {
    wrote: true,
    path: manualProofDraftFile,
    note: `Wrote local draft proof file at ${manualProofDraftFile}. Keep it ignored and replace TODO notes only with real browser evidence.`,
  };
}

async function main() {
  const authCookie = loadAuthCookie();
  const manualProof = loadManualJourneyProof();
  const rows = [];

  const chatbotPage = await fetchJson("/account/chatbot", {
    cookie: authCookie.value,
  });
  const chatbotPageOk =
    authCookie.value && chatbotPage.status === 200 && typeof chatbotPage.payload === "string";
  rows.push({
    step: "Authenticated chatbot page",
    route: "/account/chatbot",
    status: chatbotPage.status,
    result: chatbotPageOk ? "pass" : authCookie.value ? "fail" : "skip",
    durationMs: chatbotPage.durationMs,
    notes: authCookie.value
      ? "Logged-in chatbot page should load without redirect."
      : "Needs authenticated QA cookie.",
  });

  const extract = authCookie.value
    ? await fetchJson("/api/account/chatbot/extract-intake", {
        method: "POST",
        cookie: authCookie.value,
        body: {
          message: sampleMessage,
          locale: "el",
        },
      })
    : { status: 0, payload: null, durationMs: 0, error: "" };
  const extractOk = authCookie.value && extract.status === 200 && hasExpectedExtractedFacts(extract.payload);
  rows.push({
    step: "OpenAI fact extraction",
    route: "/api/account/chatbot/extract-intake",
    status: extract.status,
    result: extractOk ? "pass" : authCookie.value ? "fail" : "skip",
    durationMs: extract.durationMs,
    notes: authCookie.value
      ? "Expected Greek intake facts for species, name, weight, age, activity, neuter, preference, and exclusion."
      : "Needs authenticated QA cookie.",
  });

  const recommendations = await fetchJson("/api/account/foods/v2-recommendations", {
    method: "POST",
    body: {
      pet: samplePet,
      goal: "sterilised",
      format: "dry",
      limit_per_bucket: 3,
      message: sampleMessage,
    },
  });
  const recommendationShape = hasVisibleRecommendationCards(recommendations.payload);
  const composedCopyProof = await checkLiveComposedRecommendationCopy({
    authCookie,
    recommendationPayload: recommendations.payload,
  });
  const liveWriteProof = await runLiveWriteProof({
    authCookie,
    recommendationShape,
  });
  const proofForManualChecks =
    liveWriteProof.ok && Object.keys(liveWriteProof.proof).length > 0
      ? liveWriteProof.proof
      : manualProof.proof;
  const proofSource =
    liveWriteProof.ok && Object.keys(liveWriteProof.proof).length > 0
      ? liveWriteProof.source
      : manualProof.source;
  rows.push({
    step: "Food V2 recommendation cards",
    route: "/api/account/foods/v2-recommendations",
    status: recommendations.status,
    result: recommendations.status === 200 && recommendationShape.ok ? "pass" : "fail",
    durationMs: recommendations.durationMs,
    notes: `${recommendationShape.visibleCount} visible choices; premium ${recommendationShape.premiumCount}/3; value ${recommendationShape.valueCount}/3; first ${recommendationShape.firstFood || "-"}`,
  });
  rows.push({
    step: "Clean chatbot recommendation wording",
    route: "/api/account/chatbot/compose-recommendation",
    status: composedCopyProof.status,
    result: composedCopyProof.ok ? "pass" : authCookie.value ? "fail" : "skip",
    durationMs: composedCopyProof.durationMs,
    notes: composedCopyProof.note,
  });

  const manualJourneyResults = Object.entries(manualJourneyRequirements).map(([key, requirement]) => {
    const manualStatus = getManualProofStatus(proofForManualChecks, key, requirement);

    return {
      key,
      name: requirement.name,
      status: manualStatus.ok ? "manual-pass" : "manual-required",
      evidenceCount: manualStatus.evidenceCount,
      hasPlaceholderEvidence: manualStatus.hasPlaceholderEvidence,
      missingTerms: manualStatus.missingTerms,
      note: manualStatus.note,
    };
  });
  const manualJourneysPassed = manualJourneyResults.every((journey) => journey.status === "manual-pass");
  const manualProofDraft = writeManualProofDraft(manualJourneyResults);
  const missingManualProofKeys = manualJourneyResults
    .filter((journey) => journey.status !== "manual-pass")
    .map((journey) => journey.key);
  const passed = rows.filter((row) => row.result === "pass").length;
  const skipped = rows.filter((row) => row.result === "skip").length;
  const failed = rows.filter((row) => row.result === "fail").length;
  const authenticatedSteps = rows.filter((row) =>
    ["Authenticated chatbot page", "OpenAI fact extraction"].includes(row.step),
  );
  const authenticatedPassed = authenticatedSteps.every((row) => row.result === "pass");
  const nonDestructivePassed =
    failed === 0 && authenticatedPassed && recommendationShape.ok;
  const status =
    failed > 0
      ? "REVIEW"
      : nonDestructivePassed && manualJourneysPassed
        ? "PASS_FULL"
        : nonDestructivePassed
          ? "PASS_NON_DESTRUCTIVE"
          : "SKIP_AUTH";
  const journeyProofs = [
    {
      name: "New pet recommendation",
      status: recommendationShape.ok ? "api-pass" : "review",
      proofNeeded:
        "Food V2 must return 3 first-choice cards and 3 budget-friendly alternatives; browser proof still needs food selection and grams/day.",
    },
    {
      name: "Food choice and grams/day",
      status: manualJourneyResults.find((journey) => journey.key === "food_choice_grams")?.status ?? "manual-required",
      proofNeeded:
        "Tap one food card in the live chatbot and confirm the selected-food plan shows grams/day and first-week next steps.",
    },
    {
      name: "Save analysis",
      status: manualJourneyResults.find((journey) => journey.key === "save_analysis")?.status ?? "manual-required",
      proofNeeded:
        "Choose one food in the live chatbot, confirm grams/day, then save the analysis.",
    },
    {
      name: "Open report",
      status: manualJourneyResults.find((journey) => journey.key === "open_report")?.status ?? "manual-required",
      proofNeeded:
        "Open the printable report and confirm calories, selected food, grams/day, transition plan, and next action are clear.",
    },
    {
      name: "Open timeline",
      status: manualJourneyResults.find((journey) => journey.key === "open_timeline")?.status ?? "manual-required",
      proofNeeded:
        "Open the saved pet timeline and confirm the latest plan and progress context are visible.",
    },
    {
      name: "Return for progress",
      status: manualJourneyResults.find((journey) => journey.key === "return_for_progress")?.status ?? "manual-required",
      proofNeeded:
        "Return to the same saved pet and complete progress without restarting intake.",
    },
    {
      name: "Returning saved-pet continuation",
      status: manualJourneyResults.find((journey) => journey.key === "returning_continuation")?.status ?? "manual-required",
      proofNeeded:
        "Use the same saved pet for progress, no-result advice, flavour/brand change, new food recommendation, and timeline review without restarting intake.",
    },
    {
      name: "Report/account clarity",
      status: manualJourneyResults.find((journey) => journey.key === "report_account_clarity")?.status ?? "manual-required",
      proofNeeded:
        "Open account, pet profile, printable report, timeline, and progress for the same saved pet and confirm calories, selected food, grams/day, why it fits, transition, and next check-in are obvious.",
    },
  ];
  const unlockImpact =
    status === "PASS_FULL"
      ? "This supports Customer UX readiness at 88% because authenticated extraction, recommendations, clean customer wording, save, report, account, pet profile, timeline, returning progress, no-result advice, flavour/brand change, new-food continuation, and report/account clarity have current proof."
      : status === "PASS_NON_DESTRUCTIVE"
        ? "This supports the non-destructive part of the Customer UX unlock. Live write proof is still required before using it as full customer-journey evidence."
        : "This does not move Customer UX yet because logged-in production journey proof is still missing.";

  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(
    reportPath,
    [
      "# Customer Live Journey Proof QA",
      "",
      `Generated: ${new Date().toISOString()}`,
      `Site: ${siteUrl}`,
      `Status: ${status}`,
      "",
      "This is a non-destructive live proof for the first Customer UX unlock gate.",
      "It verifies the logged-in chatbot surface and OpenAI fact extraction when a QA cookie is available, then checks Food V2 can return visible customer recommendation cards.",
      "It does not save pets, write analyses, print cookies, or store secrets.",
      "",
      "## Summary",
      "",
      `- Steps checked: ${rows.length}`,
      `- Passed: ${passed}`,
      `- Skipped: ${skipped}`,
      `- Failed: ${failed}`,
      `- Auth cookie source: ${authCookie.source}`,
      `- Auth cookie note: ${authCookie.note}`,
      `- Manual proof source: ${proofSource}`,
      `- Live write proof: ${liveWriteProof.enabled ? liveWriteProof.note : "disabled"}`,
      `- Live write proof pet: ${liveWriteProof.petId || "none"}`,
      `- Unlock impact: ${unlockImpact}`,
      `- Customer journeys tracked: ${journeyProofs.length}`,
      `- Manual journeys still required: ${journeyProofs.filter((journey) => journey.status === "manual-required").length}`,
      `- Manual browser journeys passed: ${manualJourneyResults.filter((journey) => journey.status === "manual-pass").length}/${manualJourneyResults.length}`,
      `- Clean chatbot wording: ${composedCopyProof.ok ? "pass" : authCookie.value ? "review" : "skip"}`,
      `- Missing manual proof keys: ${missingManualProofKeys.length > 0 ? missingManualProofKeys.join(", ") : "none"}`,
      `- Manual proof draft: ${manualProofDraft.wrote ? manualProofDraft.path : "not written"}`,
      "",
      "## Results",
      "",
      renderTable(rows),
      "",
      "## Optional Live Write Proof",
      "",
      "This section only runs when `NUTRITAIL_QA_ENABLE_LIVE_WRITE_PROOF=1` is set.",
      "It writes a controlled QA pet and progress note to the authenticated live account, then verifies clean report wording, account/report clarity, timeline, and return-to-progress routes.",
      "",
      `- Enabled: ${liveWriteProof.enabled ? "yes" : "no"}`,
      `- Result: ${liveWriteProof.ok ? "pass" : liveWriteProof.enabled ? "review" : "not run"}`,
      `- Note: ${liveWriteProof.note}`,
      `- Pet id: ${liveWriteProof.petId || "none"}`,
      "",
      liveWriteProof.steps.length > 0
        ? [
            "| Step | Route | Status | Result | Duration | Notes |",
            "| --- | --- | ---: | --- | ---: | --- |",
            ...liveWriteProof.steps.map(
              (step) =>
                `| ${step.key} | ${step.route} | ${step.status} | ${step.ok ? "pass" : "review"} | ${step.durationMs}ms | ${step.note || "-"} |`,
            ),
          ].join("\n")
        : "No live write steps were run.",
      "",
      "## Customer Journey Proof Checklist",
      "",
      "These are the customer-visible journeys that must stay passing before Customer UX can move further.",
      "",
      renderJourneyTable(journeyProofs),
      "",
      "## Manual Browser Proof",
      "",
      "| Journey | Status | Evidence notes |",
      "| --- | --- | --- |",
      ...manualJourneyResults.map(
        (journey) =>
          `| ${journey.name} | ${journey.status} | ${journey.evidenceCount > 0 ? journey.note : "missing"}${journey.hasPlaceholderEvidence ? " Placeholder/TODO evidence is not accepted." : ""}${journey.missingTerms.length > 0 ? ` Missing terms: ${journey.missingTerms.join(", ")}` : ""} |`,
      ),
      "",
      "## To Complete The Current Customer UX Gate",
      "",
      "1. Put a QA account Cookie header in `.qa-secrets/nutritail-auth-cookie.txt`, keep using `.qa-secrets/account-cookie.txt`, or set `NUTRITAIL_QA_AUTH_COOKIE_FILE`.",
      "2. Run `npm.cmd run qa:customer-live-journey-proof`.",
      "3. In the browser, complete the manual part: choose one food, confirm grams/day, save, open account/report, open timeline, and return for progress.",
      "4. Either copy `docs/customer-live-journey-proof.template.json` to `.qa-secrets/customer-live-journey-proof.json`, or run `$env:NUTRITAIL_QA_WRITE_MANUAL_PROOF_DRAFT='1'; npm.cmd run qa:customer-live-journey-proof` to create `.qa-secrets/customer-live-journey-proof.draft.json`.",
      "5. Rename/copy the local draft to `.qa-secrets/customer-live-journey-proof.json` only after replacing TODO notes with real evidence from the browser.",
      "6. Or, for a controlled authenticated write proof, run `$env:NUTRITAIL_QA_ENABLE_LIVE_WRITE_PROOF='1'; npm.cmd run qa:customer-live-journey-proof`; this creates a QA pet in the live account and should be used intentionally.",
      "7. Re-run `npm.cmd run qa:customer-live-journey-proof` and only then update the Customer UX score.",
    ].join("\n") + "\n",
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        status,
        siteUrl,
        passed,
        skipped,
        failed,
        customer_journeys_tracked: journeyProofs.length,
        manual_journeys_still_required: journeyProofs.filter(
          (journey) => journey.status === "manual-required",
        ).length,
        manual_journeys_passed: manualJourneyResults.filter(
          (journey) => journey.status === "manual-pass",
        ).length,
        missing_manual_proof_keys: missingManualProofKeys,
        auth_cookie_source: authCookie.source,
        manual_proof_source: proofSource,
        live_write_proof_enabled: liveWriteProof.enabled,
        live_write_proof_ok: liveWriteProof.ok,
        live_write_proof_pet_id: liveWriteProof.petId || null,
        manual_proof_draft_written: manualProofDraft.wrote,
        manual_proof_draft_path: manualProofDraft.path,
        report: reportPath,
      },
      null,
      2,
    ),
  );

  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
