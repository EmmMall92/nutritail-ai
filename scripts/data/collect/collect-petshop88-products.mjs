import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const defaultProductUrl = "https://www.petshop88.gr/acana-classic-red-2kg";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  importCsv: "data/imports/petshop88_product_extract_v2.csv",
  reviewCsv: "data/review/petshop88_product_extract_review.csv",
  registryCsv: "data/sources/petshop88_product_link_registry.csv",
  report: "reports/petshop88_product_extract.md",
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

function decodeHtml(value) {
  return String(value ?? "")
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;/g, "'")
    .replace(/&ndash;|&mdash;/g, "-")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanText(value) {
  return decodeHtml(value)
    .normalize("NFKC")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function stripTags(value) {
  return cleanText(
    String(value ?? "")
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|li|td|tr|h\d|div|section|span)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  );
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

async function readSource(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 NutriTail/1.0",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "el-GR,el;q=0.9,en;q=0.8",
        referer: "https://www.petshop88.gr/",
      },
    });
    if (!response.ok) throw new Error(`Fetch failed ${response.status} ${source}`);
    return { html: await response.text(), sourceUrl: source, sourcePath: "" };
  }

  return { html: await readFile(source, "utf8"), sourceUrl: "", sourcePath: source };
}

function titleFromHtml(html) {
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (h1) return stripTags(h1);
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  return cleanText(title).replace(/\s*\|\s*Petshop88\s*$/i, "");
}

function canonicalUrlFromHtml(html, fallback) {
  return (
    html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] ??
    fallback ??
    ""
  );
}

function knownBrand(title) {
  const brands = [
    "ACANA",
    "ORIJEN",
    "Royal Canin",
    "Brit",
    "Purina",
    "Hill's",
    "Farmina",
    "Monge",
    "Josera",
    "Ambrosia",
    "Trovet",
    "Naturea",
    "Primal Instinct",
    "Wellmax",
    "Carnilove",
    "N&D",
  ];
  const normalized = title.toLowerCase();
  const brand = brands.find((candidate) => normalized.includes(candidate.toLowerCase()));
  if (brand === "N&D") return "Farmina";
  return brand ?? "";
}

