import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  importsDir: "data/imports",
  reviewCsv: "data/review/epa_dha_text_backfill_review.csv",
  report: "reports/epa_dha_text_backfill.md",
};

const reviewHeaders = [
  "action",
  "dataset_file",
  "formula_key",
  "brand",
  "formula_name",
  "field",
  "old_value",
  "new_value",
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

function hasValue(value) {
  const text = String(value ?? "").trim();
  return text.length > 0 && text.toLowerCase() !== "null";
}

function normalizeNumberToken(token) {
  if (!token) return null;
  const value = String(token).trim().replace(",", ".");
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPercent(value) {
  return String(Number(value.toFixed(4))).replace(/\.0+$/u, "");
}

function percentFromValueUnit(value, unit) {
  const normalizedUnit = String(unit ?? "%").toLowerCase();
  if (normalizedUnit.includes("mg")) return value / 10000;
  if (normalizedUnit.includes("g/kg")) return value / 10;
  if (normalizedUnit.includes("%") || !normalizedUnit.trim()) return value;
  return null;
}

function evidenceSnippet(text, start, end) {
  const from = Math.max(0, start - 70);
  const to = Math.min(text.length, end + 70);
  return text.slice(from, to).replace(/\s+/gu, " ").trim();
}

function collectText(row) {
  return textFields
    .map((field) => row[field])
    .filter(hasValue)
    .join(" | ")
    .replace(/\s+/gu, " ");
}

function collectSingleNutrientMatches(text, nutrient) {
  const matches = [];
  const label =
    nutrient === "dha"
      ? String.raw`(?:\bDHA\b|docosahexaenoic(?:\s+acid)?|ω-?3\s+λιπαρ(?:ό|ο)\s+οξύ\s*\(?DHA\)?)`
      : String.raw`(?:\bEPA\b|eicosapentaenoic(?:\s+acid)?|ω-?3\s+λιπαρ(?:ό|ο)\s+οξύ\s*\(?EPA\)?)`;
  const patterns = [
    new RegExp(`${label}[^\\d]{0,35}(\\d+(?:[,.]\\d+)?)\\s*(%|mg\\s*/?\\s*kg|g\\s*/?\\s*kg)?`, "giu"),
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const valueToken = match[1];
      const unit = match[2] ?? "%";
      const value = normalizeNumberToken(valueToken);
      if (value === null) continue;
      const percent = percentFromValueUnit(value, unit);
      if (percent === null || percent < 0 || percent > 3) continue;
      matches.push({
        nutrient,
        percent,
        evidence: evidenceSnippet(text, match.index ?? 0, (match.index ?? 0) + match[0].length),
        start: match.index ?? 0,
        end: (match.index ?? 0) + match[0].length,
      });
    }
  }

  return matches;
}

function collectPairedMatches(text) {
  const matches = [];
  const pairPatterns = [
    {
      order: ["dha", "epa"],
      pattern:
        /\bDHA\s*\/\s*EPA\b[^\d]{0,45}(\d+(?:[,.]\d+)?)\s*(%|mg\s*\/?\s*kg|g\s*\/?\s*kg)?\s*\/\s*(\d+(?:[,.]\d+)?)\s*(%|mg\s*\/?\s*kg|g\s*\/?\s*kg)?/giu,
    },
    {
      order: ["epa", "dha"],
      pattern:
        /\bEPA\s*\/\s*DHA\b[^\d]{0,45}(\d+(?:[,.]\d+)?)\s*(%|mg\s*\/?\s*kg|g\s*\/?\s*kg)?\s*\/\s*(\d+(?:[,.]\d+)?)\s*(%|mg\s*\/?\s*kg|g\s*\/?\s*kg)?/giu,
    },
  ];

  for (const { order, pattern } of pairPatterns) {
    for (const match of text.matchAll(pattern)) {
      const first = normalizeNumberToken(match[1]);
      const second = normalizeNumberToken(match[3]);
      if (first === null || second === null) continue;
      const firstPercent = percentFromValueUnit(first, match[2] ?? "%");
      const secondPercent = percentFromValueUnit(second, match[4] ?? match[2] ?? "%");
      if (firstPercent === null || secondPercent === null) continue;
      const evidence = evidenceSnippet(text, match.index ?? 0, (match.index ?? 0) + match[0].length);
      [
        [order[0], firstPercent],
        [order[1], secondPercent],
      ].forEach(([nutrient, percent]) => {
        if (percent >= 0 && percent <= 3) {
          matches.push({
            nutrient,
            percent,
            evidence,
            start: match.index ?? 0,
            end: (match.index ?? 0) + match[0].length,
          });
        }
      });
    }
  }

  return matches;
}

function collectAmbiguousPairMentions(text) {
  const mentions = [];
  const pattern =
    /\b(?:EPA\s*(?:\/|\+|&|and|και)\s*DHA|DHA\s*(?:\/|\+|&|and|και)\s*EPA)\b[^.\n\r;|]{0,50}(\d+(?:[,.]\d+)?)\s*(%|mg\s*\/?\s*kg|g\s*\/?\s*kg|g)?/giu;
  for (const match of text.matchAll(pattern)) {
    const hasTwoValues = /\d+(?:[,.]\d+)?\s*(?:%|mg\s*\/?\s*kg|g\s*\/?\s*kg)?\s*\/\s*\d/iu.test(match[0]);
    if (!hasTwoValues) {
      mentions.push({
        evidence: evidenceSnippet(text, match.index ?? 0, (match.index ?? 0) + match[0].length),
        start: match.index ?? 0,
        end: (match.index ?? 0) + match[0].length,
      });
    }
  }
  return mentions;
}

function bestMatch(matches, nutrient) {
  const nutrientMatches = matches.filter((match) => match.nutrient === nutrient);
  if (nutrientMatches.length === 0) return null;
  const uniqueValues = [...new Set(nutrientMatches.map((match) => formatPercent(match.percent)))];
  if (uniqueValues.length > 1) return { conflict: true, values: uniqueValues, evidence: nutrientMatches[0].evidence };
  return nutrientMatches[0];
}

function overlaps(match, spans) {
  return spans.some((span) => match.start < span.end && match.end > span.start);
}

function appendSourceNote(row, note) {
  const current = String(row.source_notes ?? "").trim();
  if (current.includes(note)) return current;
  return [current, note].filter(Boolean).join("; ");
}

function removeSourceNote(row, note) {
  return String(row.source_notes ?? "")
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part && part !== note)
    .join("; ");
}

