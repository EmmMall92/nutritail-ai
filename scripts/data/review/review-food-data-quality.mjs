import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  jsonMaster: "data/imports/nutritail_foods_euuk_v1.json",
  missingPhotoQueue: "data/imports/nutritail_foods_missing_photo_queue.csv",
  csvReview: "data/review/foods_data_quality_issues.csv",
  report: "reports/foods_data_quality_summary.md",
};

const issueHeaders = [
  "priority",
  "issue_type",
  "brand",
  "name",
  "species",
  "market",
  "data_quality_status",
  "field",
  "current_value",
  "recommended_action",
  "data_source_url",
];

const coreFields = [
  "brand",
  "name",
  "species",
  "ingredients",
  "kcal_per_100g",
  "protein_percent",
  "fat_percent",
  "fiber_percent",
  "calcium_percent",
  "phosphorus_percent",
  "data_source_url",
];

const optionalMineralFields = ["sodium_percent", "magnesium_percent"];

const nutritionRanges = {
  kcal_per_100g: { min: 40, max: 550 },
  protein_percent: { min: 3, max: 60 },
  fat_percent: { min: 1, max: 45 },
  fiber_percent: { min: 0, max: 20 },
  sodium_percent: { min: 0, max: 2 },
  magnesium_percent: { min: 0, max: 0.5 },
  calcium_percent: { min: 0, max: 3 },
  phosphorus_percent: { min: 0, max: 2.5 },
};

function csvEscape(value) {
  if (value == null) return "";
  const text = Array.isArray(value) ? JSON.stringify(value) : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(headers, rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header])).join(","))
    .join("\n")}\n`;
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0] ?? "");
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function extractMarket(dataNotes) {
  return dataNotes?.match(/(?:^|;\s*)market=([^;]+)/)?.[1]?.trim() || "unknown";
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && value !== "";
}

function issueBase(row) {
  return {
    brand: row.brand,
    name: row.name,
    species: row.species,
    market: extractMarket(row.data_notes),
    data_quality_status: row.data_quality_status,
    data_source_url: row.data_source_url,
  };
}

function addIssue(issues, row, issue) {
  issues.push({
    ...issueBase(row),
    ...issue,
  });
}

function collectRowIssues(row, issues) {
  for (const field of coreFields) {
    if (!hasValue(row[field])) {
      addIssue(issues, row, {
        priority: "high",
        issue_type: "missing_core_field",
        field,
        current_value: row[field] ?? "",
        recommended_action: "Backfill from official source, label photo, or hold row from import until complete.",
      });
    }
  }

  for (const field of optionalMineralFields) {
    if (!hasValue(row[field])) {
      addIssue(issues, row, {
        priority: row.data_quality_status === "verified" ? "high" : "medium",
        issue_type: "missing_optional_mineral",
        field,
        current_value: "",
        recommended_action: "Backfill from official analytical sheet or label photo.",
      });
    }
  }

  for (const [field, range] of Object.entries(nutritionRanges)) {
    const value = row[field];
    if (!hasValue(value)) continue;
    if (typeof value !== "number" || value < range.min || value > range.max) {
      addIssue(issues, row, {
        priority: "high",
        issue_type: "suspicious_nutrition_value",
        field,
        current_value: value,
        recommended_action: `Review value and units. Expected rough range: ${range.min}-${range.max}.`,
      });
    }
  }

  if (row.data_quality_status === "partial") {
    addIssue(issues, row, {
      priority: "medium",
      issue_type: "partial_row",
      field: "data_quality_status",
      current_value: row.data_quality_status,
      recommended_action: "Review missing fields and promote to verified only when sodium and magnesium are present.",
    });
  }

  if (!String(row.data_notes ?? "").includes("basis=as-fed")) {
    addIssue(issues, row, {
      priority: "low",
      issue_type: "missing_basis_note",
      field: "data_notes",
      current_value: row.data_notes,
      recommended_action: "Add basis=as-fed to data_notes unless the source explicitly uses a different basis.",
    });
  }
}

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
    const value = row[key] || "unknown";
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function renderCountList(counts) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => `- ${label}: ${count}`);
}

async function main() {
  const foods = JSON.parse(await readFile(paths.jsonMaster, "utf8"));
  const missingQueue = parseCsv(await readFile(paths.missingPhotoQueue, "utf8"));
  const issues = [];

  for (const row of foods) {
    collectRowIssues(row, issues);
  }

  const issueKeys = new Set(
    issues.map((issue) => `${issue.brand}|${issue.name}|${issue.field}|${issue.issue_type}`),
  );

  for (const queueRow of missingQueue) {
    const key = `${queueRow.brand}|${queueRow.name}|missing_fields|missing_photo_queue`;
    if (issueKeys.has(key)) continue;
    issues.push({
      priority: queueRow.priority || "medium",
      issue_type: "missing_photo_queue",
      brand: queueRow.brand,
      name: queueRow.name,
      species: queueRow.species,
      market: queueRow.market,
      data_quality_status: "queued",
      field: "missing_fields",
      current_value: queueRow.missing_fields,
      recommended_action: queueRow.notes || "Collect label photo or stronger official evidence.",
      data_source_url: queueRow.data_source_url,
    });
  }

  const brandCounts = countBy(issues, "brand");
  const priorityCounts = countBy(issues, "priority");
  const typeCounts = countBy(issues, "issue_type");
  const statusCounts = countBy(foods, "data_quality_status");

  await mkdir(path.dirname(paths.csvReview), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.csvReview, writeCsv(issueHeaders, issues), "utf8");

  const topHighPriority = issues
    .filter((issue) => issue.priority === "high")
    .slice(0, 20)
    .map((issue) => `- ${issue.brand} - ${issue.name}: ${issue.issue_type} (${issue.field})`);

  const report = [
    "# Foods Data Quality Summary",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "",
    "## Dataset Snapshot",
    "",
    `- Canonical food rows: ${foods.length}`,
    `- Missing photo queue rows: ${missingQueue.length}`,
    `- Total quality issues tracked: ${issues.length}`,
    "",
    "## Food Rows By Status",
    "",
    ...renderCountList(statusCounts),
    "",
    "## Issues By Priority",
    "",
    ...renderCountList(priorityCounts),
    "",
    "## Issues By Type",
    "",
    ...renderCountList(typeCounts),
    "",
    "## Issues By Brand",
    "",
    ...renderCountList(brandCounts),
    "",
    "## High Priority Sample",
    "",
    ...(topHighPriority.length ? topHighPriority : ["- No high priority issues found."]),
    "",
    "## Recommended Workflow",
    "",
    "- Work high priority suspicious values first.",
    "- Backfill sodium and magnesium from official sheets or label photos.",
    "- Keep partial rows partial until both optional minerals are present.",
    "- Re-run `npm run review:foods` after every dataset batch.",
    "",
  ].join("\n");

  await writeFile(paths.report, report, "utf8");
  console.log(`Wrote ${paths.csvReview}`);
  console.log(`Wrote ${paths.report}`);
  console.log(`Issues tracked: ${issues.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
