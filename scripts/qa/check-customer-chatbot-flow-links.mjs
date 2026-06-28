import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH ||
  "reports/customer_chatbot_flow_links_qa.md";

const checks = [
  {
    label: "Chatbot reads petId query parameter",
    file: "app/account/chatbot/page.tsx",
    expected: 'query.get("petId")',
  },
  {
    label: "Chatbot reads progress mode query parameter",
    file: "app/account/chatbot/page.tsx",
    expected: 'query.get("mode")',
  },
  {
    label: "Chatbot opens direct progress mode",
    file: "app/account/chatbot/page.tsx",
    expected: 'mode === "progress"',
  },
  {
    label: "Account dashboard progress action deep-links to saved pet",
    file: "app/account/page.tsx",
    expected: "/account/chatbot?petId=${latestPet.id}&mode=progress",
  },
  {
    label: "Account dashboard receives latest pet progress log",
    file: "app/api/account/pets/route.ts",
    expected: "latestProgressLog",
  },
  {
    label: "Account dashboard shows latest progress decision card",
    file: "app/account/page.tsx",
    expected: "Latest progress decision",
  },
  {
    label: "Account dashboard links latest progress to a new progress check",
    file: "app/account/page.tsx",
    expected: "/account/chatbot?petId=${latestProgressPet.id}&mode=progress",
  },
  {
    label: "Pets list progress action deep-links to saved pet",
    file: "app/account/pets/page.tsx",
    expected: "/account/chatbot?petId=${pet.id}&mode=progress",
  },
  {
    label: "Pets list run analysis action deep-links to saved pet",
    file: "app/account/pets/page.tsx",
    expected: "/account/chatbot?petId=${pet.id}",
  },
  {
    label: "Pets list explains resting calories in customer language",
    file: "app/account/pets/page.tsx",
    expected: "Resting calories",
  },
  {
    label: "Pets list explains daily target in customer language",
    file: "app/account/pets/page.tsx",
    expected: "Daily target",
  },
  {
    label: "Pets list uses customer-facing food-fit wording",
    file: "app/account/pets/page.tsx",
    expected: "Food fit:",
  },
  {
    label: "Pet detail progress action deep-links to saved pet",
    file: "app/account/pets/[id]/page.tsx",
    expected: "/account/chatbot?petId=${pet.id}&mode=progress",
  },
  {
    label: "Pet detail analysis action deep-links to saved pet",
    file: "app/account/pets/[id]/page.tsx",
    expected: "/account/chatbot?petId=${pet.id}",
  },
  {
    label: "Saved chatbot analysis links to printable report",
    file: "app/account/chatbot/page.tsx",
    expected: "/print/pet-report/${savedPetId}",
  },
  {
    label: "Saved chatbot analysis links to printable timeline",
    file: "app/account/chatbot/page.tsx",
    expected: "/print/pet-timeline/${savedPetId}",
  },
  {
    label: "Saved chatbot analysis links to progress check",
    file: "app/account/chatbot/page.tsx",
    expected: "/account/chatbot?petId=${savedPetId}&mode=progress",
  },
  {
    label: "Recommendation cards preview grams before choosing food",
    file: "app/account/chatbot/page.tsx",
    expected: "getRecommendationChoicePortionPreview",
  },
  {
    label: "Recommendation cards expose customer grams/day label",
    file: "app/account/chatbot/page.tsx",
    expected: "Foods worth checking first",
  },
  {
    label: "Chosen recommendation points user to save the plan",
    file: "app/account/chatbot/page.tsx",
    expected: "Press save to keep calories, food choice, and first portion on the profile.",
  },
  {
    label: "Recommendation cards use customer role badges",
    file: "app/account/chatbot/page.tsx",
    expected: "getRecommendationChoiceBadgeLabel",
  },
  {
    label: "Recommendation cards expose estimate portion badge",
    file: "app/account/chatbot/page.tsx",
    expected: "Estimate portion",
  },
  {
    label: "Recommendation composer has compact customer fallback",
    file: "app/account/chatbot/page.tsx",
    expected: "formatCompactFoodV2RecommendationFallback",
  },
  {
    label: "Chatbot locks rapid message submits immediately",
    file: "app/account/chatbot/page.tsx",
    expected: "processingMessageRef.current",
  },
  {
    label: "Chatbot disables input while preparing a reply",
    file: "app/account/chatbot/page.tsx",
    expected: "disabled={isProcessingMessage || isAnalyzing || isSaving}",
  },
  {
    label: "Compact recommendation fallback points to food cards",
    file: "app/account/chatbot/page.tsx",
    expected: "Choose one food card below to estimate daily portions. After that, you can save the plan.",
  },
  {
    label: "Saved chatbot analysis frames next steps as ready",
    file: "app/account/chatbot/page.tsx",
    expected: "Your pet profile, report, timeline, and progress check are ready. Choose what you want to do next.",
  },
  {
    label: "Saved chatbot analysis explains recommended next step",
    file: "app/account/chatbot/page.tsx",
    expected: "Open the report first to keep calories, portion, and food choice in one place.",
  },
  {
    label: "Saved chatbot analysis sets progress check timing",
    file: "app/account/chatbot/page.tsx",
    expected: "After 2-4 weeks, run a progress check with updated weight, grams/day, and treats.",
  },
  {
    label: "Saved chatbot analysis exposes progress check action",
    file: "app/account/chatbot/page.tsx",
    expected: "Weight, grams, treats, and results.",
  },
  {
    label: "Saved pet selection preserves pending comparison intent",
    file: "app/account/chatbot/page.tsx",
    expected: "const pendingCompare = [...pendingCompareQueries]",
  },
  {
    label: "Saved pet selection clears pending comparison after handoff",
    file: "app/account/chatbot/page.tsx",
    expected: "setPendingCompareQueries([])",
  },
  {
    label: "Saved pet selection runs pending comparison with pet species",
    file: "app/account/chatbot/page.tsx",
    expected: "await runFoodComparison(pendingCompare, { species: nextPet.species })",
  },
  {
    label: "Saved pet chatbot intake uses formatted pet display names",
    file: "app/account/chatbot/page.tsx",
    expected: "name: formatPetDisplayName(savedPet.name)",
  },
  {
    label: "Saved pet chatbot messages use formatted pet display names",
    file: "app/account/chatbot/page.tsx",
    expected: "const savedPetName = formatPetDisplayName(savedPet.name)",
  },
  {
    label: "Saved pet follow-up messages use formatted pet display names",
    file: "app/account/chatbot/page.tsx",
    expected: "const targetPetName = formatPetDisplayName(targetPet.name)",
  },
  {
    label: "Saved pet handoff user echo is localized",
    file: "app/account/chatbot/page.tsx",
    expected: "formatSavedPetUserEcho(savedPetName, chatLanguage)",
  },
  {
    label: "Saved pet current-food prompt is localized",
    file: "app/account/chatbot/page.tsx",
    expected: "formatSavedPetCurrentFoodPrompt(savedPetName, chatLanguage)",
  },
  {
    label: "Saved pet mobile progress shortcut is localized",
    file: "app/account/chatbot/page.tsx",
    expected: 'botText("Έλεγχος", "Progress")',
  },
  {
    label: "Saved pet mobile change-food shortcut is localized",
    file: "app/account/chatbot/page.tsx",
    expected: 'botText("Άλλη τροφή", "Another food")',
  },
  {
    label: "Saved pet picker uses localized customer-facing pet metadata",
    file: "app/account/chatbot/page.tsx",
    expected: "formatSavedPetCardMeta(savedPet, chatLanguage)",
  },
  {
    label: "Saved pet profile summary localizes activity labels",
    file: "app/account/chatbot/page.tsx",
    expected: "formatSavedPetActivityLabel(savedPet.activity_level, language)",
  },
  {
    label: "Saved pet comparison handoff offers next actions",
    file: "app/account/chatbot/page.tsx",
    expected:
      "After the comparison, I can run a fresh analysis, a progress check, or another-food recommendation for this pet.",
  },
  {
    label: "Progress check accepts weight-only first reply",
    file: "app/account/chatbot/page.tsx",
    expected: "You can start with only the current weight, for example 7 kg.",
  },
  {
    label: "Progress check sends appetite context to the progress API",
    file: "app/account/chatbot/page.tsx",
    expected: "appetiteNote: details.appetiteNote",
  },
  {
    label: "Progress API stores appetite context in progress metadata",
    file: "app/api/account/pets/[id]/progress/route.ts",
    expected: "appetiteNote: appetiteNote || null",
  },
  {
    label: "Progress check sends deterministic decision status",
    file: "app/account/chatbot/page.tsx",
    expected: "progressDecisionStatus: progressDecision.status",
  },
  {
    label: "Progress decision exposes focused next-step action panel",
    file: "app/account/chatbot/page.tsx",
    expected: "getProgressDecisionActions(latestProgressDecisionStatus).map",
  },
  {
    label: "Progress decision panel can recommend another food",
    file: "app/account/chatbot/page.tsx",
    expected: "review_food_fit",
  },
  {
    label: "Progress API stores deterministic decision status",
    file: "app/api/account/pets/[id]/progress/route.ts",
    expected: "progressDecisionStatus: progressDecisionStatus || null",
  },
  {
    label: "Pet detail latest progress shows appetite chip",
    file: "app/account/pets/[id]/page.tsx",
    expected: "Appetite: {formatProgressChipLabel(progressSummary.appetiteNote)}",
  },
  {
    label: "Pet detail latest progress shows decision chip",
    file: "app/account/pets/[id]/page.tsx",
    expected: "Decision: {formatProgressChipLabel(progressSummary.progressDecisionStatus)}",
  },
  {
    label: "Pet detail timeline shows structured progress chips",
    file: "app/account/pets/[id]/page.tsx",
    expected: "getProgressContextChips(log.metadata).map",
  },
  {
    label: "Printable timeline shows structured stool progress",
    file: "app/print/pet-timeline/[id]/page.tsx",
    expected: "formatProgressChipLabel(log.metadata?.stoolNote)",
  },
  {
    label: "Printable timeline shows progress decision",
    file: "app/print/pet-timeline/[id]/page.tsx",
    expected: "Progress decision:",
  },
  {
    label: "Analysis in-progress message is localized",
    file: "app/account/chatbot/page.tsx",
    expected: "Περίμενε λίγο, ολοκληρώνω την ανάλυση.",
  },
  {
    label: "Analysis complete message is localized",
    file: "app/account/chatbot/page.tsx",
    expected:
      "Η ανάλυση ολοκληρώθηκε. Μπορείς να την αποθηκεύσεις ή να ξεκινήσεις ξανά.",
  },
  {
    label: "Printable timeline uses customer-facing food recommendation label",
    file: "app/print/pet-timeline/[id]/page.tsx",
    expected: "Food recommendation:",
  },
  {
    label: "Pet detail analysis history uses customer-facing food recommendation label",
    file: "app/account/pets/[id]/page.tsx",
    expected: "Food recommendation:",
  },
  {
    label: "Pet detail food score uses customer-facing recheck wording",
    file: "app/account/pets/[id]/page.tsx",
    expected: "Worth rechecking",
  },
  {
    label: "Pet detail uses customer-facing food-fit card label",
    file: "app/account/pets/[id]/page.tsx",
    expected: "Food fit",
  },
  {
    label: "Pet detail weight edit uses species-aware customer limit",
    file: "app/account/pets/[id]/page.tsx",
    expected: 'const maxPetWeightKg = pet.species === "cat" ? 15 : 90;',
  },
  {
    label: "Printable report uses customer-facing saved food insights heading",
    file: "app/print/pet-report/page.tsx",
    expected: "Saved Food Insights",
  },
  {
    label: "Printable timeline uses customer-facing saved food insights heading",
    file: "app/print/pet-timeline/[id]/page.tsx",
    expected: "Latest Saved Food Insights",
  },
  {
    label: "Printable report gives a customer follow-up plan",
    file: "app/print/pet-report/[id]/page.tsx",
    expected: "Follow-up Plan",
  },
  {
    label: "Printable report uses customer-facing plan status wording",
    file: "app/print/pet-report/[id]/page.tsx",
    expected: "Plan status",
  },
  {
    label: "Printable report uses customer-facing food-fit wording",
    file: "app/print/pet-report/[id]/page.tsx",
    expected: "Fresh analysis suggested",
  },
  {
    label: "Printable report explains when to ask for a new shortlist",
    file: "app/print/pet-report/[id]/page.tsx",
    expected: "When to ask for a new shortlist",
  },
  {
    label: "Printable timeline asks for grams and food refusal notes",
    file: "app/print/pet-timeline/[id]/page.tsx",
    expected: "Bring the current daily grams and any food refusal notes into the next chatbot Progress check.",
  },
  {
    label: "Printable timeline explains resting calories in customer language",
    file: "app/print/pet-timeline/[id]/page.tsx",
    expected: "Resting calories",
  },
  {
    label: "Pet detail explains resting calories in customer language",
    file: "app/account/pets/[id]/page.tsx",
    expected: "Resting calories",
  },
  {
    label: "Pet detail explains daily target in customer language",
    file: "app/account/pets/[id]/page.tsx",
    expected: "Daily target",
  },
  {
    label: "Printable timeline explains daily target in customer language",
    file: "app/print/pet-timeline/[id]/page.tsx",
    expected: "Practical calories for the current plan",
  },
  {
    label: "Printable timeline uses customer nutrition-notes heading",
    file: "app/print/pet-timeline/[id]/page.tsx",
    expected: "Latest Nutrition Notes",
  },
  {
    label: "Chat guardrails use customer-facing practical notes",
    file: "lib/nutrition/chatGuardrails.ts",
    expected: "Practical notes:",
  },
  {
    label: "Greek chatbot guardrail copy uses customer-friendly caution heading",
    file: "app/account/chatbot/page.tsx",
    expected: "Μικρή προσοχή πριν δούμε τις τροφές:",
  },
];

