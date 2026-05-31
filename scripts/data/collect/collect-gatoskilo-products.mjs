import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const defaultLocalProductPath =
  "C:/Users/NIOstb/Desktop/photo_foods_nutritail/Happy Dog NaturCroq Duck & Rice Sterilised 11kg - Gatoskilo.html";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  importCsv: "data/imports/gatoskilo_product_extract_v2.csv",
  reviewCsv: "data/review/gatoskilo_product_extract_review.csv",
  registryCsv: "data/sources/gatoskilo_product_link_registry.csv",
  report: "reports/gatoskilo_product_extract.md",
};

const reviewHeaders = [
  "formula_key",
  "brand",
  "formula_name",
  "species",
  "status",
  "source_url",
  "extracted_fields",
  "missing_fields",
  "notes",
];

const registryHeaders = [
  "source_group",
  "listing_url",
  "product_url",
  "product_title",
  "brand_guess",
  "species",
  "format",
  "source_tier",
  "source_type",
  "market",
  "status",
  "notes",
];

const LOCAL_HTML_EXTENSIONS = new Set([".html", ".htm", ".mhtml", ".mht"]);

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(headers, rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header] ?? "")).join(","))
    .join("\n")}\n`;
}

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
      values.push(current.replace(/^\uFEFF/, "").trim());
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current.replace(/^\uFEFF/, "").trim());
  return values;
}

async function foodV2Headers() {
  const template = await readFile(paths.template, "utf8");
  return parseCsvLine(template.split(/\r?\n/u)[0] ?? "");
}

function cleanText(value) {
  return decodeHtml(value)
    .normalize("NFKC")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function decodeHtml(value) {
  return String(value ?? "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;/g, "'")
    .replace(/&ndash;|&mdash;/g, "-")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value) {
  return cleanText(
    String(value ?? "")
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|li|td|tr|h\d|div|section)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  );
}

function decodeQuotedPrintable(value) {
  return String(value ?? "")
    .replace(/=\r?\n/g, "")
    .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
}

function htmlFromSourceText(text) {
  const raw = String(text ?? "");
  if (/<html[\s>]/i.test(raw)) return raw;
  const decoded = decodeQuotedPrintable(raw);
  const start = decoded.search(/<!doctype html|<html[\s>]/i);
  if (start >= 0) return decoded.slice(start);
  return decoded;
}

async function readSource(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 NutriTail/1.0",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "el-GR,el;q=0.9,en;q=0.8",
        "cache-control": "no-cache",
        referer: "https://www.gatoskilo.gr/",
      },
    });
    if (!response.ok) throw new Error(`Fetch failed ${response.status} ${source}`);
    return { html: await response.text(), sourceUrl: source, sourcePath: "" };
  }

  const text = await readFile(source, "utf8");
  const snapshotUrl =
    text.match(/Snapshot-Content-Location:\s*(https?:\/\/\S+)/i)?.[1] ??
    text.match(/Content-Location:\s*(https?:\/\/\S+)/i)?.[1] ??
    "";
  return { html: htmlFromSourceText(text), sourceUrl: snapshotUrl, sourcePath: source };
}

async function collectLocalHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectLocalHtmlFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && LOCAL_HTML_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

async function resolveLocalSources({ dir, local }) {
  const sources = [];

  if (dir) {
    const info = await stat(dir);
    if (!info.isDirectory()) {
      throw new Error(`--dir must point to a directory: ${dir}`);
    }
    sources.push(...(await collectLocalHtmlFiles(dir)));
  }

  if (local) sources.push(local);

  return [...new Set(sources)];
}

function titleFromHtml(html) {
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (h1) return stripTags(h1).replace(/\s*-\s*Gatoskilo$/i, "");
  const meta = html.match(/<meta\b[^>]*(?:property|name)=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1];
  if (meta) return cleanText(meta).replace(/\s*-\s*Gatoskilo$/i, "");
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  return cleanText(title).replace(/\s*-\s*Gatoskilo$/i, "");
}

function canonicalUrlFromHtml(html, fallback) {
  return (
    html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] ??
    html.match(/<meta\b[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] ??
    fallback ??
    ""
  );
}

function brandFromHtml(html, title) {
  const brand =
    html.match(/<meta\b[^>]*itemprop=["']brand["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] ??
    html.match(/itemprop=["']manufacturer["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] ??
    "";
  if (brand) return cleanText(brand);
  const known = ["Happy Dog", "Acana", "Orijen", "Royal Canin", "Josera", "Hill's", "Farmina", "Monge", "Brit"];
  return known.find((candidate) => title.toLowerCase().includes(candidate.toLowerCase())) ?? "";
}

function speciesFromText(url, title, bodyText) {
  const urlText = String(url ?? "").toLowerCase();
  if (urlText.includes("ksira-trofi-gatas")) return "cat";
  if (urlText.includes("ksira-trofi-skyloy")) return "dog";
  const text = `${title} ${bodyText}`.toLowerCase();
  if (text.includes("γάτα") || text.includes("για γάτες")) return "cat";
  if (text.includes("σκύλ") || text.includes("σκυλ")) return "dog";
  return "";
}

function lifeStageFromText(text) {
  const lower = text.toLowerCase();
  if (/(puppy|κουτάβ|junior|kitten|γατάκι)/iu.test(lower)) return lower.includes("kitten") || lower.includes("γατάκι") ? "kitten" : "puppy";
  if (/(senior|8\+|ηλικιωμ|ώριμ)/iu.test(lower)) return "senior";
  if (/(adult|ενήλικ|ενηλικ)/iu.test(lower)) return "adult";
  return "";
}

function dogSizeFromText(text) {
  const lower = text.toLowerCase();
  if (/(mini|small|μικρόσωμ|μικροσωμ)/iu.test(lower)) return "small";
  if (/(medium|μεσαίο|μεσαι)/iu.test(lower)) return "medium";
  if (/(maxi|large|giant|μεγαλόσωμ|μεγαλοσωμ)/iu.test(lower)) return "large";
  if (/(ανεξαρτήτως φυλής|all breeds|all sizes)/iu.test(lower)) return "all";
  return "";
}

function formulaNameFromTitle(title, brand) {
  return cleanText(title)
    .replace(new RegExp(`^${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i"), "")
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|gr|g)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9α-ω]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function numberValue(value) {
  const normalized = String(value ?? "").replace(",", ".").match(/\d+(?:\.\d+)?/u)?.[0];
  return normalized ? Number(normalized) : null;
}

