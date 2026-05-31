import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const categoryUrls = [
  "https://www.zooplus.com/shop/dogs/dry_dog_food",
  "https://josera.com/en/dog-products",
  "https://www.petsamolis.gr/skylos/trofes-skylon/xira-trofi-skylou",
];

const maxPerSource = Number(process.env.CATEGORY_EXTRACT_LIMIT_PER_SOURCE ?? 80);

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  importCsv: "data/imports/category_product_sources_extract_v2.csv",
  reviewCsv: "data/review/category_product_sources_extract_review.csv",
  registryCsv: "data/sources/category_product_sources_registry.csv",
  report: "reports/category_product_sources_extract.md",
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
    .replace(/&micro;|µ/g, "μ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanText(value) {
  return decodeHtml(value)
    .normalize("NFKC")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:%])/g, "$1")
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

function numberValue(value) {
  const normalized = String(value ?? "").replace(",", ".").match(/\d+(?:\.\d+)?/u)?.[0];
  return normalized ? Number(normalized) : null;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function estimateKcalPer100g({ protein, fat, fiber, ash, moisture = 10 }) {
  if ([protein, fat, fiber, ash].some((value) => typeof value !== "number")) return null;
  const carbohydrate = Math.max(0, 100 - protein - fat - fiber - ash - moisture);
  return {
    carbohydrate: round1(carbohydrate),
    kcalPer100g: round1(protein * 3.5 + fat * 8.5 + carbohydrate * 3.5),
  };
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

function splitIngredients(text) {
  const source = cleanText(text)
    .replace(/^(ingredients|composition|σύσταση|σύνθεση|συστατικά)\s*:\s*/iu, "")
    .replace(/\.$/u, "");
  const tokens = [];
  let current = "";
  let depth = 0;
  for (const char of source) {
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);
    if ((char === "," || char === ";") && depth === 0) {
      if (current.trim()) tokens.push(cleanText(current));
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) tokens.push(cleanText(current));
  return [...new Set(tokens)].slice(0, 80);
}

function baseFoodRow(headers) {
  return Object.fromEntries(headers.map((header) => [header, ""]));
}

async function fetchText(url, accept = "text/html,application/xhtml+xml") {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 NutriTail/1.0",
      accept,
      "accept-language": "en,el-GR;q=0.9,el;q=0.8",
      "cache-control": "no-cache",
    },
  });
  if (!response.ok) throw new Error(`Fetch failed ${response.status} ${url}`);
  return response.text();
}

function nextData(html) {
  const raw = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
  return raw ? JSON.parse(raw) : null;
}

function canonicalProductUrl(url) {
  const parsed = new URL(url);
  parsed.search = "";
  return parsed.href.replace(/\/$/u, "");
}

function linksFromHtml(html, baseUrl) {
  const origin = new URL(baseUrl).origin;
  return [...new Set([...html.matchAll(/href=["']([^"'#]+)["']/gi)].map((match) => new URL(match[1], origin).href))];
}

async function discoverZooplus() {
  const discovered = new Map();
  for (const url of [categoryUrls[0], `${categoryUrls[0]}?p=2`]) {
    const html = await fetchText(url);
    for (const link of linksFromHtml(html, url)) {
      const parsed = new URL(link);
      if (/\/shop\/dogs\/dry_dog_food\//u.test(parsed.pathname) && /\/\d+$/u.test(parsed.pathname)) {
        discovered.set(canonicalProductUrl(link), { productUrl: link, listingUrl: url });
      }
    }
  }
  return [...discovered.values()].slice(0, maxPerSource);
}