const forbiddenChecks = [
  {
    label: "Saved pet handoff does not use raw English Use echo",
    file: "app/account/chatbot/page.tsx",
    forbidden: "createMessage(\"user\", `Use ${savedPetName}`)",
  },
  {
    label: "Saved pet prompt does not use old English-only current-food text",
    file: "app/account/chatbot/page.tsx",
    forbidden: "Great. I will use ${savedPetName}'s saved profile.",
  },
  {
    label: "Saved pet mobile shortcut does not hardcode Progress",
    file: "app/account/chatbot/page.tsx",
    forbidden: ">Progress</button>",
  },
  {
    label: "Saved pet mobile shortcut does not hardcode Another food",
    file: "app/account/chatbot/page.tsx",
    forbidden: ">Another food</button>",
  },
  {
    label: "Current-food candidate copy does not expose matcher score",
    file: "app/account/chatbot/page.tsx",
    forbidden: "${confidence}, score ${score}",
  },
  {
    label: "Current-food quality note does not expose data-quality label",
    file: "app/account/chatbot/page.tsx",
    forbidden: "Data quality:",
  },
  {
    label: "Recommendation card badge does not expose raw internal score",
    file: "app/account/chatbot/page.tsx",
    forbidden: "Math.round(choice.score)}/100",
  },
  {
    label: "Recommendation cards no longer use old match-label helper",
    file: "app/account/chatbot/page.tsx",
    forbidden: "getRecommendationChoiceMatchLabel",
  },
  {
    label: "Printable timeline does not expose raw recommended food ids",
    file: "app/print/pet-timeline/[id]/page.tsx",
    forbidden: "Recommended Food IDs",
  },
  {
    label: "Pet detail page does not expose legacy food signal ids",
    file: "app/account/pets/[id]/page.tsx",
    forbidden: "Legacy food signal ids",
  },
  {
    label: "Pet detail food score does not expose back-office review wording",
    file: "app/account/pets/[id]/page.tsx",
    forbidden: "Needs review",
  },
  {
    label: "Pet detail does not expose raw food-score wording",
    file: "app/account/pets/[id]/page.tsx",
    forbidden: "Food score",
  },
  {
    label: "Pet detail does not expose raw score fraction",
    file: "app/account/pets/[id]/page.tsx",
    forbidden: "/100",
  },
  {
    label: "Pets list does not expose RER card label",
    file: "app/account/pets/page.tsx",
    forbidden: "RER {latest.rer} kcal",
  },
  {
    label: "Pets list does not expose MER card label",
    file: "app/account/pets/page.tsx",
    forbidden: "MER {latest.mer} kcal",
  },
  {
    label: "Pets list does not expose raw score fraction",
    file: "app/account/pets/page.tsx",
    forbidden: "Score {latest.food_score}/100",
  },
  {
    label: "Pet detail weight edit does not allow unrealistic legacy limit",
    file: "app/account/pets/[id]/page.tsx",
    forbidden: 'max="150"',
  },
  {
    label: "Printable report does not expose legacy food analysis wording",
    file: "app/print/pet-report/page.tsx",
    forbidden: "Legacy Food Analysis Signals",
  },
  {
    label: "Printable saved report does not expose back-office review wording",
    file: "app/print/pet-report/[id]/page.tsx",
    forbidden: "Needs review",
  },
  {
    label: "Printable saved report does not expose model-confidence wording",
    file: "app/print/pet-report/[id]/page.tsx",
    forbidden: "High confidence",
  },
  {
    label: "Printable saved report does not expose moderate-confidence wording",
    file: "app/print/pet-report/[id]/page.tsx",
    forbidden: "Moderate confidence",
  },
  {
    label: "Printable saved report does not expose raw food-score wording",
    file: "app/print/pet-report/[id]/page.tsx",
    forbidden: "Food score:",
  },
  {
    label: "Printable timeline does not expose legacy food analysis wording",
    file: "app/print/pet-timeline/[id]/page.tsx",
    forbidden: "Legacy Food Analysis Signals",
  },
  {
    label: "Printable timeline does not expose AI-branded nutrition heading",
    file: "app/print/pet-timeline/[id]/page.tsx",
    forbidden: "Latest AI Nutrition Advice",
  },
  {
    label: "Analysis in-progress message is not raw English-only",
    file: "app/account/chatbot/page.tsx",
    forbidden:
      'createMessage("bot", "Hold on a moment, I am finishing the analysis.")',
  },
  {
    label: "Analysis complete message is not raw English-only",
    file: "app/account/chatbot/page.tsx",
    forbidden:
      'createMessage(\n        "bot",\n        "The analysis is complete. You can save it or press Restart."',
  },
  {
    label: "Greek chatbot guardrail copy does not use old English wrapper",
    file: "app/account/chatbot/page.tsx",
    forbidden: "Before food-specific advice, here are the guardrails I would keep in mind:",
  },
  {
    label: "Chat guardrails do not expose confidence heading",
    file: "lib/nutrition/chatGuardrails.ts",
    forbidden: "Confidence notes:",
  },
  {
    label: "Chatbot calorie explanation does not expose RER acronym",
    file: "app/account/chatbot/page.tsx",
    forbidden: "Resting calories (RER)",
  },
  {
    label: "Chatbot calorie explanation does not expose MER/DER acronym",
    file: "app/account/chatbot/page.tsx",
    forbidden: "Base daily target (MER/DER)",
  },
  {
    label: "Pet detail does not expose RER card label",
    file: "app/account/pets/[id]/page.tsx",
    forbidden: ">RER<",
  },
  {
    label: "Pet detail does not expose MER card label",
    file: "app/account/pets/[id]/page.tsx",
    forbidden: ">MER<",
  },
  {
    label: "Printable report history does not expose RER label",
    file: "app/print/pet-report/[id]/page.tsx",
    forbidden: "<strong>RER:</strong>",
  },
  {
    label: "Printable report history does not expose MER label",
    file: "app/print/pet-report/[id]/page.tsx",
    forbidden: "<strong>MER:</strong>",
  },
];

