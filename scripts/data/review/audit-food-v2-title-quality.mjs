import { mkdir, readFile, writeFile } from "node:fs/promises";

const paths = {
  input: "data/imports/food_v2_best_candidate_preview.csv",
  output: "data/review/food_v2_title_quality_audit.csv",
  report: "reports/food_v2_title_quality_audit.md",
};

const headers = [
  "severity",
  "issue_type",
  "brand",
  "formula_name",
  "display_name",
  "species",
  "format",
  "source_priority",
  "formula_key",
  "suggested_action",
];

const descriptiveTitlePatterns = [
  /\b(?:dietetic|dietary|complete|complementary)\s+(?:food|feed)\b/i,
  /\b(?:food|feed)\s+for\b/i,
  /\b(?:support|management|treatment|reduction)\s+of\b/i,
  /διαιτητικ[ηή]\s+τροφ[ηή]/iu,
  /κτηνιατρικ[ηή]\s*τροφ[ηή]/iu,
  /τροφ[ηή]\s+για/iu,
  /αντιμετ[ωώ]πιση/iu,
  /υποστ[ηή]ριξη/iu,
  /θεραπε[ιί]α/iu,
  /εν[ηή]λικ[αα]\s+και\s+ηλικιωμ[εέ]να/iu,
];

const medicalDescriptionPatterns = [
  /νεφρικ[ηή]\s+ανεπ[αά]ρκεια/iu,
  /ηπατικ[ηή]\s+λειτουργ[ιί]α/iu,
  /παγκρεατικ[ηή]\s+ανεπ[αά]ρκεια/iu,
  /ουρολιθ[ιί]αση/iu,
  /λ[ιί]θων\s+στρουβ[ιί]τη/iu,
  /σακχαρ[ωώ]δη\s+διαβ[ηή]τη/iu,
  /οστεοαρθρ[ιί]τιδα/iu,
  /\b(?:renal|hepatic|gastrointestinal|urinary|struvite|diabetic|joint|mobility)\b/i,
];