async function discoverPetsamolis() {
  const discovered = new Map();
  for (const url of [categoryUrls[2], `${categoryUrls[2]}?page=2`]) {
    const html = await fetchText(url);
    for (const link of linksFromHtml(html, url)) {
      const parsed = new URL(link);
      const isProduct =
        /\/skylos\/trofes-skylon\/xira-trofi-skylou\/.+/u.test(parsed.pathname) &&
        !["super-premium-skylon", "premium-skylon", "oikonomikes", "kliniki-trofi-skylon"].some((segment) =>
          parsed.pathname.endsWith(`/${segment}`),
        );
      if (isProduct) discovered.set(canonicalProductUrl(link), { productUrl: link, listingUrl: url });
    }
  }
  return [...discovered.values()].slice(0, maxPerSource);
}

async function discoverJosera() {
  const sitemap = await fetchText("https://josera.com/sitemap.xml", "application/xml,text/xml,text/html");
  const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  const discovered = new Map();
  for (const sitemapUrl of sitemapUrls.filter((url) => url.includes("cms-login.josera.com"))) {
    const xml = await fetchText(sitemapUrl, "application/xml,text/xml,text/html");
    for (const productUrl of [...xml.matchAll(/<loc>(https:\/\/josera\.com\/en\/product\/[^<]+)<\/loc>/g)].map(
      (match) => match[1],
    )) {
      discovered.set(canonicalProductUrl(productUrl), { productUrl, listingUrl: categoryUrls[1] });
    }
  }
  return [...discovered.values()];
}

function percentText(value) {
  const parsed = numberValue(value);
  return parsed === null ? "" : String(parsed);
}

function percentField(text, labels) {
  for (const label of labels) {
    const match = text.match(new RegExp(`${label}\\s*:?\\s*(\\d+(?:[,.]\\d+)?)\\s*%`, "iu"));
    const value = numberValue(match?.[1]);
    if (value !== null) return value;
  }
  return null;
}

function mgField(text, labels) {
  for (const label of labels) {
    const match = text.match(new RegExp(`${label}[\\s\\S]{0,80}?(\\d+(?:[,.]\\d+)?)\\s*mg`, "iu"));
    const value = numberValue(match?.[1]);
    if (value !== null) return value;
  }
  return null;
}

function sectionAfterText(text, label, nextLabels) {
  const start = text.search(new RegExp(label, "iu"));
  if (start < 0) return "";
  const rest = text.slice(start);
  const ends = nextLabels
    .map((next) => {
      const found = rest.slice(label.length).search(new RegExp(next, "iu"));
      return found < 0 ? -1 : found + label.length;
    })
    .filter((index) => index > 0);
  const end = ends.length ? Math.min(...ends) : rest.length;
  return cleanText(rest.slice(0, end));
}

function brandFromTitle(title) {
  const brands = [
    "Royal Canin",
    "Hill's",
    "Briantos",
    "Wolf of Wilderness",
    "Akvatera",
    "Nature's Protection",
    "Ambrosia",
    "ACANA",
    "Josera",
    "JosiDog",
    "Amity",
    "Anima",
    "Brit",
    "Belcando",
    "Monge",
    "Farmina",
    "Purina",
  ];
  const match = brands.find((brand) => title.toLowerCase().includes(brand.toLowerCase()));
  return match ?? cleanText(title).split(/\s+/u)[0] ?? "";
}

function lifeStageFromText(text) {
  const lower = text.toLowerCase();
  if (/(puppy|junior|κουτάβ)/iu.test(lower)) return "puppy";
  if (/(senior|8\+|ηλικιωμ|στείρ|sterili[sz]ed|light)/iu.test(lower)) return "senior";
  if (/(adult|ενήλικ)/iu.test(lower)) return "adult";
  return "";
}

function dogSizeFromText(text) {
  const lower = text.toLowerCase();
  if (/(mini|small|μικρόσωμ)/iu.test(lower)) return "small";
  if (/(medium|μεσαί)/iu.test(lower)) return "medium";
  if (/(maxi|large|giant|μεγαλόσωμ|μεγαλόσωμων)/iu.test(lower)) return "large";
  if (/(all breeds|all sizes|όλων των φυλών|όλες τις φυλές)/iu.test(lower)) return "all";
  return "";
}

