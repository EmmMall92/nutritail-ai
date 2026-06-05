import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  candidates: "data/imports/food_v2_best_candidate_preview.csv",
  gaps: "data/review/food_v2_nutrient_gap_priorities.csv",
  output: "data/review/food_v2_recommendation_safety_audit.csv",
  report: "reports/food_v2_recommendation_safety_audit.md",
};

const headers = [
  "recommendation_status",
  "risk_level",
  "brand",
  "display_name",
  "species",
  "format",
  "life_stage",
  "data_quality_status",
  "source_priority",
  "formula_key",
  "gap_priority",
  "gap_score",
  "missing_blockers",
  "estimated_fields_to_replace",
  "health_context",
  "recommendation_reason",
  "required_before_enable",
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

function splitList(value) {
  return String(value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isMedicalOrGrowth(row, gapRow) {
  const context = splitList(gapRow?.health_context);
  const text = [
    row.medical_tags,
    row.commercial_tags,
    row.display_name,
    row.formula_name,
    row.life_stage,
  ]
    .join(" ")
    .toLowerCase();

  return (
    context.length > 0 ||
    /renal|urinary|hepatic|diabetic|gastro|hypoallergenic|dermatosis|obesity|weight|puppy|kitten|junior|senior/.test(
      text
    )
  );
}

function statusFor(row, gapRow) {
  const blockers = splitList(gapRow?.missing_blockers);
  const estimated = splitList(gapRow?.estimated_fields_to_replace);
  const medicalOrGrowth = isMedicalOrGrowth(row, gapRow);
  const gapPriority = String(gapRow?.priority ?? "low");
  const gapScore = Number(gapRow?.gap_score ?? 0);

  if (row.data_quality_status === "unknown") {
    return {
      recommendation_status: "do_not_enable",
      risk_level: "high",
      recommendation_reason: "Unknown data quality cannot be used in recommendations.",
      required_before_enable: "Classify data quality and verify source evidence.",
    };
  }

  if (blockers.length > 0 && medicalOrGrowth) {
    return {
      recommendation_status: "do_not_enable",
      risk_level: "high",
      recommendation_reason:
        "Medical, senior, puppy, kitten or weight-context food is missing blocker nutrients.",
      required_before_enable:
        "Backfill blocker nutrients from official source, PDF or clear label photo.",
    };
  }

  if (blockers.length > 0) {
    return {
      recommendation_status: "hold_until_backfill",
      risk_level: "medium",
      recommendation_reason: "Core blocker nutrients are missing.",
      required_before_enable: "Backfill missing kcal, calcium, phosphorus or proximate values.",
    };
  }

  if (estimated.includes("kcal_per_100g") && medicalOrGrowth) {
    return {
      recommendation_status: "cautious_enable_only",
      risk_level: "medium",
      recommendation_reason:
        "Uses estimated calories for a sensitive recommendation context.",
      required_before_enable:
        "Prefer official kcal before strong recommendation or portion guidance.",
    };
  }

  if (gapPriority === "high" || gapScore >= 60) {
    return {
      recommendation_status: "review_before_enable",
      risk_level: "medium",
      recommendation_reason: "Nutrient gap score is high even without core blockers.",
      required_before_enable: "Review gap report and source notes before enabling.",
    };
  }

  if (row.source_priority === "retailer" && row.data_quality_status === "needs_review") {
    return {
      recommendation_status: "cautious_enable_only",
      risk_level: "low",
      recommendation_reason:
        "Retailer-sourced row still needs review, but no critical blockers were detected.",
      required_before_enable: "Spot-check title, ingredients and source before enabling.",
    };
  }

  return {
    recommendation_status: "eligible_after_admin_choice",
    risk_level: "low",
    recommendation_reason:
      "No critical recommendation blocker was detected in the current artifacts.",
    required_before_enable: "Admin may enable based on commercial/brand decision.",
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
  return (
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([key, count]) => `- ${key}: ${count}`)
      .join("\n") || "- none"
  );
}

function renderTopHolds(rows) {
  return (
    rows
      .filter((row) => row.recommendation_status !== "eligible_after_admin_choice")
      .slice(0, 25)
      .map(
        (row) =>
          `- ${row.brand} - ${row.display_name}: ${row.recommendation_status}; risk=${row.risk_level}; blockers=${row.missing_blockers || "none"}; context=${row.health_context || "none"}`
      )
      .join("\n") || "- none"
  );
}

async function main() {
  const [candidateRows, gapRows] = await Promise.all([
    readFile(paths.candidates, "utf8").then(parseCsv),
    readFile(paths.gaps, "utf8").then(parseCsv),
  ]);
  const gapsByFormulaKey = new Map(gapRows.map((row) => [row.formula_key, row]));

  const rows = candidateRows
    .map((row) => {
      const gapRow = gapsByFormulaKey.get(row.formula_key);
      const status = statusFor(row, gapRow);
      return {
        ...status,
        brand: row.brand,
        display_name: row.display_name,
        species: row.species,
        format: row.format,
        life_stage: row.life_stage,
        data_quality_status: row.data_quality_status,
        source_priority: row.source_priority,
        formula_key: row.formula_key,
        gap_priority: gapRow?.priority ?? "",
        gap_score: gapRow?.gap_score ?? "",
        missing_blockers: gapRow?.missing_blockers ?? "",
        estimated_fields_to_replace: gapRow?.estimated_fields_to_replace ?? "",
        health_context: gapRow?.health_context ?? "",
      };
    })
    .sort(
      (a, b) =>
        ["high", "medium", "low"].indexOf(a.risk_level) -
          ["high", "medium", "low"].indexOf(b.risk_level) ||
        a.brand.localeCompare(b.brand) ||
        a.display_name.localeCompare(b.display_name)
    );

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(rows), "utf8");
  await writeFile(
    paths.report,
    [
      "# Food V2 Recommendation Safety Audit",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Summary",
      "",
      `- Candidate rows reviewed: ${rows.length}`,
      `- Output CSV: ${paths.output}`,
      "",
      "## By Recommendation Status",
      "",
      renderCounts(countBy(rows, "recommendation_status")),
      "",
      "## By Risk Level",
      "",
      renderCounts(countBy(rows, "risk_level")),
      "",
      "## Top Holds / Cautious Rows",
      "",
      renderTopHolds(rows),
      "",
      "## Rule",
      "",
      "Do not enable medical, growth, senior, urinary, renal, obesity or weight-control formulas for confident recommendations when blocker nutrients are missing. Estimated kcal is acceptable only with cautious wording unless official kcal is later found.",
    ].join("\n"),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        candidateRows: rows.length,
        byStatus: countBy(rows, "recommendation_status"),
        byRisk: countBy(rows, "risk_level"),
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