function percentAfter(text, labels) {
  for (const label of labels) {
    const match = text.match(new RegExp(`${label}\\s*:?\\s*(\\d+(?:[,.]\\d+)?)\\s*%`, "iu"));
    const value = numberValue(match?.[1]);
    if (value !== null) return value;
  }
  return null;
}

function mgKgAfter(text, labels) {
  for (const label of labels) {
    const match = text.match(new RegExp(`${label}[\\s\\S]{0,80}?(\\d+(?:[,.]\\d+)?)\\s*mg`, "iu"));
    const value = numberValue(match?.[1]);
    if (value !== null) return value;
  }
  return null;
}

function sectionBetween(html, startPattern, endPattern) {
  const start = html.search(startPattern);
  if (start < 0) return "";
  const rest = html.slice(start);
  const end = rest.search(endPattern);
  return end >= 0 ? rest.slice(0, end) : rest;
}

function compositionHtml(html) {
  const tab = sectionBetween(html, /<section[^>]+tab--_1/i, /<section[^>]+tab--_2/i);
  const match = tab.match(/<p[^>]*>([\s\S]*?)<\/p>\s*<h6[^>]*>\s*Αναλυτικά/i);
  if (match?.[1]) return match[1];
  const paragraphs = [...tab.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((item) => stripTags(item[1]));
  return paragraphs.find((item) => item.includes("%") && item.split(",").length >= 5) ?? "";
}

function splitIngredients(text) {
  const cleaned = cleanText(text)
    .replace(/\.\*\)\s*αποξηραμένο\.?/iu, "")
    .replace(/\*\)\s*αποξηραμένο\.?/iu, "")
    .replace(/\.$/u, "");
  const tokens = [];
  let current = "";
  let depth = 0;
  for (const char of cleaned) {
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);
    if (char === "," && depth === 0) {
      if (current.trim()) tokens.push(cleanText(current));
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) tokens.push(cleanText(current));
  return [...new Set(tokens)];
}

