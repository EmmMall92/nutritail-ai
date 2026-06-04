import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  importsDir: "data/imports",
  reviewCsv: "data/review/epa_dha_combined_normalization_review.csv",
  report: "reports/epa_dha_combined_normalization.md",
};

const reviewHeaders = [
  "action",
  "dataset_file",
  "formula_key",
  "brand",
  "formula_name",
  "old_dha_percent",
  "old_epa_percent",
  "new_epa_dha_percent",
  "evidence",
  "notes",
];

const textFields = [
  "additives_text",
  "ingredient_text",
  "ingredients",
  "feeding_guide_text",
  "source_notes",
];

function parseCsvWithHeaders(text) {
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

  return {
    headers,
    rows: rows.slice(1).map((values) =>
      Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
    ),
  };
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

function ensureCombinedHeader(headers) {
  if (headers.includes("epa_dha_percent")) return headers;
  const epaIndex = headers.indexOf("epa_percent");
  const insertAt = epaIndex >= 0 ? epaIndex + 1 : headers.length;
  return [
    ...headers.slice(0, insertAt),
    "epa_dha_percent",
    ...headers.slice(insertAt),
  ];
}

function hasValue(value) {
  const text = String(value ?? "").trim();
  return text.length > 0 && text.toLowerCase() !== "null";
}

function parseNumber(value) {
  const normalized = String(value ?? "").trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPercent(value) {
  return String(Number(value.toFixed(4))).replace(/\.0+$/u, "");
}

function appendSourceNote(row, note) {
  const current = String(row.source_notes ?? "").trim();
  if (current.includes(note)) return current;
  return [current, note].filter(Boolean).join("; ");
}

function collectText(row) {
  return textFields
    .map((field) => row[field])
    .filter(hasValue)
    .join(" | ")
    .replace(/\s+/gu, " ");
}

function evidenceSnippet(text, start, end) {
  const from = Math.max(0, start - 70);
  const to = Math.min(text.length, end + 70);
  return text.slice(from, to).replace(/\s+/gu, " ").trim();
}

function unitToPercent(value, unit, evidence) {
  const normalizedUnit = String(unit ?? "%").toLowerCase().replace(/\s+/gu, "");
  if (normalizedUnit.includes("mg")) return { value: value / 10000, assumed: false };
  if (normalizedUnit.includes("g/kg")) return { value: value / 10, assumed: false };
  if (normalizedUnit === "g") return { value: value / 10, assumed: true };
  if (normalizedUnit.includes("%") || evidence.includes("%")) {
    return { value, assumed: false };
  }
  return { value, assumed: false };
}

function hasSplitPairValues(segment) {
  return /\d+(?:[,.]\d+)?\s*(?:%|mg\s*\/?\s*kg|g\s*\/?\s*kg)?\s*\/\s*\d/iu.test(
    segment
  );
}

function collectCombinedMatches(text) {
  const matches = [];
  const pattern =
    /\b(?:EPA\s*(?:\/|\+|&|and|και)\s*DHA|DHA\s*(?:\/|\+|&|and|και)\s*EPA)\b\s*:?\s*(\d+(?:[,.]\d+)?)\s*(%|mg\s*\/?\s*kg|g\s*\/?\s*kg|g)?/giu;

  for (const match of text.matchAll(pattern)) {
    const matchStart = match.index ?? 0;
    const matchEnd = matchStart + match[0].length;
    const nearbySegment = text.slice(matchStart, Math.min(text.length, matchEnd + 25));
    if (hasSplitPairValues(nearbySegment)) continue;

    const numeric = parseNumber(match[1]);
    if (numeric === null) continue;

    const evidence = evidenceSnippet(
      text,
      match.index ?? 0,
      (match.index ?? 0) + match[0].length
    );
    const converted = unitToPercent(numeric, match[2] ?? "%", evidence);
    if (converted.value < 0 || converted.value > 5) continue;

    matches.push({
      percent: converted.value,
      evidence,
      assumedGPerKg: converted.assumed,
    });
  }

  return matches;
}

function uniqueCombinedMatch(matches) {
  const values = [...new Set(matches.map((match) => formatPercent(match.percent)))];
  if (values.length !== 1) return null;
  return matches[0];
}

function isLikelyCombinedDuplicate(row, text) {
  const dha = parseNumber(row.dha_percent);
  const epa = parseNumber(row.epa_percent);
  if (dha === null || epa === null || dha !== epa) return false;
  if (String(row.source_notes ?? "").includes("_percent_backfilled_from_text=true")) {
    return false;
  }
  if (collectCombinedMatches(text).length > 0) return true;
  return /royal\s+canin/i.test(String(row.brand ?? ""));
}

function fallbackCombinedFromDuplicate(row) {
  const value = parseNumber(row.dha_percent);
  if (value === null) return null;
  return value > 1.5 ? value / 10 : value;
}

async function importFiles() {
  const names = await readdir(paths.importsDir);
  return names
    .filter((name) => name.endsWith("_v2.csv"))
    .map((name) => path.join(paths.importsDir, name).replace(/\\/g, "/"))
    .sort();
}

async function processFile(file) {
  const { headers, rows } = parseCsvWithHeaders(await readFile(file, "utf8"));
  if (!headers.includes("dha_percent") || !headers.includes("epa_percent")) {
    return { changed: false, reviewRows: [] };
  }

  const outputHeaders = ensureCombinedHeader(headers);
  const reviewRows = [];
  let changed = false;

  for (const row of rows) {
    if (!("epa_dha_percent" in row)) row.epa_dha_percent = "";

    const text = collectText(row);
    const combinedMatch = uniqueCombinedMatch(collectCombinedMatches(text));
    const likelyCombinedDuplicate = isLikelyCombinedDuplicate(row, text);
    const alreadyCombined =
      hasValue(row.epa_dha_percent) &&
      !hasValue(row.dha_percent) &&
      !hasValue(row.epa_percent) &&
      String(row.source_notes ?? "").includes(
        "epa_dha_percent_from_combined_label=true"
      );

    if (alreadyCombined) {
      reviewRows.push({
        action: "current_combined",
        dataset_file: file,
        formula_key: row.formula_key,
        brand: row.brand,
        formula_name: row.formula_name,
        old_dha_percent: row.dha_percent,
        old_epa_percent: row.epa_percent,
        new_epa_dha_percent: row.epa_dha_percent,
        evidence:
          combinedMatch?.evidence ??
          "Previously normalized combined EPA+DHA value.",
        notes: "Already stored as combined EPA+DHA.",
      });
      continue;
    }

    if (!combinedMatch && !likelyCombinedDuplicate) continue;

    const oldDha = row.dha_percent;
    const oldEpa = row.epa_percent;
    const combinedValue =
      combinedMatch?.percent ?? fallbackCombinedFromDuplicate(row);

    if (combinedValue === null) continue;

    row.epa_dha_percent = formatPercent(combinedValue);
    row.dha_percent = "";
    row.epa_percent = "";
    row.source_notes = appendSourceNote(
      row,
      "epa_dha_percent_from_combined_label=true"
    );
    if (combinedMatch?.assumedGPerKg || parseNumber(oldDha) > 1.5) {
      row.source_notes = appendSourceNote(
        row,
        "epa_dha_combined_g_per_kg_converted_to_percent=true"
      );
    }
    if (likelyCombinedDuplicate) {
      row.source_notes = appendSourceNote(
        row,
        "cleared_duplicate_epa_dha_split_from_combined_value=true"
      );
    }

    changed = true;
    reviewRows.push({
      action: likelyCombinedDuplicate
        ? "moved_duplicate_split_to_combined"
        : "filled_combined",
      dataset_file: file,
      formula_key: row.formula_key,
      brand: row.brand,
      formula_name: row.formula_name,
      old_dha_percent: oldDha,
      old_epa_percent: oldEpa,
      new_epa_dha_percent: row.epa_dha_percent,
      evidence:
        combinedMatch?.evidence ??
        "Equal EPA and DHA values looked like a combined label value.",
      notes: "Stored as combined EPA+DHA; separate EPA/DHA fields cleared.",
    });
  }

  if (changed) {
    await writeFile(file, writeCsv(outputHeaders, rows), "utf8");
  }

  return { changed, reviewRows };
}

function renderReport(reviewRows, changedFiles) {
  const byAction = reviewRows.reduce((acc, row) => {
    acc[row.action] = (acc[row.action] ?? 0) + 1;
    return acc;
  }, {});
  const byBrand = reviewRows.reduce((acc, row) => {
    acc[row.brand] = (acc[row.brand] ?? 0) + 1;
    return acc;
  }, {});

  return `# EPA/DHA Combined Normalization

Generated: ${new Date().toISOString()}

## Summary

- Files changed: ${changedFiles.length}
- Rows normalized: ${reviewRows.length}
- Current combined rows: ${byAction.current_combined ?? 0}
- Filled combined values: ${byAction.filled_combined ?? 0}
- Moved duplicate split values to combined: ${byAction.moved_duplicate_split_to_combined ?? 0}
- Review CSV: ${paths.reviewCsv}

## Rule

Rows with clear separate values such as "DHA / EPA 0.7% / 0.5%" keep separate DHA and EPA fields. Rows with one combined label value such as "EPA+DHA: 0.4%" or "EPA + DHA 2.1 g/kg" use epa_dha_percent instead. Suspicious equal EPA/DHA values, especially Royal Canin combined-style rows, are moved to epa_dha_percent and the split fields are cleared.

## By Brand

${Object.entries(byBrand)
  .sort((a, b) => b[1] - a[1])
  .map(([brand, count]) => `- ${brand}: ${count}`)
  .join("\n") || "- none"}

## Changed Files

${changedFiles.map((file) => `- ${file}`).join("\n") || "- none"}
`;
}

async function main() {
  const files = await importFiles();
  const allReviewRows = [];
  const changedFiles = [];

  for (const file of files) {
    const result = await processFile(file);
    allReviewRows.push(...result.reviewRows);
    if (result.changed) changedFiles.push(file);
  }

  await mkdir(path.dirname(paths.reviewCsv), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.reviewCsv, writeCsv(reviewHeaders, allReviewRows), "utf8");
  await writeFile(paths.report, renderReport(allReviewRows, changedFiles), "utf8");

  console.log(`EPA/DHA combined rows normalized: ${allReviewRows.length}`);
  console.log(`Changed files: ${changedFiles.length}`);
  console.log(`Wrote ${paths.reviewCsv}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
