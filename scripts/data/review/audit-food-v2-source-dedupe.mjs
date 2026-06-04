import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  queue: "data/review/food_v2_import_candidate_queue.csv",
  groupsCsv: "data/review/food_v2_source_dedupe_groups.csv",
  rowsCsv: "data/review/food_v2_source_dedupe_rows.csv",
  report: "reports/food_v2_source_dedupe_audit.md",
};

const groupHeaders = [
  "canonical_identity_key",
  "row_count",
  "candidate_count",
  "hold_count",
  "best_dataset_file",
  "best_formula_key",
  "best_display_name",
  "best_decision",
  "best_score",
  "best_missing_blockers",
  "recommended_action",
  "alternative_formula_keys",
];

const rowHeaders = [
  "canonical_identity_key",
  "rank",
  "score",
  "decision",
  "dataset_file",
  "formula_key",
  "brand",
  "display_name",
  "species",
  "format",
  "source_priority",
  "title_source_priority",
  "missing_blockers",
  "filled_core_fields",
  "filled_mineral_fields",
  "has_kcal",
  "has_source",
];

const coreFields = [
  "ingredient_text",
  "protein_percent",
  "fat_percent",
  "fiber_percent",
  "ash_percent",
  "moisture_percent",
];

const mineralFields = [
  "calcium_percent",
  "phosphorus_percent",
  "sodium_percent",
  "magnesium_percent",
  "potassium_percent",
];

let iso88597ByteMap = null;

function getIso88597ByteMap() {
  if (iso88597ByteMap) return iso88597ByteMap;

  const decoder = new TextDecoder("iso-8859-7");
  iso88597ByteMap = new Map();
  for (let byte = 0; byte <= 255; byte += 1) {
    iso88597ByteMap.set(decoder.decode(new Uint8Array([byte])), byte);
  }

  return iso88597ByteMap;
}

function countGreekLetters(value) {
  return (value.match(/[\u0370-\u03ff]/gu) ?? []).length;
}

function countMojibakeMarkers(value) {
  return (value.match(/[ΞΟ][\u0380-\u03ffA-Za-z]/gu) ?? []).length;
}

