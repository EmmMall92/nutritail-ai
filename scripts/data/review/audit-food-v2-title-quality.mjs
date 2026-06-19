import { mkdir, readFile, writeFile } from "node:fs/promises";

const paths = {
  candidateInput: "data/imports/food_v2_best_candidate_preview.csv",
  sourceRegistryInput: "data/sources/category_product_sources_registry.csv",
  output: "data/review/food_v2_title_quality_audit.csv",
  report: "reports/food_v2_title_quality_audit.md",
};

const headers = [
  "audit_source",
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
  /\b(?:holistic|complete|dry|dietetic|veterinary)\s+food\s+for\b/i,
  /(?:πλήρης|ολοκληρωμένη|ολιστική|ξηρή|διαιτητική|κτηνιατρική)\s+τροφή\s+για/iu,
  /τροφή\s+για\s+(?:ενήλικ|κουτάβ|γατάκ|σκύλ|γάτ)/iu,
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
  /\b(?:offer|promo|gift|δ[ωώ]ρο|προσφορ[αά])\b/iu,
  /\b\d+(?:[,.]\d+)?\s*(?:kg|g|gr|grams?)\s*(?:free|gratis)\b/iu,
  /\+\s*\d+(?:[,.]\d+)?\s*(?:kg|g|gr|grams?)\s*(?:free|gratis)\b/iu,
];

const repeatedProductTermPattern =
  /\b(vetsolution|vet\s*solution|veterinary|urinary|renal|hepatic|gastrointestinal|diabetic|obesity|dermatosis|hypoallergenic|sterilised|sterilized|senior|puppy|kitten|adult|mini|medium|maxi|large|giant)(?:\s+\1)+\b/iu;

const mojibakeTitlePattern =
  /(?:Ξ[Ά-ΏΑ-Ω]|Ο[€‡ƒ„‰…]|Β®|�)/u;

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

function stripBrandPrefix(value, brand) {
  let cleaned = normalizeText(value);
  const normalizedBrand = normalizeComparable(brand);

  if (!cleaned || !normalizedBrand) return cleaned;

  while (normalizeComparable(cleaned).startsWith(`${normalizedBrand} `)) {
    cleaned = cleaned.slice(normalizeText(brand).length).trim();
  }

  return cleaned;
}

function titleForQualityChecks(value, brand) {
  const title = normalizeText(value);
  const brandlessTitle = stripBrandPrefix(title, brand);

  return brandlessTitle || title;
}

function wordCount(value) {
  return normalizeText(value).split(/\s+/u).filter(Boolean).length;
}

function hasRepeatedProductTerms(value) {
  return repeatedProductTermPattern.test(normalizeText(value));
}

function hasMojibake(value) {
  return mojibakeTitlePattern.test(String(value ?? ""));
}

function isConciseMedicalProductTitle(value) {
  const title = normalizeText(value);
  if (!title || wordCount(title) > 9 || title.length > 90) return false;
  if (/\b(?:for|support|management|treatment|reduction)\s+of\b/i.test(title)) {
    return false;
  }
  if (/τροφ[ηή]\s+για/iu.test(title)) return false;
  return !descriptiveTitlePatterns.some((pattern) => pattern.test(title));
}

function isLowPrioritySourceRegistryFallback(row) {
  if (row.audit_source !== "category_product_sources_registry") return false;

  const sourceText = normalizeComparable(
    `${row.formula_key ?? ""} ${row.source_group ?? ""} ${row.product_url ?? ""} ${row.formula_name ?? ""}`
  );

  return (
    sourceText.includes("petsamolis.gr") ||
    sourceText.includes("trial_pack") ||
    sourceText.includes("saver_packs") ||
    sourceText.includes("economy pack") ||
    sourceText.includes("try now")
  );
}