const packOrOfferPatterns = [
  /\b\d+(?:[,.]\d+)?\s*(?:kg|g|gr|grams?)\b/iu,
  /\b\d+\s*x\s*\d+(?:[,.]\d+)?\s*(?:kg|g|gr)\b/iu,
  /\b(?:offer|promo|gift|free|δ[ωώ]ρο|προσφορ[αά])\b/iu,
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

  const csvHeaders = (rows[0] ?? []).map((header) =>
    header.replace(/^\uFEFF/u, "").trim()
  );
  return rows.slice(1).map((values) =>
    Object.fromEntries(csvHeaders.map((header, index) => [header, values[index] ?? ""]))
  );
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/u.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header])).join(","))
    .join("\n")}\n`;
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeComparable(value) {
  return normalizeText(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "");
}

function wordCount(value) {
  return normalizeText(value).split(/\s+/u).filter(Boolean).length;
}

function addIssue(issues, row, severity, issueType, suggestedAction) {
  issues.push({
    severity,
    issue_type: issueType,
    brand: row.brand,
    formula_name: row.formula_name,
    display_name: row.display_name,
    species: row.species,
    format: row.format,
    source_priority: row.source_priority,
    formula_key: row.formula_key,
    suggested_action: suggestedAction,
  });
}

function findTitleIssues(row) {
  const issues = [];
  const formulaName = normalizeText(row.formula_name);
  const displayName = normalizeText(row.display_name);
  const normalizedFormula = normalizeComparable(formulaName);
  const normalizedBrand = normalizeComparable(row.brand);

  if (!formulaName) {
    addIssue(issues, row, "critical", "missing_formula_name", "Do not import until formula_name exists.");
    return issues;
  }

  if (wordCount(formulaName) > 10 || formulaName.length > 80) {
    addIssue(
      issues,
      row,
      "high",
      "formula_name_too_long",
      "Replace SEO/description text with a short formula-level product name."
    );
  }

  if (displayName.length > 100) {
    addIssue(
      issues,
      row,
      "high",
      "display_name_too_long",
      "Use Brand + concise formula name; keep long descriptions in notes only."
    );
  }

  if (normalizedBrand && normalizedFormula.startsWith(`${normalizedBrand} `)) {
    addIssue(
      issues,
      row,
      "medium",
      "formula_name_starts_with_brand",
      "Remove duplicated brand from formula_name; display_name should carry the brand."
    );
  }

  for (const pattern of descriptiveTitlePatterns) {
    if (pattern.test(formulaName)) {
      addIssue(
        issues,
        row,
        "high",
        "formula_name_looks_like_description",
        "Review manually and replace with canonical product name before import."
      );
      break;
    }
  }

  for (const pattern of medicalDescriptionPatterns) {
    if (pattern.test(formulaName) && wordCount(formulaName) > 5) {
      addIssue(
        issues,
        row,
        "medium",
        "medical_claim_used_as_name",
        "Keep the medical claim in tags/notes; formula_name should be the official product line."
      );
      break;
    }
  }

  for (const pattern of packOrOfferPatterns) {
    if (pattern.test(formulaName)) {
      addIssue(
        issues,
        row,
        "medium",
        "formula_contains_pack_or_offer",
        "Remove pack size or offer wording from formula_name; store pack details separately."
      );
      break;
    }
  }

  if (row.source_priority === "retailer" && issues.length > 0) {
    addIssue(
      issues,
      row,
      "medium",
      "retailer_title_needs_human_review",
      "Retailer title has quality warnings; prefer official/PDF title or manual canonicalization."
    );
  }

  return issues;
}

function countBy(rows, field) {
  return rows.reduce((acc, row) => {
    const key = row[field] || "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function renderCounts(counts) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, count]) => `- ${key}: ${count}`)
    .join("\n");
}

function rowsWithHighIssues(issues) {
  const highKeys = new Set(
    issues
      .filter((issue) => issue.severity === "critical" || issue.severity === "high")
      .map((issue) => issue.formula_key)
  );
  return highKeys.size;
}

function renderTopBrandActions(issues) {
  const highIssues = issues.filter(
    (issue) => issue.severity === "critical" || issue.severity === "high"
  );
  const byBrand = countBy(highIssues, "brand");
  return renderCounts(byBrand) || "- none";
}

function renderMediumBrandActions(issues) {
  const mediumIssues = issues.filter((issue) => issue.severity === "medium");
  const byBrand = countBy(mediumIssues, "brand");
  const rows = Object.entries(byBrand)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 15);

  return rows.map(([brand, count]) => `- ${brand}: ${count}`).join("\n") || "- none";
}

async function main() {
  const rows = parseCsv(await readFile(paths.input, "utf8"));
  const issues = rows.flatMap(findTitleIssues);
  const highIssueRows = rowsWithHighIssues(issues);
  const issueFreeRows = rows.length - new Set(issues.map((issue) => issue.formula_key)).size;

  await mkdir("data/review", { recursive: true });
  await mkdir("reports", { recursive: true });
  await writeFile(paths.output, writeCsv(issues), "utf8");
  await writeFile(
    paths.report,
    [
      "# Food V2 Title Quality Audit",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Summary",
      "",
      `- Candidate rows reviewed: ${rows.length}`,
      `- Issue rows: ${issues.length}`,
      `- Candidate rows with high/critical title issues: ${highIssueRows}`,
      `- Candidate rows without title issues: ${issueFreeRows}`,
      `- Output CSV: ${paths.output}`,
      "",
      "## Issues By Severity",
      "",
      renderCounts(countBy(issues, "severity")) || "- none",
      "",
      "## Issues By Type",
      "",
      renderCounts(countBy(issues, "issue_type")) || "- none",
      "",
      "## High/Critical Issues By Brand",
      "",
      renderTopBrandActions(issues),
      "",
      "## Medium Cleanup Focus By Brand",
      "",
      renderMediumBrandActions(issues),
      "",
      "## Recommended Next Step",
      "",
      highIssueRows > 0
        ? "Clean high/critical title issues before committing those rows to Food V2. Then work through the medium cleanup brands above."
        : "No high/critical title issues were found. Work through the medium cleanup brands above when polishing customer-facing names.",
    ].join("\n"),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        candidateRows: rows.length,
        issueRows: issues.length,
        highIssueRows,
        issueFreeRows,
        output: paths.output,
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
