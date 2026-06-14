import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  input: "data/imports/food_v2_best_candidate_preview.csv",
  output: "data/review/food_v2_title_canonicalization_queue.csv",
  report: "reports/food_v2_title_canonicalization_pass.md",
};

const headers = [
  "priority",
  "action",
  "brand",
  "current_formula_name",
  "current_display_name",
  "suggested_formula_name",
  "suggested_display_name",
  "species",
  "format",
  "life_stage",
  "dog_size",
  "source_priority",
  "source_rank",
  "data_source_url",
  "formula_key",
  "reasons",
];

const packSizePattern =
  /\b\d+(?:[,.]\d+)?\s*(?:kg|kgs|g|gr|grams?|lb|lbs)\b/giu;

const packOfferPattern =
  /\b(?:\d+\s*x\s*)?\d+(?:[,.]\d+)?\s*(?:kg|g|gr|lb)s?(?:\s*\+\s*\d+(?:[,.]\d+)?\s*(?:kg|g|gr|lb)s?)?\b/giu;

const sourceSuffixPattern =
  /\b(?:gatoskilo|petshop88|pet-it|petcity|petsamolis|zooplus|official|retailer|html|mhtml|pdf|document|spreadsheet|eshop)\b/giu;

const titleNoisePatterns = [
  /\b(?:dry dog food|dog dry food|dry cat food|cat dry food|dry food|xira trofi skylou|ksira trofi skylou|xira trofi gatas|ksira trofi gatas|trofi skylou|trofes skylon|trofi gatas|trofes gaton|for dogs|for cats|dogs|dog|skylou|skylos|gatas|gata|eshop)\b/giu,
  /\b(?:activity\s*\/\s*day|feed amount|recommended food|feeding guide|feeding table)\b.*$/iu,
  /\b(?:complete|complementary|dietetic|dietary)\s+(?:food|feed)\b/iu,
  /\b(?:food|feed)\s+for\b/iu,
  /(?:ξηρ[αή]\s+)?τροφ[ηή]\s+για/iu,
  /ολιστικ[ηή]\s+τροφ[ηή]/iu,
  /πλ[ηή]ρης\s+τροφ[ηή]/iu,
];

const hardDescriptionPatterns = titleNoisePatterns.slice(1);

const displayOnlyPatterns = [
  /\b(?:with|rich in|fresh|and)\b/iu,
  /\b(?:chicken|lamb|salmon|duck|turkey|beef|pork|fish|tuna|sardine|herring|rice|potato|pea)\b/iu,
  /κοτ[οό]πουλο|αρν[ιί]|σολομ[οό]|παπ[ιί]α|γαλοπο[υύ]λα|μοσχ[αά]ρι|ρ[υύ]ζι|πατ[αά]τα/iu,
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

function cleanText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[’‘]/gu, "'")
    .replace(/[“”]/gu, '"')
    .replace(/\s+/gu, " ")
    .trim();
}

function normalizeCompare(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "");
}