function tagsFromText(text) {
  const source = cleanText(text).toLowerCase();
  const mappings = [
    ["adult", /(adult|ενήλικ)/u],
    ["puppy", /(puppy|junior|κουτάβ)/u],
    ["senior", /(senior|ηλικιωμ)/u],
    ["sterilised", /(sterili[sz]ed|στείρ)/u],
    ["weight_control", /(light|weight|diabetic|παχύσαρκ)/u],
    ["urinary", /(urinary|ουρολογ)/u],
    ["renal", /(renal|kidney|νεφρ)/u],
    ["gi_support", /(gastro|digest|sensitive stomach|πεπτικ|εντερικ)/u],
    ["allergy", /(hypoallergenic|allerg|υποαλλεργ)/u],
    ["grain_free", /(grain-free|grain free|χωρίς σιτηρά)/u],
    ["gluten_free", /(gluten-free|gluten free)/u],
    ["small_breed", /(small|mini|μικρόσωμ)/u],
    ["large_breed", /(large|giant|μεγαλόσωμ)/u],
    ["duck", /(duck|πάπια)/u],
    ["lamb", /(lamb|αρν)/u],
    ["chicken", /(chicken|κοτόπουλο)/u],
    ["salmon", /(salmon|σολομό)/u],
    ["fish", /(fish|ψάρι|τόνο|σαρδέλα)/u],
    ["rice", /(rice|ρύζι)/u],
    ["potato", /(potato|πατάτα)/u],
    ["pea", /(pea|μπιζέλι)/u],
    ["corn", /(maize|corn|καλαμπόκι)/u],
  ];
  return [...new Set(mappings.filter(([, pattern]) => pattern.test(source)).map(([tag]) => tag))];
}

function sourcePriorityFor(url) {
  if (url.includes("josera.com")) return "official";
  return "retailer";
}

function marketFor(url) {
  if (url.includes("petsamolis.gr")) return "GR";
  return "EU";
}

function localeFor(url) {
  if (url.includes("petsamolis.gr")) return "el";
  return "en";
}

function formulaKey(row, market, sourcePriority) {
  return `${slugify(row.brand)}-${slugify(row.formula_name)}-${row.species}-${row.format}-${market.toLowerCase()}-${sourcePriority}`;
}

function finishRow(row, url, notes = []) {
  const ingredients = splitIngredients(row.ingredient_text);
  const tags = tagsFromText(`${row.formula_name} ${row.display_name} ${row.ingredient_text}`);
  const sourcePriority = sourcePriorityFor(url);
  const market = marketFor(url);
  row.ingredients = JSON.stringify(ingredients);
  row.commercial_tags = tags.join("|");
  row.medical_tags = tags
    .filter((tag) => ["weight_control", "urinary", "renal", "gi_support", "allergy"].includes(tag))
    .join("|");
  row.primary_animal_proteins = tags.filter((tag) => ["duck", "lamb", "chicken", "salmon", "fish"].includes(tag)).join("|");
  row.carbohydrate_sources = tags.filter((tag) => ["rice", "potato", "pea", "corn"].includes(tag)).join("|");
  row.data_quality_status = "needs_review";
  row.data_source_url = url;
  row.source_priority = sourcePriority;
  row.source_notes = [
    `market=${market}`,
    `locale=${localeFor(url)}`,
    "basis=as-fed",
    `source_tier=${sourcePriority}`,
    "source_kind=category_product_page",
    "category_batch=true",
    "human_qa_required_before_recommendation=true",
    ...notes,
  ].join("; ");
  row.formula_key = formulaKey(row, market, sourcePriority);
  row.is_recommendable = "false";
  return row;
}