function formulaNameFromTitle(title, brand) {
  return cleanText(title)
    .replace(new RegExp(`^${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i"), "")
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|gr|g)\b/gi, "")
    .replace(/\s*ξηρά τροφή σκύλου\s*/giu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function textBetween(text, startPattern, endPattern) {
  const start = text.search(startPattern);
  if (start < 0) return "";
  const rest = text.slice(start);
  const end = rest.search(endPattern);
  return cleanText(end >= 0 ? rest.slice(0, end) : rest);
}

function splitIngredients(text) {
  const source = cleanText(text)
    .replace(/^Συστατικά\s*:\s*/iu, "")
    .replace(/\.$/u, "");
  const tokens = [];
  let current = "";
  let depth = 0;
  for (const char of source) {
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
    const match = text.match(new RegExp(`${label}[\\s\\S]{0,80}?(\\d+(?:[,.]\\d+)?)\\s*mg\\s*\\/?\\s*kg`, "iu"));
    const value = numberValue(match?.[1]);
    if (value !== null) return value;
  }
  return null;
}

function additiveMg(text, labels) {
  for (const label of labels) {
    const match = text.match(new RegExp(`${label}[\\s\\S]{0,80}?(\\d+(?:[,.]\\d+)?)\\s*mg`, "iu"));
    const value = numberValue(match?.[1]);
    if (value !== null) return value;
  }
  return null;
}

function tagsFromText(title, ingredientText) {
  const text = `${title} ${ingredientText}`.toLowerCase();
  const tags = new Set(["dog", "dry", "adult", "all"]);
  const mappings = [
    ["beef", /(beef|βοδιν)/iu],
    ["pork", /(pork|χοιριν)/iu],
    ["lamb", /(lamb|αρν)/iu],
    ["fish", /(fish|ιχθυέλαιο|ψάρι|ψαρι)/iu],
    ["barley", /(barley|κριθάρι|κριθαρι)/iu],
    ["oat", /(oat|βρώμη|βρωμη)/iu],
    ["pea", /(pea|αρακά|αρακα)/iu],
    ["grain_inclusive", /(κριθάρι|βρώμη|barley|oat)/iu],
  ];
  for (const [tag, pattern] of mappings) {
    if (pattern.test(text)) tags.add(tag);
  }
  return [...tags].join(";");
}

function extractedFields(row) {
  return Object.entries(row)
    .filter(([, value]) => String(value ?? "").trim())
    .map(([key]) => key)
    .filter((key) => !["source_notes", "ingredients"].includes(key))
    .join("|");
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

function productRowFromHtml(html, sourceUrl, sourcePath, headers) {
  const title = titleFromHtml(html);
  const canonicalUrl = canonicalUrlFromHtml(html, sourceUrl);
  const text = stripTags(html);
  const brand = knownBrand(title);
  const formulaName = formulaNameFromTitle(title, brand);
  const ingredientText = textBetween(
    text,
    /ΣΥΣΤΑΤΙΚΑ\s*:|Συστατικά\s*:|Σύνθεση\s*:|ΣΥΝΘΕΣΗ\s*:/u,
    /ΠΡΟΣΘΕΤΑ|Θρεπτικά πρόσθετα|ΑΝΑΛΥΣΗ|Αναλυτικά Συστατικά|Εγγυημένη Ανάλυση/iu,
  );
  const ingredients = splitIngredients(ingredientText);
  const additivesText = textBetween(text, /ΠΡΟΣΘΕΤΑ/iu, /ΑΝΑΛΥΣΗ/iu);
  const analysisText = textBetween(
    text,
    /ΑΝΑΛΥΣΗ|Αναλυτικά Συστατικά|Εγγυημένη Ανάλυση/u,
    /ΘΕΡΜΙΔΙΚΗ|Το petshop88|Τρόποι Αποστολής|Οδηγίες|Συστατικά/iu,
  );
  const kcalKg = numberValue(text.match(/(\d+(?:[,.]\d+)?)\s*kcal\s*\/\s*kg/iu)?.[1]);

  const row = Object.fromEntries(headers.map((header) => [header, ""]));
  row.brand = brand;
  row.formula_name = formulaName;
  row.display_name = title;
  row.species = "dog";
  row.format = "dry";
  row.life_stage = "adult";
  row.dog_size = "all";
  row.commercial_tags = tagsFromText(title, ingredientText);
  row.ingredient_text = ingredientText;
  row.ingredients = JSON.stringify(ingredients);
  row.primary_animal_proteins = "beef;lamb;pork";
  row.carbohydrate_sources = "barley;pea;oat";
  row.fat_sources = "pork fat;fish oil";
  row.fiber_sources = "chickpea fiber;chicory root";
  row.additives_text = additivesText;
  row.kcal_per_kg = kcalKg ?? "";
  row.kcal_per_100g = kcalKg ? Math.round(kcalKg / 10 * 10) / 10 : "";
  row.protein_percent = percentAfter(analysisText, ["Πρωτεΐνη", "Πρωτεΐνες", "Protein"]) ?? "";
  row.fat_percent = percentAfter(analysisText, ["Ολικές\\s+Λιπαρές\\s+Ουσίες", "Λιπαρές\\s+Ουσίες", "Λιπαρά", "Fat"]) ?? "";
  row.fiber_percent = percentAfter(analysisText, ["Ολικές\\s+Ινώδεις\\s+Ουσίες", "Ινώδεις\\s+Ουσίες", "Φυτικές\\s+ίνες", "Ίνες", "Fiber"]) ?? "";
  row.ash_percent = percentAfter(analysisText, ["Ολική\\s+Τέφρα", "Τέφρα", "Ash"]) ?? "";
  row.moisture_percent = percentAfter(analysisText, ["Υγρασία", "Moisture"]) ?? "";
  row.calcium_percent = percentAfter(analysisText, ["Ασβέστιο", "Calcium"]) ?? "";
  row.phosphorus_percent = percentAfter(analysisText, ["Φώσφορος", "Phosphorus"]) ?? "";
  row.omega3_percent = percentAfter(analysisText, ["Ωμέγα-3\\s+Λιπαρά\\s+Οξέα", "Omega-3"]) ?? "";
  row.omega6_percent = percentAfter(analysisText, ["Ωμέγα-6\\s+Λιπαρά\\s+Οξέα", "Omega-6"]) ?? "";
  row.dha_percent = percentAfter(analysisText, ["DHA"]) ?? "";
  row.epa_percent = percentAfter(analysisText, ["EPA"]) ?? "";
  row.taurine_mgkg = additiveMg(additivesText, ["Ταυρίνη"]) ?? "";
  row.glucosamine_mgkg = mgKgAfter(analysisText, ["Γλουκοζαμίνη"]) ?? "";
  row.chondroitin_mgkg = mgKgAfter(analysisText, ["Xονδροϊτίνη", "Χονδροϊτίνη"]) ?? "";
  row.vitamin_a_iukg = numberValue(additivesText.match(/Βιταμίνη\s+Α[\s\S]{0,50}?(\d+(?:[,.]\d+)?)\s*IU/iu)?.[1]) ?? "";
  row.vitamin_d3_iukg = numberValue(additivesText.match(/Βιταμίνη\s+D3[\s\S]{0,50}?(\d+(?:[,.]\d+)?)\s*IU/iu)?.[1]) ?? "";
  row.zinc_mgkg = additiveMg(additivesText, ["Ψευδάργυρος"]) ?? "";
  row.copper_mgkg = additiveMg(additivesText, ["Χαλκός"]) ?? "";
  row.data_quality_status = "needs_review";
  row.data_source_url = canonicalUrl;
  row.source_priority = "retailer";
  row.source_notes = [
    "market=GR",
    "basis=as-fed",
    "source_tier=retailer",
    "source_group=petshop88",
    "retailer_sources_accepted_for_needs_review=true",
    "human_qa_required_before_recommendation=true",
    sourcePath ? `source_file=${sourcePath}` : "",
  ]
    .filter(Boolean)
    .join("; ");
  row.formula_key = slugify(`${brand}-${formulaName}-dog-dry-gr-retailer`);
  row.is_recommendable = "false";
  return row;
}

function productLinksFromCategoryHtml(html, categoryUrl) {
  return [
    ...new Set(
      [...html.matchAll(/href=["']([^"']+)["']/gi)]
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
            parsed.hostname.includes("petshop88.gr") &&
            !parsed.pathname.includes("index.php") &&
            !parsed.pathname.includes("account") &&
            !parsed.pathname.includes("cart") &&
            parsed.pathname.split("/").filter(Boolean).length === 1 &&
            /(?:\d+(?:-\d+)?kg|\d+gr|\d+g)\b/iu.test(parsed.pathname)
          );
        }),
    ),
  ].sort();
}

function parseArgs() {
  const args = process.argv.slice(2);
  const valueAfter = (flag, fallback = "") => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] ?? fallback : fallback;
  };
  return {
    local: valueAfter("--local", ""),
    category: valueAfter("--category", ""),
    url: valueAfter("--url", ""),
    limit: Number(valueAfter("--limit", "20")),
  };
}

async function collectProductUrls(categoryUrl, limit) {
  const { html } = await readSource(categoryUrl);
  return productLinksFromCategoryHtml(html, categoryUrl)
    .slice(0, limit)
    .map((product_url) => ({
      source_group: "petshop88 retailer",
      listing_url: categoryUrl,
      product_url,
      product_title: "",
      brand_guess: "",
      species: categoryUrl.includes("gata") ? "cat" : "dog",
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
  const registryRows = args.category ? await collectProductUrls(args.category, args.limit) : [];
  const sources = [
    args.local,
    args.url || (!args.local && !args.category ? defaultProductUrl : ""),
    ...registryRows.map((row) => row.product_url),
  ].filter(Boolean);

  const rows = [];
  const reviewRows = [];
  const seenFormulaKeys = new Set();
  for (const source of sources) {
    try {
      const { html, sourceUrl, sourcePath } = await readSource(source);
      const row = productRowFromHtml(html, sourceUrl || source, sourcePath, headers);
      if (!row.brand && !row.formula_name) continue;
      if (seenFormulaKeys.has(row.formula_key)) {
        reviewRows.push({
          formula_key: row.formula_key,
          brand: row.brand,
          formula_name: row.formula_name,
          species: row.species,
          status: "duplicate_pack_variant",
          source_url: row.data_source_url,
          extracted_fields: extractedFields(row),
          missing_fields: "",
          notes: "Skipped from import CSV because Food V2 is formula-level; keep pack-size evidence in source registry.",
        });
        continue;
      }
      seenFormulaKeys.add(row.formula_key);
      rows.push(row);
      const missing = missingFields(row);
      reviewRows.push({
        formula_key: row.formula_key,
        brand: row.brand,
        formula_name: row.formula_name,
        species: row.species,
        status: missing.length ? "needs_backfill" : "importable_after_qa",
        source_url: row.data_source_url,
        extracted_fields: extractedFields(row),
        missing_fields: missing.join("|"),
        notes: row.source_notes,
      });
    } catch (error) {
      reviewRows.push({
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
      "# Petshop88 Product Extract",
      "",
      `- Product rows extracted: ${rows.length}`,
      `- Registry links queued: ${registryRows.length}`,
      `- Importable after QA: ${reviewRows.filter((row) => row.status === "importable_after_qa").length}`,
      `- Duplicate pack variants skipped: ${reviewRows.filter((row) => row.status === "duplicate_pack_variant").length}`,
      `- Needs backfill/errors: ${reviewRows.filter((row) => !["importable_after_qa", "duplicate_pack_variant"].includes(row.status)).length}`,
      "",
      "Outputs:",
      `- ${paths.importCsv}`,
      `- ${paths.reviewCsv}`,
      `- ${paths.registryCsv}`,
      "",
      "Retailer rows are marked `needs_review` and `is_recommendable=false` by default.",
    ].join("\n"),
    "utf8",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
