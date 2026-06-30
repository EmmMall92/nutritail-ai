import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const reportPath =
  process.env.NUTRITAIL_CHATBOT_GOLDEN_SUITE_REPORT ||
  "reports/chatbot_golden_suite.md";
const strictMode = process.argv.includes("--strict");
const fastMode = process.argv.includes("--fast");
const defaultTimeoutMs = fastMode ? 180_000 : 600_000;
const configuredTimeoutMs = Number(
  process.env.NUTRITAIL_CHATBOT_GOLDEN_SUITE_TIMEOUT_MS ?? defaultTimeoutMs
);
const timeoutMs =
  Number.isFinite(configuredTimeoutMs) && configuredTimeoutMs > 0
    ? configuredTimeoutMs
    : defaultTimeoutMs;

if (strictMode) {
  process.env.NUTRITAIL_QA_DOG_QUALITY_MAX_REVIEW ??= "0";
}

const fullChecks = [
  {
    name: "AI intake golden cases",
    command: "npm.cmd",
    args: ["run", "qa:ai-intake"],
    covers: "OpenAI/fallback fact extraction, pet name cleanup, preference parsing, weight limits.",
  },
  {
    name: "Bulk chatbot case intake",
    command: "npm.cmd",
    args: ["run", "qa:chatbot-case-intake"],
    covers: "Future dog/cat golden case batches have valid ids, prompts, species, locale, safety expectations, and duplicate checks.",
  },
  {
    name: "Chatbot intake cleanup",
    command: "npm.cmd",
    args: ["run", "qa:chatbot-intake-cleanup"],
    covers: "Live-style Greek pet name cleanup and liked/avoided protein conflict reconciliation.",
  },
  {
    name: "Dog edge fixture 101-200",
    command: "npm.cmd",
    args: ["run", "qa:dog-edge-fixture"],
    covers: "User-supplied dog cases 101-200 fixture structure and required expectations.",
  },
  {
    name: "Dog golden coverage audit",
    command: "npm.cmd",
    args: ["run", "audit:dog-chatbot-golden-coverage"],
    covers: "200 live runner ids, fixture coverage, duplicates, and damaged prompt detection.",
  },
  {
    name: "Dog 201-600 coverage audit",
    command: "npm.cmd",
    args: ["run", "audit:dog-201-600-coverage"],
    covers:
      "400 additional dog cases cover growth, sterilised, allergy, senior, GI, renal, urinary, value, premium, activity, and safety scenarios.",
  },
  {
    name: "Cat 001-500 coverage audit",
    command: "npm.cmd",
    args: ["run", "audit:cat-chatbot-coverage"],
    covers:
      "500 cat cases cover urinary, renal, kitten/growth, allergy, senior, sterilised, weight-control, preference, and urgent safety scenarios.",
  },
  {
    name: "Food Intelligence use cases",
    command: "npm.cmd",
    args: ["run", "qa:food-intelligence-use-cases"],
    covers: "Strengths, cautions, best use cases, and not-ideal cases for weight, growth, senior, renal, allergy, skin/coat, and active-food logic.",
  },
  {
    name: "Medical nutrition rules",
    command: "npm.cmd",
    args: ["run", "qa:medical-rules"],
    covers: "Renal and urinary mineral-context rules, veterinary safety notes, and Food V2 ranking signals.",
  },
  {
    name: "GI allergy senior v2 rules",
    command: "npm.cmd",
    args: ["run", "qa:gi-allergy-senior-v2"],
    covers: "GI symptom ranking, allergy/intolerance hard rejects, and senior low-appetite/chewing logic.",
  },
  {
    name: "Pancreatitis fat-sensitive v2 rules",
    command: "npm.cmd",
    args: ["run", "qa:pancreatitis-fat-sensitive-v2"],
    covers: "Pancreatitis and fat-sensitive low-fat fit, missing-fat caution, high-fat holds, and vet framing.",
  },
  {
    name: "Nutrition source-map intake",
    command: "npm.cmd",
    args: ["run", "qa:nutrition-source-map-intake"],
    covers: "Book and training source maps define allowed uses, copyright policy, topics, and target rule files before rules are extracted.",
  },
  {
    name: "Food V2 ranking scenarios",
    command: "npm.cmd",
    args: ["run", "audit:food-v2-ranking-scenarios"],
    covers: "Condition-specific recommendation accuracy for sterilised, senior, allergy, urinary, renal, growth, and active-dog scenarios.",
  },
  {
    name: "Food V2 guard coverage",
    command: "npm.cmd",
    args: ["run", "qa:food-v2-guard-coverage"],
    covers: "Every blocking Food V2 ranking signal is exposed through recommendation guard diagnostics.",
  },
  {
    name: "Chatbot portion estimates",
    command: "npm.cmd",
    args: ["run", "qa:chatbot-portions"],
    covers: "Choose food -> estimate grams/day using main-food calories after treat allowance.",
  },
  {
    name: "Customer chatbot flow links",
    command: "npm.cmd",
    args: ["run", "qa:customer-chatbot-flow-links"],
    covers: "Saved analysis next steps, pet profile/report/timeline/progress links, and customer-facing recommendation card actions.",
  },
  {
    name: "Customer recommendation smoke",
    command: "npm.cmd",
    args: ["run", "qa:customer-recommendation-smoke"],
    covers: "Customer-facing summaries for sterilised, weight loss, allergy, GI, urinary, renal, growth, active, and senior scenarios stay simple and card-action oriented.",
  },
  {
    name: "Account progress live routes",
    command: "npm.cmd",
    args: ["run", "qa:account-progress-live-routes"],
    covers: "Live account chatbot/report/timeline/progress routes respond safely on production.",
  },
  {
    name: "Live dog chatbot 200 cases",
    command: "npm.cmd",
    args: ["run", "qa:dog-chatbot-live-cases"],
    covers: "Live extraction, safety expectations, Food V2 candidates, and recommendation guards.",
  },
  {
    name: "Live dog chatbot 201-600 smoke cases",
    command: "npm.cmd",
    args: ["run", "qa:dog-chatbot-live-201-600-smoke"],
    covers:
      "Representative live dog scenarios from the 201-600 bank across picky eating, pregnancy, urinary, underweight, allergy, climate, rescue, sterilised, value, active, puppy, and premium requests.",
  },
  {
    name: "Live cat chatbot 100 cases",
    command: "npm.cmd",
    args: ["run", "qa:cat-chatbot-live-cases"],
    covers:
      "Live cat recommendation behavior across sterilised, kitten/growth, urinary, renal, weight-control, allergy, hairball, senior, fussy-eater, rescue, and climate scenarios.",
  },
  {
    name: "Dog chatbot quality audit",
    command: "npm.cmd",
    args: ["run", "audit:dog-chatbot-quality"],
    covers: "Qualitative review of the generated 200-case report for growth, renal, urinary, senior, allergy, GI, sterilised, and active-dog top-food positioning.",
  },
  {
    name: "Customer-facing recommendation copy",
    command: "npm.cmd",
    args: ["run", "qa:chatbot-customer-recommendations"],
    covers: "No back-office wording in customer chatbot recommendations and card action flow.",
  },
];