function parseZooplus(html, url, headers) {
  const product = nextData(html)?.props?.pageProps?.pageLevelProps?.productDetails?.product;
  if (!product) throw new Error("Zooplus product JSON missing");
  const constituents = Object.fromEntries(
    (product.articleVariants?.[0]?.articleConstituents ?? []).map((item) => [
      cleanText(item.ingredientName).toLowerCase(),
      item.amount,
    ]),
  );
  const feedingText = stripTags(product.feedingRecommendationText ?? "");
  const ingredientsText = stripTags(product.ingredientsText ?? "");
  const ingredientPart = cleanText(ingredientsText.replace(/^Ingredients:\s*/iu, "").split(/Additives per kg:/iu)[0] ?? "");
  const additivesText = cleanText(ingredientsText.match(/Additives per kg:\s*([\s\S]+)/iu)?.[1] ?? "");
  const kcalPerKg = numberValue(feedingText.match(/Calories per kg[^:]*:\s*(\d+(?:[,.]\d+)?)/iu)?.[1]);
  const estimate = kcalPerKg
    ? null
    : estimateKcalPer100g({
        protein: numberValue(constituents.protein),
        fat: numberValue(constituents.fat),
        fiber: numberValue(constituents.fibre ?? constituents.fiber),
        ash: numberValue(constituents.ash),
        moisture: numberValue(constituents.moisture) ?? 10,
      });
  const title = cleanText(product.title).replace(/\s*-\s*dog dry food$/iu, "");
  const brand = cleanText(product.brands?.[0] ?? brandFromTitle(title)).replace(/^./u, (char) => char.toUpperCase());
  const formula = title.replace(new RegExp(`^${brand}\\s*`, "iu"), "");
  const row = {
    ...baseFoodRow(headers),
    brand,
    formula_name: formula || title,
    display_name: title,
    species: "dog",
    format: "dry",
    life_stage: lifeStageFromText(`${title} ${product.summary}`) || "adult",
    dog_size: dogSizeFromText(`${title} ${product.summary}`),
    ingredient_text: ingredientPart,
    additives_text: additivesText,
    feeding_guide_text: feedingText,
    kcal_per_kg: kcalPerKg ? String(kcalPerKg) : estimate ? String(Math.round(estimate.kcalPer100g * 10)) : "",
    kcal_per_100g: kcalPerKg ? String(round1(kcalPerKg / 10)) : estimate ? String(estimate.kcalPer100g) : "",
    protein_percent: percentText(constituents.protein),
    fat_percent: percentText(constituents.fat),
    fiber_percent: percentText(constituents.fibre ?? constituents.fiber),
    ash_percent: percentText(constituents.ash),
    moisture_percent: percentText(constituents.moisture),
    calcium_percent: percentText(constituents.calcium),
    phosphorus_percent: percentText(constituents.phosphorus),
  };
  return finishRow(row, url, [
    "retailer_source_accepted_for_gap_fill=true",
    estimate ? "kcal_estimated=true" : "kcal_estimated=false",
    estimate ? "kcal_estimation_method=modified_atwater" : "",
    estimate ? `estimated_carbohydrate_percent=${estimate.carbohydrate}` : "",
  ].filter(Boolean));
}

