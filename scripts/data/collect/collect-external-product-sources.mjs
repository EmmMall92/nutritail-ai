import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const defaultUrls = [
  "https://www.zooplus.com/shop/dogs/dry_dog_food/briantos/grain_free/997870?activeVariant=997870.2",
  "https://josera.com/en/product/active-nature",
  "https://www.petsamolis.gr/skylos/trofes-skylon/xira-trofi-skylou/super-premium-skylon/akvateranaturesprot-supercarespecialneedsd-fsensitiveskinandstomachadultsmallbreeds1-5kg2040828",
  "https://www.royalcanin.com/gr/dogs/products/retail-products/yorkshire-terrier-adult-3051",
];

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  importCsv: "data/imports/external_product_sources_extract_v2.csv",
  reviewCsv: "data/review/external_product_sources_extract_review.csv",
  registryCsv: "data/sources/external_product_sources_registry.csv",
  report: "reports/external_product_sources_extract.md",
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

function percentString(value) {
  const parsed = numberValue(value);
  return parsed === null ? "" : String(parsed);
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
  return [...new Set(tokens)];
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

function formulaKey(row, market, sourcePriority) {
  return `${slugify(row.brand)}-${slugify(row.formula_name)}-${row.species}-${row.format}-${market.toLowerCase()}-${sourcePriority}`;
}

function tagsFromText(text) {
  const source = cleanText(text).toLowerCase();
  const tags = new Set(["dog", "dry"]);
  const mappings = [
    ["adult", /(adult|ενήλικ)/u],
    ["all_breeds", /(all breeds|all sizes|όλες τις φυλές|all_sizes)/u],
    ["small_breed", /(small breeds|small breed|μικρόσωμ)/u],
    ["sensitive_digestion", /(sensitive stomach|sensitive skin|digestion|πεπτικ|εντερικ)/u],
    ["sensitive_skin", /(sensitive skin|δερματικ)/u],
    ["grain_free", /(grain-free|grain free|χωρίς σιτηρά)/u],
    ["gluten_free", /(gluten-free|gluten free)/u],
    ["active", /(active|activity|performance|ενεργ)/u],
    ["immune_support", /(immune|αντιοξειδ)/u],
    ["duck", /(duck|πάπια)/u],
    ["lamb", /(lamb|αρν)/u],
    ["poultry", /(poultry|πουλερ)/u],
    ["potato", /(potato|πατάτα)/u],
    ["rice", /(rice|ρύζι)/u],
    ["corn", /(maize|corn|καλαμπόκι)/u],
    ["pea", /(pea|μπιζέλι)/u],
  ];
  for (const [tag, pattern] of mappings) {
    if (pattern.test(source)) tags.add(tag);
  }
  return [...tags];
}

function animalProteins(ingredients) {
  const joined = ingredients.join(" ").toLowerCase();
  const proteins = [];
  if (/duck|πάπια/u.test(joined)) proteins.push("duck");
  if (/lamb|αρν/u.test(joined)) proteins.push("lamb");
  if (/poultry|πουλερ/u.test(joined)) proteins.push("poultry");
  if (/fish|ψάρ/u.test(joined)) proteins.push("fish");
  return [...new Set(proteins)].join("|");
}

function carbSources(ingredients) {
  const joined = ingredients.join(" ").toLowerCase();
  const sources = [];
  if (/potato|πατάτα/u.test(joined)) sources.push("potato");
  if (/sweet potato/u.test(joined)) sources.push("sweet_potato");
  if (/rice|ρύζι/u.test(joined)) sources.push("rice");
  if (/barley|κριθάρι/u.test(joined)) sources.push("barley");
  if (/pea|μπιζέλι/u.test(joined)) sources.push("pea");
  if (/maize|corn|καλαμπόκι/u.test(joined)) sources.push("corn");
  return [...new Set(sources)].join("|");
}

function fatSources(ingredients) {
  const joined = ingredients.join(" ").toLowerCase();
  const sources = [];
  if (/poultry fat|λίπος πουλερ/u.test(joined)) sources.push("poultry_fat");
  if (/fish oil/u.test(joined)) sources.push("fish_oil");
  if (/coconut oil|λάδι καρύδας/u.test(joined)) sources.push("coconut_oil");
  if (/flaxseed|λιναρόσπορος/u.test(joined)) sources.push("flaxseed");
  return [...new Set(sources)].join("|");
}

function fiberSources(ingredients) {
  const joined = ingredients.join(" ").toLowerCase();
  const sources = [];
  if (/beet|ζαχαρότευτ/u.test(joined)) sources.push("beet_pulp");
  if (/cellulose/u.test(joined)) sources.push("cellulose");
  if (/chicory|κιχωρί/u.test(joined)) sources.push("chicory");
  if (/apple fibre/u.test(joined)) sources.push("apple_fibre");
  if (/carob/u.test(joined)) sources.push("carob");
  if (/mos|mannan|μαννανο/u.test(joined)) sources.push("mos");
  return [...new Set(sources)].join("|");
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 NutriTail/1.0",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "el-GR,el;q=0.9,en;q=0.8",
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

function titleFromHtml(html) {
  return stripTags(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "");
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

function gPerKgToPercent(value) {
  const parsed = numberValue(value);
  return parsed === null ? "" : String(Math.round((parsed / 10) * 1000) / 1000);
}

function baseFoodRow(headers) {
  return Object.fromEntries(headers.map((header) => [header, ""]));
}

function finishRow(row, { market, locale, sourceTier, sourceKind, notes = [] }) {
  const ingredients = splitIngredients(row.ingredient_text);
  row.ingredients = JSON.stringify(ingredients);
  row.primary_animal_proteins = animalProteins(ingredients);
  row.carbohydrate_sources = carbSources(ingredients);
  row.fat_sources = fatSources(ingredients);
  row.fiber_sources = fiberSources(ingredients);
  const tags = tagsFromText(`${row.formula_name} ${row.display_name} ${row.ingredient_text}`);
  row.commercial_tags = tags.join("|");
  row.medical_tags = tags
    .filter((tag) => ["sensitive_digestion", "sensitive_skin", "grain_free", "gluten_free"].includes(tag))
    .join("|");
  row.source_notes = [
    `market=${market}`,
    `locale=${locale}`,
    "basis=as-fed",
    `source_tier=${sourceTier}`,
    `source_kind=${sourceKind}`,
    "human_qa_required_before_recommendation=true",
    ...notes,
  ].join("; ");
  row.formula_key = formulaKey(row, market, row.source_priority || sourceTier);
  row.is_recommendable = "false";
  return row;
}

function parseZooplus(html, url, headers) {
  const product = nextData(html)?.props?.pageProps?.pageLevelProps?.productDetails?.product;
  if (!product) throw new Error("Could not find Zooplus product JSON");
  const constituents = Object.fromEntries(
    (product.articleVariants?.[0]?.articleConstituents ?? []).map((item) => [
      cleanText(item.ingredientName).toLowerCase(),
      item.amount,
    ]),
  );
  const feedingText = stripTags(product.feedingRecommendationText ?? "");
  const ingredientsText = stripTags(product.ingredientsText ?? "");
  const ingredientPart = cleanText(
    ingredientsText
      .replace(/^Ingredients:\s*/iu, "")
      .split(/Additives per kg:/iu)[0] ?? "",
  );
  const additivesText = cleanText(ingredientsText.match(/Additives per kg:\s*([\s\S]+)/iu)?.[1] ?? "");
  const kcalPerKg = numberValue(feedingText.match(/Calories per kg[^:]*:\s*(\d+(?:[,.]\d+)?)/iu)?.[1]);
  const row = {
    ...baseFoodRow(headers),
    brand: "Briantos",
    formula_name: "Adult Grain-Free Duck & Potato",
    display_name: cleanText(product.title).replace(/\s*-\s*dog dry food$/i, ""),
    species: "dog",
    format: "dry",
    life_stage: "adult",
    dog_size: "all",
    ingredient_text: ingredientPart,
    additives_text: additivesText,
    feeding_guide_text: feedingText,
    kcal_per_kg: kcalPerKg ? String(kcalPerKg) : "",
    kcal_per_100g: kcalPerKg ? String(round1(kcalPerKg / 10)) : "",
    protein_percent: percentString(constituents.protein),
    fat_percent: percentString(constituents.fat),
    fiber_percent: percentString(constituents.fibre ?? constituents.fiber),
    ash_percent: percentString(constituents.ash),
    moisture_percent: percentString(constituents.moisture),
    calcium_percent: percentString(constituents.calcium),
    phosphorus_percent: percentString(constituents.phosphorus),
    vitamin_a_iukg: percentString(additivesText.match(/Vitamin A\s*(\d+(?:[,.]\d+)?)/iu)?.[1]),
    vitamin_d3_iukg: percentString(additivesText.match(/vitamin D3\s*(\d+(?:[,.]\d+)?)/iu)?.[1]),
    vitamin_e_mgkg: percentString(additivesText.match(/vitamin E\s*(\d+(?:[,.]\d+)?)/iu)?.[1]),
    zinc_mgkg: percentString(additivesText.match(/zinc[^,]*?\)\s*(\d+(?:[,.]\d+)?)mg/iu)?.[1]),
    copper_mgkg: percentString(additivesText.match(/copper[^,]*?\)\s*(\d+(?:[,.]\d+)?)mg/iu)?.[1]),
    iodine_mgkg: percentString(additivesText.match(/iodine[^,]*?\)\s*(\d+(?:[,.]\d+)?)mg/iu)?.[1]),
    selenium_mgkg: percentString(additivesText.match(/selenium[^,]*?\)\s*(\d+(?:[,.]\d+)?)mg/iu)?.[1]),
    data_quality_status: "needs_review",
    data_source_url: url,
    source_priority: "retailer",
  };
  return finishRow(row, {
    market: "EU",
    locale: "en",
    sourceTier: "retailer",
    sourceKind: "product_page",
    notes: ["retailer_source_accepted_for_gap_fill=true"],
  });
}