function tagsFromRow({ title, composition, species, format, lifeStage, dogSize }) {
  const text = `${title} ${composition}`.toLowerCase();
  const tags = new Set([species, format, lifeStage, dogSize].filter(Boolean));
  const mappings = [
    ["sterilised", /(sterilised|στειρωμ)/iu],
    ["duck", /(duck|πάπια|παπια)/iu],
    ["rice", /(rice|ρύζι|ρυζι)/iu],
    ["chicken", /(chicken|κοτόπουλ|κοτοπουλ|πουλερικ)/iu],
    ["lamb", /(lamb|αρν)/iu],
    ["salmon", /(salmon|σολομ)/iu],
    ["fish", /(fish|ψάρι|ψαρι)/iu],
    ["wheat", /(wheat|σιτάρ|σιταρ)/iu],
    ["corn", /(corn|maize|καλαμπόκ|καλαμποκ)/iu],
    ["barley", /(barley|κριθάρι|κριθαρι)/iu],
    ["grain_free", /(grain free|χωρίς σιτηρά|χωρις σιτηρα)/iu],
  ];
  for (const [tag, pattern] of mappings) {
    if (pattern.test(text)) tags.add(tag);
  }
  return [...tags].filter(Boolean).join(";");
}

function feedingGuideFromHtml(html) {
  const tab = sectionBetween(html, /<section[^>]+tab--_2/i, /<style|<section[^>]+tab--_3/i);
  if (!tab) return "";
  const intro = [...tab.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => stripTags(match[1]))
    .filter((line) => line && !/^\d+\s*gr$/iu.test(line))
    .slice(0, 2);
  const rows = [...tab.matchAll(/<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi)]
    .map((match) => [stripTags(match[1]), stripTags(match[2])])
    .filter(([weight, amount]) => /\d/.test(weight) && /\d/.test(amount))
    .map(([weight, amount]) => `${weight}: ${amount}`);
  return [...intro, rows.length ? `Δοσολογία: ${rows.join("; ")}` : ""].filter(Boolean).join(" ");
}

function additivesFromText(text) {
  const match = text.match(/Βιταμίνες\s*\/\s*κιλό:[\s\S]*?(?=Μην ξεχνάτε!|Οδηγίες|Δοσολογία|$)/iu);
  return cleanText(match?.[0] ?? "");
}

function estimateKcal(row) {
  if (row.kcal_per_100g || row.kcal_per_kg) return { notes: [] };
  const protein = numberValue(row.protein_percent);
  const fat = numberValue(row.fat_percent);
  const fiber = numberValue(row.fiber_percent);
  const ash = numberValue(row.ash_percent) ?? 7;
  const moisture = numberValue(row.moisture_percent) ?? 10;
  if (protein === null || fat === null || fiber === null || row.format !== "dry") return { notes: [] };
  const carbohydrate = Math.round((100 - protein - fat - fiber - ash - moisture) * 10) / 10;
  if (carbohydrate < 0 || carbohydrate > 100) return { notes: ["kcal_estimate_failed=true"] };
  const kcal100 = Math.round(((protein * 3.5) + (fat * 8.5) + (carbohydrate * 3.5)) * 10) / 10;
  row.kcal_per_100g = String(kcal100);
  row.kcal_per_kg = String(Math.round(kcal100 * 10));
  return {
    notes: [
      "kcal_estimated=true",
      "kcal_estimation_method=modified_atwater",
      `estimated_carbohydrate_percent=${carbohydrate}`,
      "default_moisture_percent=10",
    ],
  };
}