const fastCheckNames = new Set([
  "AI intake golden cases",
  "Bulk chatbot case intake",
  "Chatbot intake cleanup",
  "Dog edge fixture 101-200",
  "Dog golden coverage audit",
  "Dog 201-600 coverage audit",
  "Cat 001-500 coverage audit",
  "Food Intelligence use cases",
  "Medical nutrition rules",
  "GI allergy senior v2 rules",
  "Pancreatitis fat-sensitive v2 rules",
  "Nutrition source-map intake",
  "Food V2 ranking scenarios",
  "Food V2 guard coverage",
  "Chatbot portion estimates",
  "Customer chatbot flow links",
  "Customer recommendation smoke",
  "Live dog chatbot smoke cases",
  "Live dog chatbot 201-600 smoke cases",
  "Live cat chatbot 100 cases",
  "Customer-facing recommendation copy",
]);

const checks = fastMode
  ? fullChecks
      .map((check) =>
        check.name === "Live dog chatbot 200 cases"
          ? {
              ...check,
              name: "Live dog chatbot smoke cases",
              args: ["run", "qa:dog-chatbot-live-smoke"],
              covers:
                "Representative live dog chatbot smoke cases across growth, sterilised, allergy, urinary, renal, active, senior, and rescue contexts.",
            }
          : check
      )
      .filter((check) => fastCheckNames.has(check.name))
  : fullChecks;

const fullObjectiveCoverage = [
  {
    objective: "1. Recommendation accuracy",
    evidence:
      "Food V2 ranking scenarios, food preference ranking, dog live cases, and feeding rules cover sterilised, senior, allergy, urinary, renal, large-dog size fit, large-breed puppy, and active-dog logic.",
  },
  {
    objective: "2. Customer-facing answer quality",
    evidence:
      "Customer recommendation copy, customer recommendation smoke, and customer chatbot flow links guard against back-office wording and verify food-card action flow.",
  },
  {
    objective: "3. Large dog/cat live chatbot case coverage",
    evidence:
      "Dog edge fixture, dog golden coverage audit, dog 201-600 coverage audit, cat 001-500 coverage audit, live runners, and quality audits prove the large dog/cat scenario set is structurally sound and covers required safety/recommendation checks.",
  },
  {
    objective: "4. Brand data cleanup",
    evidence:
      "Title/source/duplicate/product-form QA scripts keep customer-facing food names, duplicate risks, and non-complete-food guards visible.",
  },
  {
    objective: "5. Food Intelligence",
    evidence:
      "Food Intelligence use-case QA checks strengths, cautions, best use cases, and not-ideal cases for major nutrition contexts.",
  },
  {
    objective: "6. End-to-end user experience",
    evidence:
      "Customer flow links and live route checks cover login/account chatbot, report, timeline, progress, and food-selection next steps.",
  },
];