function repairGreekMojibake(value) {
  const text = String(value ?? "");
  if (!text || !/[ΞΟ][\u0380-\u03ffA-Za-z]/u.test(text)) return text;

  const byteMap = getIso88597ByteMap();
  const bytes = [];
  for (const char of text) {
    const byte = byteMap.get(char);
    if (byte === undefined) return text;
    bytes.push(byte);
  }

  const repaired = new TextDecoder("utf-8", { fatal: false }).decode(
    new Uint8Array(bytes)
  );
  const isBetter =
    repaired &&
    !repaired.includes("\uFFFD") &&
    countMojibakeMarkers(repaired) < countMojibakeMarkers(text) &&
    countGreekLetters(repaired) >= countGreekLetters(text) / 2;

  return isBetter ? repaired : text;
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

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/u.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(headers, rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header])).join(","))
    .join("\n")}\n`;
}

function hasValue(value) {
  const text = String(value ?? "").trim();
  return text.length > 0 && text.toLowerCase() !== "null";
}

function normalizeToken(value) {
  return normalizeFoodTokenAliases(repairGreekMojibake(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/\b\d+(?:[,.]\d+)?\s*(?:kg|g|gr|grams?)\b/giu, " ")
    .replace(/\b\d+\s*%\b/gu, " ")
    .replace(/\b(?:with|με)\b/giu, " ")
    .replace(/[^a-z0-9\u0370-\u03ff]+/giu, " ")
    .replace(/\s+/g, " ")
    .trim());
}

function normalizeFoodTokenAliases(value) {
  return String(value ?? "")
    .replace(/\u03bc\u03b5/gu, " ")
    .replace(/\u03ba\u03b1\u03b9/gu, " and ")
    .replace(/\u03ba\u03bf\u03c4\u03bf\u03c0\u03bf\u03c5\u03bb\u03bf/gu, " chicken ")
    .replace(/\u03c7\u03bf\u03b9\u03c1\u03b9\u03bd\u03bf/gu, " pork ")
    .replace(/\u03c0\u03c1\u03bf\u03c3\u03bf\u03c5\u03c4\u03bf/gu, " ham ")
    .replace(/\u03c8\u03b1\u03c1\u03b9/gu, " fish ")
    .replace(/\u03c1\u03c5\u03b6\u03b9/gu, " rice ")
    .replace(/\u03c4\u03bf\u03bd\u03bf\u03c2/gu, " tuna ")
    .replace(/\u03c4\u03bf\u03bd\u03bf/gu, " tuna ")
    .replace(/\u03b1\u03c1\u03bd\u03b9/gu, " lamb ")
    .replace(/\u03c3\u03bf\u03bb\u03bf\u03bc\u03bf\u03c2/gu, " salmon ")
    .replace(/\u03c3\u03bf\u03bb\u03bf\u03bc\u03bf/gu, " salmon ")
    .replace(/\u03bc\u03bf\u03c3\u03c7\u03b1\u03c1\u03b9/gu, " beef ")
    .replace(/\u03b2\u03bf\u03b4\u03b9\u03bd\u03bf/gu, " beef ")
    .replace(/\u03c0\u03b1\u03c0\u03b9\u03b1/gu, " duck ")
    .replace(/\u03b3\u03b1\u03bb\u03bf\u03c0\u03bf\u03c5\u03bb\u03b1/gu, " turkey ")
    .replace(/\u03b3\u03b1\u03c1\u03b9\u03b4\u03b5\u03c2/gu, " shrimp ")
    .replace(/\u03b3\u03b1\u03c1\u03b9\u03b4\u03b1/gu, " shrimp ")
    .replace(/\s+/g, " ")
    .trim();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function normalizeGreekFoodTokens(value) {
  return String(value ?? "")
    .replace(/\bμε\b/gu, " ")
    .replace(/\bκαι\b/gu, " and ")
    .replace(/\bκοτοπουλο\b/gu, " chicken ")
    .replace(/\bχοιρινο\b/gu, " pork ")
    .replace(/\bπροσουτο\b/gu, " ham ")
    .replace(/\bψαρι\b/gu, " fish ")
    .replace(/\bρυζι\b/gu, " rice ")
    .replace(/\bτονος\b/gu, " tuna ")
    .replace(/\bτονο\b/gu, " tuna ")
    .replace(/\bαρνι\b/gu, " lamb ")
    .replace(/\bσολομος\b/gu, " salmon ")
    .replace(/\bσολομο\b/gu, " salmon ")
    .replace(/\bμοσχαρι\b/gu, " beef ")
    .replace(/\bβοδινο\b/gu, " beef ")
    .replace(/\bπαπια\b/gu, " duck ")
    .replace(/\bγαλοπουλα\b/gu, " turkey ")
    .replace(/\bγαριδα\b/gu, " shrimp ")
    .replace(/\bγαριδες\b/gu, " shrimp ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripBrandFromFormula(brand, formula) {
  const brandText = normalizeToken(brand);
  let formulaText = normalizeToken(applyBrandFormulaAlias(brand, formula));
  if (brandText && formulaText.startsWith(`${brandText} `)) {
    formulaText = formulaText.slice(brandText.length + 1).trim();
  }
  return formulaText;
}

function applyBrandFormulaAlias(brand, formula) {
  const brandText = normalizeToken(brand);
  let formulaText = normalizeToken(formula);

  if (brandText !== "schesir") return formula;
  if (formulaText.startsWith(`${brandText} `)) {
    formulaText = formulaText.slice(brandText.length + 1).trim();
  }

  const normalizedAliases = [
    [/^dry medium maintenance(?: chicken)?$/u, "Adult Medium Chicken"],
    [/^adult medium chicken$/u, "Adult Medium Chicken"],
    [/^dry small maintenance(?: dog| chicken)?$/u, "Adult Small Chicken Rice"],
    [/^adult small(?: chicken and rice| chicken rice)$/u, "Adult Small Chicken Rice"],
    [/^dry kitten(?: chicken)?$/u, "Kitten Chicken"],
    [/^kitten chicken$/u, "Kitten Chicken"],
    [/^cat sterilized and light(?: chicken)?$/u, "Sterilized Light Chicken"],
    [/^sterili[sz]ed cat chicken$/u, "Sterilized Light Chicken"],
  ];

  for (const [pattern, replacement] of normalizedAliases) {
    if (pattern.test(formulaText)) return replacement;
  }

  const schesirAliases = [
    [/^dry medium maintenance(?: chicken| με κοτοπουλο)?$/u, "Adult Medium Chicken"],
    [/^adult medium(?: με κοτοπουλο| chicken)$/u, "Adult Medium Chicken"],
    [/^dry small maintenance(?: dog| με κοτοπουλο)?$/u, "Adult Small Chicken Rice"],
    [/^adult small(?: με κοτοπουλο and ρυζι| chicken rice)$/u, "Adult Small Chicken Rice"],
    [/^dry kitten(?: με κοτοπουλο| chicken)?$/u, "Kitten Chicken"],
    [/^kitten(?: με κοτοπουλο| chicken)$/u, "Kitten Chicken"],
    [/^cat sterilized and light(?: με κοτοπουλο| chicken)?$/u, "Sterilized Light Chicken"],
    [/^sterili[sz]ed cat(?: με κοτοπουλο| chicken)$/u, "Sterilized Light Chicken"],
  ];

  for (const [pattern, replacement] of schesirAliases) {
    if (pattern.test(formulaText)) return replacement;
  }

  return formula;
}

function canonicalIdentityKey(row) {
  const brand = normalizeToken(row.brand);
  const formula = stripBrandFromFormula(
    row.brand,
    row.formula_name || row.display_name || row.formula_key
  );
  const species = normalizeToken(row.species || "unknown");
  const format = normalizeToken(row.format || "unknown");
  return [brand, formula, species, format].filter(Boolean).join("|");
}

function sourceScore(priority) {
  const value = String(priority ?? "").toLowerCase();
  if (value === "official") return 18;
  if (value === "pdf" || value === "document") return 14;
  if (value === "retailer") return 10;
  if (value === "manual_photo") return 8;
  return 0;
}

function rowScore(queueRow, fullRow) {
  const filledCore = coreFields.filter((field) => hasValue(fullRow[field])).length;
  const filledMinerals = mineralFields.filter((field) => hasValue(fullRow[field])).length;
  const hasKcal = hasValue(fullRow.kcal_per_100g) || hasValue(fullRow.kcal_per_kg);
  const hasSource = hasValue(fullRow.data_source_url) || fullRow.source_priority === "manual_photo";
  const decisionBonus = queueRow.decision === "candidate" ? 30 : 0;
  const qualityBonus = fullRow.data_quality_status === "verified" ? 10 : 0;
  const titleBonus = Number(queueRow.title_source_priority || 0) / 10;

  return {
    filledCore,
    filledMinerals,
    hasKcal,
    hasSource,
    score:
      decisionBonus +
      qualityBonus +
      sourceScore(fullRow.source_priority) +
      titleBonus +
      filledCore * 4 +
      filledMinerals * 3 +
      (hasKcal ? 8 : 0) +
      (hasSource ? 6 : 0),
  };
}

async function readImportRows(datasetFiles) {
  const rowsByDataset = new Map();
  for (const datasetFile of datasetFiles) {
    try {
      rowsByDataset.set(
        datasetFile,
        parseCsv(await readFile(path.join(process.cwd(), datasetFile), "utf8"))
      );
    } catch {
      rowsByDataset.set(datasetFile, []);
    }
  }
  return rowsByDataset;
}

function recommendedAction(groupRows) {
  const best = groupRows[0];
  if (best.queueRow.decision === "candidate" && groupRows.length > 1) {
    return "Use best row for preview; keep alternatives as evidence/backfill references.";
  }
  if (best.queueRow.decision === "candidate") return "Use best row for preview.";
  return "Keep in review until blockers are resolved.";
}

function displayNameFor(queueRow, fullRow) {
  return repairGreekMojibake(
    fullRow.display_name ||
      [queueRow.brand, queueRow.formula_name].filter(Boolean).join(" ")
  );
}

function renderReport(groupRows, rowRows) {
  const duplicateGroups = groupRows.filter((row) => Number(row.row_count) > 1);
  const importReadyGroups = groupRows.filter((row) => row.best_decision === "candidate");
  const topGroups = duplicateGroups.slice(0, 20);

  return `# Food V2 Source Dedupe Audit