function productLinksFromCategoryHtml(html, categoryUrl) {
  return [
    ...new Set(
      [...html.matchAll(/href=["']([^"'#]+\.html)["']/gi)]
        .map((match) => {
          try {
            return new URL(decodeHtml(match[1]), categoryUrl).toString();
          } catch {
            return "";
          }
        })
        .filter((url) => {
          const parsed = new URL(url);
          return (
            parsed.hostname.includes("gatoskilo.gr") &&
            /\/\d+-[^/]+\.html$/u.test(parsed.pathname) &&
            !parsed.pathname.includes("/content/")
          );
        }),
    ),
  ].sort();
}

function productRowFromHtml(html, sourceUrl, sourcePath, headers) {
  const title = titleFromHtml(html);
  const canonicalUrl = canonicalUrlFromHtml(html, sourceUrl);
  const pageProductText = stripTags(
    sectionBetween(html, /<h1\b/i, /<section[^>]+tab--_2|<section[^>]+tab--_1|<style/i) || html,
  );
  const nutritionHtml = sectionBetween(html, /<section[^>]+tab--_1/i, /<section[^>]+tab--_2/i);
  const feedingHtml = sectionBetween(html, /<section[^>]+tab--_2/i, /<style|<section[^>]+tab--_3/i);
  const productHtml = [
    pageProductText,
    nutritionHtml,
    feedingHtml,
  ].join("\n");
  const bodyText = stripTags(productHtml || html);
  const brand = brandFromHtml(html, title);
  const formulaName = formulaNameFromTitle(title, brand);
  const species = speciesFromText(canonicalUrl, title, bodyText);
  const format = /ξηρά|ksira|dry/iu.test(`${canonicalUrl} ${title} ${bodyText}`) ? "dry" : "";
  const lifeStage = lifeStageFromText(`${title} ${bodyText}`);
  const dogSize = dogSizeFromText(`${title} ${bodyText}`);
  const ingredientText = stripTags(compositionHtml(html));
  const ingredients = splitIngredients(ingredientText);
  const additivesText = additivesFromText(stripTags(nutritionHtml));
  const row = Object.fromEntries(headers.map((header) => [header, ""]));
  row.brand = brand;
  row.formula_name = formulaName;
  row.display_name = title;
  row.species = species;
  row.format = format;
  row.life_stage = lifeStage;
  row.dog_size = dogSize;
  row.commercial_tags = tagsFromRow({ title, composition: ingredientText, species, format, lifeStage, dogSize });
  row.medical_tags = /sterilised|στειρωμ/iu.test(`${title} ${bodyText}`) ? "sterilised" : "";
  row.ingredient_text = ingredientText;
  row.ingredients = JSON.stringify(ingredients);
  row.additives_text = additivesText;
  row.feeding_guide_text = feedingGuideFromHtml(html);
  row.protein_percent = percentAfter(bodyText, ["Ακατέργαστη\\s+Πρωτεΐνη", "Πρωτεΐνη", "Protein"]) ?? "";
  row.fat_percent = percentAfter(bodyText, ["Ακατέργαστα\\s+Λιπαρά", "Λίπος", "Fat"]) ?? "";
  row.fiber_percent = percentAfter(bodyText, ["Ακατέργαστες\\s+Φυτικές\\s+Ίνες", "Φυτικές\\s+Ίνες", "Fiber"]) ?? "";
  row.ash_percent = percentAfter(bodyText, ["Ακατέργαστη\\s+Τέφρα", "Τέφρα", "Ash"]) ?? "";
  row.calcium_percent = percentAfter(bodyText, ["Ασβέστιο", "Calcium"]) ?? "";
  row.phosphorus_percent = percentAfter(bodyText, ["Φώσφορος", "Phosphorus"]) ?? "";
  row.sodium_percent = percentAfter(bodyText, ["Νάτριο", "Sodium"]) ?? "";
  row.magnesium_percent = percentAfter(bodyText, ["Μαγνήσιο", "Magnesium"]) ?? "";
  row.potassium_percent = percentAfter(bodyText, ["Κάλιο", "Potassium"]) ?? "";
  row.omega3_percent = percentAfter(bodyText, ["Ωμέγα-3\\s+Λιπαρά\\s+Οξέα", "Omega-3"]) ?? "";
  row.omega6_percent = percentAfter(bodyText, ["Ωμέγα-6\\s+Λιπαρά\\s+Οξέα", "Omega-6"]) ?? "";
  row.vitamin_a_iukg = numberValue(bodyText.match(/Βιταμίνη\s+A\b[\s\S]{0,80}?(\d+(?:[,.]\d+)?)\s*I\.?U/iu)?.[1]) ?? "";
  row.vitamin_d3_iukg = numberValue(bodyText.match(/βιταμίνη\s+D3\b[\s\S]{0,80}?(\d+(?:[,.]\d+)?)\s*I\.?U/iu)?.[1]) ?? "";
  row.iron_mgkg = mgKgAfter(bodyText, ["Σίδηρος", "Iron"]) ?? "";
  row.copper_mgkg = mgKgAfter(bodyText, ["χαλκός", "Copper"]) ?? "";
  row.zinc_mgkg = mgKgAfter(bodyText, ["ψευδάργυρος", "Zinc"]) ?? "";
  row.manganese_mgkg = mgKgAfter(bodyText, ["μαγγάνιο", "Manganese"]) ?? "";
  row.iodine_mgkg = mgKgAfter(bodyText, ["ιώδιο", "Iodine"]) ?? "";
  row.selenium_mgkg = mgKgAfter(bodyText, ["σελήνιο", "Selenium"]) ?? "";
  row.ean = html.match(/"ean13"\s*:\s*"([^"]+)"/i)?.[1] ?? "";
  row.data_quality_status = "needs_review";
  row.data_source_url = canonicalUrl;
  row.source_priority = "retailer";
  row.formula_key = slugify(`${brand}-${formulaName}-${species}-${format}-gr-retailer`);
  row.is_recommendable = "false";
  const estimate = estimateKcal(row);
  row.source_notes = [
    "market=GR",
    "basis=as-fed",
    "source_tier=retailer",
    "source_group=gatoskilo",
    "retailer_sources_accepted_for_needs_review=true",
    "human_qa_required_before_recommendation=true",
    sourcePath ? `source_file=${sourcePath}` : "",
    ...estimate.notes,
  ]
    .filter(Boolean)
    .join("; ");
  return row;
}

