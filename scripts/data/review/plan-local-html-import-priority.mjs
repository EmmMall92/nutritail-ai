import { mkdir, readFile, writeFile } from "node:fs/promises";

const paths = {
  importCsv: "data/imports/gatoskilo_local_html_batch_v2.csv",
  duplicateCsv: "data/review/gatoskilo_canonical_duplicate_review.csv",
  outputCsv: "data/review/local_html_import_priority.csv",
  report: "reports/local_html_import_priority.md",
};

const outputHeaders = [
  "priority_bucket",
  "priority_score",
  "formula_key",
  "brand",
  "formula_name",
  "species",
  "format",
  "kcal_status",
  "ash_status",
  "mineral_status",
  "feeding_guide_status",
  "duplicate_status",
  "duplicate_match_count",
  "is_recommendable",
  "data_source_url",
  "review_reason",
];

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(headers, rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header] ?? "")).join(","))
    .join("\n")}\n`;
}

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
    header.replace(/^\uFEFF/, "").trim()
  );

  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
  );
}

function hasValue(value) {
  return String(value ?? "").trim() !== "";
}

function notesInclude(row, token) {
  return String(row.source_notes ?? "").includes(token);
}

function kcalStatus(row) {
  if (!hasValue(row.kcal_per_100g) && !hasValue(row.kcal_per_kg)) return "missing";
  if (notesInclude(row, "kcal_estimated=true")) return "estimated";
  return "label";
}

function ashStatus(row) {
  if (!hasValue(row.ash_percent)) return "missing";
  if (notesInclude(row, "label_ash_used=true")) return "label";
  return "present";
}

function mineralStatus(row) {
  const minerals = [
    row.calcium_percent,
    row.phosphorus_percent,
    row.sodium_percent,
    row.magnesium_percent,
  ].filter(hasValue).length;

  if (minerals >= 4) return "full";
  if (minerals >= 2) return "partial";
  if (minerals >= 1) return "minimal";
  return "missing";
}

function feedingGuideStatus(row) {
  return hasValue(row.feeding_guide_text) ? "present" : "missing";
}

function duplicateStatus(matchCount, exactCount) {
  if (exactCount > 0) return "exact_duplicate_review";
  if (matchCount > 0) return "fuzzy_duplicate_review";
  return "no_known_duplicate";
}

function priorityFor(row, matchCount, exactCount) {
  const reasons = [];
  let score = 0;

  const kcal = kcalStatus(row);
  const ash = ashStatus(row);
  const minerals = mineralStatus(row);
  const feeding = feedingGuideStatus(row);

  if (kcal === "label") {
    score += 35;
    reasons.push("label_kcal");
  } else if (kcal === "estimated") {
    score += 18;
    reasons.push("estimated_kcal");
  } else {
    reasons.push("missing_kcal");
  }

  if (hasValue(row.ingredient_text) || hasValue(row.ingredients)) {
    score += 20;
    reasons.push("ingredients_present");
  } else {
    reasons.push("missing_ingredients");
  }

  if (hasValue(row.protein_percent) && hasValue(row.fat_percent) && hasValue(row.fiber_percent)) {
    score += 15;
    reasons.push("core_analysis_present");
  } else {
    reasons.push("core_analysis_incomplete");
  }

  if (ash !== "missing") {
    score += 8;
    reasons.push(`${ash}_ash`);
  } else {
    reasons.push("missing_ash");
  }

  if (minerals === "full") score += 12;
  else if (minerals === "partial") score += 8;
  else if (minerals === "minimal") score += 4;
  reasons.push(`${minerals}_minerals`);

  if (feeding === "present") {
    score += 5;
    reasons.push("feeding_guide");
  }

  if (String(row.data_quality_status ?? "") === "needs_review") {
    score += 3;
  }

  if (String(row.is_recommendable ?? "") === "true") {
    reasons.push("already_recommendable");
  }

  if (exactCount > 0) {
    score -= 35;
    reasons.push("exact_duplicate_review_needed");
  } else if (matchCount > 0) {
    score -= 18;
    reasons.push("fuzzy_duplicate_review_needed");
  }

  let bucket = "review_later";
  if (exactCount > 0) bucket = "duplicate_review_first";
  else if (matchCount > 0) bucket = "possible_duplicate_review";
  else if (kcal === "label" && score >= 80) bucket = "commit_first_after_qa";
  else if (kcal === "estimated" && score >= 65) bucket = "commit_after_kcal_review";
  else if (kcal === "missing") bucket = "needs_kcal_backfill";
  else if (score >= 55) bucket = "commit_after_basic_review";

  return { bucket, score: Math.max(0, score), reasons };
}

async function main() {
  const importRows = parseCsv(await readFile(paths.importCsv, "utf8"));
  const duplicateRows = parseCsv(await readFile(paths.duplicateCsv, "utf8")).filter(
    (row) => row.gatoskilo_formula_key
  );

  const duplicateMap = new Map();
  const exactDuplicateMap = new Map();
  for (const row of duplicateRows) {
    const key = row.gatoskilo_formula_key;
    duplicateMap.set(key, (duplicateMap.get(key) ?? 0) + 1);
    if (String(row.match_type ?? "").startsWith("exact")) {
      exactDuplicateMap.set(key, (exactDuplicateMap.get(key) ?? 0) + 1);
    }
  }

  const outputRows = importRows.map((row) => {
    const matchCount = duplicateMap.get(row.formula_key) ?? 0;
    const exactCount = exactDuplicateMap.get(row.formula_key) ?? 0;
    const priority = priorityFor(row, matchCount, exactCount);

    return {
      priority_bucket: priority.bucket,
      priority_score: priority.score,
      formula_key: row.formula_key,
      brand: row.brand,
      formula_name: row.formula_name,
      species: row.species,
      format: row.format,
      kcal_status: kcalStatus(row),
      ash_status: ashStatus(row),
      mineral_status: mineralStatus(row),
      feeding_guide_status: feedingGuideStatus(row),
      duplicate_status: duplicateStatus(matchCount, exactCount),
      duplicate_match_count: matchCount,
      is_recommendable: row.is_recommendable,
      data_source_url: row.data_source_url,
      review_reason: priority.reasons.join("|"),
    };
  });

  outputRows.sort((a, b) => {
    const bucketOrder = [
      "commit_first_after_qa",
      "commit_after_kcal_review",
      "commit_after_basic_review",
      "needs_kcal_backfill",
      "possible_duplicate_review",
      "duplicate_review_first",
      "review_later",
    ];
    return (
      bucketOrder.indexOf(a.priority_bucket) - bucketOrder.indexOf(b.priority_bucket) ||
      Number(b.priority_score) - Number(a.priority_score) ||
      String(a.brand).localeCompare(String(b.brand)) ||
      String(a.formula_name).localeCompare(String(b.formula_name))
    );
  });

  const bucketCounts = outputRows.reduce((acc, row) => {
    acc[row.priority_bucket] = (acc[row.priority_bucket] ?? 0) + 1;
    return acc;
  }, {});

  const kcalCounts = outputRows.reduce((acc, row) => {
    acc[row.kcal_status] = (acc[row.kcal_status] ?? 0) + 1;
    return acc;
  }, {});

  await mkdir("data/review", { recursive: true });
  await mkdir("reports", { recursive: true });
  await writeFile(paths.outputCsv, writeCsv(outputHeaders, outputRows), "utf8");
  await writeFile(
    paths.report,
    [
      "# Local HTML Import Priority Plan",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Summary",
      "",
      `- Source import rows: ${importRows.length}`,
      `- Duplicate-reviewed formula keys: ${duplicateMap.size}`,
      `- Output rows: ${outputRows.length}`,
      "",
      "## Priority Buckets",
      "",
      ...Object.entries(bucketCounts).map(([bucket, count]) => `- ${bucket}: ${count}`),
      "",
      "## Kcal Status",
      "",
      ...Object.entries(kcalCounts).map(([status, count]) => `- ${status}: ${count}`),
      "",
      "## Recommended Workflow",
      "",
      "1. Review `commit_first_after_qa` first and commit selected rows from Admin Food V2.",
      "2. Review `possible_duplicate_review` before importing, especially exact or near Acana/Royal/Josera matches.",
      "3. Use `commit_after_kcal_review` only when estimated kcal is acceptable or official kcal is unavailable.",
      "4. Keep `needs_kcal_backfill` for official source search, label photos, or later energy calculation review.",
      "",
      "## Outputs",
      "",
      `- ${paths.outputCsv}`,
    ].join("\n"),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        sourceRows: importRows.length,
        outputRows: outputRows.length,
        bucketCounts,
        kcalCounts,
        output: paths.outputCsv,
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
