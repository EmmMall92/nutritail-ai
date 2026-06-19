import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  input: "data/imports/food_v2_best_candidate_preview.csv",
  output: "data/review/food_v2_nutrient_gap_priorities.csv",
  report: "reports/food_v2_nutrient_gap_priorities.md",
};

const headers = [
  "priority",
  "gap_score",
  "brand",
  "display_name",
  "species",
  "format",
  "life_stage",
  "data_quality_status",
  "source_priority",
  "formula_key",
  "missing_blockers",
  "estimated_fields_to_replace",
  "missing_helpful_fields",
  "health_context",
  "recommended_evidence",
  "next_action",
  "data_source_url",
];

const blockerFields = [
  "protein_percent",
  "fat_percent",
  "fiber_percent",
  "kcal_per_100g",
  "calcium_percent",
  "phosphorus_percent",
];

const helpfulFields = [
  "ash_percent",
  "moisture_percent",
  "sodium_percent",
  "magnesium_percent",
  "omega3_percent",
  "omega6_percent",
  "epa_percent",
  "dha_percent",
  "epa_dha_percent",
];

const highSensitivityTags = {
  renal: ["phosphorus_percent", "sodium_percent", "epa_percent", "dha_percent", "epa_dha_percent"],
  urinary: ["magnesium_percent", "phosphorus_percent", "sodium_percent", "moisture_percent"],
  obesity: ["kcal_per_100g", "fiber_percent", "fat_percent", "ash_percent"],
  weight_control: ["kcal_per_100g", "fiber_percent", "fat_percent", "ash_percent"],
  gi_support: ["fiber_percent", "ash_percent", "moisture_percent"],
  sensitive_digestion: ["fiber_percent", "ash_percent", "moisture_percent"],
  allergy: ["ingredients", "primary_animal_proteins"],
  puppy: ["kcal_per_100g", "calcium_percent", "phosphorus_percent", "dha_percent", "epa_dha_percent"],
  kitten: ["kcal_per_100g", "calcium_percent", "phosphorus_percent", "dha_percent", "epa_dha_percent"],
  senior: ["phosphorus_percent", "sodium_percent", "epa_percent", "dha_percent", "epa_dha_percent"],
};

