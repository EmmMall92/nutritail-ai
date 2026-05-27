import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  issues: "data/review/foods_data_quality_issues.csv",
  csvPlan: "data/review/foods_data_cleanup_plan.csv",
  report: "reports/foods_data_cleanup_plan.md",
};

const headers = [
  "priority",
  "brand",
  "task_type",
  "affected_rows",
  "affected_fields",
  "recommended_batch",
  "acceptance_check",
];

function csvEscape(value) {
  if (value == null) return "";
  const text = Array.isArray(value) ? value.join("|") : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(rows) {
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
  const sourceHeaders = parseCsvLine(lines[0] ?? "");
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(sourceHeaders.map((header, index) => [header, values[index] ?? ""]));
  });
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function taskPriority(issues) {
  if (issues.some((issue) => issue.priority === "high")) return "high";
  if (issues.some((issue) => issue.priority === "medium")) return "medium";
  return "low";
}

function taskType(issueType) {
  if (issueType === "missing_core_field") return "core_backfill";
  if (issueType === "suspicious_nutrition_value") return "value_review";
  if (issueType === "missing_optional_mineral") return "mineral_backfill";
  if (issueType === "missing_photo_queue") return "photo_evidence";
  if (issueType === "partial_row") return "status_upgrade_review";
  return "general_review";
}

function batchLabel({ brand, task_type: type, priority }) {
  const prefix = priority === "high" ? "Batch 1" : priority === "medium" ? "Batch 2" : "Batch 3";
  if (type === "core_backfill") return `${prefix}: ${brand} core nutrition backfill`;
  if (type === "value_review") return `${prefix}: ${brand} suspicious value review`;
  if (type === "mineral_backfill") return `${prefix}: ${brand} sodium/magnesium backfill`;
  if (type === "photo_evidence") return `${prefix}: ${brand} label photo evidence`;
  if (type === "status_upgrade_review") return `${prefix}: ${brand} partial status review`;
  return `${prefix}: ${brand} data review`;
}

function acceptanceCheck(type) {
  if (type === "core_backfill") return "Core fields are filled or row remains needs_review with explicit note.";
  if (type === "value_review") return "Suspicious value is confirmed, corrected, or quarantined with notes.";
  if (type === "mineral_backfill") return "sodium_percent and magnesium_percent are filled where source evidence exists.";
  if (type === "photo_evidence") return "Photo/source evidence is attached or row remains in the missing-photo queue.";
  if (type === "status_upgrade_review") return "Rows move from partial to verified only when required mineral fields are present.";
  return "Review outcome is reflected in import data and reports.";
}

function groupKey(issue) {
  return `${issue.brand}|${taskType(issue.issue_type)}`;
}

async function main() {
  const issues = parseCsv(await readFile(paths.issues, "utf8"));
  const grouped = new Map();

  for (const issue of issues) {
    const key = groupKey(issue);
    const list = grouped.get(key) ?? [];
    list.push(issue);
    grouped.set(key, list);
  }

  const tasks = [...grouped.entries()].map(([key, groupedIssues]) => {
    const [brand, type] = key.split("|");
    const priority = taskPriority(groupedIssues);
    const fields = unique(groupedIssues.map((issue) => issue.field));
    const rows = unique(groupedIssues.map((issue) => issue.name));
    const task = {
      priority,
      brand,
      task_type: type,
      affected_rows: rows.length,
      affected_fields: fields,
      recommended_batch: "",
      acceptance_check: acceptanceCheck(type),
    };
    task.recommended_batch = batchLabel(task);
    return task;
  });

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  tasks.sort(
    (a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority] ||
      a.brand.localeCompare(b.brand) ||
      a.task_type.localeCompare(b.task_type),
  );

  await mkdir(path.dirname(paths.csvPlan), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.csvPlan, writeCsv(tasks), "utf8");

  const highTasks = tasks.filter((task) => task.priority === "high");
  const mediumTasks = tasks.filter((task) => task.priority === "medium");
  const lowTasks = tasks.filter((task) => task.priority === "low");

  const renderTasks = (items) =>
    items.length
      ? items.map(
          (task) =>
            `- ${task.recommended_batch}: ${task.affected_rows} rows; fields=${task.affected_fields.join("|")}`,
        )
      : ["- None"];

  const report = [
    "# Foods Data Cleanup Plan",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Quality issues reviewed: ${issues.length}`,
    `- Cleanup tasks created: ${tasks.length}`,
    `- High priority tasks: ${highTasks.length}`,
    `- Medium priority tasks: ${mediumTasks.length}`,
    `- Low priority tasks: ${lowTasks.length}`,
    "",
    "## High Priority",
    "",
    ...renderTasks(highTasks),
    "",
    "## Medium Priority",
    "",
    ...renderTasks(mediumTasks),
    "",
    "## Low Priority",
    "",
    ...renderTasks(lowTasks),
    "",
    "## Operating Rule",
    "",
    "- Fix high-priority core gaps before broad mineral backfill.",
    "- Keep source evidence in notes or private photo manifests before changing status to verified.",
    "- Re-run `npm run review:foods` and `npm run plan:food-cleanup` after each food dataset PR.",
    "",
  ].join("\n");

  await writeFile(paths.report, report, "utf8");
  console.log(`Wrote ${paths.csvPlan}`);
  console.log(`Wrote ${paths.report}`);
  console.log(`Cleanup tasks created: ${tasks.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
