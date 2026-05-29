import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  queue: "data/review/food_backfill_priority_queue.json",
  csv: "data/review/food_evidence_collection_batches.csv",
  json: "data/review/food_evidence_collection_batches.json",
  report: "reports/food_evidence_collection_batches.md",
};

const headers = [
  "priority",
  "brand",
  "evidence_needed",
  "rows",
  "missing_fields",
  "next_action",
  "acceptance_check",
];

const priorityRank = { high: 0, medium: 1, low: 2 };

function csvEscape(value) {
  if (value == null) return "";
  const text = Array.isArray(value) ? value.join("|") : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header])).join(","))
    .join("\n")}\n`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function batchKey(item) {
  return `${item.priority}|${item.brand}|${item.evidenceNeeded}`;
}

function nextActionFor(batch) {
  if (batch.priority === "high") {
    return "Collect exact label photos or official technical sheets before changing canonical nutrition fields.";
  }

  if (batch.evidence_needed.includes("manufacturer_response")) {
    return "Send manufacturer/support request first; use label photos if official data is unavailable.";
  }

  return "Collect official PDF, technical sheet, or label-photo evidence for the exact formula and market.";
}

function acceptanceCheckFor(batch) {
  if (batch.missing_fields.some((field) => ["kcal_per_100g", "calcium_percent", "phosphorus_percent"].includes(field))) {
    return "Core fields are filled from exact evidence, or the rows remain needs_review with explicit notes.";
  }

  return "Optional minerals are filled where evidence exists; rows remain partial until sodium and magnesium are present.";
}

function buildBatches(queue) {
  const grouped = new Map();

  for (const item of queue) {
    const key = batchKey(item);
    const batch = grouped.get(key) ?? {
      priority: item.priority,
      brand: item.brand,
      evidence_needed: item.evidenceNeeded,
      formulas: [],
      missing_fields: [],
      sources: [],
      request_texts: [],
    };

    batch.formulas.push(item.name);
    batch.missing_fields.push(...(item.missing ?? []));
    if (item.source) batch.sources.push(item.source);
    if (item.requestText) batch.request_texts.push(item.requestText);
    grouped.set(key, batch);
  }

  return [...grouped.values()]
    .map((batch) => {
      const normalized = {
        ...batch,
        rows: unique(batch.formulas).length,
        formulas: unique(batch.formulas).sort((a, b) => a.localeCompare(b)),
        missing_fields: unique(batch.missing_fields).sort((a, b) => a.localeCompare(b)),
        sources: unique(batch.sources),
        request_texts: unique(batch.request_texts),
      };

      return {
        ...normalized,
        next_action: nextActionFor(normalized),
        acceptance_check: acceptanceCheckFor(normalized),
      };
    })
    .sort(
      (a, b) =>
        priorityRank[a.priority] - priorityRank[b.priority] ||
        a.brand.localeCompare(b.brand) ||
        a.evidence_needed.localeCompare(b.evidence_needed)
    );
}

function renderReport(batches) {
  const counts = batches.reduce(
    (acc, batch) => {
      acc[batch.priority] += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 }
  );

  const sections = batches.map((batch) => {
    const formulas = batch.formulas.map((formula) => `- ${formula}`).join("\n");
    const sources = batch.sources.map((source) => `- ${source}`).join("\n");

    return `## ${batch.priority.toUpperCase()} - ${batch.brand}

- Rows: ${batch.rows}
- Evidence needed: ${batch.evidence_needed}
- Missing fields: ${batch.missing_fields.join(", ")}
- Next action: ${batch.next_action}
- Acceptance check: ${batch.acceptance_check}

### Formulas

${formulas}

### Sources

${sources || "- No source recorded"}
`;
  });

  return `# Food Evidence Collection Batches

Generated: ${new Date().toISOString()}

## Summary

- Collection batches: ${batches.length}
- High priority batches: ${counts.high}
- Medium priority batches: ${counts.medium}
- Low priority batches: ${counts.low}
- CSV: ${paths.csv}
- JSON: ${paths.json}

## Operating Order

1. Resolve high-priority Royal Canin core evidence before optional minerals.
2. Use official technical sheets or manufacturer responses before retailer pages.
3. Use label photos only when official data is unavailable or incomplete.
4. Do not promote rows to verified until source evidence supports every required field.

${sections.join("\n")}
`;
}

async function main() {
  const queue = JSON.parse(await readFile(paths.queue, "utf8"));

  if (!Array.isArray(queue)) {
    throw new Error("Food backfill queue must be an array.");
  }

  const batches = buildBatches(queue);

  await mkdir(path.dirname(paths.csv), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.csv, writeCsv(batches), "utf8");
  await writeFile(paths.json, `${JSON.stringify(batches, null, 2)}\n`, "utf8");
  await writeFile(paths.report, renderReport(batches), "utf8");

  console.log(`Evidence collection batches: ${batches.length}`);
  console.log(`Wrote ${paths.csv}`);
  console.log(`Wrote ${paths.json}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