async function importFiles() {
  const names = await readdir(paths.importsDir);
  return names
    .filter((name) => name.endsWith("_v2.csv"))
    .map((name) => path.join(paths.importsDir, name).replace(/\\/g, "/"))
    .sort();
}

async function processFile(file) {
  const parsed = parseCsvWithHeaders(await readFile(file, "utf8"));
  const { headers, rows } = parsed;
  if (!headers.includes("dha_percent") || !headers.includes("epa_percent")) {
    return { changed: false, reviewRows: [] };
  }

  const reviewRows = [];
  let changed = false;

  for (const row of rows) {
    for (const field of ["dha_percent", "epa_percent"]) {
      const note = `${field}_backfilled_from_text=true`;
      if (String(row.source_notes ?? "").includes(note)) {
        row[field] = "";
        row.source_notes = removeSourceNote(row, note);
        changed = true;
      }
    }

    const text = collectText(row);
    if (!/\b(?:EPA|DHA)\b|docosahexaenoic|eicosapentaenoic|ω-?3/iu.test(text)) {
      continue;
    }

    const pairedMatches = collectPairedMatches(text);
    const ambiguousMentions = collectAmbiguousPairMentions(text);
    const pairedSpans = pairedMatches.map((match) => ({
      start: match.start,
      end: match.end,
    }));
    const ambiguousSpans = ambiguousMentions.map((mention) => ({
      start: mention.start,
      end: mention.end,
    }));
    const singleMatches = [
      ...collectSingleNutrientMatches(text, "dha"),
      ...collectSingleNutrientMatches(text, "epa"),
    ].filter(
      (match) =>
        !overlaps(match, pairedSpans) && !overlaps(match, ambiguousSpans)
    );
    const matches = [...pairedMatches, ...singleMatches];

    for (const field of ["dha_percent", "epa_percent"]) {
      const nutrient = field.slice(0, 3);
      if (hasValue(row[field])) continue;
      const match = bestMatch(matches, nutrient);
      if (!match) continue;
      if ("conflict" in match) {
        reviewRows.push({
          action: "needs_review",
          dataset_file: file,
          formula_key: row.formula_key,
          brand: row.brand,
          formula_name: row.formula_name,
          field,
          old_value: row[field],
          new_value: match.values.join("|"),
          evidence: match.evidence,
          notes: "Conflicting EPA/DHA values found in text; not auto-filled.",
        });
        continue;
      }

      row[field] = formatPercent(match.percent);
      row.source_notes = appendSourceNote(
        row,
        `${field}_backfilled_from_text=true`
      );
      changed = true;
      reviewRows.push({
        action: "backfilled",
        dataset_file: file,
        formula_key: row.formula_key,
        brand: row.brand,
        formula_name: row.formula_name,
        field,
        old_value: "",
        new_value: row[field],
        evidence: match.evidence,
        notes: "Exact EPA/DHA value extracted from row text.",
      });
    }

    for (const { evidence } of ambiguousMentions) {
      reviewRows.push({
        action: "ambiguous",
        dataset_file: file,
        formula_key: row.formula_key,
        brand: row.brand,
        formula_name: row.formula_name,
        field: "epa_percent|dha_percent",
        old_value: "",
        new_value: "",
        evidence,
        notes: "Combined EPA/DHA mention found, but separate values were not clear enough to split.",
      });
    }
  }

  if (changed) {
    await writeFile(file, writeCsv(headers, rows), "utf8");
  }

  return { changed, reviewRows };
}

