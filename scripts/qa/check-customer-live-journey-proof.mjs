import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const siteUrl = process.env.NUTRITAIL_QA_SITE_URL || "https://nutritail.ai";
const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH ||
  "reports/customer_live_journey_proof_qa.md";
const defaultCookieFile = ".qa-secrets/nutritail-auth-cookie.txt";
const authCookieFile =
  process.env.NUTRITAIL_QA_AUTH_COOKIE_FILE?.trim() || defaultCookieFile;
const defaultManualProofFile = ".qa-secrets/customer-live-journey-proof.json";
const manualProofFile =
  process.env.NUTRITAIL_QA_MANUAL_PROOF_FILE?.trim() || defaultManualProofFile;

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

function loadAuthCookie() {
  const fromEnv = process.env.NUTRITAIL_QA_AUTH_COOKIE?.trim() || "";
  if (fromEnv) {
    return {
      value: fromEnv,
      source: "NUTRITAIL_QA_AUTH_COOKIE",
      note: "Cookie loaded from environment variable.",
    };
  }

  if (!existsSync(authCookieFile)) {
    return {
      value: "",
      source: "missing",
      note: `No cookie file found at ${authCookieFile}.`,
    };
  }

  const fromFile = readFileSync(authCookieFile, "utf8").trim();

  return {
    value: fromFile,
    source: fromFile ? "NUTRITAIL_QA_AUTH_COOKIE_FILE" : "empty file",
    note: fromFile
      ? "Cookie loaded from local ignored file."
      : `Cookie file ${authCookieFile} is empty.`,
  };
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

function getManualProofStatus(proof, key) {
  const entry = proof?.[key];
  const evidence = Array.isArray(entry?.evidence) ? entry.evidence.filter(Boolean) : [];
  const ok = entry?.passed === true && evidence.length > 0;

  return {
    ok,
    evidenceCount: evidence.length,
    note: ok
      ? evidence.slice(0, 2).join("; ")
      : "Needs browser proof with passed=true and at least one evidence note.",
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
  rows.push({
    step: "Food V2 recommendation cards",
    route: "/api/account/foods/v2-recommendations",
    status: recommendations.status,
    result: recommendations.status === 200 && recommendationShape.ok ? "pass" : "fail",
    durationMs: recommendations.durationMs,
    notes: `${recommendationShape.visibleCount} visible choices; premium ${recommendationShape.premiumCount}/3; value ${recommendationShape.valueCount}/3; first ${recommendationShape.firstFood || "-"}`,
  });

  const manualJourneyKeys = {
    food_choice_grams: "Food choice and grams/day",
    save_analysis: "Save analysis",
    open_report: "Open report",
    open_timeline: "Open timeline",
    return_for_progress: "Return for progress",
  };
  const manualJourneyResults = Object.entries(manualJourneyKeys).map(([key, name]) => {
    const manualStatus = getManualProofStatus(manualProof.proof, key);

    return {
      key,
      name,
      status: manualStatus.ok ? "manual-pass" : "manual-required",
      evidenceCount: manualStatus.evidenceCount,
      note: manualStatus.note,
    };
  });
  const manualJourneysPassed = manualJourneyResults.every((journey) => journey.status === "manual-pass");
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
        "Return to the same saved pet and complete progress, no-result, or flavour/brand-change follow-up.",
    },
  ];
  const unlockImpact =
    status === "PASS_FULL"
      ? "This supports moving Customer UX beyond 83% because authenticated extraction, recommendations, save, report, timeline, and returning progress have current proof."
      : status === "PASS_NON_DESTRUCTIVE"
        ? "This supports the non-destructive part of the Customer UX unlock. Manual save/report/timeline/progress proof is still required before raising the score above 83%."
        : "This does not move Customer UX above 83% yet because logged-in production journey proof is still missing.";

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
      `- Manual proof source: ${manualProof.source}`,
      `- Unlock impact: ${unlockImpact}`,
      `- Customer journeys tracked: ${journeyProofs.length}`,
      `- Manual journeys still required: ${journeyProofs.filter((journey) => journey.status === "manual-required").length}`,
      `- Manual browser journeys passed: ${manualJourneyResults.filter((journey) => journey.status === "manual-pass").length}/${manualJourneyResults.length}`,
      "",
      "## Results",
      "",
      renderTable(rows),
      "",
      "## Customer Journey Proof Checklist",
      "",
      "These are the five customer-visible journeys that must pass before Customer UX can move above the 82% band.",
      "",
      renderJourneyTable(journeyProofs),
      "",
      "## Manual Browser Proof",
      "",
      "| Journey | Status | Evidence notes |",
      "| --- | --- | --- |",
      ...manualJourneyResults.map(
        (journey) =>
          `| ${journey.name} | ${journey.status} | ${journey.evidenceCount > 0 ? journey.note : "missing"} |`,
      ),
      "",
      "## To Complete The 83-85% Customer UX Gate",
      "",
      "1. Put a QA account Cookie header in `.qa-secrets/nutritail-auth-cookie.txt` or set `NUTRITAIL_QA_AUTH_COOKIE_FILE`.",
      "2. Run `npm.cmd run qa:customer-live-journey-proof`.",
      "3. In the browser, complete the manual part: choose one food, confirm grams/day, save, open report, open timeline, and return for progress.",
      "4. Record browser evidence in `.qa-secrets/customer-live-journey-proof.json` using the documented keys.",
      "5. Re-run `npm.cmd run qa:customer-live-journey-proof` and only then update the Customer UX score above 83%.",
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
        auth_cookie_source: authCookie.source,
        manual_proof_source: manualProof.source,
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