function parseJosera(html, url, headers) {
  const resource = nextData(html)?.props?.pageProps?.resource;
  if (!resource?.field_composition) throw new Error("Josera product resource missing composition");
  const title = cleanText(resource.title ?? "");
  const kcalPerKg = numberValue(resource.field_metabolisable_energy_perkg);
  const productText = `${title} ${resource.field_headline ?? ""} ${resource.field_short_description ?? ""}`;
  const isDog =
    JSON.stringify(resource.field_category ?? "").includes("Hund") ||
    /dog|dogs|hund/i.test(productText) ||
    url.includes("dog");
  const isDry = !/wet|pate|filet|soup/i.test(url);
  if (!isDog || !isDry) throw new Error("Josera row is not a dry dog product");
  const row = {
    ...baseFoodRow(headers),
    brand: title.toLowerCase().startsWith("josidog") ? "JosiDog" : "Josera",
    formula_name: title.replace(/^JosiDog\s*/iu, "").replace(/^Josera\s*/iu, ""),
    display_name: title.toLowerCase().startsWith("josi") ? title : `Josera ${title}`,
    species: "dog",
    format: "dry",
    life_stage: lifeStageFromText(productText) || "adult",
    dog_size: dogSizeFromText(`${productText} ${(resource.field_animal_size ?? []).join(" ")}`),
    ingredient_text: cleanText(resource.field_composition ?? ""),
    additives_text: stripTags(resource.field_short_description ?? ""),
    feeding_guide_text: stripTags(`${resource.field_feeding_recommendations ?? ""} ${resource.field_feeding_recommendations_ds ?? ""}`),
    kcal_per_kg: kcalPerKg ? String(kcalPerKg) : "",
    kcal_per_100g: kcalPerKg ? String(round1(kcalPerKg / 10)) : "",
    protein_percent: percentText(resource.field_protein),
    fat_percent: percentText(resource.field_fat_content),
    fiber_percent: percentText(resource.field_crude_fibre),
    ash_percent: percentText(resource.field_crude_ash),
    calcium_percent: percentText(resource.field_calcium),
    phosphorus_percent: percentText(resource.field_phosphorus),
    sodium_percent: percentText(resource.field_sodium),
    magnesium_percent: percentText(resource.field_magnesium),
    potassium_percent: percentText(resource.field_potassium),
  };
  return finishRow(row, url, ["official_structured_product_resource=true"]);
}