const fastObjectiveCoverage = fullObjectiveCoverage.map((item) => {
  if (item.objective === "3. Large dog/cat live chatbot case coverage") {
    return {
      ...item,
      evidence:
        "Dog edge fixture, dog 1-200 coverage, dog 201-600 coverage, cat 001-500 coverage, dog live smoke, dog 201-600 smoke, and cat live 100-case checks prove the large case bank is structurally sound and has live regression feedback.",
    };
  }

  if (item.objective === "6. End-to-end user experience") {
    return {
      ...item,
      evidence:
        "Customer flow links cover account chatbot, report, timeline, progress, and food-selection next steps. The fast suite skips slower live route checks; run the full or strict suite for live route signoff.",
    };
  }

  return item;
});

const objectiveCoverage = fastMode ? fastObjectiveCoverage : fullObjectiveCoverage;

function runCheck(check) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    let settled = false;
    const command =
      process.platform === "win32" ? "cmd.exe" : check.command;
    const args =
      process.platform === "win32"
        ? ["/d", "/s", "/c", [check.command, ...check.args].join(" ")]
        : check.args;
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      shell: false,
    });
    let stdout = "";
    let stderr = "";
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(result);
    };
    const timeout = setTimeout(() => {
      const durationMs = Date.now() - startedAt;
      const message = `${check.name} exceeded ${(timeoutMs / 1000).toFixed(
        0
      )}s timeout.`;

      if (process.platform === "win32" && child.pid) {
        spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
          stdio: "ignore",
          shell: false,
        });
      } else {
        child.kill("SIGTERM");
      }

      stderr += `\n${message}\n`;
      process.stderr.write(`\n${message}\n`);
      finish({
        ...check,
        status: "fail",
        exitCode: "timeout",
        durationMs,
        stdout,
        stderr,
      });
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on("error", (error) => {
      stderr += `\n${error.message}\n`;
      finish({
        ...check,
        status: "fail",
        exitCode: "spawn_error",
        durationMs: Date.now() - startedAt,
        stdout,
        stderr,
      });
    });

    child.on("close", (code) => {
      finish({
        ...check,
        status: code === 0 ? "pass" : "fail",
        exitCode: code,
        durationMs: Date.now() - startedAt,
        stdout,
        stderr,
      });
    });
  });
}

function summarizeOutput(value) {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  return lines.slice(-12).join("\n");
}

async function main() {
  const results = [];

  for (const check of checks) {
    console.log(`\n=== ${check.name} ===`);
    const result = await runCheck(check);
    results.push(result);

    if (result.status !== "pass") {
      break;
    }
  }

  const failed = results.filter((result) => result.status !== "pass");
  const lines = [
    "# Chatbot Golden Suite",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Mode: ${strictMode ? "strict" : fastMode ? "fast" : "full"}`,
    `- Per-check timeout: ${(timeoutMs / 1000).toFixed(0)}s`,
    `- Checks run: ${results.length}/${checks.length}`,
    `- Passed: ${results.filter((result) => result.status === "pass").length}`,
    `- Failed: ${failed.length}`,
    "",
    "## Coverage",
    "",
    ...checks.map((check) => `- ${check.name}: ${check.covers}`),
    "",
    "## Objective Coverage",
    "",
    ...objectiveCoverage.map(
      (item) => `- ${item.objective}: ${item.evidence}`
    ),
    "",
    "## Results",
    "",
    ...results.flatMap((result) => [
      `### ${result.name}`,
      "",
      `- Status: ${result.status}`,
      `- Duration: ${(result.durationMs / 1000).toFixed(1)}s`,
      `- Command: \`${[result.command, ...result.args].join(" ")}\``,
      "",
      "```text",
      summarizeOutput(`${result.stdout}\n${result.stderr}`) || "(no output)",
      "```",
      "",
    ]),
  ];

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${lines.join("\n")}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        checks: results.length,
        passed: results.filter((result) => result.status === "pass").length,
        failed: failed.length,
        report: reportPath,
      },
      null,
      2
    )
  );

  if (failed.length > 0 || results.length !== checks.length) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
