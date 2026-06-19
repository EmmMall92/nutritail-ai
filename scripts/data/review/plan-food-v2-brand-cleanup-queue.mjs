import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  brandReadiness: "data/review/food_v2_brand_readiness_audit.csv",
  titleQuality: "data/review/food_v2_title_quality_audit.csv",
  duplicateRisks: "data/review/food_v2_duplicate_merge_risk_audit.csv",
  output: "data/review/food_v2_brand_cleanup_queue.csv",
  report: "reports/food_v2_brand_cleanup_queue.md",
};

const headers = [
  "priority_rank",
  "brand",
  "priority_score",
  "recommended_phase",
  "total_rows",
  "customer_impact_score",
  "customer_title_risk_score",
  "duplicate_customer_risk_score",
  "nutrition_confidence_gap_score",
  "readiness_status",
  "title_issue_rows",
  "title_issue_identities",
  "duplicate_risk_groups",
  "missing_calcium_phosphorus_rows",
  "missing_ash_rows",
  "estimated_kcal_rows",
  "missing_kcal_rows",
  "official_rows",
  "retailer_rows",
  "next_cleanup_file",
  "next_cleanup_step",
  "recommended_action",
];

const strategicBrandWeights = new Map([
  ["Royal Canin", 35],
  ["Royal Canin Veterinary Diet", 32],
  ["Schesir", 30],
  ["Ambrosia", 28],
  ["Josera", 28],
  ["N&D", 27],
  ["Farmina", 27],
  ["Acana", 25],
  ["ACANA", 25],
  ["Orijen", 25],
  ["Purina Pro Plan", 25],
  ["Brit", 24],
  ["Happy Dog", 24],
  ["Monge", 24],
  ["Hill's Prescription Diet", 20],
  ["Hills", 20],
  ["Belcando", 18],
]);

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
  if (/[",\n\r]/u.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function addCount(map, key, amount = 1) {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + amount);
}

function addSetValue(map, key, value) {
  if (!key || !value) return;
  const current = map.get(key) ?? new Set();
  current.add(value);
  map.set(key, current);
}

function inferBrandFromDuplicate(row) {
  const key = String(row.canonical_identity_key ?? "");
  const firstKeyPart = key.split("|")[0]?.trim();
  if (firstKeyPart) {
    const known = [...strategicBrandWeights.keys()].find(
      (brand) => brand.toLowerCase() === firstKeyPart
    );
    if (known) return known;
    return firstKeyPart
      .split(/\s+/u)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  const displayName = String(row.best_display_name ?? "");
  return [...strategicBrandWeights.keys()].find((brand) =>
    displayName.toLowerCase().startsWith(brand.toLowerCase())
  );
}

function phaseFor(row) {
  const duplicateRiskGroups = toNumber(row.duplicate_risk_groups);
  const titleIssueRows = toNumber(row.title_issue_rows);
  const missingCaP = toNumber(row.missing_calcium_phosphorus_rows);
  const estimatedKcal = toNumber(row.estimated_kcal_rows);

  if (duplicateRiskGroups > 0) return "dedupe_before_import";
  if (titleIssueRows > 0) return "title_cleanup";
  if (missingCaP > 0 || estimatedKcal > 0) return "nutrient_backfill";
  if (row.readiness_status === "ready_for_controlled_import") {
    return "controlled_import_ready";
  }
  return "small_batch_review";
}

function actionFor(row) {
  const phase = row.recommended_phase;
  if (phase === "dedupe_before_import") {
    return "Review duplicate groups first, pick one canonical survivor per formula, then import.";
  }
  if (phase === "title_cleanup") {
    return "Clean customer-facing formula names before wider chatbot exposure.";
  }
  if (phase === "nutrient_backfill") {
    return "Backfill calcium/phosphorus, ash or estimated kcal where possible before confident recommendations.";
  }
  if (phase === "controlled_import_ready") {
    return "Use admin preview, Check Existing, then import selected rows.";
  }
  return "Run a small admin preview batch and manually inspect titles, source and duplicates.";
}

function nextCleanupFileFor(row) {
  if (row.recommended_phase === "dedupe_before_import") {
    return paths.duplicateRisks;
  }
  if (row.recommended_phase === "title_cleanup") {
    return paths.titleQuality;
  }
  if (row.recommended_phase === "nutrient_backfill") {
    return "data/review/food_v2_nutrient_gap_priorities.csv";
  }
  if (row.recommended_phase === "controlled_import_ready") {
    return paths.output;
  }
  return paths.brandReadiness;
}

function nextCleanupStepFor(row) {
  if (row.recommended_phase === "dedupe_before_import") {
    return "Filter duplicate audit by brand/canonical identity, choose one customer-facing survivor, then keep other rows as evidence/backfill only.";
  }
  if (row.recommended_phase === "title_cleanup") {
    return "Filter title audit by brand and rewrite names into Brand + line + life stage/size + protein/flavor + condition.";
  }
  if (row.recommended_phase === "nutrient_backfill") {
    return "Filter nutrient gaps by brand and backfill kcal, ash, calcium/phosphorus from official pages, PDFs, labels or trusted retailers.";
  }
  if (row.recommended_phase === "controlled_import_ready") {
    return "Run admin preview, Check Existing, import a selected controlled batch, then rerun this queue.";
  }
  return "Review a small brand batch manually for title, source, duplicate and nutrient confidence before customer exposure.";
}

function customerTitleRiskScore(row) {
  const titleRows = Math.min(toNumber(row.title_issue_rows), 120) * 0.55;
  const identities = Math.min(toNumber(row.title_issue_identities), 80) * 0.9;
  const strategic = strategicBrandWeights.get(row.brand) ? 8 : 0;
  return Math.min(100, Math.round(titleRows + identities + strategic));
}

function duplicateCustomerRiskScore(row) {
  const duplicateGroups = Math.min(toNumber(row.duplicate_risk_groups), 60) * 1.6;
  const totalRows = Math.min(toNumber(row.total_rows), 120) * 0.08;
  const strategic = strategicBrandWeights.get(row.brand) ? 6 : 0;
  return Math.min(100, Math.round(duplicateGroups + totalRows + strategic));
}

function nutritionConfidenceGapScore(row) {
  const minerals = Math.min(toNumber(row.missing_calcium_phosphorus_rows), 120) * 0.55;
  const ash = Math.min(toNumber(row.missing_ash_rows), 120) * 0.25;
  const estimatedKcal = Math.min(toNumber(row.estimated_kcal_rows), 80) * 0.45;
  const missingKcal = Math.min(toNumber(row.missing_kcal_rows), 80) * 0.9;
  const retailerOnly = toNumber(row.official_rows) === 0 && toNumber(row.retailer_rows) > 0 ? 8 : 0;
  return Math.min(100, Math.round(minerals + ash + estimatedKcal + missingKcal + retailerOnly));
}

function priorityScore(row) {
  const strategic = strategicBrandWeights.get(row.brand) ?? 0;
  const totalRows = Math.min(toNumber(row.total_rows), 120) * 0.25;
  const title = Math.min(toNumber(row.title_issue_identities), 80) * 2;
  const duplicate = Math.min(toNumber(row.duplicate_risk_groups), 40) * 3;
  const mineral = Math.min(toNumber(row.missing_calcium_phosphorus_rows), 120) * 0.35;
  const estimated = Math.min(toNumber(row.estimated_kcal_rows), 80) * 0.2;
  const readiness =
    row.readiness_status === "ready_for_controlled_import"
      ? 6
      : row.readiness_status === "review_before_import"
        ? 10
        : row.readiness_status === "needs_cleanup_or_source_backfill"
          ? 14
          : 4;

  return Math.round(strategic + totalRows + title + duplicate + mineral + estimated + readiness);
}

function customerImpactScore(row) {
  const strategic = strategicBrandWeights.get(row.brand) ?? 0;
  const rows = Math.min(toNumber(row.total_rows), 100) * 0.35;
  const titles = Math.min(toNumber(row.title_issue_identities), 50) * 1.5;
  const duplicates = Math.min(toNumber(row.duplicate_risk_groups), 25) * 2.5;
  const nutrition =
    Math.min(toNumber(row.missing_calcium_phosphorus_rows), 100) * 0.25 +
    Math.min(toNumber(row.estimated_kcal_rows), 60) * 0.25;
  const sourcePenalty = toNumber(row.official_rows) === 0 ? 8 : 0;

  return Math.round(strategic + rows + titles + duplicates + nutrition + sourcePenalty);
}

function renderReport(rows) {
  const topRows = rows.slice(0, 30);
  const nextSprintRows = rows
    .filter((row) =>
      ["dedupe_before_import", "title_cleanup", "nutrient_backfill"].includes(
        row.recommended_phase
      )
    )
    .slice(0, 5);
  const customerHotspots = [...rows]
    .sort((a, b) => b.customer_impact_score - a.customer_impact_score)
    .slice(0, 12);
  const titleHotspots = [...rows]
    .filter(
      (row) =>
        toNumber(row.title_issue_rows) > 0 ||
        toNumber(row.title_issue_identities) > 0
    )
    .sort((a, b) => b.customer_title_risk_score - a.customer_title_risk_score)
    .slice(0, 10);
  const duplicateHotspots = [...rows]
    .filter((row) => toNumber(row.duplicate_risk_groups) > 0)
    .sort((a, b) => b.duplicate_customer_risk_score - a.duplicate_customer_risk_score)
    .slice(0, 10);
  const nutritionHotspots = [...rows]
    .filter((row) => row.nutrition_confidence_gap_score > 0)
    .sort((a, b) => b.nutrition_confidence_gap_score - a.nutrition_confidence_gap_score)
    .slice(0, 10);
  const byPhase = rows.reduce((counts, row) => {
    counts.set(row.recommended_phase, (counts.get(row.recommended_phase) ?? 0) + 1);
    return counts;
  }, new Map());

  return [
    "# Food V2 Brand Cleanup Queue",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Brands queued: ${rows.length}`,
    `- Top priority brand: ${rows[0]?.brand ?? "none"}`,
    `- Output CSV: ${paths.output}`,
    `- Highest customer impact brand: ${
      [...rows].sort((a, b) => b.customer_impact_score - a.customer_impact_score)[0]?.brand ??
      "none"
    }`,
    "",
    "## Queue By Phase",
    "",
    ...[...byPhase.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([phase, count]) => `- ${phase}: ${count}`),
    "",
    "## Top Cleanup Priorities",
    "",
    ...topRows.map(
      (row) =>
        `- ${row.priority_rank}. ${row.brand}: priority=${row.priority_score}; customer_impact=${row.customer_impact_score}; ${row.recommended_phase}; rows=${row.total_rows}; title identities=${row.title_issue_identities}; title issues=${row.title_issue_rows}; duplicates=${row.duplicate_risk_groups}; Ca/P gaps=${row.missing_calcium_phosphorus_rows}`
    ),
    "",
    "## Next Cleanup Sprint",
    "",
    "Work these in order before the next broad customer-facing recommendation test.",
    "",
    ...nextSprintRows.map(
      (row, index) =>
        `${index + 1}. ${row.brand} (${row.recommended_phase}) - ${row.recommended_action} Open \`${row.next_cleanup_file}\`; ${row.next_cleanup_step}`
    ),
    "",
    "## Customer-Facing Risk Hotspots",
    "",
    "These brands are most likely to produce confusing customer recommendations because of visible title, duplicate or nutrition-confidence issues.",
    "",
    ...customerHotspots.map(
      (row) =>
        `- ${row.brand}: customer_impact=${row.customer_impact_score}; title_risk=${row.customer_title_risk_score}; duplicate_risk=${row.duplicate_customer_risk_score}; nutrition_gap=${row.nutrition_confidence_gap_score}; next=${row.next_cleanup_file}`
    ),
    "",
    "## Title Cleanup Hotspots",
    "",
    titleHotspots.length > 0
      ? titleHotspots
          .map(
            (row) =>
              `- ${row.brand}: title_risk=${row.customer_title_risk_score}; title issues=${row.title_issue_rows}; identities=${row.title_issue_identities}; next step: ${row.next_cleanup_step}`
          )
          .join("\n")
      : "- No current title cleanup hotspots with actual title issues. Use Customer-Facing Risk Hotspots for strategic brand order.",
    "",
    "## Duplicate Cleanup Hotspots",
    "",
    duplicateHotspots.length > 0
      ? duplicateHotspots
          .map(
            (row) =>
              `- ${row.brand}: duplicate_risk=${row.duplicate_customer_risk_score}; duplicate groups=${row.duplicate_risk_groups}; next step: ${row.next_cleanup_step}`
          )
          .join("\n")
      : "- No current duplicate cleanup hotspots with actionable duplicate groups.",
    "",
    "## Nutrition Confidence Hotspots",
    "",
    ...nutritionHotspots.map(
      (row) =>
        `- ${row.brand}: nutrition_gap=${row.nutrition_confidence_gap_score}; Ca/P gaps=${row.missing_calcium_phosphorus_rows}; ash gaps=${row.missing_ash_rows}; estimated kcal=${row.estimated_kcal_rows}; missing kcal=${row.missing_kcal_rows}`
    ),
    "",
    "## How To Use This",
    "",
    "1. Start with high `customer_impact_score` brands because these are most likely to affect visible chatbot recommendations.",
    "2. Resolve `dedupe_before_import` before importing new rows, because duplicate formulas can confuse ranking and food cards.",
    "3. Resolve `title_cleanup` before customer exposure, because product names are what users remember and click.",
    "4. Resolve `nutrient_backfill` before relying on medical, growth, senior, or weight-control confidence.",
    "5. Use the risk columns to split work: title risk affects what customers see, duplicate risk affects ranking, nutrition gap risk affects confidence.",
    "",
    "`title_issue_identities` counts distinct formula/source identities from the title audit and may be higher than committed rows when the source registry has extra candidate rows.",
    "",
    "## Operating Rule",
    "",
    "Use this as the brand-by-brand cleanup order before broad customer-facing recommendation testing. It does not write to Supabase; it combines title quality, duplicate risk and nutrient gaps into one working queue.",
  ].join("\n");
}

async function main() {
  const [brandRows, titleRows, duplicateRows] = await Promise.all([
    readFile(paths.brandReadiness, "utf8").then(parseCsv),
    readFile(paths.titleQuality, "utf8").then(parseCsv),
    readFile(paths.duplicateRisks, "utf8").then(parseCsv),
  ]);

  const titleIssuesByBrand = new Map();
  const titleIssueFormulaKeysByBrand = new Map();
  const duplicateGroupsByBrand = new Map();

  for (const row of titleRows.filter((row) => row.severity !== "info")) {
    addCount(titleIssuesByBrand, row.brand);
    addSetValue(
      titleIssueFormulaKeysByBrand,
      row.brand,
      row.formula_key || `${row.brand}|${row.formula_name}|${row.species}|${row.format}`
    );
  }
  for (const row of duplicateRows) {
    if (row.risk_level === "hold" || row.risk_level === "low") continue;
    addCount(duplicateGroupsByBrand, inferBrandFromDuplicate(row));
  }

  const queue = brandRows
    .map((row) => {
      const titleIssueRows = titleIssuesByBrand.get(row.brand) ?? 0;
      const titleIssueIdentities = titleIssueFormulaKeysByBrand.get(row.brand)?.size ?? 0;
      const duplicateRiskGroups = duplicateGroupsByBrand.get(row.brand) ?? 0;
      const enriched = {
        brand: row.brand,
        total_rows: toNumber(row.total_rows),
        readiness_status: row.readiness_status,
        title_issue_rows: titleIssueRows,
        title_issue_identities: titleIssueIdentities,
        duplicate_risk_groups: duplicateRiskGroups,
        missing_calcium_phosphorus_rows: toNumber(row.missing_core_mineral_rows),
        missing_ash_rows: toNumber(row.missing_ash_rows),
        estimated_kcal_rows: toNumber(row.estimated_kcal_rows),
        missing_kcal_rows: toNumber(row.missing_kcal_rows),
        official_rows: toNumber(row.official_rows),
        retailer_rows: toNumber(row.retailer_rows),
      };
      const recommended_phase = phaseFor(enriched);
      const fullRow = {
        ...enriched,
        recommended_phase,
      };
      return {
        ...fullRow,
        priority_score: priorityScore(fullRow),
        customer_impact_score: customerImpactScore(fullRow),
        customer_title_risk_score: customerTitleRiskScore(fullRow),
        duplicate_customer_risk_score: duplicateCustomerRiskScore(fullRow),
        nutrition_confidence_gap_score: nutritionConfidenceGapScore(fullRow),
        next_cleanup_file: nextCleanupFileFor(fullRow),
        next_cleanup_step: nextCleanupStepFor(fullRow),
        recommended_action: actionFor(fullRow),
      };
    })
    .sort((a, b) => b.priority_score - a.priority_score || b.total_rows - a.total_rows)
    .map((row, index) => ({ priority_rank: index + 1, ...row }));

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(
    paths.output,
    [headers.join(","), ...queue.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n"),
    "utf8"
  );
  await writeFile(paths.report, renderReport(queue), "utf8");

  console.log(
    JSON.stringify(
      {
        brands: queue.length,
        topBrand: queue[0]?.brand ?? null,
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