async function runPreserveCompareIntentCheck() {
  const file = "app/account/chatbot/page.tsx";
  const content = await readFile(file, "utf8");
  const start = content.indexOf("function startNewPetFromPetChoice");
  const end = content.indexOf("async function extractIntakeFactsFromMessage", start);
  const body = start >= 0 && end > start ? content.slice(start, end) : "";

  return {
    label: "Starting a new pet preserves pending compare intent",
    file,
    ok:
      body.includes("function startNewPetFromPetChoice") &&
      !body.includes("setPendingCompareQueries([])"),
  };
}

async function runCheck(check) {
  const content = await readFile(check.file, "utf8");
  const ok = content.includes(check.expected);
  return {
    ...check,
    ok,
  };
}

async function runForbiddenCheck(check) {
  const content = await readFile(check.file, "utf8");
  const ok = !content.includes(check.forbidden);
  return {
    label: check.label,
    file: check.file,
    ok,
  };
}

function renderTable(rows) {
  return [
    "| Check | File | Result |",
    "| --- | --- | --- |",
    ...rows.map(
      (row) =>
        `| ${row.label} | \`${row.file}\` | ${row.ok ? "pass" : "fail"} |`
    ),
  ].join("\n");
}

async function main() {
  const rows = [];

  for (const check of checks) {
    rows.push(await runCheck(check));
  }

  for (const check of forbiddenChecks) {
    rows.push(await runForbiddenCheck(check));
  }

  rows.push(await runPreserveCompareIntentCheck());

  const passed = rows.filter((row) => row.ok).length;
  const failed = rows.length - passed;

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(
    reportPath,
    [
      "# Customer Chatbot Flow Link QA",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Summary",
      "",
      `- Checks: ${rows.length}`,
      `- Passed: ${passed}`,
      `- Failed: ${failed}`,
      "",
      "This guards the customer flow where account and pet pages should open the chatbot with the correct saved pet context, especially progress checks.",
      "",
      "## Results",
      "",
      renderTable(rows),
    ].join("\n"),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        checked: rows.length,
        passed,
        failed,
        report: reportPath,
      },
      null,
      2
    )
  );

  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
