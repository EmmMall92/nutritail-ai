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
    label: "Recommendation cards expose tap-for-grams badge",
    file: "app/account/chatbot/page.tsx",
    expected: "Tap for grams",
  },
  {
    label: "Recommendation composer has compact customer fallback",
    file: "app/account/chatbot/page.tsx",
    expected: "formatCompactFoodV2RecommendationFallback",
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
    label: "Progress check accepts weight-only first reply",
    file: "app/account/chatbot/page.tsx",
    expected: "You can start with only the current weight, for example 7 kg.",
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
