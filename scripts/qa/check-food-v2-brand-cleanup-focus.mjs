import { readFileSync } from "node:fs";

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

  const headers = (rows[0] ?? []).map((header) =>
    header.replace(/^\uFEFF/u, "").trim()
  );
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
  );
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const queueRows = parseCsv(
  readFileSync("data/review/food_v2_brand_cleanup_queue.csv", "utf8")
);

const importantBrands = [
  "Royal Canin",
  "Josera",
  "Brit",
  "Ambrosia",
  "Happy Dog",
  "Farmina",
  "Acana",
  "Purina Pro Plan",
  "Orijen",
  "Monge",
];
const allowedNextFiles = new Set([
  "data/review/food_v2_nutrient_gap_priorities.csv",
  "data/review/food_v2_duplicate_merge_risk_audit.csv",
  "data/review/food_v2_brand_readiness_audit.csv",
  "data/review/food_v2_brand_cleanup_queue.csv",
]);

if (queueRows.length < importantBrands.length) {
  console.error(`Brand cleanup queue looks too small: ${queueRows.length} rows.`);
  process.exit(1);
}

for (const brand of importantBrands) {
  const row = queueRows.find((item) => item.brand === brand);
  if (!row) {
    console.error(`${brand} should remain visible in the Food V2 brand cleanup queue.`);
    process.exit(1);
  }
  if (!row.recommended_action?.trim()) {
    console.error(`${brand} is missing a recommended action.`);
    process.exit(1);
  }
  if (!allowedNextFiles.has(row.next_cleanup_file)) {
    console.error(`${brand} points to an unexpected cleanup file: ${row.next_cleanup_file}`);
    process.exit(1);
  }
}

const topRows = queueRows.slice(0, 15);
const nonActionableTopRows = topRows.filter(
  (row) => !row.next_cleanup_step?.trim() || !row.recommended_action?.trim()
);
if (nonActionableTopRows.length > 0) {
  console.error("Top brand cleanup rows must have clear next steps and actions.");
  console.error(nonActionableTopRows.map((row) => row.brand).join(", "));
  process.exit(1);
}

const nutrientBackfillRows = queueRows.filter(
  (row) => numberValue(row.nutrition_confidence_gap_score) > 10
);
const nutrientRowsWithWrongFile = nutrientBackfillRows.filter(
  (row) => row.next_cleanup_file !== "data/review/food_v2_nutrient_gap_priorities.csv"
);
if (nutrientRowsWithWrongFile.length > 0) {
  console.error("Nutrient-gap brands should point reviewers to the nutrient gap priorities file.");
  console.error(nutrientRowsWithWrongFile.map((row) => row.brand).join(", "));
  process.exit(1);
}

const duplicateRows = queueRows.filter((row) => numberValue(row.duplicate_risk_groups) > 0);
const duplicateRowsWithWrongFile = duplicateRows.filter(
  (row) => row.next_cleanup_file !== "data/review/food_v2_duplicate_merge_risk_audit.csv"
);
if (duplicateRowsWithWrongFile.length > 0) {
  console.error("Duplicate-risk brands should point reviewers to the duplicate merge risk audit.");
  console.error(duplicateRowsWithWrongFile.map((row) => row.brand).join(", "));
  process.exit(1);
}

const titleRows = queueRows.filter((row) => numberValue(row.title_issue_rows) > 0);
const titleRowsWithWrongFile = titleRows.filter(
  (row) => row.next_cleanup_file !== "data/review/food_v2_title_quality_audit.csv"
);
if (titleRowsWithWrongFile.length > 0) {
  console.error("Title-risk brands should point reviewers to the title quality audit.");
  console.error(titleRowsWithWrongFile.map((row) => row.brand).join(", "));
  process.exit(1);
}

const topPriorityBrands = topRows.map((row) => row.brand);
if (!topPriorityBrands.includes("Royal Canin") || !topPriorityBrands.includes("Josera")) {
  console.error("Royal Canin and Josera should remain top cleanup priorities while nutrient gaps remain.");
  console.error(topPriorityBrands.join(", "));
  process.exit(1);
}

console.log("Food V2 brand cleanup focus QA passed.");
