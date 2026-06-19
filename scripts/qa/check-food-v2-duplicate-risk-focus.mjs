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

const duplicateRows = parseCsv(
  readFileSync("data/review/food_v2_duplicate_merge_risk_audit.csv", "utf8")
);
const queueRows = parseCsv(
  readFileSync("data/review/food_v2_brand_cleanup_queue.csv", "utf8")
);

const officialOverlapRows = duplicateRows.filter(
  (row) => row.risk_reason === "official_and_lower_priority_sources_overlap"
);
const officialSurvivorRows = duplicateRows.filter(
  (row) => row.risk_reason === "official_survivor_with_lower_priority_backfill"
);
const riskyRows = duplicateRows.filter((row) =>
  ["high", "medium"].includes(row.risk_level)
);
const royalQueue = queueRows.find((row) => row.brand === "Royal Canin");

if (officialOverlapRows.length === 0) {
  console.error("Expected official/lower-priority evidence overlap rows.");
  process.exit(1);
}

if (officialSurvivorRows.length === 0) {
  console.error("Expected official-survivor rows for duplicate candidate source overlaps.");
  process.exit(1);
}

const nonLowOfficialOverlap = officialOverlapRows.filter(
  (row) => row.risk_level !== "low"
);
if (nonLowOfficialOverlap.length > 0) {
  console.error(
    "Official/lower-priority overlaps should be low risk unless there is a material conflict."
  );
  process.exit(1);
}

const nonLowOfficialSurvivor = officialSurvivorRows.filter(
  (row) => row.risk_level !== "low"
);
if (nonLowOfficialSurvivor.length > 0) {
  console.error(
    "Official survivor/backfill overlaps should be low risk unless there is a material nutrition conflict."
  );
  process.exit(1);
}

if (riskyRows.length >= duplicateRows.length) {
  console.error("Duplicate audit is not separating risky groups from evidence overlaps.");
  process.exit(1);
}

if (!royalQueue) {
  console.error("Royal Canin should remain in the brand cleanup queue.");
  process.exit(1);
}

if (Number(royalQueue.duplicate_risk_groups) >= 35) {
  console.error(
    `Royal Canin duplicate risk should ignore low evidence overlaps, got ${royalQueue.duplicate_risk_groups}.`
  );
  process.exit(1);
}

console.log("Food V2 duplicate risk focus QA passed.");