const focusBrands = [
  "Royal Canin",
  "Royal Canin Veterinary Diet",
  "Josera",
  "Ambrosia",
  "Happy Dog",
  "Purina Pro Plan",
  "Monge",
  "Acana",
  "Orijen",
  "Farmina",
  "Brit",
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
  const text = Array.isArray(value) ? value.join("|") : String(value ?? "");
  if (/[",\n\r]/u.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header])).join(","))
    .join("\n")}\n`;
}

function hasValue(value) {
  if (value === null || value === undefined) return false;
  const text = String(value).trim();
  if (!text) return false;
  const numberValue = Number(text);
  if (Number.isFinite(numberValue)) return numberValue > 0;
  return true;
}

function missing(row, fields) {
  return fields.filter((field) => !hasValue(row[field]));
}

function sourceNotes(row) {
  return String(row.source_notes ?? "").toLowerCase();
}

function tagsFor(row) {
  const text = [
    row.medical_tags,
    row.commercial_tags,
    row.life_stage,
    row.display_name,
    row.formula_name,
  ]
    .join(";")
    .toLowerCase();

  return Object.keys(highSensitivityTags).filter((tag) =>
    text.includes(tag.replace("_", " ")) || text.includes(tag)
  );
}

function contextSensitiveMissing(row, missingFields) {
  const tags = tagsFor(row);
  const important = new Set();

  for (const tag of tags) {
    for (const field of highSensitivityTags[tag] ?? []) {
      if (missingFields.includes(field)) important.add(field);
    }
  }

  return [...important];
}

function estimatedFieldsToReplace(row) {
  const notes = sourceNotes(row);
  const fields = [];

  if (notes.includes("kcal_estimated=true")) {
    fields.push("kcal_per_100g");
  }
  if (notes.includes("default_moisture_percent=10")) {
    fields.push("moisture_percent");
  }
  if (notes.includes("default_ash") || notes.includes("ash_default")) {
    fields.push("ash_percent");
  }

  return fields;
}

function scoreGap(row, missingBlockers, missingHelpful, contextMissing, estimatedFields) {
  let score = 0;

  score += missingBlockers.length * 18;
  score += contextMissing.length * 12;
  score += estimatedFields.length * 8;
  score += missingHelpful.length * 4;

  if (row.data_quality_status === "needs_review") score += 10;
  if (row.source_priority === "retailer") score += 6;
  if (tagsFor(row).length > 0) score += 8;

  return score;
}

function priorityFor(score, missingBlockers, contextMissing, estimatedFields) {
  if (missingBlockers.length > 0 || contextMissing.length >= 2 || score >= 60) {
    return "high";
  }
  if (estimatedFields.length > 0 || contextMissing.length > 0 || score >= 25) {
    return "medium";
  }
  return "low";
}

function evidenceFor(row, missingBlockers, estimatedFields) {
  if (missingBlockers.includes("kcal_per_100g") || estimatedFields.includes("kcal_per_100g")) {
    return "official_page_pdf_or_label_photo_with_energy";
  }
  if (missingBlockers.includes("calcium_percent") || missingBlockers.includes("phosphorus_percent")) {
    return "official_pdf_or_label_photo_with_analytical_constituents";
  }
  if (row.source_priority === "retailer") {
    return "official_source_or_pack_photo_to_confirm_retailer_data";
  }
  return "manufacturer_pdf_support_response_or_label_photo";
}

function nextAction(priority, missingBlockers, estimatedFields) {
  if (priority === "high") {
    return "Do not mark as confidently recommendable until blockers or context-critical fields are resolved.";
  }
  if (estimatedFields.length > 0) {
    return "Replace estimated/default values when official label energy or declared ash/moisture is found.";
  }
  if (missingBlockers.length === 0) {
    return "Useful follow-up backfill; safe to keep lower priority unless this brand is commercially important.";
  }
  return "Collect stronger evidence before import/commit.";
}

function buildQueue(rows) {
  return rows
    .map((row) => {
      const missingBlockers = missing(row, blockerFields);
      const missingHelpful = missing(row, helpfulFields);
      const allMissing = [...missingBlockers, ...missingHelpful];
      const contextMissing = contextSensitiveMissing(row, allMissing);
      const estimatedFields = estimatedFieldsToReplace(row);
      const gapScore = scoreGap(
        row,
        missingBlockers,
        missingHelpful,
        contextMissing,
        estimatedFields
      );
      const priority = priorityFor(
        gapScore,
        missingBlockers,
        contextMissing,
        estimatedFields
      );

      return {
        priority,
        gap_score: gapScore,
        brand: row.brand,
        display_name: row.display_name,
        species: row.species,
        format: row.format,
        life_stage: row.life_stage,
        data_quality_status: row.data_quality_status,
        source_priority: row.source_priority,
        formula_key: row.formula_key,
        missing_blockers: missingBlockers,
        estimated_fields_to_replace: estimatedFields,
        missing_helpful_fields: missingHelpful,
        health_context: tagsFor(row),
        recommended_evidence: evidenceFor(row, missingBlockers, estimatedFields),
        next_action: nextAction(priority, missingBlockers, estimatedFields),
        data_source_url: row.data_source_url,
      };
    })
    .filter(
      (row) =>
        row.missing_blockers.length > 0 ||
        row.estimated_fields_to_replace.length > 0 ||
        row.missing_helpful_fields.length > 0
    )
    .sort(
      (a, b) =>
        b.gap_score - a.gap_score ||
        a.brand.localeCompare(b.brand) ||
        a.display_name.localeCompare(b.display_name)
    );
}

function countBy(rows, field) {
  return rows.reduce((acc, row) => {
    const value = row[field];
    const values = Array.isArray(value)
      ? value.filter(Boolean)
      : [value].filter(Boolean);
    const safeValues = values.length > 0 ? values : ["none"];
    for (const item of safeValues) {
      acc[item] = (acc[item] ?? 0) + 1;
    }
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

function renderTopRows(queue) {
  return (
    queue
      .slice(0, 25)
      .map(
        (row) =>
          `- ${row.brand} - ${row.display_name}: priority=${row.priority}; score=${row.gap_score}; blockers=${row.missing_blockers.join(", ") || "none"}; estimated=${row.estimated_fields_to_replace.join(", ") || "none"}; context=${row.health_context.join(", ") || "none"}`
      )
      .join("\n") || "- none"
  );
}

function renderBrandFocus(queue) {
  return focusBrands
    .map((brand) => {
      const rows = queue.filter((row) => row.brand === brand);
      if (rows.length === 0) return null;

      const high = rows.filter((row) => row.priority === "high").length;
      const medium = rows.filter((row) => row.priority === "medium").length;
      const blockers = countBy(rows, "missing_blockers");
      const estimated = countBy(rows, "estimated_fields_to_replace");
      const topRows = rows
        .slice(0, 3)
        .map(
          (row) =>
            `  - ${row.display_name}: ${row.priority}; blockers=${row.missing_blockers.join(", ") || "none"}; estimated=${row.estimated_fields_to_replace.join(", ") || "none"}`
        )
        .join("\n");

      return [
        `### ${brand}`,
        "",
        `- Rows needing backfill/review: ${rows.length}`,
        `- High priority: ${high}`,
        `- Medium priority: ${medium}`,
        `- Most common blockers: ${
          Object.entries(blockers)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([key, count]) => `${key} (${count})`)
            .join(", ") || "none"
        }`,
        `- Estimated/default values to replace: ${
          Object.entries(estimated)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([key, count]) => `${key} (${count})`)
            .join(", ") || "none"
        }`,
        "",
        "First rows to work:",
        topRows || "- none",
      ].join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

async function main() {
  const rows = parseCsv(await readFile(paths.input, "utf8"));
  const queue = buildQueue(rows);

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(queue), "utf8");
  await writeFile(
    paths.report,
    [
      "# Food V2 Nutrient Gap Priorities",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Summary",
      "",
      `- Candidate rows reviewed: ${rows.length}`,
      `- Rows with nutrient gaps or estimated/default values: ${queue.length}`,
      `- High priority: ${queue.filter((row) => row.priority === "high").length}`,
      `- Medium priority: ${queue.filter((row) => row.priority === "medium").length}`,
      `- Low priority: ${queue.filter((row) => row.priority === "low").length}`,
      `- Output CSV: ${paths.output}`,
      "",
      "## Priority By Level",
      "",
      renderCounts(countBy(queue, "priority")),
      "",
      "## Most Common Blockers",
      "",
      renderCounts(countBy(queue, "missing_blockers")),
      "",
      "## Estimated Values To Replace",
      "",
      renderCounts(countBy(queue, "estimated_fields_to_replace")),
      "",
      "## Health Context",
      "",
      renderCounts(countBy(queue, "health_context")),
      "",
      "## Top Priority Rows",
      "",
      renderTopRows(queue),
      "",
      "## Brand Focus Sprint",
      "",
      "Use this section to work brand-by-brand without scanning the full CSV. It follows the current commercial/data priorities for recommendation quality.",
      "",
      renderBrandFocus(queue),
      "",
      "## Workflow",
      "",
      "1. Fix high-priority rows first, especially medical, puppy/kitten, renal, urinary, obesity and senior formulas.",
      "2. Replace estimated kcal with official kcal/kg or kcal/100g whenever a label, official page or PDF provides it.",
      "3. Replace default ash/moisture assumptions with declared values when available.",
      "4. Use omega3/omega6/EPA/DHA gaps as second-pass enrichment unless the food targets growth, senior, renal, skin or joint support.",
      "5. Keep retailer-only rows in review unless official evidence or clear pack photos confirm the missing fields.",
    ].join("\n"),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        candidateRows: rows.length,
        queueRows: queue.length,
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