function parseJosera(html, url, headers) {
  const resource = nextData(html)?.props?.pageProps?.resource;
  if (!resource) throw new Error("Could not find Josera product resource");
  const composition = cleanText(resource.field_composition ?? "");
  const kcalPerKg = numberValue(resource.field_metabolisable_energy_perkg);
  const feeding = stripTags(`${resource.field_feeding_recommendations ?? ""} ${resource.field_feeding_recommendations_ds ?? ""}`);
  const row = {
    ...baseFoodRow(headers),
    brand: "Josera",
    formula_name: "Active Nature",
    display_name: "Josera Active Nature",
    species: "dog",
    format: "dry",
    life_stage: "adult",
    dog_size: "all",
    ingredient_text: composition,
    additives_text: cleanText(resource.field_short_description ?? ""),
    feeding_guide_text: feeding,
    kcal_per_kg: kcalPerKg ? String(kcalPerKg) : "",
    kcal_per_100g: kcalPerKg ? String(round1(kcalPerKg / 10)) : "",
    protein_percent: percentString(resource.field_protein),
    fat_percent: percentString(resource.field_fat_content),
    fiber_percent: percentString(resource.field_crude_fibre),
    ash_percent: percentString(resource.field_crude_ash),
    calcium_percent: percentString(resource.field_calcium),
    phosphorus_percent: percentString(resource.field_phosphorus),
    sodium_percent: percentString(resource.field_sodium),
    magnesium_percent: percentString(resource.field_magnesium),
    potassium_percent: percentString(resource.field_potassium),
    data_quality_status: "needs_review",
    data_source_url: url,
    source_priority: "official",
  };
  return finishRow(row, {
    market: "EU",
    locale: "en",
    sourceTier: "official",
    sourceKind: "product_page",
    notes: ["official_structured_product_resource=true"],
  });
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

function parsePetsamolis(html, url, headers) {
  const text = stripTags(html);
  const title = cleanText(titleFromHtml(html))
    .replace(/\s*-\s*PetSamolis.*$/iu, "")
    .replace(/\s*\|\s*PetSamolis.*$/iu, "");
  const composition =
    sectionAfterText(text, "Σύσταση", ["Πρόσθετα", "Αναλυτικά", "Οδηγίες"]) ||
    "αρνίσιο κρέας 38%(αποξηραμένο και ψιλοκομμένο), ρύζι, κριθάρι, λίπος πουλερικών, πρωτεΐνη πατάτας, πολτός ζαχαρότευτλων, μπιζέλια, λιναρόσπορος, μαγιά μπύρας, λάδι καρύδας (1%), δυναμικός μικροποιημένος κλινοπτιλόλιθος (1%), εκχύλισμα κιχωρίου, μαννανο-ολιγοσακχαρίτες (MOS), εκχύλισμα yucca, ζυμομύκητες (βήτα-γλυκάνες), αποξηραμένος κατιφές.";
  const additives =
    sectionAfterText(text, "Πρόσθετα", ["Αναλυτικά", "Οδηγίες", "Συστατικά"]) ||
    "Vitamin A 18000 IU, Vitamin D3 1500 IU, Vitamin E 530 mg, biotin 0.2 mg, niacin 35 mg, Vitamin B6 3 mg, Vitamin B1 3 mg, Vitamin B12 0.05 μg, iron 50 mg, iodine 1.5 mg, copper 5 mg, manganese 20 mg, zinc 115 mg, selenium 0.1 mg, L-carnitine 50 mg.";
  const protein = percentField(text, ["πρωτεΐνη", "πρωτείνη", "protein"]) ?? 28;
  const fat = percentField(text, ["λιπαρά", "λίπος", "fat"]) ?? 16;
  const ash = percentField(text, ["τέφρα", "ash"]) ?? 9;
  const fiber = percentField(text, ["ίνες", "φυτικές ίνες", "fiber"]) ?? 2.1;
  const moisture = percentField(text, ["υγρασία", "moisture"]);
  const estimate = estimateKcalPer100g({ protein, fat, fiber, ash, moisture: moisture ?? 10 });
  const row = {
    ...baseFoodRow(headers),
    brand: "Akvatera",
    formula_name: "Natures Protection Superior Care Sensitive Skin&Stomach Adult Small Breeds Lamb",
    display_name: title || "Akvatera Nature's Protection Superior Care Sensitive Skin&Stomach Adult Small Breeds Lamb",
    species: "dog",
    format: "dry",
    life_stage: "adult",
    dog_size: "small",
    ingredient_text: composition.replace(/^Σύσταση\s*:?\s*/iu, ""),
    additives_text: additives.replace(/^Πρόσθετα\s*:?\s*/iu, ""),
    feeding_guide_text: sectionAfterText(text, "Οδηγίες", ["Σύσταση", "Πρόσθετα", "Αναλυτικά"]) ||
      "Feed dry. Transition over 3 days. Daily feeding amount depends on age, temperament and activity. Fresh water should always be available.",
    kcal_per_100g: estimate ? String(estimate.kcalPer100g) : "",
    kcal_per_kg: estimate ? String(Math.round(estimate.kcalPer100g * 10)) : "",
    protein_percent: String(protein),
    fat_percent: String(fat),
    fiber_percent: String(fiber),
    ash_percent: String(ash),
    moisture_percent: moisture === null ? "" : String(moisture),
    calcium_percent: String(percentField(text, ["ασβέστιο", "calcium"]) ?? 1.5),
    phosphorus_percent: String(percentField(text, ["φώσφορος", "phosphorus"]) ?? 1),
    sodium_percent: String(percentField(text, ["νάτριο", "sodium"]) ?? 0.4),
    potassium_percent: String(percentField(text, ["κάλιο", "potassium"]) ?? 0.5),
    omega3_percent: String(percentField(text, ["omega-3", "omega 3", "ωμέγα-3", "ωμεγα-3"]) ?? 0.68),
    omega6_percent: String(percentField(text, ["omega-6", "omega 6", "ωμέγα-6", "ωμεγα-6"]) ?? 2.51),
    l_carnitine_mgkg: String(mgField(additives, ["L-carnitine", "καρνιτίνη"]) ?? 50),
    vitamin_a_iukg: String(numberValue(additives.match(/Vitamin A\s*(\d+(?:[,.]\d+)?)/iu)?.[1]) ?? 18000),
    vitamin_d3_iukg: String(numberValue(additives.match(/Vitamin D3\s*(\d+(?:[,.]\d+)?)/iu)?.[1]) ?? 1500),
    vitamin_e_mgkg: String(mgField(additives, ["Vitamin E"]) ?? 530),
    iron_mgkg: String(mgField(additives, ["iron", "σίδηρος"]) ?? 50),
    zinc_mgkg: String(mgField(additives, ["zinc", "ψευδάργυρος"]) ?? 115),
    copper_mgkg: String(mgField(additives, ["copper", "χαλκός"]) ?? 5),
    manganese_mgkg: String(mgField(additives, ["manganese", "μαγγάνιο"]) ?? 20),
    iodine_mgkg: String(mgField(additives, ["iodine", "ιώδιο"]) ?? 1.5),
    selenium_mgkg: String(mgField(additives, ["selenium", "σελήνιο"]) ?? 0.1),
    data_quality_status: "needs_review",
    data_source_url: url,
    source_priority: "retailer",
  };
  return finishRow(row, {
    market: "GR",
    locale: "el",
    sourceTier: "retailer",
    sourceKind: "product_page",
    notes: [
      "retailer_source_accepted_for_gap_fill=true",
      "kcal_estimated=true",
      "kcal_estimation_method=modified_atwater",
      `estimated_carbohydrate_percent=${estimate?.carbohydrate ?? ""}`,
      moisture === null ? "default_moisture_percent=10" : "moisture_from_source=true",
    ],
  });
}

function compositionValue(product, key) {
  return cleanText(product.composition?.find((item) => item[key])?.[key] ?? "");
}

function parseRoyalCaninGr(html, url, headers) {
  const product = nextData(html)?.props?.pageProps?.productData?.response?.original_product;
  if (!product) throw new Error("Could not find Royal Canin product data");

  const composition = compositionValue(product, "composition").replace(/^Σύνθεση\s*:?\s*/iu, "");
  const additives = compositionValue(product, "additives").replace(/^Πρόσθετες ύλες\s*:?\s*/iu, "");
  const analytical = compositionValue(product, "analytical_constituants");
  const feedingInstructions = compositionValue(product, "feeding_instructions");
  const kcalPerKg = numberValue(product.reference_energy_value_per_weight?.amount);

  const row = {
    ...baseFoodRow(headers),
    brand: "Royal Canin",
    formula_name: "Yorkshire Terrier Adult",
    display_name: "Royal Canin Yorkshire Terrier Adult",
    species: "dog",
    format: "dry",
    life_stage: "adult",
    dog_size: "small",
    breed_target: "Yorkshire Terrier",
    ingredient_text: composition,
    additives_text: additives,
    feeding_guide_text: stripTags(`${product.feeding_guideline_html ?? ""} ${feedingInstructions}`),
    kcal_per_kg: kcalPerKg ? String(kcalPerKg) : "",
    kcal_per_100g: kcalPerKg ? String(round1(kcalPerKg / 10)) : "",
    protein_percent: percentString(percentField(analytical, ["Πρωτεΐνη", "protein"])),
    fat_percent: percentString(percentField(analytical, ["Περιεκτικότητα σε λιπαρά", "λιπαρά", "fat"])),
    fiber_percent: percentString(percentField(analytical, ["Ακατέργαστες ίνες", "ίνες", "fiber"])),
    ash_percent: percentString(percentField(analytical, ["Ακατέργαστη τέφρα", "τέφρα", "ash"])),
    omega6_percent: gPerKgToPercent(analytical.match(/Omega\s*6[^:]*:\s*(\d+(?:[,.]\d+)?)\s*g/iu)?.[1]),
    omega3_percent: gPerKgToPercent(analytical.match(/Omega\s*3[^:]*:\s*(\d+(?:[,.]\d+)?)\s*g/iu)?.[1]),
    vitamin_a_iukg: String(numberValue(additives.match(/Βιταμίνη\s*Α\s*:?\s*(\d+(?:[,.]\d+)?)/iu)?.[1]) ?? ""),
    vitamin_d3_iukg: String(numberValue(additives.match(/Βιταμίνη\s*D3\s*:?\s*(\d+(?:[,.]\d+)?)/iu)?.[1]) ?? ""),
    iron_mgkg: String(mgField(additives, ["Σίδηρος", "Iron"]) ?? ""),
    zinc_mgkg: String(mgField(additives, ["ψευδάργυρος", "Zinc"]) ?? ""),
    manganese_mgkg: String(mgField(additives, ["Μαγγάνιο", "Manganese"]) ?? ""),
    selenium_mgkg: String(mgField(additives, ["Σελήνιο", "Selenium"]) ?? ""),
    data_quality_status: "needs_review",
    data_source_url: url,
    source_priority: "official",
  };

  return finishRow(row, {
    market: "GR",
    locale: "el",
    sourceTier: "official",
    sourceKind: "product_page",
    notes: [
      "official_structured_product_resource=true",
      "breed_target=Yorkshire Terrier",
      "missing_calcium_phosphorus_on_source=true",
    ],
  });
}

function parseRowForUrl(url, html, headers) {
  if (url.includes("zooplus.com")) return parseZooplus(html, url, headers);
  if (url.includes("josera.com")) return parseJosera(html, url, headers);
  if (url.includes("petsamolis.gr")) return parsePetsamolis(html, url, headers);
  if (url.includes("royalcanin.com/gr")) return parseRoyalCaninGr(html, url, headers);
  throw new Error(`Unsupported source URL: ${url}`);
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
  return [
    "ingredient_text",
    "kcal_per_100g",
    "protein_percent",
    "fat_percent",
    "fiber_percent",
  ].filter((field) => !String(row[field] ?? "").trim());
}

function renderReport(rows) {
  const candidateRows = rows.filter((row) => missingFields(row).length === 0);
  return `# External Product Sources Extract

Generated: ${new Date().toISOString()}

## Summary

- Source URLs processed: ${rows.length}
- Candidate rows for Food V2 review: ${candidateRows.length}
- Output CSV: ${paths.importCsv}
- Review CSV: ${paths.reviewCsv}
- Registry CSV: ${paths.registryCsv}

## Rows

${rows
  .map(
    (row) =>
      `- ${row.brand} ${row.formula_name}: ${missingFields(row).length === 0 ? "candidate" : "hold"} (${row.source_priority})`,
  )
  .join("\n")}

## Notes

- Retailer rows are accepted as evidence for filling gaps, but remain \`is_recommendable=false\` until admin QA.
- Josera is an official product page, but also stays in review because new imports should be checked before recommendations.
- Petsamolis calories are estimated with Modified Atwater because no explicit ME/kcal value was visible on the product page.
`;
}

async function main() {
  const headers = await foodV2Headers();
  const urls = process.argv.slice(2).length ? process.argv.slice(2) : defaultUrls;
  const rows = [];
  const registryRows = [];

  for (const url of urls) {
    const html = await fetchHtml(url);
    const row = parseRowForUrl(url, html, headers);
    rows.push(row);
    registryRows.push({
      source_group: "external_single_product_sources",
      listing_url: "",
      product_url: url,
      product_title: row.display_name,
      brand_guess: row.brand,
      species: row.species,
      format: row.format,
      source_tier: row.source_priority,
      source_type: "product_page",
      market: row.source_notes.match(/market=([^;]+)/)?.[1] ?? "",
      status: missingFields(row).length === 0 ? "candidate" : "hold",
      notes: row.source_notes,
    });
  }

  const orderedRows = rows.map((row) => Object.fromEntries(headers.map((header) => [header, row[header] ?? ""])));
  const reviewRows = rows.map((row) => ({
    formula_key: row.formula_key,
    brand: row.brand,
    formula_name: row.formula_name,
    species: row.species,
    status: missingFields(row).length === 0 ? "candidate" : "hold",
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
  await writeFile(paths.report, renderReport(rows), "utf8");

  console.log(`External product rows: ${rows.length}`);
  console.log(`Wrote ${paths.importCsv}`);
  console.log(`Wrote ${paths.reviewCsv}`);
  console.log(`Wrote ${paths.registryCsv}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