function sourceRegistryFallbackIssueType(row, issueType) {
  if (!isLowPrioritySourceRegistryFallback(row)) return issueType;
  if (
    [
      "formula_name_too_long",
      "display_name_too_long",
      "formula_name_starts_with_brand",
      "formula_name_looks_like_description",
      "medical_claim_used_as_name",
      "formula_contains_pack_or_offer",
      "retailer_title_needs_human_review",
    ].includes(issueType)
  ) {
    return `source_registry_fallback_${issueType}`;
  }

  return issueType;
}

function sourceRegistryFallbackSeverity(row, severity, issueType) {
  if (!isLowPrioritySourceRegistryFallback(row)) return severity;
  if (severity === "critical") return severity;

  const fallbackIssueType = sourceRegistryFallbackIssueType(row, issueType);
  return fallbackIssueType.startsWith("source_registry_fallback_")
    ? "info"
    : severity;
}

function sourceRegistryFallbackAction(row, suggestedAction) {
  if (!isLowPrioritySourceRegistryFallback(row)) return suggestedAction;

  return `${suggestedAction} Low-priority source-registry fallback only; keep it as evidence/backfill and do not count it as a customer-facing cleanup blocker.`;
}

function addIssue(issues, row, severity, issueType, suggestedAction) {
  const finalIssueType = sourceRegistryFallbackIssueType(row, issueType);
  const finalSeverity = sourceRegistryFallbackSeverity(row, severity, issueType);
  issues.push({
    audit_source: row.audit_source,
    severity: finalSeverity,
    issue_type: finalIssueType,
    brand: row.brand,
    formula_name: row.formula_name,
    display_name: row.display_name,
    species: row.species,
    format: row.format,
    source_priority: row.source_priority,
    formula_key: row.formula_key,
    suggested_action: sourceRegistryFallbackAction(row, suggestedAction),
  });
}

