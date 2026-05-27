import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const LISTING_PAGES = [
  "https://ambrosiapetfood.com/el/products/",
  "https://ambrosiapetfood.com/el/products/page/2/",
];

const RAW_OUTPUT = path.join("data", "raw", "ambrosia", "ambrosia-products-el.json");
const REPORT_OUTPUT = path.join("reports", "ambrosia_collection_audit.md");

const PERCENT_FIELDS = [
  ["protein_percent", /(?:Ακατέργαστη\s*)?πρωτεΐνη\s*([\d,.]+)\s*%/i],
  ["fat_percent", /(?:Ακατέργαστ(?:ο|α)\s*)?(?:λίπος|λιπαρά)\s*([\d,.]+)\s*%/i],
  ["fiber_percent", /(?:Ακατέργαστες\s*)?ίνες\s*([\d,.]+)\s*%/i],
  ["moisture_percent", /(?:Υγρασία|Υγρασια)\s*([\d,.]+)\s*%/i],
  ["calcium_percent", /(?:Ca\s*)?\(?\s*ασβέστιο\s*\)?\s*([\d,.]+)\s*%/i],
  ["phosphorus_percent", /(?:P\s*)?\(?\s*φώσφορος\s*\)?\s*([\d,.]+)\s*%/i],
  ["omega_3_percent", /Ωμέγα\s*3\s*([\d,.]+)\s*%/i],
  ["omega_6_percent", /Ωμέγα\s*6\s*([\d,.]+)\s*%/i],
];

function decodeHtml(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#8211;|&#8212;/g, "-")
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(html) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|li|div|h[1-6]|tr|td|th)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function parseNumber(raw) {
  if (!raw) return null;
  const numeric = raw.replace(/[^\d.,]/g, "");
  const normalized = numeric.includes(",")
    ? numeric.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}(\.\d{3})+$/.test(numeric)
      ? numeric.replace(/\./g, "")
      : numeric;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function collectProductUrls(listingHtml) {
  const urls = new Set();
  const pattern = /href=["'](https:\/\/ambrosiapetfood\.com\/el\/products\/[^"'#?]+\/)["']/g;
  for (const match of listingHtml.matchAll(pattern)) {
    const url = match[1];
    if (url === "https://ambrosiapetfood.com/el/products/") continue;
    if (/\/page\/\d+\/$/.test(url)) continue;
    if (url.includes("/feed/")) continue;
    urls.add(url);
  }
  return urls;
}

function extractTitle(html) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return h1 ? stripTags(h1[1]) : null;
}

function extractTabHtml(html, id) {
  const startMatch = html.match(new RegExp(`<div class=["']tab-pane fade[^"']*["'] id=["']${id}["'][^>]*>`, "i"));
  if (!startMatch?.index) return null;

  const start = startMatch.index + startMatch[0].length;
  const nextTab = html.slice(start).search(/<div class=["']tab-pane fade[^"']*["'] id=/i);
  const end = nextTab >= 0 ? start + nextTab : html.length;
  return html.slice(start, end);
}

function extractKcal(text) {
  const match = text.match(/([\d.,]+)\s*kcal\s*\/\s*kg/i);
  const kcalPerKg = parseNumber(match?.[1] ?? null);
  return {
    kcal_per_kg: kcalPerKg,
    kcal_per_100g: kcalPerKg == null ? null : round1(kcalPerKg / 10),
  };
}

function extractSection(text, startLabels, endLabels) {
  const startIndexes = startLabels
    .map((label) => text.toLowerCase().indexOf(label.toLowerCase()))
    .filter((index) => index >= 0);
  if (!startIndexes.length) return null;

  const start = Math.min(...startIndexes);
  const afterStart = text.slice(start);
  const endIndexes = endLabels
    .map((label) => afterStart.toLowerCase().indexOf(label.toLowerCase(), 1))
    .filter((index) => index > 0);
  const end = endIndexes.length ? Math.min(...endIndexes) : Math.min(afterStart.length, 2000);
  return afterStart.slice(0, end).trim();
}

function splitIngredients(rawSection) {
  if (!rawSection) return [];
  const cleaned = rawSection
    .replace(/^Σύνθεση\s*:?\s*/i, "")
    .replace(/^Composition\s*:?\s*/i, "")
    .replace(/ΟΔΗΓΙΕΣ ΓΙΑ ΣΩΣΤΗ ΧΡΗΣΗ:[\s\S]*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  const ingredients = [];
  let buffer = "";
  let depth = 0;

  for (const char of cleaned) {
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);

    if (char === "," && depth === 0) {
      if (buffer.trim()) ingredients.push(buffer.trim());
      buffer = "";
      continue;
    }

    buffer += char;
  }

  if (buffer.trim()) ingredients.push(buffer.trim());
  return [...new Set(ingredients)];
}

