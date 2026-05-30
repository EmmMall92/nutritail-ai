import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  registry: "data/sources/schesir_royal_link_registry.csv",
  output: "data/imports/schesir_official_enrichment_extract_v2.csv",
  review: "data/review/schesir_official_enrichment_extract_review.csv",
  report: "reports/schesir_official_enrichment_extract.md",
};

const reviewHeaders = [
  "formula_key",
  "brand",
  "formula_name",
  "species",
  "format",
  "status",
  "missing_fields",
  "evidence_path",
  "duplicate_blocks_skipped",
  "recommended_action",
  "notes",
];

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
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
  const headers = rows[0].map((header) => header.replace(/^\uFEFF/, "").trim());
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function writeCsv(headers, rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header] ?? "")).join(","))
    .join("\n")}\n`;
}

function cleanText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(value) {
  return cleanText(
    String(value ?? "")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#039;|&#39;/g, "'")
      .replace(/&ndash;/g, "-")
      .replace(/&rsquo;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">"),
  );
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0370-\u03ff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "NutriTail Schesir official enrichment/1.0",
      accept: "text/html,application/xhtml+xml",
    },
  });
  if (!response.ok) throw new Error(`Fetch failed ${response.status} ${url}`);
  return response.text();
}

async function fetchTextOrEmpty(url) {
  try {
    return await fetchText(url);
  } catch (error) {
    console.warn(error instanceof Error ? error.message : `Fetch failed ${url}`);
    return "";
  }
}

function pageText(html) {
  return decodeHtml(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
}

function sectionBetween(text, start, stops) {
  const startIndex = text.indexOf(start);
  if (startIndex === -1) return "";
  const tail = text.slice(startIndex + start.length);
  const stopIndexes = stops.map((stop) => tail.indexOf(stop)).filter((index) => index >= 0);
  const end = stopIndexes.length ? Math.min(...stopIndexes) : tail.length;
  return cleanText(tail.slice(0, end));
}

function titleFromHtml(html) {
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (h1) return decodeHtml(h1.replace(/<[^>]+>/g, " "));
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  return decodeHtml(title.replace(/\s*[–|-]\s*Schesir\s*$/i, ""));
}

function numberValue(value) {
  const match = String(value ?? "").replace(",", ".").match(/\d+(?:\.\d+)?/);
  if (!match) return "";
  return String(Number(match[0]));
}

function percentValue(text, labels) {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(new RegExp(`${escaped}\\s*:?\\s*(\\d+(?:[,.]\\d+)?)\\s*%`, "iu"));
    const value = numberValue(match?.[1] ?? "");
    if (value) return value;
  }
  return "";
}

function mgkgValue(text, labels) {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(new RegExp(`${escaped}\\s*:?\\s*(\\d+(?:[,.]\\d+)?)\\s*mg`, "iu"));
    const value = numberValue(match?.[1] ?? "");
    if (value) return value;
  }
  return "";
}

function normalizeLifeStage(title, url) {
  const text = `${title} ${url}`.toLowerCase();
  if (text.includes("kitten")) return "kitten";
  if (text.includes("puppy")) return "puppy";
  if (text.includes("senior") || text.includes("7+")) return "senior";
  return "adult";
}

function tagsFor(title, url, ingredientText) {
  const text = `${title} ${url} ${ingredientText}`.toLowerCase();
  const tags = ["dry"];
  for (const [needle, tag] of [
    ["sterilized", "sterilised"],
    ["sterilised", "sterilised"],
    ["kitten", "kitten"],
    ["puppy", "puppy"],
    ["hairball", "hairball"],
    ["urinary", "urinary"],
    ["sensitive", "sensitive_digestion"],
    ["chicken", "chicken"],
    ["fish", "fish"],
    ["salmon", "salmon"],
    ["ham", "pork"],
    ["rice", "rice"],
    ["monoprotein", "single_animal_protein"],
  ]) {
    if (text.includes(needle)) tags.push(tag);
  }
  return [...new Set(tags)].join(";");
}

function rowFromPage(registryRow, html) {
  const text = pageText(html);
  const title = titleFromHtml(html) || registryRow.product_title;
  const analysisText = sectionBetween(text, "Analytical Constituents", ["Composition", "Additivi", "Nutritional additives", "Description"]);
  const ingredientText = sectionBetween(text, "Composition", ["Additivi", "Nutritional additives", "Description", "Technological additives"]);
  const additivesText = sectionBetween(text, "Additivi nutrizionali/kg", ["Description", "Technological additives"]);
  const species = registryRow.species || (registryRow.product_url.includes("dog") ? "dog" : "cat");
  const format = registryRow.format || "dry";

  return {
    brand: "Schesir",
    formula_name: title,
    display_name: title,
    species,
    format,
    life_stage: normalizeLifeStage(title, registryRow.product_url),
    dog_size: species === "dog" ? "all" : "",
    breed_target: "",
    medical_tags: tagsFor(title, registryRow.product_url, ingredientText)
      .split(";")
      .filter((tag) => ["urinary", "sensitive_digestion", "hairball"].includes(tag))
      .join(";"),
    commercial_tags: tagsFor(title, registryRow.product_url, ingredientText),
    ingredient_text: ingredientText,
    ingredients: "",
    primary_animal_proteins: "",
    carbohydrate_sources: "",
    fat_sources: "",
    fiber_sources: "",
    additives_text: additivesText,
    feeding_guide_text: "",
    kcal_per_100g: "",
    kcal_per_kg: "",
    protein_percent: percentValue(analysisText, ["Protein"]),
    fat_percent: percentValue(analysisText, ["Crude Fat", "Fat"]),
    fiber_percent: percentValue(analysisText, ["Crude Fibre", "Crude Fiber", "Fibre"]),
    ash_percent: percentValue(analysisText, ["Crude Ash", "Ash"]),
    moisture_percent: "",
    calcium_percent: percentValue(analysisText, ["Ca", "Calcium"]),
    phosphorus_percent: percentValue(analysisText, ["P", "Phosphorus"]),
    sodium_percent: percentValue(analysisText, ["Na", "Sodium"]),
    magnesium_percent: percentValue(analysisText, ["Mg", "Magnesium"]),
    potassium_percent: percentValue(analysisText, ["K", "Potassium"]),
    omega3_percent: percentValue(analysisText, ["Omega-3", "Omega 3"]),
    omega6_percent: percentValue(analysisText, ["Omega-6", "Omega 6"]),
    dha_percent: percentValue(analysisText, ["DHA"]),
    epa_percent: percentValue(analysisText, ["EPA"]),
    taurine_mgkg: mgkgValue(additivesText, ["Taurine"]),
    l_carnitine_mgkg: "",
    glucosamine_mgkg: "",
    chondroitin_mgkg: "",
    vitamin_a_iukg: numberValue(additivesText.match(/Vitamin A\s*(\d+(?:[,.]\d+)?)/i)?.[1] ?? ""),
    vitamin_d3_iukg: numberValue(additivesText.match(/Vitamin D3\s*(\d+(?:[,.]\d+)?)/i)?.[1] ?? ""),
    vitamin_e_mgkg: mgkgValue(additivesText, ["Vitamin E"]),
    iron_mgkg: mgkgValue(additivesText, ["iron"]),
    zinc_mgkg: mgkgValue(additivesText, ["zinc"]),
    copper_mgkg: mgkgValue(additivesText, ["copper"]),
    manganese_mgkg: mgkgValue(additivesText, ["manganese"]),
    iodine_mgkg: mgkgValue(additivesText, ["iodine"]),
    selenium_mgkg: mgkgValue(additivesText, ["selenium"]),
    data_quality_status: "needs_review",
    data_source_url: registryRow.product_url,
    source_priority: "official",
    source_notes: "market=EU; basis=as-fed; source_tier=official; source_kind=product_page; Auto-extracted from official Schesir page; review before commit.",
    formula_key: `schesir-${slugify(title)}-${species}-${format}-official`,
    ean: "",
    is_recommendable: "true",
  };
}

function missingFieldsFor(row) {
  const missing = [];
  for (const field of ["ingredient_text", "protein_percent", "fat_percent", "fiber_percent"]) {
    if (!row[field]) missing.push(field);
  }
  if (!row.kcal_per_kg && !row.kcal_per_100g) missing.push("kcal_per_100g_or_kcal_per_kg");
  return missing.join("|");
}

function reviewRow(row) {
  return {
    formula_key: row.formula_key,
    brand: row.brand,
    formula_name: row.formula_name,
    species: row.species,
    format: row.format,
    status: "needs_review",
    missing_fields: missingFieldsFor(row),
    evidence_path: row.data_source_url,
    duplicate_blocks_skipped: "0",
    recommended_action: "Match to existing/staged Schesir formula, verify official nutrients and calories, then preview in Food V2 before commit.",
    notes: "Official Schesir enrichment; calories/ME still need label, brochure, or formula estimate backfill.",
  };
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || "unknown";
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function renderCounts(counts) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => `- ${label}: ${count}`)
    .join("\n");
}

function renderReport(rows) {
  const coverage = (field) => rows.filter((row) => String(row[field] ?? "").trim()).length;
  return `# Schesir Official Enrichment Extract

