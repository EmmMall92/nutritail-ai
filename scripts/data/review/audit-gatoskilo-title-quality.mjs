import { mkdir, readFile, writeFile } from "node:fs/promises";

const paths = {
  importCsv: "data/imports/gatoskilo_local_html_batch_v2.csv",
  outputCsv: "data/review/gatoskilo_title_quality_review.csv",
  report: "reports/gatoskilo_title_quality_audit.md",
};

const headers = [
  "issue_type",
  "brand",
  "formula_name",
  "display_name",
  "species",
  "format",
  "source_url",
  "formula_key",
  "suggested_action",
];

const speciesUrlRules = [
  { species: "dog", patterns: ["skyloy", "skylou", "dog"] },
  { species: "cat", patterns: ["gatas", "gaton", "cat"] },
];

const titleNoisePatterns = [
  { type: "formula_contains_pack_offer", pattern: /\b(?:doro|gift|offer|promo)\b/i },
  { type: "formula_contains_pack_size", pattern: /\b\d+(?:[,.]\d+)?\s*(?:kg|gr|g)\b/i },
  { type: "formula_contains_price_or_discount", pattern: /(?:€|eur|%|\b\d+\s*\+\s*\d+\b)/i },
];

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(rows) {
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

  const csvHeaders = (rows[0] ?? []).map((header) =>
    header.replace(/^\uFEFF/, "").trim()
  );

  return rows.slice(1).map((values) =>
    Object.fromEntries(csvHeaders.map((header, index) => [header, values[index] ?? ""]))
  );
}

function expectedSpeciesFromUrl(url) {
  const normalized = String(url ?? "").toLowerCase();
  return (
    speciesUrlRules.find((rule) =>
      rule.patterns.some((pattern) => normalized.includes(pattern))
    )?.species ?? ""
  );
}

function addIssue(issues, row, issueType, suggestedAction) {
  issues.push({
    issue_type: issueType,
    brand: row.brand,
    formula_name: row.formula_name,
    display_name: row.display_name,
    species: row.species,
    format: row.format,
    source_url: row.data_source_url,
    formula_key: row.formula_key,
    suggested_action: suggestedAction,
  });
}

async function main() {
  const rows = parseCsv(await readFile(paths.importCsv, "utf8"));
  const issues = [];

  for (const row of rows) {
    const expectedSpecies = expectedSpeciesFromUrl(row.data_source_url);
    if (expectedSpecies && expectedSpecies !== row.species) {
      addIssue(
        issues,
        row,
        "species_url_conflict",
        `Set species to ${expectedSpecies}; source URL category is stronger than page body/sidebar text.`
      );
    }

    if (row.brand && row.formula_name?.toLowerCase().startsWith(row.brand.toLowerCase())) {
      addIssue(
        issues,
        row,
        "formula_starts_with_brand",
        "Remove duplicated brand from formula_name if this is not part of the official formula line."
      );
    }

    if (row.species === "dog" && /\bcat\b/i.test(row.formula_name ?? "")) {
      addIssue(
        issues,
        row,
        "dog_formula_contains_cat",
        "Review formula_name; dog row contains cat wording."
      );
    }

    if (row.species === "dog" && /\bdog\b/i.test(row.formula_name ?? "")) {
      addIssue(
        issues,
        row,
        "formula_contains_species_word",
        "Review whether the word Dog is needed in formula_name or should only be implied by species."
      );
    }

    if (row.species === "cat" && /\bdog\b/i.test(row.formula_name ?? "")) {
      addIssue(
        issues,
        row,
        "cat_formula_contains_dog",
        "Review formula_name; cat row contains dog wording."
      );
    }

    if (row.species === "cat" && /\bcat\b/i.test(row.formula_name ?? "")) {
      addIssue(
        issues,
        row,
        "formula_contains_species_word",
        "Review whether the word Cat is needed in formula_name or should only be implied by species."
      );
    }

    for (const rule of titleNoisePatterns) {
      if (rule.pattern.test(row.formula_name ?? "")) {
        addIssue(
          issues,
          row,
          rule.type,
          "Remove pack, promotion, or offer wording from formula_name and keep it only in source notes/pack sidecar."
        );
      }
    }
  }

  const issueCounts = issues.reduce((acc, issue) => {
    acc[issue.issue_type] = (acc[issue.issue_type] ?? 0) + 1;
    return acc;
  }, {});

  await mkdir("data/review", { recursive: true });
  await mkdir("reports", { recursive: true });
  await writeFile(paths.outputCsv, writeCsv(issues), "utf8");
  await writeFile(
    paths.report,
    [
      "# Gatoskilo Title Quality Audit",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Summary",
      "",
      `- Source rows: ${rows.length}`,
      `- Title/species issues found: ${issues.length}`,
      "",
      "## Issue Counts",
      "",
      ...Object.entries(issueCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([issue, count]) => `- ${issue}: ${count}`),
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
        sourceRows: rows.length,
        issueRows: issues.length,
        issueCounts,
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