function extractTableRows(html) {
  const rows = [];
  const pattern = /<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
  for (const match of html.matchAll(pattern)) {
    rows.push({
      label: stripTags(match[1]),
      value: stripTags(match[2]),
    });
  }
  return rows;
}

function extractPercentFields(source) {
  const tableRows = source.includes("<tr") ? extractTableRows(source) : [];
  if (tableRows.length) {
    const fields = {
      protein_percent: null,
      fat_percent: null,
      fiber_percent: null,
      moisture_percent: null,
      calcium_percent: null,
      phosphorus_percent: null,
      omega_3_percent: null,
      omega_6_percent: null,
    };

    for (const row of tableRows) {
      const label = row.label.toLowerCase();
      const value = parseNumber(row.value);
      if (value == null) continue;

      if (label.includes("ωμέγα-3") || label.includes("ωμέγα 3")) {
        fields.omega_3_percent = value;
        continue;
      }
      if (label.includes("ωμέγα-6") || label.includes("ωμέγα 6")) {
        fields.omega_6_percent = value;
        continue;
      }
      if (label.includes("πρωτεΐν")) fields.protein_percent = value;
      if (label.includes("ακατέργαστο λίπος")) fields.fat_percent = value;
      if (label.includes("ίνες")) fields.fiber_percent = value;
      if (label.includes("υγρασία")) fields.moisture_percent = value;
      if (label.includes("ασβέστιο")) fields.calcium_percent = value;
      if (label.includes("φώσφορος")) fields.phosphorus_percent = value;
    }

    return fields;
  }

  const fields = {};
  for (const [key, pattern] of PERCENT_FIELDS) {
    const match = source.match(pattern);
    fields[key] = parseNumber(match?.[1] ?? null);
  }
  return fields;
}

function extractSummaryWindow(html) {
  const h1Index = html.search(/<h1[^>]*>/i);
  if (h1Index < 0) return "";
  return stripTags(html.slice(h1Index, h1Index + 5000));
}

function inferSpecies(summaryText, pageText = "") {
  const lower = `${summaryText} ${pageText}`.toLowerCase();
  const hasCatFeedingGuide = lower.includes("cat weight");
  const hasDogFeedingGuide = lower.includes("dog weight");
  if (hasCatFeedingGuide && !hasDogFeedingGuide) return "cat";
  if (hasDogFeedingGuide && !hasCatFeedingGuide) return "dog";

  const catSignals = ["cat", "cats", "γάτα", "γάτες", "γατα", "γατες"];
  const dogSignals = ["dog", "dogs", "σκύλο", "σκυλο", "σκύλους", "σκυλους"];
  const hasCat = catSignals.some((signal) => lower.includes(signal));
  const hasDog = dogSignals.some((signal) => lower.includes(signal));
  if (hasCat && !hasDog) return "cat";
  if (hasDog && !hasCat) return "dog";
  return null;
}

function inferLifeStage(summaryText) {
  const lower = summaryText.toLowerCase();
  const stages = [];
  if (lower.includes("puppy") || lower.includes("kitten")) stages.push("growth");
  if (lower.includes("adult") || lower.includes("ενήλικ") || lower.includes("ενηλικ")) stages.push("adult");
  if (lower.includes("senior")) stages.push("senior");
  if (lower.includes("all life stages") || lower.includes("όλα τα στάδια") || lower.includes("ολα τα σταδια")) {
    stages.push("all_life_stages");
  }
  return [...new Set(stages)];
}