function missingFields(row) {
  return [
    "brand",
    "formula_name",
    "species",
    "format",
    "ingredient_text",
    "protein_percent",
    "fat_percent",
    "fiber_percent",
    "kcal_per_100g",
    "data_source_url",
  ].filter((field) => !String(row[field] ?? "").trim());
}

function extractedFields(row) {
  return Object.entries(row)
    .filter(([, value]) => String(value ?? "").trim())
    .map(([key]) => key)
    .filter((key) => !["source_notes", "ingredients"].includes(key))
    .join("|");
}

function rowCompleteness(row) {
  return extractedFields(row).split("|").filter(Boolean).length;
}

function dedupeProductRows(rows) {
  const byKey = new Map();
  const duplicateCounts = new Map();

  for (const row of rows) {
    const key = row.formula_key;
    const existing = byKey.get(key);
    if (!existing || rowCompleteness(row) > rowCompleteness(existing)) {
      byKey.set(key, row);
    }
    duplicateCounts.set(key, (duplicateCounts.get(key) ?? 0) + (existing ? 1 : 0));
  }

  return {
    rows: [...byKey.values()].map((row) => ({
      ...row,
      source_notes: [
        row.source_notes,
        (duplicateCounts.get(row.formula_key) ?? 0) > 0
          ? `duplicate_local_or_pack_rows_skipped=${duplicateCounts.get(row.formula_key)}`
          : "",
      ]
        .filter(Boolean)
        .join("; "),
    })),
    duplicateCount: rows.length - byKey.size,
  };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const valueAfter = (flag, fallback = "") => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] ?? fallback : fallback;
  };
  return {
    dir: valueAfter("--dir", ""),
    local: valueAfter("--local", ""),
    category: valueAfter("--category", ""),
    url: valueAfter("--url", ""),
    limit: Number(valueAfter("--limit", "20")),
  };
}

