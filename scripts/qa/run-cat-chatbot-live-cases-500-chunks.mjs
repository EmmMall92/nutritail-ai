import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

const command = process.platform === "win32" ? "npm.cmd" : "npm";
const start = Number(process.env.NUTRITAIL_QA_CAT_CHUNK_START ?? 1);
const end = Number(process.env.NUTRITAIL_QA_CAT_CHUNK_END ?? 500);
const size = Number(process.env.NUTRITAIL_QA_CAT_CHUNK_SIZE ?? 25);
const timeoutMs = Number(process.env.NUTRITAIL_QA_CHUNK_TIMEOUT_MS ?? 180000);
const keepChunkReports = process.env.NUTRITAIL_QA_KEEP_CHUNK_REPORTS === "1";

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

if (!isPositiveInteger(start) || !isPositiveInteger(end) || !isPositiveInteger(size)) {
  console.error("Cat live QA chunk bounds must be positive integers.");
  process.exit(1);
}

const min = Math.min(start, end);
const max = Math.max(start, end);
const aggregateReportPath =
  process.env.NUTRITAIL_QA_AGGREGATE_REPORT_PATH ??
  (min === 1 && max === 500
    ? "reports/cat_chatbot_live_cases_1-500.md"
    : `reports/cat_chatbot_live_cases_${String(min).padStart(3, "0")}-${String(max).padStart(3, "0")}_chunks.md`);
const failures = [];
const chunkReports = [];

function catId(id) {
  return `cat-${String(id).padStart(3, "0")}`;
}

function catIds(startId, endId) {
  const ids = [];
  for (let id = startId; id <= endId; id += 1) ids.push(catId(id));
  return ids.join(",");
}

for (let chunkStart = min; chunkStart <= max; chunkStart += size) {
  const chunkEnd = Math.min(chunkStart + size - 1, max);
  const chunk = `${String(chunkStart).padStart(3, "0")}-${String(chunkEnd).padStart(3, "0")}`;
  const reportPath = `reports/cat_chatbot_live_cases_${chunk}.md`;
  chunkReports.push({ chunk, reportPath });

  console.log(`Running cat live QA chunk ${chunk}...`);

  const result = spawnSync(`${command} run qa:cat-chatbot-live-cases`, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NUTRITAIL_QA_CAT_FIXTURE_PATH:
        process.env.NUTRITAIL_QA_CAT_FIXTURE_PATH ??
        "data/evals/chatbot-extra-cases-cat-001-500.json",
      NUTRITAIL_QA_CASE_IDS: catIds(chunkStart, chunkEnd),
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
  console.error("Cat 001-500 live QA chunks need review:");
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}

const rows = chunkReports.map(({ chunk, reportPath }) => {
  const report = readFileSync(reportPath, "utf8");
  const result = report.match(/Result: (\d+)\/(\d+) passed, (\d+) review/);
  return {
    chunk,
    reportPath,
    passed: Number(result?.[1] ?? 0),
    checked: Number(result?.[2] ?? 0),
    review: Number(result?.[3] ?? 0),
    generated: report.match(/Run date: ([^\n\r]+)/)?.[1] ?? new Date().toISOString(),
  };
});

const totals = rows.reduce(
  (acc, row) => ({
    checked: acc.checked + row.checked,
    passed: acc.passed + row.passed,
    review: acc.review + row.review,
  }),
  { checked: 0, passed: 0, review: 0 }
);

const runDate = rows.at(-1)?.generated ?? new Date().toISOString();
const aggregateReport = `# Cat Chatbot Live Cases ${String(min).padStart(3, "0")}-${String(max).padStart(3, "0")}

Site: ${process.env.NUTRITAIL_QA_SITE_URL || "https://nutritail.ai"}
Run date: ${runDate}
Runner: \`npm.cmd run qa:cat-chatbot-live-cases:500:chunks\`
OpenAI extraction: skipped
Result: ${totals.passed}/${totals.checked} passed, ${totals.review} review

This QA checks the live Food V2 recommendation endpoint with cat scenarios from
\`${process.env.NUTRITAIL_QA_CAT_FIXTURE_PATH ?? "data/evals/chatbot-extra-cases-cat-001-500.json"}\`.

The batch is executed in chunks so a slow live API call cannot block the entire
run without identifying the affected range.

## Summary

- Cases checked: ${totals.checked}
- Passed: ${totals.passed}
- Needs review: ${totals.review}

## Chunk Results

| Chunk | Checked | Passed | Needs review |
| --- | ---: | ---: | ---: |
${rows.map((row) => `| ${row.chunk} | ${row.checked} | ${row.passed} | ${row.review} |`).join("\n")}

## Coverage Notes

The live QA focuses on species safety, empty shortlists, and major nutrition-direction
mismatches for urinary, renal, kitten, senior, sterilised, weight-control, allergy,
hydration, hairball, indoor/outdoor, pregnancy/lactation, and red-flag scenarios.
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
console.log("Cat 001-500 live QA chunks passed.");
