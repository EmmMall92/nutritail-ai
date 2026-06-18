import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const brand = "Josera";

const paths = {
  titleQuality: "data/review/food_v2_title_quality_audit.csv",
  duplicateRisks: "data/review/food_v2_duplicate_merge_risk_audit.csv",
  output: "data/review/josera_food_v2_title_cleanup.csv",
  report: "reports/josera_food_v2_title_cleanup_plan.md",
};

const headers = [
  "priority",
  "issue_type",
  "species",
  "format",
  "source_priority",
  "current_formula_name",
  "current_display_name",
  "suggested_formula_name",
  "suggested_display_name",
  "product_form_risk",
  "cleanup_decision",
  "source_url",
  "formula_key",
  "suggested_action",
];

const knownTitleFixes = new Map([
  ["FIESTAPLUS", "FiestaPlus"],
  ["SENSIADULT", "SensiAdult"],
  ["SENSIJUNIOR", "SensiJunior"],
  ["MINIWELL", "Miniwell"],
  ["MARINESSE", "Marinesse"],
  ["CATELUX", "Catelux"],
  ["DAILYCAT", "DailyCat"],
  ["NATURECAT", "NatureCat"],
  ["NATURELLE", "Naturelle"],
  ["RENAL DOG DRY", "Help Renal"],
  ["GASTRO DOG DRY", "Help Gastrointestinal"],
  ["HYPOALLERGENIC DOG DRY", "Help Hypoallergenic"],
  ["WEIGHT & DIABETIC DOG DRY", "Help Weight & Diabetic"],
  ["HEART DOG DRY", "Help Heart"],
  ["LIVER DOG DRY", "Help Liver"],
]);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += char;
  }

  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);

  const csvHeaders = (rows[0] ?? []).map((header) =>
    header.replace(/^\uFEFF/u, "").trim()
  );
  return rows.slice(1).map((values) =>
    Object.fromEntries(csvHeaders.map((header, index) => [header, values[index] ?? ""]))
  );
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/u.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function titleCase(text) {
  const smallWords = new Set(["and", "or", "of", "the", "with"]);
  return String(text ?? "")
    .toLowerCase()
    .split(/\s+/u)
    .filter(Boolean)
    .map((word, index) => {
      if (index > 0 && smallWords.has(word)) return word;
      if (word === "dry") return "";
      if (word === "dog" || word === "cat") return "";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .filter(Boolean)
    .join(" ")
    .replace(/\s*&\s*/gu, " & ")
    .replace(/\s+/gu, " ")
    .trim();
}

function stripBrand(text) {
  return String(text ?? "")
    .replace(/^josera\s+/iu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function suggestedFormulaName(text) {
  const cleaned = stripBrand(text);
  const known = knownTitleFixes.get(cleaned.toUpperCase());
  if (known) return known;
  return titleCase(cleaned);
}

function sourceUrlFromFormulaKey(row) {
  const key = String(row.formula_key ?? "");
  const [, url] = key.split("|");
  if (url?.startsWith("http")) return url;
  return "";
}

function productFormRisk(row) {
  const text = `${row.formula_name ?? ""} ${row.display_name ?? ""}`.toLowerCase();
  if (/\b(loopies|denties|meat hearts|meat bites|meat chunks|knuspies|crunchies)\b/u.test(text)) {
    return "possible_treat_or_snack";
  }
  if (/\b(wet|pate|filet|soup|sauce)\b/u.test(text)) return "possible_non_dry";
  return "dry_food_candidate";
}

function cleanupDecision(row) {
  const formRisk = productFormRisk(row);
  if (formRisk === "possible_treat_or_snack") {
    return "Hold from dry-food recommendations until product form is verified as complete dry food or treat.";
  }
  if (row.issue_type === "medical_claim_used_as_name") {
    return "Use the Josera Help product line as the customer title and keep medical positioning in tags/health context.";
  }
  if (row.issue_type === "formula_name_starts_with_brand") {
    return "Remove duplicated Josera prefix from formula_name; display_name may include the brand once.";
  }
  return "Manual title review before customer-facing recommendation exposure.";
}

function priorityFor(row) {
  const formRisk = productFormRisk(row) === "possible_treat_or_snack" ? 90 : 0;
  const medical = row.issue_type === "medical_claim_used_as_name" ? 70 : 0;
  const brandPrefix = row.issue_type === "formula_name_starts_with_brand" ? 40 : 0;
  const official = row.source_priority === "official" ? 8 : 0;
  return formRisk + medical + brandPrefix + official;
}

function enrichRow(row) {
  const suggestedFormula = suggestedFormulaName(row.formula_name);
  return {
    priority: priorityFor(row),
    issue_type: row.issue_type,
    species: row.species,
    format: row.format,
    source_priority: row.source_priority,
    current_formula_name: row.formula_name,
    current_display_name: row.display_name,
    suggested_formula_name: suggestedFormula,
    suggested_display_name: suggestedFormula ? `${brand} ${suggestedFormula}` : row.display_name,
    product_form_risk: productFormRisk(row),
    cleanup_decision: cleanupDecision(row),
    source_url: sourceUrlFromFormulaKey(row),
    formula_key: row.formula_key,
    suggested_action: row.suggested_action,
  };
}

function renderReport(rows, duplicateRows) {
  const byRisk = rows.reduce((counts, row) => {
    counts.set(row.product_form_risk, (counts.get(row.product_form_risk) ?? 0) + 1);
    return counts;
  }, new Map());
  const byIssue = rows.reduce((counts, row) => {
    counts.set(row.issue_type, (counts.get(row.issue_type) ?? 0) + 1);
    return counts;
  }, new Map());
  const topRows = rows.slice(0, 30);
  const duplicateRowsForJosera = duplicateRows.filter((row) =>
    String(row.canonical_identity_key ?? "").toLowerCase().startsWith("josera|")
  );

  return [
    "# Josera Food V2 Title Cleanup Plan",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Title rows to review: ${rows.length}`,
    `- Duplicate groups to keep in mind: ${duplicateRowsForJosera.length}`,
    `- Output CSV: ${paths.output}`,
    "",
    "## By Product Form Risk",
    "",
    ...[...byRisk.entries()].map(([risk, count]) => `- ${risk}: ${count}`),
    "",
    "## By Issue Type",
    "",
    ...[...byIssue.entries()].map(([issue, count]) => `- ${issue}: ${count}`),
    "",
    "## Top Cleanup Rows",
    "",
    ...topRows.map(
      (row, index) =>
        `${index + 1}. ${row.current_display_name} -> ${row.suggested_display_name}; risk=${row.product_form_risk}; action=${row.cleanup_decision}`
    ),
    "",
    "## Customer-Facing Naming Rule",
    "",
    "Use `Josera + clean product line/name` once. Do not show duplicated brand names, feeding-table text, pack sizes, or generic medical wording as the main title.",
    "",
    "Examples:",
    "",
    "- `Josera Active Nature`, not `Josera Active Nature Active Nature Weight Activity / day ...`.",
    "- `Josera Help Renal`, not `Josera Renal Dog Dry` when the Help line is clear from source context.",
    "- Treat/snack candidates should not appear as dry-food recommendations until product form is verified.",
  ].join("\n");
}

async function main() {
  const [titleRows, duplicateRows] = await Promise.all([
    readFile(paths.titleQuality, "utf8").then(parseCsv),
    readFile(paths.duplicateRisks, "utf8").then(parseCsv),
  ]);

  const rows = titleRows
    .filter((row) => row.brand === brand)
    .map(enrichRow)
    .sort((a, b) => b.priority - a.priority || a.suggested_display_name.localeCompare(b.suggested_display_name));

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await Promise.all([
    writeFile(
      paths.output,
      [headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n"),
      "utf8"
    ),
    writeFile(paths.report, renderReport(rows, duplicateRows), "utf8"),
  ]);

  console.log(
    JSON.stringify(
      {
        brand,
        titleRows: rows.length,
        output: paths.output,
        report: paths.report,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