async function summarizeCurrentBackfills(files) {
  const summary = {
    rowsWithBackfill: 0,
    dhaBackfilled: 0,
    epaBackfilled: 0,
    filesWithBackfill: [],
  };

  for (const file of files) {
    const { headers, rows } = parseCsvWithHeaders(await readFile(file, "utf8"));
    if (!headers.includes("source_notes")) continue;

    let rowsWithBackfill = 0;
    let dhaBackfilled = 0;
    let epaBackfilled = 0;

    for (const row of rows) {
      const notes = String(row.source_notes ?? "");
      const hasDha = notes.includes("dha_percent_backfilled_from_text=true");
      const hasEpa = notes.includes("epa_percent_backfilled_from_text=true");
      if (!hasDha && !hasEpa) continue;

      rowsWithBackfill += 1;
      if (hasDha) dhaBackfilled += 1;
      if (hasEpa) epaBackfilled += 1;
    }

    if (rowsWithBackfill > 0) {
      summary.rowsWithBackfill += rowsWithBackfill;
      summary.dhaBackfilled += dhaBackfilled;
      summary.epaBackfilled += epaBackfilled;
      summary.filesWithBackfill.push({
        file,
        rowsWithBackfill,
        dhaBackfilled,
        epaBackfilled,
      });
    }
  }

  return summary;
}

function renderReport(reviewRows, changedFiles, currentBackfills) {
  const backfills = reviewRows.filter((row) => row.action === "backfilled");
  const ambiguous = reviewRows.filter((row) => row.action === "ambiguous");
  const needsReview = reviewRows.filter((row) => row.action === "needs_review");
  const byField = backfills.reduce((acc, row) => {
    acc[row.field] = (acc[row.field] ?? 0) + 1;
    return acc;
  }, {});

  return `# EPA/DHA Text Backfill

Generated: ${new Date().toISOString()}

## Summary

- Files changed: ${changedFiles.length}
- Newly backfilled values this run: ${backfills.length}
- Newly backfilled DHA values: ${byField.dha_percent ?? 0}
- Newly backfilled EPA values: ${byField.epa_percent ?? 0}
- Rows with EPA/DHA text backfill flags now: ${currentBackfills.rowsWithBackfill}
- DHA values flagged from text now: ${currentBackfills.dhaBackfilled}
- EPA values flagged from text now: ${currentBackfills.epaBackfilled}
- Ambiguous combined mentions left for review: ${ambiguous.length}
- Conflicting values left for review: ${needsReview.length}
- Review CSV: ${paths.reviewCsv}

## Rule

Only exact separate EPA/DHA values are auto-filled. Combined values such as "EPA/DHA: 4 g" or "EPA + DHA: 0.4%" are not split automatically.

## Changed Files

${changedFiles.map((file) => `- ${file}`).join("\n") || "- none"}

## Current Backfill Coverage

${currentBackfills.filesWithBackfill
  .map(
    (entry) =>
      `- ${entry.file}: ${entry.rowsWithBackfill} rows (${entry.dhaBackfilled} DHA, ${entry.epaBackfilled} EPA)`
  )
  .join("\n") || "- none"}
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
  const currentBackfills = await summarizeCurrentBackfills(files);
  await writeFile(paths.reviewCsv, writeCsv(reviewHeaders, allReviewRows), "utf8");
  await writeFile(paths.report, renderReport(allReviewRows, changedFiles, currentBackfills), "utf8");

  console.log(`EPA/DHA backfilled values: ${allReviewRows.filter((row) => row.action === "backfilled").length}`);
  console.log(`Changed files: ${changedFiles.length}`);
  console.log(`Rows with text backfill flags now: ${currentBackfills.rowsWithBackfill}`);
  console.log(`Ambiguous mentions: ${allReviewRows.filter((row) => row.action === "ambiguous").length}`);
  console.log(`Wrote ${paths.reviewCsv}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
