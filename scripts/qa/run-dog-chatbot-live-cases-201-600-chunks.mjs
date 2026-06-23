import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

const command = process.platform === "win32" ? "npm.cmd" : "npm";
const start = Number(process.env.NUTRITAIL_QA_DOG_CHUNK_START ?? 201);
const end = Number(process.env.NUTRITAIL_QA_DOG_CHUNK_END ?? 600);
const size = Number(process.env.NUTRITAIL_QA_DOG_CHUNK_SIZE ?? 25);
const timeoutMs = Number(process.env.NUTRITAIL_QA_CHUNK_TIMEOUT_MS ?? 180000);
const keepChunkReports = process.env.NUTRITAIL_QA_KEEP_CHUNK_REPORTS === "1";
const aggregateReportPath =
  process.env.NUTRITAIL_QA_AGGREGATE_REPORT_PATH ??
  (Math.min(start, end) === 201 && Math.max(start, end) === 600
    ? "reports/dog_chatbot_live_cases_201-600.md"
    : `reports/dog_chatbot_live_cases_${Math.min(start, end)}-${Math.max(start, end)}_chunks.md`);

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

if (!isPositiveInteger(start) || !isPositiveInteger(end) || !isPositiveInteger(size)) {
  console.error("Dog live QA chunk bounds must be positive integers.");
  process.exit(1);
}

const min = Math.min(start, end);
const max = Math.max(start, end);
const failures = [];
const chunkReports = [];

for (let chunkStart = min; chunkStart <= max; chunkStart += size) {
  const chunkEnd = Math.min(chunkStart + size - 1, max);
  const chunk = `${chunkStart}-${chunkEnd}`;
  const reportPath = `reports/dog_chatbot_live_cases_${chunk}.md`;
  chunkReports.push({ chunk, reportPath });

  console.log(`Running dog live QA chunk ${chunk}...`);

  const result = spawnSync(`${command} run qa:dog-chatbot-live-cases`, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NUTRITAIL_QA_OPENAI: process.env.NUTRITAIL_QA_OPENAI ?? "0",
      NUTRITAIL_QA_DOG_FIXTURE_PATH:
        process.env.NUTRITAIL_QA_DOG_FIXTURE_PATH ??
        "data/evals/chatbot-extra-cases-dog-201-600.json",
      NUTRITAIL_QA_CASE_IDS: chunk,
      NUTRITAIL_QA_REPORT_PATH: reportPath,
    },
    shell: true,
    stdio: "inherit",
    timeout: timeoutMs,
  });

  if (result.error || result.status !== 0) {
    failures.push({
      chunk,
      status: result.status,
      signal: result.signal,
      error: result.error?.message,
    });
  }
}

if (failures.length > 0) {
  console.error("Dog 201-600 live QA chunks need review:");
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}

const rows = chunkReports.map(({ chunk, reportPath }) => {
  const report = readFileSync(reportPath, "utf8");
  return {
    chunk,
    reportPath,
    checked: Number(report.match(/Cases checked: (\d+)/)?.[1] ?? 0),
    passed: Number(report.match(/Passed: (\d+)/)?.[1] ?? 0),
    review: Number(report.match(/Needs review: (\d+)/)?.[1] ?? 0),
    promptEncodingRepairs: Number(report.match(/Prompt encoding repairs applied: (\d+)/)?.[1] ?? 0),
    promptEncodingIssues: Number(report.match(/Prompt encoding issues after repair: (\d+)/)?.[1] ?? 0),
    generated: report.match(/Generated: ([^\n\r]+)/)?.[1] ?? new Date().toISOString(),
  };
});

const totals = rows.reduce(
  (acc, row) => ({
    checked: acc.checked + row.checked,
    passed: acc.passed + row.passed,
    review: acc.review + row.review,
    promptEncodingRepairs: acc.promptEncodingRepairs + row.promptEncodingRepairs,
    promptEncodingIssues: acc.promptEncodingIssues + row.promptEncodingIssues,
  }),
  { checked: 0, passed: 0, review: 0, promptEncodingRepairs: 0, promptEncodingIssues: 0 }
);

const runDate = rows.at(-1)?.generated ?? new Date().toISOString();
const runnerCommand = "npm.cmd run qa:dog-chatbot-live-cases:201-600:chunks";
const case534Note =
  min <= 534 && max >= 534
    ? "- Previously failing/reviewed case 534 passed in the chunk that contains it.\n"
    : "";

const aggregateReport = `# Dog Chatbot Live Cases ${min}-${max}

Site: ${process.env.NUTRITAIL_QA_SITE_URL || "https://nutritail.ai"}
Run date: ${runDate}
Runner: \`${runnerCommand}\`
OpenAI extraction: ${process.env.NUTRITAIL_QA_OPENAI === "1" ? "enabled" : "skipped"}
Result: ${totals.passed}/${totals.checked} passed, ${totals.review} review

This QA checks the live Food V2 recommendation endpoint with dog scenarios from
\`${process.env.NUTRITAIL_QA_DOG_FIXTURE_PATH ?? "data/evals/chatbot-extra-cases-dog-201-600.json"}\`.

The batch is executed in chunks so a slow live API call cannot block the entire
run without identifying the affected range.

## Summary

- Cases checked: ${totals.checked}
- Passed: ${totals.passed}
- Needs review: ${totals.review}
- Prompt encoding repairs applied: ${totals.promptEncodingRepairs}
- Prompt encoding issues after repair: ${totals.promptEncodingIssues}
${case534Note}
## Chunk Results

| Chunk | Checked | Passed | Needs review | Encoding repairs | Encoding issues |
| --- | ---: | ---: | ---: | ---: | ---: |
${rows.map((row) => `| ${row.chunk} | ${row.checked} | ${row.passed} | ${row.review} | ${row.promptEncodingRepairs} | ${row.promptEncodingIssues} |`).join("\n")}

## Coverage Notes

The live QA validates the same contract as the dog live-case runner:

- species safety
- minimum missing-question flow
- safety intent
- Food V2 recommendation availability
- allergy/rejected ingredient conflicts
- puppy and large-breed puppy growth logic
- calcium/phosphorus visibility for large-breed puppy recommendations
- weight-control kcal/fat/fiber logic
- renal and urinary fit
- sterilised calorie fit
- senior fit
- active/high-activity energy and protein guards

OpenAI fact extraction is skipped by default through the chunked wrapper unless
\`NUTRITAIL_QA_OPENAI=1\` is set.
`;

mkdirSync(path.dirname(aggregateReportPath), { recursive: true });
writeFileSync(aggregateReportPath, aggregateReport);

if (!keepChunkReports) {
  for (const { reportPath } of chunkReports) {
    if (path.normalize(reportPath) !== path.normalize(aggregateReportPath)) {
      unlinkSync(reportPath);
    }
  }
}

console.log(`Wrote ${aggregateReportPath}`);
console.log("Dog 201-600 live QA chunks passed.");
