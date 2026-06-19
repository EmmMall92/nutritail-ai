import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  queue: "data/review/royal_canin_photo_gap_queue.csv",
  foodV2Gaps: "data/review/food_v2_nutrient_gap_priorities.csv",
  workbook: "data/review/royal_canin_gap_workbook.csv",
  report: "reports/royal_canin_gap_workbook.md",
};

const headers = [
  "priority",
  "formula_key",
  "brand",
  "formula_name",
  "species",
  "open_gap_groups",
  "critical_missing_fields",
  "next_best_action",
  "evidence_path",
  "status",
  "notes",
];

const criticalOrder = [
  "barcode_or_ean",
  "ingredient_text",
  "kcal_per_100g_or_kcal_per_kg",
  "protein_percent",
  "fat_percent",
  "fiber_percent",
  "ash_percent",
  "moisture_percent",
  "calcium_percent",
  "phosphorus_percent",
  "sodium_percent",
  "magnesium_percent",
];

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
  const csvHeaders = (rows[0] ?? []).map((header) => header.replace(/^\uFEFF/, "").trim());
  return rows.slice(1).map((values) =>
    Object.fromEntries(csvHeaders.map((header, index) => [header, values[index] ?? ""]))
  );
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header])).join(","))
    .join("\n")}\n`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function priorityRank(priority) {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  return 2;
}

function nextBestAction(fields) {
  if (fields.includes("barcode_or_ean")) {
    return "Open the pack photos and verify barcode/EAN plus exact formula identity.";
  }
  if (fields.includes("ingredient_text")) {
    return "Transcribe the composition/ingredients panel exactly as printed.";
  }
  if (fields.includes("kcal_per_100g_or_kcal_per_kg")) {
    return "Find calories/ME on label or official product page before import.";
  }
  if (fields.some((field) => field.endsWith("_percent"))) {
    return "Transcribe analytical constituents and minerals from label or technical sheet.";
  }
  return "Review evidence and update the row status.";
}

function buildWorkbookRows(queueRows) {
  const grouped = new Map();

  for (const row of queueRows) {
    const item = grouped.get(row.formula_key) ?? {
      priority: row.priority,
      formula_key: row.formula_key,
      brand: row.brand,
      formula_name: row.formula_name,
      species: row.species,
      open_gap_groups: [],
      critical_missing_fields: [],
      evidence_path: row.evidence_path,
      status: "open",
      notes: row.notes,
    };

    if (priorityRank(row.priority) < priorityRank(item.priority)) {
      item.priority = row.priority;
    }
    item.open_gap_groups.push(row.gap_group);
    item.critical_missing_fields.push(...String(row.missing_fields).split("|"));
    grouped.set(row.formula_key, item);
  }

  return [...grouped.values()]
    .map((row) => {
      const fields = unique(row.critical_missing_fields)
        .filter((field) => criticalOrder.includes(field))
        .sort((a, b) => criticalOrder.indexOf(a) - criticalOrder.indexOf(b));
      return {
        ...row,
        open_gap_groups: unique(row.open_gap_groups).join("|"),
        critical_missing_fields: fields.join("|"),
        next_best_action: nextBestAction(fields),
      };
    })
    .sort(
      (a, b) =>
        priorityRank(a.priority) - priorityRank(b.priority) ||
        a.species.localeCompare(b.species) ||
        a.formula_name.localeCompare(b.formula_name)
    );
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || "unknown";
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function renderCounts(counts) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => `- ${label}: ${count}`)
    .join("\n");
}

function brandMatchesRoyalCanin(value) {
  return value === "Royal Canin" || value === "Royal Canin Veterinary Diet";
}

function buildFoodV2RoyalCaninRows(rows) {
  return rows
    .filter((row) => brandMatchesRoyalCanin(row.brand))
    .sort(
      (a, b) =>
        priorityRank(a.priority) - priorityRank(b.priority) ||
        Number(b.gap_score ?? 0) - Number(a.gap_score ?? 0) ||
        a.display_name.localeCompare(b.display_name)
    );
}

function renderFoodV2GapSummary(rows) {
  if (rows.length === 0) return "- No current Food V2 Royal Canin nutrient gaps found.";

  const high = rows.filter((row) => row.priority === "high").length;
  const medium = rows.filter((row) => row.priority === "medium").length;
  const calciumGaps = rows.filter((row) => String(row.missing_blockers).includes("calcium_percent")).length;
  const phosphorusGaps = rows.filter((row) => String(row.missing_blockers).includes("phosphorus_percent")).length;
  const estimatedKcal = rows.filter((row) =>
    String(row.estimated_fields_to_replace).includes("kcal_per_100g")
  ).length;
  const topRows = rows
    .slice(0, 12)
    .map(
      (row) =>
        `- ${row.brand} - ${row.display_name}: ${row.priority}; blockers=${row.missing_blockers || "none"}; estimated=${row.estimated_fields_to_replace || "none"}; context=${row.health_context || "none"}`
    )
    .join("\n");

  return [
    `- Food V2 Royal Canin gap rows: ${rows.length}`,
    `- High priority: ${high}`,
    `- Medium priority: ${medium}`,
    `- Calcium gaps: ${calciumGaps}`,
    `- Phosphorus gaps: ${phosphorusGaps}`,
    `- Estimated kcal to replace: ${estimatedKcal}`,
    "",
    "First Food V2 rows to resolve:",
    topRows,
  ].join("\n");
}

function renderReport(rows, foodV2RoyalCaninRows) {
  return `# Royal Canin Gap Workbook

Generated: ${new Date().toISOString()}

## Summary

- Workbook rows: ${rows.length}
- Source queue: ${paths.queue}
- Food V2 nutrient gaps: ${paths.foodV2Gaps}
- Output workbook: ${paths.workbook}

## By Species

${renderCounts(countBy(rows, "species"))}

## By Priority

${renderCounts(countBy(rows, "priority"))}

## First Actions

${rows.slice(0, 10).map((row) => `- ${row.formula_name} (${row.species}): ${row.next_best_action}`).join("\n")}

## Food V2 Recommendation-Impact Gaps

${renderFoodV2GapSummary(foodV2RoyalCaninRows)}

## Practical Order

1. Resolve Food V2 rows first when they already appear in the recommendation preview.
2. Use photo workbook rows to backfill missing label evidence for formulas not yet ready for Food V2 import.
3. Prioritize puppy, urinary, renal, senior, sterilised and weight-care formulas before ordinary adult maintenance rows.
`;
}

async function main() {
  const queueRows = parseCsv(await readFile(paths.queue, "utf8"));
  const foodV2GapRows = parseCsv(await readFile(paths.foodV2Gaps, "utf8"));
  const rows = buildWorkbookRows(queueRows);
  const foodV2RoyalCaninRows = buildFoodV2RoyalCaninRows(foodV2GapRows);
  await mkdir(path.dirname(paths.workbook), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.workbook, writeCsv(rows), "utf8");
  await writeFile(paths.report, renderReport(rows, foodV2RoyalCaninRows), "utf8");
  console.log(`Royal Canin gap workbook rows: ${rows.length}`);
  console.log(`Royal Canin Food V2 nutrient gap rows: ${foodV2RoyalCaninRows.length}`);
  console.log(`Wrote ${paths.workbook}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
