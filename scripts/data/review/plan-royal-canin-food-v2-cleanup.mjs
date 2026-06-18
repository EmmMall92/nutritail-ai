import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const brand = "Royal Canin";

const paths = {
  brandReadiness: "data/review/food_v2_brand_readiness_audit.csv",
  duplicateRisks: "data/review/food_v2_duplicate_merge_risk_audit.csv",
  titleQuality: "data/review/food_v2_title_quality_audit.csv",
  nutrientGaps: "data/review/food_v2_nutrient_gap_priorities.csv",
  duplicateOutput: "data/review/royal_canin_food_v2_duplicate_cleanup.csv",
  titleOutput: "data/review/royal_canin_food_v2_title_cleanup.csv",
  nutrientOutput: "data/review/royal_canin_food_v2_nutrient_backfill.csv",
  report: "reports/royal_canin_food_v2_cleanup_plan.md",
};

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

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/u.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function writeCsv(rows, outputPath, headers) {
  return writeFile(
    outputPath,
    [headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n"),
    "utf8"
  );
}

function isRoyalCaninDuplicate(row) {
  const key = String(row.canonical_identity_key ?? "").toLowerCase();
  const name = String(row.best_display_name ?? "").toLowerCase();
  return key.startsWith("royal canin|") || name.startsWith("royal canin");
}

function byNumeric(field, direction = "desc") {
  return (a, b) => {
    const left = Number(a[field]) || 0;
    const right = Number(b[field]) || 0;
    return direction === "desc" ? right - left : left - right;
  };
}

function splitFormulaKeys(row) {
  return String(row.formula_keys ?? "")
    .split("|")
    .map((key) => key.trim())
    .filter(Boolean);
}

function sourceHintForFormulaKey(formulaKey) {
  const key = String(formulaKey ?? "").toLowerCase();
  if (key.includes("-official")) return "official";
  if (key.includes("-document") || key.includes("-pdf")) return "document";
  if (key.includes("-gatoskilo") || key.includes("-retailer")) return "retailer";
  if (key.includes("-photo")) return "photo";
  if (key.includes("-spreadsheet") || key.includes("-ods")) return "spreadsheet";
  return "unknown";
}

function survivorScore(formulaKey) {
  const sourceHint = sourceHintForFormulaKey(formulaKey);
  const sourceScore =
    sourceHint === "official"
      ? 100
      : sourceHint === "document"
        ? 85
        : sourceHint === "retailer"
          ? 70
          : sourceHint === "photo"
            ? 60
            : sourceHint === "spreadsheet"
              ? 45
              : 35;

  const hasCanonicalName = /royal-canin-[a-z0-9-]+-(dog|cat)-dry/u.test(formulaKey) ? 8 : 0;
  const packPenalty = /\b\d+(kg|g|gr)\b/u.test(formulaKey) ? -10 : 0;
  return sourceScore + hasCanonicalName + packPenalty;
}

function chooseRecommendedSurvivor(row) {
  const keys = splitFormulaKeys(row);
  if (keys.length === 0) {
    return {
      recommended_survivor_formula_key: row.best_formula_key ?? "",
      survivor_source_hint: sourceHintForFormulaKey(row.best_formula_key),
      survivor_decision: "Use current best row; no formula key alternatives were available.",
    };
  }

  const [survivor] = [...keys].sort(
    (a, b) => survivorScore(b) - survivorScore(a) || a.localeCompare(b)
  );
  const currentBest = String(row.best_formula_key ?? "");
  const sourceHint = sourceHintForFormulaKey(survivor);
  const currentHint = sourceHintForFormulaKey(currentBest);
  const survivorDecision =
    survivor === currentBest
      ? `Keep current best row as canonical survivor (${sourceHint}).`
      : `Prefer ${sourceHint} row over current ${currentHint || "unknown"} best row; keep the rest as evidence/backfill.`;

  return {
    recommended_survivor_formula_key: survivor,
    survivor_source_hint: sourceHint,
    survivor_decision: survivorDecision,
  };
}

function titleCase(text) {
  const smallWords = new Set(["and", "or", "of", "the", "with"]);
  return String(text ?? "")
    .split(/\s+/u)
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (lower === "plus") return "+";
      if (index > 0 && smallWords.has(lower)) return lower;
      if (/^\d+\+?$/u.test(word)) return word;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ")
    .replace(/\s+\+/gu, "+");
}

function customerFormulaNameFromIdentity(row) {
  const keyParts = String(row.canonical_identity_key ?? "").split("|");
  const formulaPart = keyParts[1]?.trim();
  if (formulaPart) return `Royal Canin ${titleCase(formulaPart)}`;

  return String(row.best_display_name ?? "")
    .replace(/\s+\d+(?:[.,]\d+)?\s*(?:kg|g|gr)\b/giu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function enrichDuplicateRow(row) {
  return {
    ...row,
    ...chooseRecommendedSurvivor(row),
    customer_formula_name: customerFormulaNameFromIdentity(row),
  };
}

function hasLifeStageConflict(row) {
  const name = String(row.display_name ?? "").toLowerCase();
  const stage = String(row.life_stage ?? "").toLowerCase();

  if (stage === "kitten" && /\b(adult|indoor|fit|sensible|persian adult|light weight|urinary care)\b/u.test(name)) {
    return true;
  }
  if (stage === "puppy" && /\b(adult|mature|ageing|senior|7\+|8\+|12\+)\b/u.test(name)) {
    return true;
  }
  if (stage === "senior" && /\b(puppy|junior|kitten)\b/u.test(name)) {
    return true;
  }

  return false;
}

function renderReport({ readiness, duplicates, titles, nutrients, lifeStageConflicts }) {
  const topDuplicates = duplicates.slice(0, 15);
  const topTitles = titles.slice(0, 15);
  const topNutrients = nutrients.slice(0, 20);
  const topLifeStageConflicts = lifeStageConflicts.slice(0, 20);

  return [
    "# Royal Canin Food V2 Cleanup Plan",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Brand rows: ${readiness?.total_rows ?? "unknown"}`,
    `- Readiness status: ${readiness?.readiness_status ?? "unknown"}`,
    `- Duplicate groups to review: ${duplicates.length}`,
    `- Title cleanup rows: ${titles.length}`,
    `- Nutrient backfill rows: ${nutrients.length}`,
    `- Life-stage conflict rows: ${lifeStageConflicts.length}`,
    `- Official rows: ${readiness?.official_rows ?? "unknown"}`,
    `- Retailer rows: ${readiness?.retailer_rows ?? "unknown"}`,
    `- Missing calcium/phosphorus rows: ${readiness?.missing_core_mineral_rows ?? "unknown"}`,
    `- Estimated kcal rows: ${readiness?.estimated_kcal_rows ?? "unknown"}`,
    "",
    "## Recommended Order",
    "",
    "1. Review duplicate groups first, especially official-plus-retailer overlaps. Keep the best official formula row as survivor and use retailer/photo rows only as evidence or backfill.",
    "2. Clean customer-facing formula titles after dedupe, so pack sizes and retailer wording do not leak into recommendations.",
    "3. Fix life-stage conflicts before import; an Adult cat food marked kitten or senior dog food marked puppy can distort recommendations.",
    "4. Backfill calcium/phosphorus and replace estimated kcal where official page, PDF, label photo, or accepted retailer evidence is available.",
    "5. Re-run Food V2 recommendation QA after each Royal Canin cleanup batch.",
    "",
    "## Top Duplicate Groups",
    "",
    ...topDuplicates.map(
      (row, index) =>
        `${index + 1}. ${row.customer_formula_name} | rows=${row.row_count}; candidates=${row.candidate_count}; survivor=${row.recommended_survivor_formula_key}; sources=${row.source_priorities}; action=${row.survivor_decision}`
    ),
    "",
    "## Top Title Cleanup Rows",
    "",
    ...topTitles.map(
      (row, index) =>
        `${index + 1}. ${row.display_name} | issue=${row.issue_type}; source=${row.source_priority}; action=${row.suggested_action}`
    ),
    "",
    "## Life-Stage Conflicts To Fix Before Import",
    "",
    ...topLifeStageConflicts.map(
      (row, index) =>
        `${index + 1}. ${row.display_name} | current_stage=${row.life_stage}; context=${row.health_context || "general"}; source=${row.source_priority}; formula=${row.formula_key}`
    ),
    "",
    "## Top Nutrient Backfill Rows",
    "",
    ...topNutrients.map(
      (row, index) =>
        `${index + 1}. ${row.display_name} | gaps=${row.missing_blockers || "none"}; replace=${row.estimated_fields_to_replace || "none"}; context=${row.health_context || "general"}`
    ),
    "",
    "## Outputs",
    "",
    `- Duplicate queue: ${paths.duplicateOutput}`,
    `- Title queue: ${paths.titleOutput}`,
    `- Nutrient queue: ${paths.nutrientOutput}`,
  ].join("\n");
}

async function main() {
  const [brandRows, duplicateRows, titleRows, nutrientRows] = await Promise.all([
    readFile(paths.brandReadiness, "utf8").then(parseCsv),
    readFile(paths.duplicateRisks, "utf8").then(parseCsv),
    readFile(paths.titleQuality, "utf8").then(parseCsv),
    readFile(paths.nutrientGaps, "utf8").then(parseCsv),
  ]);

  const readiness = brandRows.find((row) => row.brand === brand);
  const duplicates = duplicateRows
    .filter((row) => row.risk_level !== "hold")
    .filter(isRoyalCaninDuplicate)
    .map(enrichDuplicateRow)
    .sort(byNumeric("row_count"));
  const titles = titleRows
    .filter((row) => row.brand === brand)
    .sort((a, b) => a.issue_type.localeCompare(b.issue_type) || a.display_name.localeCompare(b.display_name));
  const nutrients = nutrientRows
    .filter((row) => row.brand === brand)
    .sort(byNumeric("gap_score"));
  const lifeStageConflicts = nutrients.filter(hasLifeStageConflict);

  await mkdir(path.dirname(paths.duplicateOutput), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });

  await Promise.all([
    writeCsv(duplicates, paths.duplicateOutput, [
      "canonical_identity_key",
      "row_count",
      "candidate_count",
      "risk_level",
      "risk_reason",
      "recommended_action",
      "best_formula_key",
      "best_display_name",
      "recommended_survivor_formula_key",
      "survivor_source_hint",
      "customer_formula_name",
      "survivor_decision",
      "source_priorities",
      "formula_keys",
    ]),
    writeCsv(titles, paths.titleOutput, [
      "severity",
      "issue_type",
      "display_name",
      "formula_name",
      "species",
      "format",
      "source_priority",
      "formula_key",
      "suggested_action",
    ]),
    writeCsv(nutrients, paths.nutrientOutput, [
      "priority",
      "gap_score",
      "display_name",
      "species",
      "format",
      "life_stage",
      "source_priority",
      "formula_key",
      "missing_blockers",
      "estimated_fields_to_replace",
      "missing_helpful_fields",
      "health_context",
      "recommended_evidence",
      "next_action",
      "data_source_url",
    ]),
    writeFile(
      paths.report,
      renderReport({ readiness, duplicates, titles, nutrients, lifeStageConflicts }),
      "utf8"
    ),
  ]);

  console.log(
    JSON.stringify(
      {
        brand,
        duplicates: duplicates.length,
        titles: titles.length,
        nutrients: nutrients.length,
        lifeStageConflicts: lifeStageConflicts.length,
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
