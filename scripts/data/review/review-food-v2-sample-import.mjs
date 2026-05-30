import { readFile } from "node:fs/promises";

const SAMPLE_PATH = "data/samples/food-v2-sample-import.csv";
const TEMPLATE_PATH = "data/templates/nutritail-food-v2-template.csv";

const requiredFields = [
  "brand",
  "formula_name",
  "species",
  "format",
  "ingredient_text",
  "kcal_per_100g",
  "protein_percent",
  "fat_percent",
  "fiber_percent",
  "data_source_url",
  "source_priority",
  "source_notes",
];

const ranges = {
  kcal_per_100g: [200, 600],
  protein_percent: [5, 60],
  fat_percent: [2, 45],
  fiber_percent: [0, 20],
  ash_percent: [0, 20],
  moisture_percent: [0, 20],
  calcium_percent: [0, 4],
  phosphorus_percent: [0, 3],
  sodium_percent: [0, 2],
  magnesium_percent: [0, 0.5],
};

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const headers = parseCsvLine(lines[0] ?? "");
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""])
    );
  });

  return { headers, rows };
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formulaKey(row) {
  return [row.brand, row.formula_name, row.species, row.format]
    .map(slugify)
    .join("|");
}

function hasValue(value) {
  return String(value ?? "").trim().length > 0;
}

function numberValue(value) {
  if (!hasValue(value)) return null;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function assert(condition, message, issues) {
  if (!condition) issues.push(message);
}

async function main() {
  const issues = [];
  const template = parseCsv(await readFile(TEMPLATE_PATH, "utf8"));
  const sample = parseCsv(await readFile(SAMPLE_PATH, "utf8"));

  assert(
    template.headers.join("|") === sample.headers.join("|"),
    "Sample import headers must match the Food V2 template headers.",
    issues
  );

  assert(sample.rows.length === 2, "Sample import should contain exactly 2 rows.", issues);

  const keys = new Set();

  sample.rows.forEach((row, index) => {
    const label = `row ${index + 1}`;

    requiredFields.forEach((field) => {
      assert(hasValue(row[field]), `${label} is missing ${field}.`, issues);
    });

    assert(
      row.species === "dog" || row.species === "cat",
      `${label} has unsupported species.`,
      issues
    );
    assert(
      ["dry", "wet", "treat", "supplement"].includes(row.format),
      `${label} has unsupported format.`,
      issues
    );
    assert(
      ["verified", "needs_review", "unknown"].includes(row.data_quality_status),
      `${label} has unsupported data_quality_status.`,
      issues
    );
    assert(
      ["official", "retailer", "manual_photo", "unknown"].includes(row.source_priority),
      `${label} has unsupported source_priority.`,
      issues
    );
    assert(
      row.source_notes.includes("market=") && row.source_notes.includes("basis=as-fed"),
      `${label} source_notes must include market= and basis=as-fed.`,
      issues
    );

    const key = formulaKey(row);
    assert(!keys.has(key), `${label} duplicates formula key ${key}.`, issues);
    keys.add(key);

    Object.entries(ranges).forEach(([field, [min, max]]) => {
      const value = numberValue(row[field]);
      if (value === null) return;
      assert(value >= min && value <= max, `${label} ${field} is outside ${min}-${max}.`, issues);
    });
  });

  if (issues.length > 0) {
    console.error("Food V2 sample import review failed:");
    issues.forEach((issue) => console.error(`- ${issue}`));
    process.exitCode = 1;
    return;
  }

  console.log("Food V2 sample import review passed.");
  console.log(`Rows: ${sample.rows.length}`);
  console.log(`Formula keys: ${keys.size}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