Generated: ${new Date().toISOString()}

## Summary

- Formula identity groups: ${groupRows.length}
- Duplicate source groups: ${duplicateGroups.length}
- Groups with an importable best row: ${importReadyGroups.length}
- Source rows analyzed: ${rowRows.length}
- Group CSV: ${paths.groupsCsv}
- Row CSV: ${paths.rowsCsv}

## How To Use

Use the best row for admin preview, then keep alternative rows as evidence/backfill references. This audit does not import or delete anything.

## Top Duplicate Groups

${topGroups
  .map(
    (row) =>
      `- ${row.best_display_name} (${row.row_count} rows): best=${row.best_formula_key}; alternatives=${row.alternative_formula_keys || "none"}`
  )
  .join("\n")}
`;
}

async function main() {
  const queueRows = parseCsv(await readFile(paths.queue, "utf8"));
  const datasetFiles = [...new Set(queueRows.map((row) => row.dataset_file).filter(Boolean))];
  const rowsByDataset = await readImportRows(datasetFiles);
  const fullRowsByKey = new Map();

  for (const datasetFile of datasetFiles) {
    for (const row of rowsByDataset.get(datasetFile) ?? []) {
      if (row.formula_key) fullRowsByKey.set(`${datasetFile}::${row.formula_key}`, row);
    }
  }

  const groups = new Map();
  for (const queueRow of queueRows) {
    const fullRow =
      fullRowsByKey.get(`${queueRow.dataset_file}::${queueRow.formula_key}`) ?? {};
    const mergedRow = { ...fullRow, ...queueRow };
    const key = canonicalIdentityKey(mergedRow);
    if (!key) continue;
    const score = rowScore(queueRow, mergedRow);
    const item = { queueRow, fullRow: mergedRow, score };
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  const groupRows = [];
  const rowRows = [];

  for (const [canonicalKey, items] of groups.entries()) {
    items.sort(
      (a, b) =>
        b.score.score - a.score.score ||
        String(a.fullRow.display_name || a.queueRow.formula_name).localeCompare(
          String(b.fullRow.display_name || b.queueRow.formula_name)
        )
    );
    const best = items[0];
    const alternatives = items
      .slice(1)
      .map((item) => item.queueRow.formula_key)
      .filter(Boolean);
    const candidateCount = items.filter((item) => item.queueRow.decision === "candidate").length;
    const holdCount = items.filter((item) => item.queueRow.decision === "hold").length;

    groupRows.push({
      canonical_identity_key: canonicalKey,
      row_count: items.length,
      candidate_count: candidateCount,
      hold_count: holdCount,
      best_dataset_file: best.queueRow.dataset_file,
      best_formula_key: best.queueRow.formula_key,
      best_display_name: displayNameFor(best.queueRow, best.fullRow),
      best_decision: best.queueRow.decision,
      best_score: best.score.score.toFixed(1),
      best_missing_blockers: best.queueRow.missing_blockers,
      recommended_action: recommendedAction(items),
      alternative_formula_keys: alternatives.join("|"),
    });

    items.forEach((item, index) => {
      rowRows.push({
        canonical_identity_key: canonicalKey,
        rank: index + 1,
        score: item.score.score.toFixed(1),
        decision: item.queueRow.decision,
        dataset_file: item.queueRow.dataset_file,
        formula_key: item.queueRow.formula_key,
        brand: repairGreekMojibake(item.queueRow.brand),
        display_name: displayNameFor(item.queueRow, item.fullRow),
        species: item.queueRow.species,
        format: item.fullRow.format,
        source_priority: item.queueRow.source_priority,
        title_source_priority: item.queueRow.title_source_priority,
        missing_blockers: item.queueRow.missing_blockers,
        filled_core_fields: item.score.filledCore,
        filled_mineral_fields: item.score.filledMinerals,
        has_kcal: item.score.hasKcal ? "yes" : "no",
        has_source: item.score.hasSource ? "yes" : "no",
      });
    });
  }

  groupRows.sort(
    (a, b) =>
      Number(b.row_count) - Number(a.row_count) ||
      Number(b.best_score) - Number(a.best_score) ||
      a.best_display_name.localeCompare(b.best_display_name)
  );

  await mkdir(path.dirname(paths.groupsCsv), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.groupsCsv, writeCsv(groupHeaders, groupRows), "utf8");
  await writeFile(paths.rowsCsv, writeCsv(rowHeaders, rowRows), "utf8");
  await writeFile(paths.report, renderReport(groupRows, rowRows), "utf8");

  console.log(`Food V2 source dedupe groups: ${groupRows.length}`);
  console.log(`Duplicate source groups: ${groupRows.filter((row) => Number(row.row_count) > 1).length}`);
  console.log(`Wrote ${paths.groupsCsv}`);
  console.log(`Wrote ${paths.rowsCsv}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