function titleCaseToken(token) {
  if (/^[A-Z0-9+&/-]{2,}$/u.test(token)) return token;
  if (/^\d/u.test(token)) return token;
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

function titleCase(value) {
  return cleanText(value)
    .split(" ")
    .filter(Boolean)
    .map(titleCaseToken)
    .join(" ");
}

function stripLeadingBrand(value, brand) {
  const cleaned = cleanText(value);
  const normalized = normalizeCompare(cleaned);
  const normalizedBrand = normalizeCompare(brand);
  if (!normalizedBrand || !normalized.startsWith(`${normalizedBrand} `)) return cleaned;
  return cleaned.slice(cleanText(brand).length).trim();
}

function stripPackAndNoise(value) {
  let cleaned = cleanText(value)
    .replace(packOfferPattern, " ")
    .replace(packSizePattern, " ")
    .replace(sourceSuffixPattern, " ");

  for (const pattern of titleNoisePatterns) {
    cleaned = cleaned.replace(pattern, " ");
  }

  return cleaned
    .replace(/\s*[-–—|_]\s*/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function sourceRank(row) {
  const combined = normalizeCompare(
    `${row.data_source_url ?? ""} ${row.source_notes ?? ""} ${row.source_priority ?? ""}`
  );

  if (combined.includes("gatoskilo")) return 60;
  if (
    combined.includes(".pdf") ||
    combined.includes("source_tier=uploaded_document") ||
    combined.includes("source_tier=uploaded_pdf") ||
    combined.includes("document_extract") ||
    combined.includes("pdf_extract")
  ) {
    return 50;
  }
  if (row.source_priority === "official") return 40;
  if (combined.includes("zooplus")) return 30;
  if (
    combined.includes("petshop88") ||
    combined.includes("pet-it") ||
    combined.includes("petcity")
  ) {
    return 25;
  }
  if (row.source_priority === "retailer") return 20;
  if (combined.includes("petsamolis")) return 10;
  return 0;
}

function wordCount(value) {
  return cleanText(value).split(/\s+/u).filter(Boolean).length;
}

function looksLikeDescription(value) {
  const text = cleanText(value);
  return (
    wordCount(text) > 14 ||
    text.length > 110 ||
    hardDescriptionPatterns.some((pattern) => pattern.test(text))
  );
}

function candidateQuality(value, brand) {
  const cleaned = stripPackAndNoise(stripLeadingBrand(value, brand));
  if (!cleaned) return 0;

  let score = 10;
  if (wordCount(cleaned) <= 8) score += 8;
  if (wordCount(cleaned) <= 5) score += 4;
  if (displayOnlyPatterns.some((pattern) => pattern.test(cleaned))) score += 4;
  if (!looksLikeDescription(cleaned)) score += 6;
  if (normalizeCompare(cleaned).startsWith(normalizeCompare(brand))) score -= 3;
  if (cleaned.length > 90) score -= 8;
  if (packSizePattern.test(cleaned)) score -= 4;
  return score;
}

function bestFormulaCandidate(row) {
  const candidates = [
    row.formula_name,
    stripLeadingBrand(row.display_name, row.brand),
    row.display_name,
  ]
    .map((value) => stripPackAndNoise(value))
    .filter(Boolean);

  const unique = [...new Set(candidates)];
  unique.sort(
    (a, b) =>
      candidateQuality(b, row.brand) - candidateQuality(a, row.brand) ||
      a.length - b.length
  );

  return titleCase(unique[0] ?? cleanText(row.formula_name));
}

function standardDisplayName(row, formulaName) {
  const brand = cleanText(row.brand);
  const formula = stripLeadingBrand(formulaName, brand);
  return [brand, formula]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/gu, " ")
    .trim();
}

function reasonsFor(row, suggestedFormula, suggestedDisplay) {
  const reasons = [];
  const currentFormula = cleanText(row.formula_name);
  const currentDisplay = cleanText(row.display_name);

  if (!currentFormula) reasons.push("missing_formula_name");
  if (looksLikeDescription(currentFormula)) reasons.push("formula_looks_like_description");
  if (packSizePattern.test(currentFormula)) reasons.push("formula_contains_pack_size");
  if (normalizeCompare(currentFormula).startsWith(`${normalizeCompare(row.brand)} `)) {
    reasons.push("formula_starts_with_brand");
  }
  if (currentDisplay && !normalizeCompare(currentDisplay).startsWith(normalizeCompare(row.brand))) {
    reasons.push("display_name_missing_brand");
  }
  if (packSizePattern.test(currentDisplay)) reasons.push("display_name_contains_pack_size");
  if (normalizeCompare(currentFormula) !== normalizeCompare(suggestedFormula)) {
    reasons.push("formula_name_can_be_canonicalized");
  }
  if (normalizeCompare(currentDisplay) !== normalizeCompare(suggestedDisplay)) {
    reasons.push("display_name_can_be_standardized");
  }

  return [...new Set(reasons)];
}

function priorityFor(reasons, row) {
  if (
    reasons.includes("missing_formula_name") ||
    reasons.includes("formula_looks_like_description")
  ) {
    return "high";
  }
  if (
    reasons.includes("formula_starts_with_brand") ||
    reasons.includes("formula_contains_pack_size") ||
    reasons.includes("display_name_contains_pack_size")
  ) {
    return "medium";
  }
  if (sourceRank(row) <= 20 && reasons.length > 0) return "medium";
  return "low";
}

function actionFor(priority) {
  if (priority === "high") return "manual_review_before_import";
  if (priority === "medium") return "apply_suggested_title_if_source_matches";
  return "optional_cleanup";
}

function countBy(rows, field) {
  return rows.reduce((acc, row) => {
    const key = row[field] || "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function renderCounts(counts) {
  return (
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([key, count]) => `- ${key}: ${count}`)
      .join("\n") || "- none"
  );
}

function sourcePolicy() {
  return [
    "1. Prefer Gatoskilo local HTML titles when the product page title is formula-like.",
    "2. Prefer uploaded PDFs/documents next when they expose a clean official formula name.",
    "3. Use official product pages after that.",
    "4. Use Zooplus/Petshop88/Pet-it/Petcity as retailer fallback titles.",
    "5. Use Petsamolis last unless it is the only usable title source.",
    "6. Formula names must not include pack size; display names should include the brand.",
  ].join("\n");
}

async function main() {
  const rows = parseCsv(await readFile(paths.input, "utf8"));
  const queue = rows
    .map((row) => {
      const suggestedFormula = bestFormulaCandidate(row);
      const suggestedDisplay = standardDisplayName(row, suggestedFormula);
      const reasons = reasonsFor(row, suggestedFormula, suggestedDisplay);
      if (reasons.length === 0) return null;
      const priority = priorityFor(reasons, row);

      return {
        priority,
        action: actionFor(priority),
        brand: row.brand,
        current_formula_name: row.formula_name,
        current_display_name: row.display_name,
        suggested_formula_name: suggestedFormula,
        suggested_display_name: suggestedDisplay,
        species: row.species,
        format: row.format,
        life_stage: row.life_stage,
        dog_size: row.dog_size,
        source_priority: row.source_priority,
        source_rank: sourceRank(row),
        data_source_url: row.data_source_url,
        formula_key: row.formula_key,
        reasons: reasons.join(";"),
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        ["high", "medium", "low"].indexOf(a.priority) -
          ["high", "medium", "low"].indexOf(b.priority) ||
        b.source_rank - a.source_rank ||
        a.brand.localeCompare(b.brand) ||
        a.suggested_display_name.localeCompare(b.suggested_display_name)
    );

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(queue), "utf8");
  await writeFile(
    paths.report,
    [
      "# Food V2 Title Canonicalization Pass",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Summary",
      "",
      `- Candidate rows reviewed: ${rows.length}`,
      `- Title repair candidates: ${queue.length}`,
      `- High priority repairs: ${queue.filter((row) => row.priority === "high").length}`,
      `- Medium priority repairs: ${queue.filter((row) => row.priority === "medium").length}`,
      `- Low priority repairs: ${queue.filter((row) => row.priority === "low").length}`,
      `- Output CSV: ${paths.output}`,
      "",
      "## Source Priority Policy",
      "",
      sourcePolicy(),
      "",
      "## Repair Candidates By Priority",
      "",
      renderCounts(countBy(queue, "priority")),
      "",
      "## Repair Candidates By Brand",
      "",
      renderCounts(countBy(queue, "brand")),
      "",
      "## Most Common Reasons",
      "",
      renderCounts(
        queue
          .flatMap((row) => row.reasons.split(";").filter(Boolean))
          .map((reason) => ({ reason }))
          .reduce((acc, row) => {
            acc[row.reason] = (acc[row.reason] ?? 0) + 1;
            return acc;
          }, {})
      ),
      "",
      "## Admin Workflow",
      "",
      "Use the CSV as a review queue. High priority rows should not be imported until the suggested title is manually accepted or replaced. Medium priority rows are usually pack-size or duplicated-brand cleanup. Low priority rows are mostly consistency cleanup.",
    ].join("\n"),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        candidateRows: rows.length,
        repairCandidates: queue.length,
        high: queue.filter((row) => row.priority === "high").length,
        medium: queue.filter((row) => row.priority === "medium").length,
        low: queue.filter((row) => row.priority === "low").length,
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
