import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  consolidated: "data/review/royal_canin_photo_review_consolidated.csv",
  queue: "data/review/royal_canin_photo_gap_queue.csv",
  report: "reports/royal_canin_photo_gap_queue.md",
};

const headers = [
  "priority",
  "formula_key",
  "brand",
  "formula_name",
  "species",
  "gap_group",
  "missing_fields",
  "evidence_path",
  "recommended_panel",
  "recommended_action",
  "status",
  "notes",
];

const gapGroups = [
  {
    key: "identity_and_barcode",
    fields: ["barcode_or_ean"],
    priority: "high",
    panel: "front/back pack photo with barcode or EAN area",
    action: "Capture or verify barcode/EAN and pack identity before production import.",
  },
  {
    key: "core_nutrition",
    fields: [
      "kcal_per_100g_or_kcal_per_kg",
      "protein_percent",
      "fat_percent",
      "fiber_percent",
      "ash_percent",
      "moisture_percent",
    ],
    priority: "high",
    panel: "analytical constituents and calorie/energy panel",
    action: "Transcribe calories and analytical constituents from the label or official product page.",
  },
  {
    key: "minerals",
    fields: [
      "calcium_percent",
      "phosphorus_percent",
      "sodium_percent",
      "magnesium_percent",
    ],
    priority: "medium",
    panel: "analytical constituents/minerals panel or official technical sheet",
    action: "Backfill minerals where present; keep blank if the label/source does not publish them.",
  },
  {
    key: "ingredients",
    fields: ["ingredient_text"],
    priority: "medium",
    panel: "composition/ingredients panel",
    action: "Transcribe ingredient text exactly as printed and verify comma separation.",
  },
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
  if (value == null) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header] ?? "")).join(","))
    .join("\n")}\n`;
}

function missingSet(row) {
  return new Set(
    String(row.missing_fields ?? "")
      .split("|")
      .map((field) => field.trim())
      .filter(Boolean)
  );
}

function queueRowsFor(row) {
  const missing = missingSet(row);
  return gapGroups
    .map((group) => ({
      group,
      fields: group.fields.filter((field) => missing.has(field)),
    }))
    .filter((item) => item.fields.length > 0)
    .map(({ group, fields }) => ({
      priority: group.priority,
      formula_key: row.formula_key,
      brand: row.brand,
      formula_name: row.formula_name,
      species: row.species,
      gap_group: group.key,
      missing_fields: fields.join("|"),
      evidence_path: row.evidence_path,
      recommended_panel: group.panel,
      recommended_action: group.action,
      status: "open",
      notes: row.notes,
    }));
}

function priorityRank(priority) {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  return 2;
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

function renderReport(sourceRows, queueRows) {
  const firstHigh = queueRows
    .filter((row) => row.priority === "high")
    .slice(0, 10)
    .map((row) => `- ${row.formula_name} (${row.species}) - ${row.gap_group}`)
    .join("\n");

  return `# Royal Canin Photo Gap Queue

Generated: ${new Date().toISOString()}

## Summary

- Source review rows: ${sourceRows.length}
- Gap queue rows: ${queueRows.length}
- Queue CSV: ${paths.queue}
- Source CSV: ${paths.consolidated}

## By Priority

${renderCounts(countBy(queueRows, "priority"))}

## By Gap Group

${renderCounts(countBy(queueRows, "gap_group"))}

## By Species

${renderCounts(countBy(queueRows, "species"))}

## First High-Priority Checks

${firstHigh || "- No high-priority gaps"}

## Operating Rule

Resolve identity/barcode and core nutrition gaps first. Keep rows in needs_review until source evidence proves the missing values and the Food V2 preview is clean.
`;
}

async function main() {
  const sourceRows = parseCsv(await readFile(paths.consolidated, "utf8"));
  const queueRows = sourceRows
    .flatMap(queueRowsFor)
    .sort(
      (a, b) =>
        priorityRank(a.priority) - priorityRank(b.priority) ||
        a.species.localeCompare(b.species) ||
        a.formula_name.localeCompare(b.formula_name) ||
        a.gap_group.localeCompare(b.gap_group)
    );

  await mkdir(path.dirname(paths.queue), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.queue, writeCsv(queueRows), "utf8");
  await writeFile(paths.report, renderReport(sourceRows, queueRows), "utf8");

  console.log(`Royal Canin photo gap queue rows: ${queueRows.length}`);
  console.log(`Wrote ${paths.queue}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