function inferForm(kcalPer100g, summaryText) {
  const lower = summaryText.toLowerCase();
  if (lower.includes("wet")) return "wet";
  if (lower.includes("dry")) return "dry";
  if (kcalPer100g != null && kcalPer100g < 150) return "wet";
  if (kcalPer100g != null && kcalPer100g >= 250) return "dry";
  return null;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Nutritail data collection audit (contact: nutritail.ai)",
    },
  });
  if (!response.ok) {
    throw new Error(`Fetch failed for ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function main() {
  const urls = new Set();
  for (const listingPage of LISTING_PAGES) {
    const html = await fetchText(listingPage);
    for (const url of collectProductUrls(html)) urls.add(url);
  }

  const products = [];
  for (const url of [...urls].sort()) {
    const html = await fetchText(url);
    const text = stripTags(html);
    const summaryText = extractSummaryWindow(html);
    const title = extractTitle(html);
    const energy = extractKcal(text);
    const compositionHtml = extractTabHtml(html, "composition");
    const analyticalHtml = extractTabHtml(html, "analytical_constituents");
    const compositionSection = compositionHtml
      ? stripTags(compositionHtml)
      : extractSection(text, ["Σύνθεση", "Composition"], [
      "Αναλυτικά Συστατικά",
      "Analytical Constituents",
      "ΟΔΗΓΙΕΣ",
      "Οδηγίες",
      "FEEDING",
    ]);
    const analyticalSection = analyticalHtml ?? extractSection(text, ["Αναλυτικά Συστατικά", "Analytical Constituents"], [
      "ΠΡΟΣΘΕΤΑ",
      "Πρόσθετα",
      "Additives",
      "ΟΔΗΓΙΕΣ",
      "Οδηγίες",
      "FEEDING",
    ]);
    const ingredients = splitIngredients(compositionSection);
    const nutrition = extractPercentFields(analyticalSection ?? text);
    const product = {
      brand: "Ambrosia",
      source_url: url,
      source_market: "GR",
      source_tier: "official",
      source_kind: "product_page",
      title,
      candidate_species: inferSpecies(summaryText, text),
      candidate_life_stages: inferLifeStage(summaryText),
      candidate_form: inferForm(energy.kcal_per_100g, summaryText),
      ingredients,
      kcal_per_kg: energy.kcal_per_kg,
      kcal_per_100g: energy.kcal_per_100g,
      ...nutrition,
      missing_core_fields: [],
      parser_notes: "Raw official-page collection. Review species, life stage, and product form before production import.",
    };

    for (const field of [
      "candidate_species",
      "ingredients",
      "kcal_per_100g",
      "protein_percent",
      "fat_percent",
      "fiber_percent",
      "calcium_percent",
      "phosphorus_percent",
    ]) {
      if (field === "ingredients") {
        if (!product.ingredients.length) product.missing_core_fields.push(field);
      } else if (product[field] == null) {
        product.missing_core_fields.push(field);
      }
    }

    products.push(product);
  }

  const generatedAt = new Date().toISOString();
  const output = {
    generated_at: generatedAt,
    listing_pages: LISTING_PAGES,
    source_policy: "Official Greek manufacturer product pages. Values are raw/as-fed candidates until normalized.",
    product_count: products.length,
    products,
  };

  await mkdir(path.dirname(RAW_OUTPUT), { recursive: true });
  await mkdir(path.dirname(REPORT_OUTPUT), { recursive: true });
  await writeFile(`${RAW_OUTPUT}`, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  const completeCore = products.filter((product) => product.missing_core_fields.length === 0).length;
  const missingSodium = products.filter((product) => product.sodium_percent == null).length;
  const missingMagnesium = products.filter((product) => product.magnesium_percent == null).length;
  const missingKcal = products.filter((product) => product.kcal_per_100g == null).length;

  const report = [
    "# Ambrosia Official Collection Audit",
    "",
    `Generated at: ${generatedAt}`,
    "",
    "## Summary",
    "",
    `- Listing pages scanned: ${LISTING_PAGES.length}`,
    `- Official product pages collected: ${products.length}`,
    `- Rows with complete production core candidates: ${completeCore}`,
    `- Rows missing kcal_per_100g: ${missingKcal}`,
    `- Rows missing sodium_percent: ${missingSodium}`,
    `- Rows missing magnesium_percent: ${missingMagnesium}`,
    "",
    "## Sources",
    "",
    ...LISTING_PAGES.map((page) => `- ${page}`),
    "",
    "## Product Pages",
    "",
    ...products.map((product) => {
      const missing = product.missing_core_fields.length ? product.missing_core_fields.join(", ") : "none";
      return `- ${product.title ?? "Untitled"} | ${product.source_url} | form=${product.candidate_form ?? "unknown"} | species=${product.candidate_species ?? "unknown"} | missing_core=${missing}`;
    }),
    "",
    "## Import Note",
    "",
    "This file is a raw collection audit, not a production import. Normalize only reviewed rows into the canonical import files.",
    "",
  ].join("\n");

  await writeFile(REPORT_OUTPUT, report, "utf8");
  console.log(`Collected ${products.length} Ambrosia product pages.`);
  console.log(`Raw output: ${RAW_OUTPUT}`);
  console.log(`Audit report: ${REPORT_OUTPUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
