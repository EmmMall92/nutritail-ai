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
    label: "Recommendation cards expose customer portion label",
    file: "app/account/chatbot/page.tsx",
    expected: "Estimated portion",
  },
  {
    label: "Chosen recommendation points user to save the plan",
    file: "app/account/chatbot/page.tsx",
    expected: "Press save to keep this plan on the pet profile.",
  },
  {
    label: "Recommendation cards use customer role badges",
    file: "app/account/chatbot/page.tsx",
    expected: "getRecommendationChoiceBadgeLabel",
  },
  {
    label: "Recommendation cards expose portion estimate badge",
    file: "app/account/chatbot/page.tsx",
    expected: "Portion estimate",
  },
  {
    label: "Recommendation composer has compact customer fallback",
    file: "app/account/chatbot/page.tsx",
    expected: "formatCompactFoodV2RecommendationFallback",
  },
  {
    label: "Compact recommendation fallback points to food cards",
    file: "app/account/chatbot/page.tsx",
    expected: "Choose one card below",
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
    label: "Printable report uses customer-facing saved food insights heading",
    file: "app/print/pet-report/page.tsx",
    expected: "Saved Food Insights",
  },
  {
    label: "Printable timeline uses customer-facing saved food insights heading",
    file: "app/print/pet-timeline/[id]/page.tsx",
    expected: "Latest Saved Food Insights",
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
    label: "Printable report does not expose legacy food analysis wording",
    file: "app/print/pet-report/page.tsx",
    forbidden: "Legacy Food Analysis Signals",
  },
  {
    label: "Printable timeline does not expose legacy food analysis wording",
    file: "app/print/pet-timeline/[id]/page.tsx",
    forbidden: "Legacy Food Analysis Signals",
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