async function collectProductUrls(categoryUrl, limit) {
  const { html } = await readSource(categoryUrl);
  const links = productLinksFromCategoryHtml(html, categoryUrl).slice(0, limit);
  return links.map((product_url) => ({
    source_group: "gatoskilo retailer",
    listing_url: categoryUrl,
    product_url,
    product_title: "",
    brand_guess: "",
    species: categoryUrl.includes("gatas") ? "cat" : "dog",
    format: "dry",
    source_tier: "retailer",
    source_type: "retailer_product_page",
    market: "GR",
    status: "queued",
    notes: `category_crawl_limit=${limit}`,
  }));
}

async function main() {
  const args = parseArgs();
  const headers = await foodV2Headers();
  const categoryUrl = args.category || "";
  const registryRows = categoryUrl ? await collectProductUrls(categoryUrl, args.limit) : [];
  const localSources = await resolveLocalSources(args);
  const sources = [
    ...localSources,
    !args.dir && !args.local && !args.url && !categoryUrl ? defaultLocalProductPath : "",
    args.url,
    ...registryRows.map((row) => row.product_url),
  ].filter(Boolean);

  const rawRows = [];
  const failedReviewRows = [];
  for (const source of sources) {
    try {
      const { html, sourceUrl, sourcePath } = await readSource(source);
      const row = productRowFromHtml(html, sourceUrl || source, sourcePath, headers);
      if (!row.brand && !row.formula_name) continue;
      rawRows.push(row);
    } catch (error) {
      failedReviewRows.push({
        formula_key: "",
        brand: "",
        formula_name: "",
        species: "",
        status: "fetch_or_parse_failed",
        source_url: source,
        extracted_fields: "",
        missing_fields: "",
        notes: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const { rows, duplicateCount } = dedupeProductRows(rawRows);
  const reviewRows = [
    ...rows.map((row) => {
      const missing = missingFields(row);
      return {
        formula_key: row.formula_key,
        brand: row.brand,
        formula_name: row.formula_name,
        species: row.species,
        status: missing.length ? "needs_backfill" : "importable_after_qa",
        source_url: row.data_source_url,
        extracted_fields: extractedFields(row),
        missing_fields: missing.join("|"),
        notes: row.source_notes,
      };
    }),
    ...failedReviewRows,
  ];

  await mkdir(path.dirname(paths.importCsv), { recursive: true });
  await mkdir(path.dirname(paths.reviewCsv), { recursive: true });
  await mkdir(path.dirname(paths.registryCsv), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.importCsv, writeCsv(headers, rows), "utf8");
  await writeFile(paths.reviewCsv, writeCsv(reviewHeaders, reviewRows), "utf8");
  await writeFile(paths.registryCsv, writeCsv(registryHeaders, registryRows), "utf8");
  await writeFile(
    paths.report,
    [
      "# Gatoskilo Product Extract",
      "",
      `- Product rows extracted: ${rows.length}`,
      `- Raw local/category pages parsed: ${rawRows.length}`,
      `- Duplicate local/pack rows skipped: ${duplicateCount}`,
      `- Registry links queued: ${registryRows.length}`,
      `- Local HTML/MHTML files scanned: ${localSources.length}`,
      `- Importable after QA: ${reviewRows.filter((row) => row.status === "importable_after_qa").length}`,
      `- Needs backfill/errors: ${reviewRows.filter((row) => row.status !== "importable_after_qa").length}`,
      "",
      "Outputs:",
      `- ${paths.importCsv}`,
      `- ${paths.reviewCsv}`,
      `- ${paths.registryCsv}`,
      "",
      "Retailer rows are marked `needs_review` and `is_recommendable=false` by default. Kcal may be estimated from proximate analysis for dry foods and is recorded in `source_notes`.",
      "",
      "Usage:",
      "- Single saved page: `npm run collect:gatoskilo-products -- --local \"C:/path/product.html\"`",
      "- Folder of saved pages: `npm run collect:gatoskilo-products -- --dir \"C:/Users/NIOstb/Desktop/photo_foods_nutritail/gatoskilo\"`",
      "- Live category crawl: `npm run collect:gatoskilo-products -- --category \"https://www.gatoskilo.gr/981-ksira-trofi-skyloy\" --limit 100`",
    ].join("\n"),
    "utf8",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