Generated: ${new Date().toISOString()}

## Summary

- Official Schesir product pages processed: ${rows.length}
- Output CSV: ${paths.output}
- Review CSV: ${paths.review}

## Coverage

- Ingredients text: ${coverage("ingredient_text")}/${rows.length}
- Protein/fat/fiber: ${rows.filter((row) => row.protein_percent && row.fat_percent && row.fiber_percent).length}/${rows.length}
- Calcium/phosphorus: ${rows.filter((row) => row.calcium_percent && row.phosphorus_percent).length}/${rows.length}
- Sodium/magnesium: ${rows.filter((row) => row.sodium_percent && row.magnesium_percent).length}/${rows.length}
- Omega 3/6: ${rows.filter((row) => row.omega3_percent && row.omega6_percent).length}/${rows.length}
- Kcal/ME: ${rows.filter((row) => row.kcal_per_kg || row.kcal_per_100g).length}/${rows.length}
- Official URL: ${coverage("data_source_url")}/${rows.length}

## By Species

${renderCounts(countBy(rows, "species"))}

## Import Decision

Rows stay in review because calories/ME are not present on the captured official pages. They are useful for official mineral, omega, ingredient, and additive backfill.
`;
}

async function main() {
  const templateText = await readFile(paths.template, "utf8");
  const headers = templateText.split(/\r?\n/)[0].split(",");
  const registry = parseCsv(await readFile(paths.registry, "utf8")).filter(
    (row) =>
      row.brand_guess === "Schesir" &&
      row.source_type === "official_product_page" &&
      row.product_scope === "complete_food_candidate" &&
      row.product_title,
  );

  const rowsByKey = new Map();
  for (const registryRow of registry) {
    const html = await fetchTextOrEmpty(registryRow.product_url);
    if (!html) continue;
    const row = rowFromPage(registryRow, html);
    rowsByKey.set(row.formula_key, row);
  }
  const rows = [...rowsByKey.values()].sort((a, b) => a.formula_name.localeCompare(b.formula_name));

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.review), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(headers, rows), "utf8");
  await writeFile(paths.review, writeCsv(reviewHeaders, rows.map(reviewRow)), "utf8");
  await writeFile(paths.report, renderReport(rows), "utf8");

  console.log(`Schesir official enrichment rows: ${rows.length}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.review}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