function parsePetsamolis(html, url, headers) {
  const text = stripTags(html);
  const rawTitle = cleanText(
    html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ??
      html.match(/<meta\b[^>]*(?:property|name)=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ??
      html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ??
      "",
  ).replace(/\s*(\||-)\s*Petsamolis.*$/iu, "");
  const brand = brandFromTitle(rawTitle);
  const ingredientSection =
    sectionAfterText(text, "Σύσταση", ["Πρόσθετα", "Αναλυτικά", "Οδηγίες", "Περιγραφή"]) ||
    sectionAfterText(text, "Συστατικά", ["Πρόσθετα", "Αναλυτικά", "Οδηγίες", "Περιγραφή"]);
  const additives = sectionAfterText(text, "Πρόσθετα", ["Αναλυτικά", "Οδηγίες", "Σύσταση", "Συστατικά"]);
  const protein = percentField(text, ["πρωτεΐνη", "πρωτείνη", "protein"]);
  const fat = percentField(text, ["λιπαρά", "λιπαρές", "λίπος", "fat"]);
  const fiber = percentField(text, ["ίνες", "φυτικές ίνες", "fiber"]);
  const ash = percentField(text, ["τέφρα", "ash"]);
  const moisture = percentField(text, ["υγρασία", "moisture"]);
  const explicitKcal = numberValue(text.match(/(?:kcal|θερμίδες|ενέργεια)[^\d]{0,30}(\d+(?:[,.]\d+)?)/iu)?.[1]);
  const estimate = explicitKcal ? null : estimateKcalPer100g({ protein, fat, fiber, ash, moisture: moisture ?? 10 });
  const row = {
    ...baseFoodRow(headers),
    brand,
    formula_name: rawTitle.replace(new RegExp(`^${brand}\\s*`, "iu"), "").replace(/\b\d+(?:[,.]\d+)?\s*(?:kg|gr|g)\b/giu, "").trim(),
    display_name: rawTitle,
    species: "dog",
    format: "dry",
    life_stage: lifeStageFromText(rawTitle) || "adult",
    dog_size: dogSizeFromText(rawTitle),
    ingredient_text: ingredientSection.replace(/^(Σύσταση|Συστατικά)\s*:?\s*/iu, ""),
    additives_text: additives.replace(/^Πρόσθετα\s*:?\s*/iu, ""),
    feeding_guide_text: sectionAfterText(text, "Οδηγίες", ["Σύσταση", "Πρόσθετα", "Αναλυτικά", "Περιγραφή"]),
    kcal_per_100g: explicitKcal ? String(explicitKcal > 1000 ? round1(explicitKcal / 10) : explicitKcal) : estimate ? String(estimate.kcalPer100g) : "",
    kcal_per_kg: explicitKcal ? String(explicitKcal > 1000 ? explicitKcal : Math.round(explicitKcal * 10)) : estimate ? String(Math.round(estimate.kcalPer100g * 10)) : "",
    protein_percent: percentText(protein),
    fat_percent: percentText(fat),
    fiber_percent: percentText(fiber),
    ash_percent: percentText(ash),
    moisture_percent: percentText(moisture),
    calcium_percent: percentText(percentField(text, ["ασβέστιο", "calcium"])),
    phosphorus_percent: percentText(percentField(text, ["φώσφορος", "phosphorus"])),
    sodium_percent: percentText(percentField(text, ["νάτριο", "sodium"])),
    magnesium_percent: percentText(percentField(text, ["μαγνήσιο", "magnesium"])),
    potassium_percent: percentText(percentField(text, ["κάλιο", "potassium"])),
    omega3_percent: percentText(percentField(text, ["omega-3", "omega 3", "ωμέγα-3", "ωμεγα-3"])),
    omega6_percent: percentText(percentField(text, ["omega-6", "omega 6", "ωμέγα-6", "ωμεγα-6"])),
    l_carnitine_mgkg: percentText(mgField(additives, ["L-carnitine", "καρνιτίνη"])),
  };
  return finishRow(row, url, [
    "retailer_source_accepted_for_gap_fill=true",
    estimate ? "kcal_estimated=true" : "kcal_estimated=false",
    estimate ? "kcal_estimation_method=modified_atwater" : "",
    estimate ? `estimated_carbohydrate_percent=${estimate.carbohydrate}` : "",
    estimate && moisture === null ? "default_moisture_percent=10" : "",
  ].filter(Boolean));
}

function parseProduct(html, url, headers) {
  if (url.includes("zooplus.com")) return parseZooplus(html, url, headers);
  if (url.includes("josera.com")) return parseJosera(html, url, headers);
  if (url.includes("petsamolis.gr")) return parsePetsamolis(html, url, headers);
  throw new Error(`Unsupported URL: ${url}`);
}

function extractedFields(row) {
  return [
    "ingredient_text",
    "kcal_per_100g",
    "kcal_per_kg",
    "protein_percent",
    "fat_percent",
    "fiber_percent",
    "ash_percent",
    "moisture_percent",
    "calcium_percent",
    "phosphorus_percent",
    "sodium_percent",
    "magnesium_percent",
    "potassium_percent",
    "omega3_percent",
    "omega6_percent",
  ].filter((field) => String(row[field] ?? "").trim());
}

function missingFields(row) {
  const missing = ["brand", "formula_name", "ingredient_text", "protein_percent", "fat_percent", "fiber_percent"].filter(
    (field) => !String(row[field] ?? "").trim(),
  );
  if (!String(row.kcal_per_100g ?? "").trim() && !String(row.kcal_per_kg ?? "").trim()) {
    missing.push("kcal_per_100g_or_kcal_per_kg");
  }
  return missing;
}

function rowStatus(row) {
  return missingFields(row).length === 0 ? "candidate" : "hold";
}

async function discoverAll() {
  const [zooplus, josera, petsamolis] = await Promise.all([discoverZooplus(), discoverJosera(), discoverPetsamolis()]);
  return [
    ...zooplus.map((item) => ({ ...item, sourceGroup: "zooplus_dog_dry_category" })),
    ...josera.map((item) => ({ ...item, sourceGroup: "josera_dog_products_sitemap" })),
    ...petsamolis.map((item) => ({ ...item, sourceGroup: "petsamolis_dog_dry_category" })),
  ];
}

function renderReport(rows, failures, discoveredCount) {
  const candidateRows = rows.filter((row) => rowStatus(row) === "candidate");
  const bySource = rows.reduce((acc, row) => {
    const source = new URL(row.data_source_url).hostname;
    acc[source] = (acc[source] ?? 0) + 1;
    return acc;
  }, {});
  return `# Category Product Sources Extract

Generated: ${new Date().toISOString()}

## Summary

- Product URLs discovered: ${discoveredCount}
- Rows extracted: ${rows.length}
- Candidate rows: ${candidateRows.length}
- Hold rows: ${rows.length - candidateRows.length}
- Failed product pages: ${failures.length}
- Per-source limit: ${maxPerSource} for retailer categories; Josera scans all English product sitemap URLs and filters dry dog products
- Output CSV: ${paths.importCsv}
- Review CSV: ${paths.reviewCsv}
- Registry CSV: ${paths.registryCsv}

## Rows By Source

${Object.entries(bySource)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([source, count]) => `- ${source}: ${count}`)
  .join("\n")}

## Failed Pages

${failures.length ? failures.map((failure) => `- ${failure.productUrl}: ${failure.error}`).join("\n") : "- None"}

## Notes

- These rows are review-first and keep \`is_recommendable=false\`.
- Retailer data is accepted as gap-fill evidence, but still needs admin QA before commit/recommendation visibility.
- Some retailer category pages are very large; rerun with \`CATEGORY_EXTRACT_LIMIT_PER_SOURCE=120\` when you want a heavier batch.
`;
}

async function main() {
  const headers = await foodV2Headers();
  const discovered = await discoverAll();
  const rows = [];
  const registryRows = [];
  const failures = [];

  for (const item of discovered) {
    try {
      const html = await fetchText(item.productUrl);
      const row = parseProduct(html, item.productUrl, headers);
      rows.push(row);
      registryRows.push({
        source_group: item.sourceGroup,
        listing_url: item.listingUrl,
        product_url: item.productUrl,
        product_title: row.display_name,
        brand_guess: row.brand,
        species: row.species,
        format: row.format,
        source_tier: row.source_priority,
        source_type: "category_product_page",
        market: marketFor(item.productUrl),
        status: rowStatus(row),
        notes: row.source_notes,
      });
    } catch (error) {
      failures.push({ ...item, error: error.message });
      registryRows.push({
        source_group: item.sourceGroup,
        listing_url: item.listingUrl,
        product_url: item.productUrl,
        product_title: "",
        brand_guess: "",
        species: "dog",
        format: "dry",
        source_tier: sourcePriorityFor(item.productUrl),
        source_type: "category_product_page",
        market: marketFor(item.productUrl),
        status: "failed",
        notes: error.message,
      });
    }
  }

  const dedupedRows = [...new Map(rows.map((row) => [row.formula_key, row])).values()];
  const orderedRows = dedupedRows.map((row) => Object.fromEntries(headers.map((header) => [header, row[header] ?? ""])));
  const reviewRows = dedupedRows.map((row) => ({
    formula_key: row.formula_key,
    brand: row.brand,
    formula_name: row.formula_name,
    species: row.species,
    status: rowStatus(row),
    source_url: row.data_source_url,
    extracted_fields: extractedFields(row).join("|"),
    missing_fields: missingFields(row).join("|"),
    notes: row.source_notes,
  }));

  for (const file of [paths.importCsv, paths.reviewCsv, paths.registryCsv, paths.report]) {
    await mkdir(path.dirname(file), { recursive: true });
  }
  await writeFile(paths.importCsv, writeCsv(headers, orderedRows), "utf8");
  await writeFile(paths.reviewCsv, writeCsv(reviewHeaders, reviewRows), "utf8");
  await writeFile(paths.registryCsv, writeCsv(registryHeaders, registryRows), "utf8");
  await writeFile(paths.report, renderReport(dedupedRows, failures, discovered.length), "utf8");

  console.log(`Discovered product URLs: ${discovered.length}`);
  console.log(`Extracted rows: ${dedupedRows.length}`);
  console.log(`Failures: ${failures.length}`);
  console.log(`Wrote ${paths.importCsv}`);
  console.log(`Wrote ${paths.reviewCsv}`);
  console.log(`Wrote ${paths.registryCsv}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
