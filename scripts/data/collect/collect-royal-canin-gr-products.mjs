import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  importCsv: "data/imports/royal_canin_gr_product_extract_v2.csv",
  reviewCsv: "data/review/royal_canin_gr_product_extract_review.csv",
  registryCsv: "data/sources/royal_canin_gr_product_registry.csv",
  report: "reports/royal_canin_gr_product_extract.md",
};

const algolia = {
  appId: "GDAKRUQ0DG",
  apiKey: "da13b75669012876b467c7cb91d14281",
  indexName: "prod_apif-products_el_GR",
  referer: "https://www.royalcanin.com/gr/dogs/products/retail-products?digital_sub_category=dry_food",
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

function cleanText(value) {
  return String(value ?? "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .normalize("NFKC")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:%])/g, "$1")
    .trim();
}

function stripTags(value) {
  return cleanText(String(value ?? "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(?:tr|td|th|p)>/gi, "\n"));
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

function gPerKgToPercent(value) {
  const parsed = numberValue(value);
  return parsed === null ? "" : String(Math.round((parsed / 10) * 1000) / 1000);
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

function royalSlug(value) {
  return encodeURIComponent(
    String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9\-+& ]/gi, "")
      .replace(/ /g, "-"),
  );
}

function splitIngredients(text) {
  const source = cleanText(text)
    .replace(/^Σύνθεση\s*:?\s*/iu, "")
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

function baseFoodRow(headers) {
  return Object.fromEntries(headers.map((header) => [header, ""]));
}

function formulaKey(row) {
  return `${slugify(row.brand)}-${slugify(row.formula_name)}-${row.species}-${row.format}-gr-official`;
}

function lifeStageFromProduct(product) {
  const stages = (product.lifestage ?? []).map((item) => item.code ?? item).join(" ").toLowerCase();
  const text = `${stages} ${product.product_title ?? ""} ${product.product_name ?? ""}`.toLowerCase();
  if (/puppy|junior|baby|starter/u.test(text)) return "puppy";
  if (/mature|senior|ageing/u.test(text)) return "senior";
  return "adult";
}

function dogSizeFromProduct(product) {
  const sizes = (product.pet_size ?? []).map((item) => item.code ?? item).join(" ").toLowerCase();
  const text = `${sizes} ${product.product_title ?? ""} ${product.product_name ?? ""}`.toLowerCase();
  if (/xsmall|x-small|mini|small/u.test(text)) return "small";
  if (/medium/u.test(text)) return "medium";
  if (/maxi|large|giant/u.test(text)) return "large";
  return "";
}

function breedTargetFromProduct(product) {
  const breed = product.breed?.[0]?.label ?? product.breed?.[0]?.name ?? "";
  return cleanText(breed);
}

function tagsFromProduct(product, analytical, ingredients) {
  const text = `${product.product_title ?? ""} ${product.product_name ?? ""} ${product.product_description_short_audience_pet_owner ?? ""} ${analytical} ${ingredients}`.toLowerCase();
  const tags = new Set(["dog", "dry", "royal_canin"]);
  const mappings = [
    ["puppy", /puppy|junior|starter/u],
    ["senior", /senior|mature|ageing/u],
    ["adult", /adult/u],
    ["small_breed", /mini|x-small|small|chihuahua|yorkshire|pomeranian|maltese/u],
    ["medium_breed", /medium/u],
    ["large_breed", /maxi|large|giant|labrador|golden|german shepherd/u],
    ["weight_control", /light|weight/u],
    ["skin_coat", /skin|coat|δέρμα|τρίχω/u],
    ["digestive_support", /digest|πεπτικ/u],
    ["dental", /dental|oral|στοματικ/u],
    ["breed_specific", /terrier|retriever|bulldog|poodle|pug|shih|dachshund|dalmatian|cocker|schnauzer|pomeranian|maltese|chihuahua/u],
  ];
  for (const [tag, pattern] of mappings) {
    if (pattern.test(text)) tags.add(tag);
  }
  return [...tags];
}

function sourceNotes(extra = []) {
  return [
    "market=GR",
    "locale=el",
    "basis=as-fed",
    "source_tier=official",
    "source_kind=royal_canin_algolia_plus_product_page",
    "category_batch=true",
    "human_qa_required_before_recommendation=true",
    ...extra,
  ].join("; ");
}

function compositionValue(product, key) {
  return cleanText(product.composition?.find((item) => item[key])?.[key] ?? "");
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 NutriTail/1.0",
      accept: "text/html,application/xhtml+xml",
      "accept-language": "el-GR,el;q=0.9,en;q=0.8",
      referer: algolia.referer,
    },
  });
  if (!response.ok) throw new Error(`Fetch failed ${response.status} ${url}`);
  return response.text();
}

function nextData(html) {
  const raw = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
  return raw ? JSON.parse(raw) : null;
}

async function discoverProducts() {
  const params = new URLSearchParams({ query: "", hitsPerPage: "1000", page: "0" }).toString();
  const response = await fetch(`https://${algolia.appId}-dsn.algolia.net/1/indexes/*/queries`, {
    method: "POST",
    headers: {
      "x-algolia-api-key": algolia.apiKey,
      "x-algolia-application-id": algolia.appId,
      "content-type": "application/json",
      referer: algolia.referer,
      origin: "https://www.royalcanin.com",
    },
    body: JSON.stringify({ requests: [{ indexName: algolia.indexName, params }] }),
  });
  if (!response.ok) throw new Error(`Algolia query failed ${response.status}`);
  const data = await response.json();
  const hits = data.results?.[0]?.hits ?? [];
  return hits
    .filter(
      (hit) =>
        hit.species?.[0]?.code === "dog" &&
        hit.product_pillar?.[0]?.code === "sptretail" &&
        hit.digital_sub_category?.code === "dry_food" &&
        hit.family === "food",
    )
    .map((hit) => ({
      title: hit.product_title,
      titleUrl: hit.product_title_url,
      worldWideMainItem: hit.world_wide_main_item,
      objectID: hit.objectID,
      productUrl: `https://www.royalcanin.com/gr/dogs/products/retail-products/${royalSlug(hit.product_title_url)}-${hit.world_wide_main_item}`,
    }));
}

function rowFromProduct(product, url, headers) {
  const composition = compositionValue(product, "composition").replace(/^Σύνθεση\s*:?\s*/iu, "");
  const additives = compositionValue(product, "additives").replace(/^Πρόσθετες ύλες\s*:?\s*/iu, "");
  const analytical = compositionValue(product, "analytical_constituants");
  const feedingInstructions = compositionValue(product, "feeding_instructions");
  const kcalPerKg = numberValue(product.reference_energy_value_per_weight?.amount);
  const title = cleanText(product.product_title ?? "");
  const ingredients = splitIngredients(composition);
  const tags = tagsFromProduct(product, analytical, composition);
  const breedTarget = breedTargetFromProduct(product);
  const row = {
    ...baseFoodRow(headers),
    brand: "Royal Canin",
    formula_name: title,
    display_name: `Royal Canin ${title}`,
    species: "dog",
    format: "dry",
    life_stage: lifeStageFromProduct(product),
    dog_size: dogSizeFromProduct(product),
    breed_target: breedTarget,
    commercial_tags: tags.join("|"),
    medical_tags: tags.filter((tag) => ["weight_control", "skin_coat", "digestive_support", "dental"].includes(tag)).join("|"),
    ingredient_text: composition,
    ingredients: JSON.stringify(ingredients),
    primary_animal_proteins: /πουλερ|poultry/iu.test(composition) ? "poultry" : "",
    carbohydrate_sources: [
      /ρύζι|rice/iu.test(composition) ? "rice" : "",
      /αραβοσίτου|καλαμπόκι|maize|corn/iu.test(composition) ? "corn" : "",
    ]
      .filter(Boolean)
      .join("|"),
    fat_sources: [
      /ζωικά λίπη|animal fats/iu.test(composition) ? "animal_fats" : "",
      /ιχθυέλαιο|fish oil/iu.test(composition) ? "fish_oil" : "",
    ]
      .filter(Boolean)
      .join("|"),
    fiber_sources: [
      /φυτικές ίνες|vegetable fibres/iu.test(composition) ? "vegetable_fibres" : "",
      /τεύτλων|beet/iu.test(composition) ? "beet_pulp" : "",
    ]
      .filter(Boolean)
      .join("|"),
    additives_text: additives,
    feeding_guide_text: stripTags(`${product.feeding_guideline_html ?? ""} ${feedingInstructions}`),
    kcal_per_kg: kcalPerKg ? String(kcalPerKg) : "",
    kcal_per_100g: kcalPerKg ? String(round1(kcalPerKg / 10)) : "",
    protein_percent: percentString(percentField(analytical, ["Πρωτεΐνη", "protein"])),
    fat_percent: percentString(percentField(analytical, ["Περιεκτικότητα σε λιπαρές ουσίες", "Περιεκτικότητα σε λιπαρά", "λιπαρές ουσίες", "λιπαρά", "fat"])),
    fiber_percent: percentString(percentField(analytical, ["Ακατέργαστες ινώδεις ουσίες", "Ακατέργαστες ίνες", "ινώδεις ουσίες", "ίνες", "fiber"])),
    ash_percent: percentString(percentField(analytical, ["Ακατέργαστη τέφρα", "τέφρα", "ash"])),
    moisture_percent: percentString(percentField(analytical, ["Υγρασία", "moisture"])),
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
    source_notes: sourceNotes([
      "official_structured_product_resource=true",
      breedTarget ? `breed_target=${breedTarget}` : "",
      "calcium_phosphorus_not_consistently_visible_on_gr_retail_pages=true",
    ].filter(Boolean)),
    is_recommendable: "false",
  };
  row.formula_key = formulaKey(row);
  return row;
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
    "omega3_percent",
    "omega6_percent",
  ].filter((field) => String(row[field] ?? "").trim());
}

function missingFields(row) {
  const missing = ["ingredient_text", "protein_percent", "fat_percent", "fiber_percent"].filter(
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

function renderReport(discovered, rows, failures) {
  return `# Royal Canin GR Product Extract

Generated: ${new Date().toISOString()}

## Summary

- Algolia dry dog retail products discovered: ${discovered.length}
- Rows extracted: ${rows.length}
- Candidate rows: ${rows.filter((row) => rowStatus(row) === "candidate").length}
- Hold rows: ${rows.filter((row) => rowStatus(row) === "hold").length}
- Failed product pages: ${failures.length}
- Output CSV: ${paths.importCsv}
- Review CSV: ${paths.reviewCsv}
- Registry CSV: ${paths.registryCsv}

## Notes

- Source tier is official because product URLs and details come from Royal Canin GR.
- Rows stay \`needs_review\` and \`is_recommendable=false\` until admin QA.
- Greek retail pages do not consistently expose calcium/phosphorus, so those gaps are kept as source notes instead of fabricated values.

## Failed Pages

${failures.length ? failures.map((failure) => `- ${failure.productUrl}: ${failure.error}`).join("\n") : "- None"}
`;
}

async function main() {
  const headers = await foodV2Headers();
  const discovered = await discoverProducts();
  const rows = [];
  const failures = [];
  const registryRows = [];

  for (const product of discovered) {
    try {
      const html = await fetchText(product.productUrl);
      const data = nextData(html);
      const originalProduct = data?.props?.pageProps?.productData?.response?.original_product;
      if (!originalProduct) throw new Error("Royal Canin product JSON missing");
      const row = rowFromProduct(originalProduct, product.productUrl, headers);
      rows.push(row);
      registryRows.push({
        source_group: "royal_canin_gr_dog_dry_retail",
        listing_url: "https://www.royalcanin.com/gr/dogs/products/retail-products?digital_sub_category=dry_food",
        product_url: product.productUrl,
        product_title: row.display_name,
        brand_guess: row.brand,
        species: row.species,
        format: row.format,
        source_tier: row.source_priority,
        source_type: "official_product_page",
        market: "GR",
        status: rowStatus(row),
        notes: row.source_notes,
      });
    } catch (error) {
      failures.push({ ...product, error: error.message });
      registryRows.push({
        source_group: "royal_canin_gr_dog_dry_retail",
        listing_url: "https://www.royalcanin.com/gr/dogs/products/retail-products?digital_sub_category=dry_food",
        product_url: product.productUrl,
        product_title: product.title,
        brand_guess: "Royal Canin",
        species: "dog",
        format: "dry",
        source_tier: "official",
        source_type: "official_product_page",
        market: "GR",
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
  await writeFile(paths.report, renderReport(discovered, dedupedRows, failures), "utf8");

  console.log(`Royal Canin GR discovered: ${discovered.length}`);
  console.log(`Rows extracted: ${dedupedRows.length}`);
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