function findTitleIssues(row) {
  const issues = [];
  const formulaName = normalizeText(row.formula_name);
  const displayName = normalizeText(row.display_name);
  const checkFormulaName = titleForQualityChecks(formulaName, row.brand);
  const normalizedFormula = normalizeComparable(formulaName);
  const normalizedBrand = normalizeComparable(row.brand);

  if (!formulaName) {
    addIssue(issues, row, "critical", "missing_formula_name", "Do not import until formula_name exists.");
    return issues;
  }

  if (hasMojibake(formulaName) || hasMojibake(displayName)) {
    addIssue(
      issues,
      row,
      "high",
      "title_contains_mojibake",
      "Fix text encoding or replace with a clean Gatoskilo/official/PDF title before customer-facing use."
    );
  }

  if (wordCount(checkFormulaName) > 10 || checkFormulaName.length > 80) {
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
    const brandlessFormula = stripBrandPrefix(formulaName, row.brand);
    const autoCleanable =
      brandlessFormula &&
      normalizeComparable(brandlessFormula) !== normalizedFormula &&
      !descriptiveTitlePatterns.some((pattern) => pattern.test(brandlessFormula)) &&
      !packOrOfferPatterns.some((pattern) => pattern.test(brandlessFormula));

    addIssue(
      issues,
      {
        ...row,
        formula_name: autoCleanable ? brandlessFormula : row.formula_name,
      },
      autoCleanable ? "info" : "medium",
      autoCleanable
        ? "formula_name_brand_prefix_auto_cleaned"
        : "formula_name_starts_with_brand",
      autoCleanable
        ? "Import preview strips this duplicated brand prefix automatically; keep watching display_name only."
        : "Remove duplicated brand from formula_name; display_name should carry the brand."
    );
  }

  if (hasRepeatedProductTerms(formulaName) || hasRepeatedProductTerms(displayName)) {
    addIssue(
      issues,
      row,
      "medium",
      "repeated_formula_terms",
      "Remove duplicated title tokens such as VetSolution VetSolution or Urinary Urinary before customer-facing use."
    );
  }

  for (const pattern of descriptiveTitlePatterns) {
    if (pattern.test(checkFormulaName)) {
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
    if (pattern.test(checkFormulaName) && wordCount(checkFormulaName) > 5) {
      const conciseProductTitle = isConciseMedicalProductTitle(checkFormulaName);
      addIssue(
        issues,
        row,
        conciseProductTitle ? "info" : "medium",
        conciseProductTitle
          ? "medical_claim_product_line_ok"
          : "medical_claim_used_as_name",
        conciseProductTitle
          ? "Concise veterinary/condition wording looks like a product line; keep visible but do not treat as a title cleanup blocker."
          : "Keep the medical claim in tags/notes; formula_name should be the official product line."
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

  if (
    row.source_priority === "retailer" &&
    issues.some((issue) => issue.severity !== "info")
  ) {
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

function normalizeCandidateRow(row) {
  return {
    ...row,
    audit_source: "food_v2_best_candidate_preview",
  };
}

function normalizeSourceRegistryRow(row) {
  const productTitle = normalizeText(row.product_title);
  const brand = normalizeText(row.brand_guess);

  return {
    audit_source: "category_product_sources_registry",
    brand,
    formula_name: productTitle,
    display_name: productTitle,
    species: row.species,
    format: row.format,
    source_priority: row.source_tier,
    formula_key: `${row.source_group || "source"}|${row.product_url || productTitle}`,
    product_url: row.product_url,
    source_group: row.source_group,
  };
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
  const candidateRows = parseCsv(await readFile(paths.candidateInput, "utf8")).map(
    normalizeCandidateRow
  );
  const sourceRegistryRows = parseCsv(
    await readFile(paths.sourceRegistryInput, "utf8")
  )
    .filter(
      (row) =>
        !["failed", "rejected"].includes(normalizeComparable(row.status)) &&
        normalizeText(row.product_title)
    )
    .map(normalizeSourceRegistryRow);
  const rows = [...candidateRows, ...sourceRegistryRows];
  const issues = rows.flatMap(findTitleIssues);
  const manualIssues = issues.filter((issue) => issue.severity !== "info");
  const highIssueRows = rowsWithHighIssues(issues);
  const manualIssueRows = new Set(manualIssues.map((issue) => issue.formula_key)).size;
  const issueFreeRows = rows.length - manualIssueRows;

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
      `- Rows reviewed: ${rows.length}`,
      `- Food V2 candidate rows reviewed: ${candidateRows.length}`,
      `- Source registry rows reviewed: ${sourceRegistryRows.length}`,
      `- Audit findings: ${issues.length}`,
      `- Manual cleanup findings: ${manualIssues.length}`,
      `- Auto-cleanup/info findings: ${issues.length - manualIssues.length}`,
      `- Rows with high/critical title issues: ${highIssueRows}`,
      `- Rows without manual title issues: ${issueFreeRows}`,
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
      "",
      "## Inputs",
      "",
      `- Food V2 candidates: ${paths.candidateInput}`,
      `- Source registry: ${paths.sourceRegistryInput}`,
      "",
      "## Title Cleanup Policy",
      "",
      "- Customer-facing names should look like product names, not SEO descriptions.",
      "- Prefer Gatoskilo titles when they are clean product titles, then official/PDF titles, then other retailers, with Petsamolis last.",
      "- Keep `formula_name` concise and keep the brand in `display_name`.",
      "- Full playbook: docs/food-v2-title-cleanup-playbook.md",
    ].join("\n"),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        rowsReviewed: rows.length,
        foodV2CandidateRows: candidateRows.length,
        sourceRegistryRows: sourceRegistryRows.length,
      auditFindings: issues.length,
      manualCleanupFindings: manualIssues.length,
      autoCleanupInfoFindings: issues.length - manualIssues.length,
      highIssueRows,
      manualIssueRows,
      rowsWithoutManualTitleIssues: issueFreeRows,
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
