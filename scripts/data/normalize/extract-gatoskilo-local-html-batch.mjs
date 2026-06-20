import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const defaultSourceDir =
  "C:/Users/NIOstb/Desktop/photo_foods_nutritail/nutrital links";
const args = process.argv.slice(2);
const sourceDir = args.find((arg) => !arg.startsWith("--")) || defaultSourceDir;
const outputName =
  args
    .find((arg) => arg.startsWith("--output="))
    ?.replace(/^--output=/, "")
    .replace(/[^a-z0-9_-]/gi, "_") || "gatoskilo_local_html_batch";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  importCsv: `data/imports/${outputName}_v2.csv`,
  reviewCsv: `data/review/${outputName}_review.csv`,
  report: `reports/${outputName}.md`,
};

const reviewHeaders = [
  "formula_key",
  "brand",
  "formula_name",
  "species",
  "format",
  "status",
  "source_url",
  "source_file",
  "pack_size",
  "extracted_fields",
  "missing_fields",
  "notes",
];

const knownBrands = [
  "Royal Canin",
  "Vet Expert",
  "Versele Laga",
  "Wellness Core",
  "Wellness CORE",
  "Nature's Protection",
  "Naturea",
  "Happy Dog",
  "Barking Heads",
  "Pro Plan",
  "Purina Pro Plan",
  "Trovet",
  "Acana",
  "Orijen",
  "Ambrosia",
  "AATU",
  "Josera",
  "Opti Life",
  "Ownat",
  "Canagan",
  "Equilibrio",
  "Amity",
  "Mera",
  "MeraDog",
  "Viozois",
  "Brit",
  "Hill's",
  "Farmina",
  "Monge",
];

const animalTerms = [
  ["chicken", ["chicken", "κοτόπουλ", "πουλερικ"]],
  ["lamb", ["lamb", "αρν"]],
  ["salmon", ["salmon", "σολομ", "σολωμ"]],
  ["fish", ["fish", "ψαρ", "ιχθυ"]],
  ["duck", ["duck", "πάπια", "παπια"]],
  ["beef", ["beef", "βοδιν", "μοσχ"]],
  ["rabbit", ["rabbit", "κουνέλ", "κουνελ"]],
  ["turkey", ["turkey", "γαλοπούλ", "γαλοπουλ"]],
  ["insect", ["insect", "έντομ", "εντομ"]],
  ["pork", ["pork", "χοιριν"]],
  ["tuna", ["tuna", "τόνο", "τονο"]],
];

const carbTerms = [
  ["rice", ["rice", "ρύζ", "ρυζ"]],
  ["corn", ["corn", "maize", "καλαμπόκ", "καλαμποκ", "αραβόσιτ"]],
  ["wheat", ["wheat", "σιτάρ", "σιταρ"]],
  ["barley", ["barley", "κριθ"]],
  ["potato", ["potato", "πατάτ", "πατατ"]],
  ["pea", ["pea", "peas", "αρακά", "αρακα", "μπιζέλ", "μπιζελ"]],
  ["oat", ["oat", "βρώμη", "βρωμη"]],
  ["tapioca", ["tapioca", "ταπιόκα", "ταπιοκα"]],
];

const fiberTerms = [
  ["beet pulp", ["beet pulp", "πολτός τεύτ", "πολτοσ τευτ"]],
  ["fos", ["fos", "φρουκτοολιγοσακχαρίτ", "φρουκτοολιγοσακχαριτ"]],
  ["mos", ["mos", "μαννάν", "μανναν"]],
  ["yucca", ["yucca"]],
  ["psyllium", ["psyllium", "ψύλλιο", "ψυλλιο"]],
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
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;/g, "'")
    .replace(/&ndash;|&mdash;/g, "-")
    .replace(/&alpha;/gi, "α")
    .replace(/&beta;/gi, "β")
    .replace(/&gamma;/gi, "γ")
    .replace(/&delta;/gi, "δ")
    .replace(/&epsilon;/gi, "ε")
    .replace(/&zeta;/gi, "ζ")
    .replace(/&eta;/gi, "η")
    .replace(/&theta;/gi, "θ")
    .replace(/&iota;/gi, "ι")
    .replace(/&kappa;/gi, "κ")
    .replace(/&lambda;/gi, "λ")
    .replace(/&mu;/gi, "μ")
    .replace(/&nu;/gi, "ν")
    .replace(/&xi;/gi, "ξ")
    .replace(/&omicron;/gi, "ο")
    .replace(/&pi;/gi, "π")
    .replace(/&rho;/gi, "ρ")
    .replace(/&sigmaf;/gi, "ς")
    .replace(/&sigma;/gi, "σ")
    .replace(/&tau;/gi, "τ")
    .replace(/&upsilon;/gi, "υ")
    .replace(/&phi;/gi, "φ")
    .replace(/&chi;/gi, "χ")
    .replace(/&psi;/gi, "ψ")
    .replace(/&omega;/gi, "ω")
    .replace(/&Alpha;/g, "Α")
    .replace(/&Beta;/g, "Β")
    .replace(/&Gamma;/g, "Γ")
    .replace(/&Delta;/g, "Δ")
    .replace(/&Epsilon;/g, "Ε")
    .replace(/&Zeta;/g, "Ζ")
    .replace(/&Eta;/g, "Η")
    .replace(/&Theta;/g, "Θ")
    .replace(/&Iota;/g, "Ι")
    .replace(/&Kappa;/g, "Κ")
    .replace(/&Lambda;/g, "Λ")
    .replace(/&Mu;/g, "Μ")
    .replace(/&Nu;/g, "Ν")
    .replace(/&Xi;/g, "Ξ")
    .replace(/&Omicron;/g, "Ο")
    .replace(/&Pi;/g, "Π")
    .replace(/&Rho;/g, "Ρ")
    .replace(/&Sigma;/g, "Σ")
    .replace(/&Tau;/g, "Τ")
    .replace(/&Upsilon;/g, "Υ")
    .replace(/&Phi;/g, "Φ")
    .replace(/&Chi;/g, "Χ")
    .replace(/&Psi;/g, "Ψ")
    .replace(/&Omega;/g, "Ω")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanText(value) {
  return decodeHtml(value)
    .normalize("NFC")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:%])/g, "$1")
    .trim();
}

function normalizeProductTitle(value) {
  return cleanText(value)
    .replace(/Μini/gu, "Mini")
    .replace(/Χsmall/giu, "Xsmall")
    .replace(/\bXSmall\b/g, "Xsmall")
    .replace(/\bS_O\b/giu, "S/O")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value) {
  return cleanText(
    String(value ?? "")
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|li|td|tr|h\d|div|section)>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  );
}

function normalizeForMatch(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ς/g, "σ");
}

async function collectHtmlFiles(directory) {
  const info = await stat(directory);
  if (!info.isDirectory()) throw new Error(`Expected directory: ${directory}`);
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectHtmlFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && /\.(html?|mhtml?|mht)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
}

function titleFromHtml(html, filePath) {
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (h1) return normalizeProductTitle(stripTags(h1).replace(/\s*-\s*Gatoskilo$/i, ""));
  const meta = html.match(/<meta\b[^>]*(?:property|name)=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1];
  if (meta) return normalizeProductTitle(cleanText(meta).replace(/\s*-\s*Gatoskilo$/i, ""));
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
  if (title) return normalizeProductTitle(cleanText(title).replace(/\s*-\s*Gatoskilo$/i, ""));
  return normalizeProductTitle(
    path.basename(filePath).replace(/\.(?:html?|mhtml?|mht)$/i, "").replace(/\s*-\s*Gatoskilo$/i, "")
  );
}

function canonicalUrlFromHtml(html) {
  return (
    html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] ??
    html.match(/<meta\b[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] ??
    ""
  );
}

function brandFromHtml(html, title) {
  const metaBrand =
    html.match(/<meta\b[^>]*itemprop=["']brand["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] ??
    html.match(/itemprop=["']manufacturer["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] ??
    "";
  if (metaBrand) return cleanText(metaBrand);

  const titleMatch = knownBrands
    .slice()
    .sort((a, b) => b.length - a.length)
    .find((brand) => normalizeForMatch(title).startsWith(normalizeForMatch(brand)));
  if (titleMatch) return titleMatch;

  return cleanText(title).split(/\s+/u).slice(0, 2).join(" ");
}

function packSizeFromTitle(title) {
  return cleanText(title.match(/\b\d+(?:[,.]\d+)?\s*(?:kg|gr|g)\b/iu)?.[0] ?? "");
}

function formulaNameFromTitle(title, brand) {
  const escapedBrand = brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return cleanText(title)
    .replace(new RegExp(`^${escapedBrand}\\s*`, "iu"), "")
    .replace(/\b\d+(?:[,.]\d+)?\s*(?:kg|gr|g)\b/giu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function slugify(value) {
  return normalizeForMatch(value)
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9α-ω]+/giu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function sectionBetween(html, startPattern, endPattern) {
  const start = html.search(startPattern);
  if (start < 0) return "";
  const rest = html.slice(start);
  const end = rest.search(endPattern);
  return end >= 0 ? rest.slice(0, end) : rest;
}

function headingSections(html) {
  const matches = [...html.matchAll(/<h6\b[^>]*>([\s\S]*?)<\/h6>/gi)];
  return matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? html.length;
    return {
      heading: stripTags(match[1]),
      bodyHtml: html.slice(start, end),
      bodyText: stripTags(html.slice(start, end)),
    };
  });
}

function findSection(sections, labels) {
  return (
    sections.find((section) => {
      const heading = normalizeForMatch(section.heading);
      return labels.some((label) => heading.includes(normalizeForMatch(label)));
    }) ?? null
  );
}

function splitIngredients(text) {
  const cleaned = cleanText(text).replace(/\.$/u, "");
  const output = [];
  let current = "";
  let depth = 0;
  for (let index = 0; index < cleaned.length; index += 1) {
    const char = cleaned[index];
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);
    const decimalComma =
      char === "," &&
      index > 0 &&
      index + 1 < cleaned.length &&
      /\d/u.test(cleaned[index - 1]) &&
      /\d/u.test(cleaned[index + 1]);
    if (char === "," && depth === 0 && !decimalComma) {
      if (current.trim()) output.push(cleanText(current));
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) output.push(cleanText(current));

  const seen = new Set();
  return output.filter((item) => {
    const key = normalizeForMatch(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function numberTokenToNumber(token, { thousands = false } = {}) {
  if (!token) return null;
  let value = String(token).trim();
  const dotCount = (value.match(/\./g) ?? []).length;
  const commaCount = (value.match(/,/g) ?? []).length;
  if (thousands && /^[1-9]\.\d{3}$/u.test(value)) value = value.replace(".", "");
  else if (commaCount && !dotCount) value = value.replace(",", ".");
  else if (dotCount > 1) value = value.replace(/\./g, "");
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function firstNumberAfter(text, labels, options = {}) {
  const normalized = cleanText(text);
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = normalized.match(new RegExp(`${escaped}[\\s\\S]{0,120}?(\\d+(?:[,.]\\d+)?)`, "iu"));
    const value = numberTokenToNumber(match?.[1], options);
    if (value !== null) return value;
  }
  return null;
}

function percentAfter(text, labels) {
  const hasFatLabel = labels.some((label) => label === "Fat" || /λιπ|lip|fat/i.test(label));
  if (hasFatLabel) {
    const priorityLabels = [labels[0], labels[2], "Fat"].filter(Boolean);
    return firstNumberAfter(text, priorityLabels) ?? firstNumberAfter(text, labels);
  }

  return firstNumberAfter(text, labels);
}

function mgkgAfter(text, labels) {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = cleanText(text).match(new RegExp(`${escaped}[\\s\\S]{0,120}?(\\d+(?:[,.]\\d+)?)\\s*mg`, "iu"));
    const value = numberTokenToNumber(match?.[1]);
    if (value !== null) return value;
  }
  return null;
}

function kcalKgFromText(text) {
  const matches = [...cleanText(text).matchAll(/(\d+(?:[,.]\d+)?)\s*kcal\s*\/?\s*(?:kg|κιλό|κιλο)/giu)];
  for (const match of matches) {
    const value = numberTokenToNumber(match[1], { thousands: true });
    if (value !== null) return value < 100 ? Math.round(value * 1000) : Math.round(value);
  }

  const afterUnit = cleanText(text).match(/kcal\s*\/?\s*(?:kg|κιλό|κιλο)[^\d]{0,20}(\d+(?:[,.]\d+)?)/iu);
  const afterUnitValue = numberTokenToNumber(afterUnit?.[1], { thousands: true });
  if (afterUnitValue !== null) {
    return afterUnitValue < 100 ? Math.round(afterUnitValue * 1000) : Math.round(afterUnitValue);
  }

  const kcalG = cleanText(text).match(/(\d+(?:[,.]\d+)?)\s*kcal\s*\/?\s*g/iu);
  const kcalGValue = numberTokenToNumber(kcalG?.[1]);
  if (kcalGValue !== null) return Math.round(kcalGValue * 1000);

  return null;
}

function formatNumber(value, decimals = 4) {
  if (value === null || value === undefined || value === "") return "";
  return String(Number(value.toFixed(decimals))).replace(/\.0$/u, "");
}

function speciesFromText(url, title, text) {
  const normalizedUrl = normalizeForMatch(url);
  if (
    normalizedUrl.includes("skyloy") ||
    normalizedUrl.includes("skylou") ||
    normalizedUrl.includes("dog")
  ) {
    return "dog";
  }
  if (
    normalizedUrl.includes("gatas") ||
    normalizedUrl.includes("gaton") ||
    normalizedUrl.includes("cat")
  ) {
    return "cat";
  }

  const haystack = normalizeForMatch(`${url} ${title} ${text}`);
  if (haystack.includes("gatas") || haystack.includes("cat") || haystack.includes("γατα")) return "cat";
  if (haystack.includes("skyloy") || haystack.includes("dog") || haystack.includes("σκυλ")) return "dog";
  return "";
}

function lifeStageFromText(title, text, species) {
  const haystack = normalizeForMatch(`${title} ${text}`);
  if (species === "cat" && /kitten|γατακι|junior/u.test(haystack)) return "kitten";
  if (/puppy|κουταβ|junior/u.test(haystack)) return "puppy";
  if (/senior|maturity|8\+|7\+|ηλικιωμ/u.test(haystack)) return "senior";
  if (/adult|ενηλικ/u.test(haystack)) return "adult";
  return "";
}

function titleFirstLifeStageFromText(title, text, species) {
  const titleText = normalizeForMatch(title);
  const bodyText = normalizeForMatch(text);

  if (species === "cat") {
    if (/kitten|junior/u.test(titleText)) return "kitten";
    if (/senior|maturity|ageing|7\+|8\+|10\+|12\+/u.test(titleText)) return "senior";
    if (
      /adult|indoor|fit|sensible|persian|urinary care|hairball|dental care|digestive care|light weight/u.test(
        titleText
      )
    ) {
      return "adult";
    }
  }

  if (/puppy|junior/u.test(titleText)) return "puppy";
  if (/senior|maturity|ageing|8\+|7\+|10\+|12\+/u.test(titleText)) return "senior";
  if (/adult|sterilised|light weight|urinary care|digestive care|dental care/u.test(titleText)) {
    return "adult";
  }

  const legacyTitleOnlyStage = lifeStageFromText(title, "", species);
  if (legacyTitleOnlyStage) return legacyTitleOnlyStage;

  if (species === "cat" && /kitten/u.test(bodyText) && !/adult/u.test(bodyText)) return "kitten";
  if (/puppy|junior/u.test(bodyText) && !/adult/u.test(bodyText)) return "puppy";
  if (/senior|maturity|ageing|8\+|7\+|10\+|12\+/u.test(bodyText)) return "senior";
  if (/adult/u.test(bodyText)) return "adult";
  return "";
}

function dogSizeFromText(title, text) {
  const haystack = normalizeForMatch(`${title} ${text}`);
  if (/mini|small|μικροσωμ/u.test(haystack)) return "small";
  if (/medium|μεσαι/u.test(haystack)) return "medium";
  if (/maxi|large|giant|μεγαλοσωμ/u.test(haystack)) return "large";
  if (/all breeds|all sizes|ολων των φυλων|ανεξαρτητως/u.test(haystack)) return "all";
  return "";
}

function containsAny(text, terms) {
  const normalized = normalizeForMatch(text);
  return terms.some((term) => normalized.includes(normalizeForMatch(term)));
}

function termsFrom(text, mappings) {
  return mappings
    .filter(([, terms]) => containsAny(text, terms))
    .map(([tag]) => tag)
    .join(";");
}

function tagsFrom({ title, ingredients, species, format, lifeStage, dogSize }) {
  const text = `${title} ${ingredients}`;
  const tags = new Set([species, format, lifeStage, dogSize].filter(Boolean));
  const mappings = [
    ["sterilised", ["sterilised", "στειρωμ"]],
    ["urinary", ["urinary", "ουρολογ", "struvite", "στρουβ"]],
    ["renal", ["renal", "νεφρ", "oxalate"]],
    ["hepatic", ["hepatic", "ηπατικ"]],
    ["gastrointestinal", ["gastrointestinal", "intestinal", "πεπτικ"]],
    ["hypoallergenic", ["hypoallergenic", "υποαλλεργ"]],
    ["dermatosis", ["dermatosis", "δερματ"]],
    ["weight_control", ["weight", "diabetic", "light", "reduced calorie", "διαβητ"]],
    ["grain_free", ["grain free", "χωρισ σιτηρ"]],
  ];
  for (const [tag, aliases] of mappings) {
    if (containsAny(text, aliases)) tags.add(tag);
  }
  for (const [tag, aliases] of [...animalTerms, ...carbTerms]) {
    if (containsAny(text, aliases)) tags.add(tag);
  }
  return [...tags].join(";");
}

function tableTextFromHtml(html) {
  return [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((row) =>
      [...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)]
        .map((cell) => stripTags(cell[1]))
        .filter(Boolean)
        .join(": "),
    )
    .filter(Boolean)
    .join("; ");
}

function estimateKcal(row) {
  if (row.kcal_per_kg || row.kcal_per_100g) return [];
  const protein = Number(row.protein_percent);
  const fat = Number(row.fat_percent);
  const fiber = Number(row.fiber_percent);
  const ash = Number(row.ash_percent || 7);
  const moisture = Number(row.moisture_percent || 10);
  if (![protein, fat, fiber, ash, moisture].every(Number.isFinite) || row.format !== "dry") {
    return [];
  }
  const carbohydrate = Number((100 - protein - fat - fiber - ash - moisture).toFixed(1));
  if (carbohydrate < 0 || carbohydrate > 100) return ["kcal_estimate_failed=true"];
  const kcal100 = Number(((protein * 3.5) + (fat * 8.5) + (carbohydrate * 3.5)).toFixed(1));
  row.kcal_per_100g = formatNumber(kcal100, 1);
  row.kcal_per_kg = String(Math.round(kcal100 * 10));
  return [
    "kcal_estimated=true",
    "kcal_estimation_method=modified_atwater",
    `estimated_carbohydrate_percent=${carbohydrate}`,
    row.moisture_percent ? "declared_moisture_used_for_estimate=true" : "default_moisture_percent=10",
  ];
}

function buildProductRow(html, filePath, headers) {
  const title = titleFromHtml(html, filePath);
  const canonicalUrl = canonicalUrlFromHtml(html);
  const nutritionHtml = sectionBetween(html, /<section[^>]+tab--_1/i, /<section[^>]+tab--_2/i);
  const feedingHtml = sectionBetween(html, /<section[^>]+tab--_2/i, /<style|<section[^>]+tab--_3/i);
  const sections = headingSections(nutritionHtml);
  const compositionSection = findSection(sections, ["Σύνθεση", "Συστατικά"]);
  const analysisSection = findSection(sections, ["Αναλυτικά"]);
  const additivesSection = findSection(sections, ["Πρόσθετα"]);
  const kcalSection = findSection(sections, ["Θερμίδες", "Ενέργεια"]);
  const bodyText = stripTags(`${nutritionHtml}\n${feedingHtml}`);
  const analysisText = analysisSection?.bodyText ?? bodyText;
  const brand = brandFromHtml(html, title);
  const formulaName = formulaNameFromTitle(title, brand);
  const species = speciesFromText(canonicalUrl, title, bodyText);
  const format = /dry|ksira|ksiri|ξηρ/iu.test(`${canonicalUrl} ${title} ${bodyText}`) ? "dry" : "";
  const lifeStage = titleFirstLifeStageFromText(title, bodyText, species);
  const dogSize = species === "dog" ? dogSizeFromText(title, bodyText) : "";
  const ingredientText = compositionSection?.bodyText ?? "";
  const ingredients = splitIngredients(ingredientText);
  const kcalKg = kcalKgFromText(`${kcalSection?.bodyText ?? ""}\n${analysisText}\n${bodyText}`);
  const packSize = packSizeFromTitle(title);

  const row = Object.fromEntries(headers.map((header) => [header, ""]));
  row.brand = brand;
  row.formula_name = formulaName;
  row.display_name = title;
  row.species = species;
  row.format = format;
  row.life_stage = lifeStage;
  row.dog_size = dogSize;
  row.medical_tags = tagsFrom({ title, ingredients: ingredientText, species: "", format: "", lifeStage: "", dogSize: "" })
    .split(";")
    .filter((tag) => ["sterilised", "urinary", "renal", "hepatic", "gastrointestinal", "hypoallergenic", "dermatosis", "weight_control"].includes(tag))
    .join(";");
  row.commercial_tags = tagsFrom({ title, ingredients: ingredientText, species, format, lifeStage, dogSize });
  row.ingredient_text = ingredientText;
  row.ingredients = JSON.stringify(ingredients);
  row.primary_animal_proteins = termsFrom(ingredientText, animalTerms);
  row.carbohydrate_sources = termsFrom(ingredientText, carbTerms);
  row.fat_sources = containsAny(ingredientText, ["λίπος", "λιπα", "oil", "έλαιο", "ελαιο"]) ? "fat;oil" : "";
  row.fiber_sources = termsFrom(ingredientText, fiberTerms);
  row.additives_text = additivesSection?.bodyText ?? "";
  row.feeding_guide_text = cleanText(`${stripTags(feedingHtml)} ${tableTextFromHtml(feedingHtml)}`).slice(0, 4000);
  row.kcal_per_kg = kcalKg ? String(kcalKg) : "";
  row.kcal_per_100g = kcalKg ? formatNumber(kcalKg / 10, 1) : "";
  row.protein_percent = formatNumber(
    percentAfter(analysisText, [
      "Ακατέργαστη Πρωτεΐνη",
      "Ακατέργαστη Πρωτεϊνη",
      "Πρωτεΐνη",
      "Πρωτεϊνη",
      "Πρωτείνη",
      "Protein",
    ]),
  );
  row.fat_percent = formatNumber(percentAfter(analysisText, ["Ακατέργαστα Λιπαρά", "Λιπαρά", "Λίπος", "Fat"]));
  if (!row.fat_percent) {
    row.fat_percent = formatNumber(
      percentAfter(analysisText, [
        "Περιεκτικότητα σε λιπαρές ουσίες",
        "λιπαρές ουσίες",
      ])
    );
  }
  row.fiber_percent = formatNumber(
    percentAfter(analysisText, [
      "Ακατέργαστες Φυτικές Ίνες",
      "Ακατέργαστες Φυτικές Ουσίες",
      "Φυτικές Ίνες",
      "Φυτικές Ουσίες",
      "Ίνες",
      "Κυτταρίνη",
      "Fiber",
    ]),
  );
  row.ash_percent = formatNumber(percentAfter(analysisText, ["Ακατέργαστη Τέφρα", "Τέφρα", "Ash"]));
  row.moisture_percent = formatNumber(percentAfter(analysisText, ["Υγρασία", "Moisture"]));
  row.calcium_percent = formatNumber(percentAfter(analysisText, ["Ασβέστιο", "Calcium"]));
  row.phosphorus_percent = formatNumber(percentAfter(analysisText, ["Φώσφορος", "Φωσφόρος", "Phosphorus"]));
  row.sodium_percent = formatNumber(percentAfter(analysisText, ["Νάτριο", "Sodium"]));
  row.magnesium_percent = formatNumber(percentAfter(analysisText, ["Μαγνήσιο", "Magnesium"]));
  row.potassium_percent = formatNumber(percentAfter(analysisText, ["Κάλιο", "Potassium"]));
  row.omega3_percent = formatNumber(percentAfter(analysisText, ["Ωμέγα-3", "Ωμέγα 3", "Omega-3"]));
  row.omega6_percent = formatNumber(percentAfter(analysisText, ["Ωμέγα-6", "Ωμέγα 6", "Omega-6"]));
  row.dha_percent = formatNumber(percentAfter(analysisText, ["DHA"]));
  row.epa_percent = formatNumber(percentAfter(analysisText, ["EPA"]));
  row.taurine_mgkg = formatNumber(mgkgAfter(`${analysisText}\n${row.additives_text}`, ["Ταυρίνη", "Taurine"]));
  row.l_carnitine_mgkg = formatNumber(mgkgAfter(`${analysisText}\n${row.additives_text}`, ["L-καρνιτίνη", "L-carnitine"]));
  row.glucosamine_mgkg = formatNumber(mgkgAfter(`${analysisText}\n${row.additives_text}`, ["Γλυκοζαμίνη", "Glucosamine"]));
  row.chondroitin_mgkg = formatNumber(mgkgAfter(`${analysisText}\n${row.additives_text}`, ["Χονδροϊτίνη", "Chondroitin"]));
  row.vitamin_a_iukg = formatNumber(firstNumberAfter(row.additives_text, ["Βιταμίνη A", "Vitamin A"], { thousands: true }));
  row.vitamin_d3_iukg = formatNumber(firstNumberAfter(row.additives_text, ["Βιταμίνη D3", "Vitamin D3"], { thousands: true }));
  row.vitamin_e_mgkg = formatNumber(mgkgAfter(row.additives_text, ["Βιταμίνη E", "Vitamin E"]));
  row.iron_mgkg = formatNumber(mgkgAfter(row.additives_text, ["Σίδηρος", "Iron"]));
  row.zinc_mgkg = formatNumber(mgkgAfter(row.additives_text, ["Ψευδάργυρος", "Zinc"]));
  row.copper_mgkg = formatNumber(mgkgAfter(row.additives_text, ["Χαλκός", "Copper"]));
  row.manganese_mgkg = formatNumber(mgkgAfter(row.additives_text, ["Μαγγάνιο", "Manganese"]));
  row.iodine_mgkg = formatNumber(mgkgAfter(row.additives_text, ["Ιώδιο", "Iodine"]));
  row.selenium_mgkg = formatNumber(mgkgAfter(row.additives_text, ["Σελήνιο", "Selenium"]));
  row.ean = html.match(/"ean13"\s*:\s*"([^"]+)"/i)?.[1] ?? "";
  row.data_quality_status = "needs_review";
  row.data_source_url = canonicalUrl || filePath;
  row.source_priority = "retailer";
  row.formula_key = slugify(`${brand}-${formulaName}-${species || "unknown"}-${format || "unknown"}-gr-gatoskilo`);
  row.is_recommendable = "false";

  const estimateNotes = estimateKcal(row);
  row.source_notes = [
    "market=GR",
    "basis=as-fed",
    "source_tier=retailer",
    "source_group=gatoskilo_local_html_batch",
    "retailer_sources_accepted_for_needs_review=true",
    "human_qa_required_before_recommendation=true",
    "canonical_formula_level_row=true",
    packSize ? `pack_size_seen=${packSize}` : "",
    kcalKg ? "label_energy_used=true" : "",
    row.ash_percent ? "label_ash_used=true" : "",
    filePath ? `source_file=${filePath}` : "",
    ...estimateNotes,
  ]
    .filter(Boolean)
    .join("; ");

  return { row, packSize };
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
    "ash_percent",
    "kcal_per_100g",
    "data_source_url",
  ].filter((field) => !String(row[field] ?? "").trim());
}

function rowCompleteness(row) {
  const requiredWeight = [
    "brand",
    "formula_name",
    "species",
    "format",
    "ingredient_text",
    "protein_percent",
    "fat_percent",
    "fiber_percent",
    "ash_percent",
    "kcal_per_100g",
    "calcium_percent",
    "phosphorus_percent",
    "sodium_percent",
    "magnesium_percent",
    "additives_text",
    "feeding_guide_text",
  ];
  return requiredWeight.filter((field) => String(row[field] ?? "").trim()).length;
}

function dedupeRows(items) {
  const byKey = new Map();
  const sidecars = new Map();
  for (const item of items) {
    const key = item.row.formula_key;
    const existing = byKey.get(key);
    if (!existing || rowCompleteness(item.row) > rowCompleteness(existing.row)) {
      byKey.set(key, item);
    }
    if (!sidecars.has(key)) sidecars.set(key, []);
    sidecars.get(key).push({
      packSize: item.packSize,
      source: item.row.data_source_url,
      sourceFile: item.row.source_notes.match(/source_file=([^;]+)/)?.[1] ?? "",
    });
  }

  const rows = [...byKey.values()].map((item) => {
    const variants = sidecars.get(item.row.formula_key) ?? [];
    const packSizes = [...new Set(variants.map((variant) => variant.packSize).filter(Boolean))];
    const skipped = Math.max(0, variants.length - 1);
    return {
      ...item.row,
      source_notes: [
        item.row.source_notes,
        packSizes.length ? `pack_sizes_seen=${packSizes.join("|")}` : "",
        skipped ? `duplicate_local_or_pack_rows_skipped=${skipped}` : "",
      ]
        .filter(Boolean)
        .join("; "),
    };
  });
  return { rows, rawCount: items.length, duplicateCount: items.length - rows.length };
}

function statusFor(row) {
  const missing = missingFields(row);
  if (!missing.length) return "importable_after_qa";
  if (row.ingredient_text && row.protein_percent && row.fat_percent && row.fiber_percent && row.ash_percent) {
    return "needs_energy_or_minor_backfill";
  }
  return "needs_backfill";
}

async function main() {
  const headers = await foodV2Headers();
  const files = await collectHtmlFiles(sourceDir);
  const parsed = [];
  const failures = [];

  for (const file of files) {
    try {
      const html = await readFile(file, "utf8");
      const item = buildProductRow(html, file, headers);
      if (item.row.brand && item.row.formula_name) parsed.push(item);
    } catch (error) {
      failures.push({
        formula_key: "",
        brand: "",
        formula_name: "",
        species: "",
        format: "",
        status: "parse_failed",
        source_url: "",
        source_file: file,
        pack_size: "",
        extracted_fields: "",
        missing_fields: "",
        notes: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const { rows, rawCount, duplicateCount } = dedupeRows(parsed);
  const reviewRows = [
    ...rows.map((row) => ({
      formula_key: row.formula_key,
      brand: row.brand,
      formula_name: row.formula_name,
      species: row.species,
      format: row.format,
      status: statusFor(row),
      source_url: row.data_source_url,
      source_file: row.source_notes.match(/source_file=([^;]+)/)?.[1] ?? "",
      pack_size: row.source_notes.match(/pack_sizes_seen=([^;]+)/)?.[1] ?? "",
      extracted_fields: extractedFields(row),
      missing_fields: missingFields(row).join("|"),
      notes: row.source_notes,
    })),
    ...failures,
  ];

  const summary = {
    htmlFilesScanned: files.length,
    rawRowsParsed: rawCount,
    formulaRowsExported: rows.length,
    duplicateLocalOrPackRowsSkipped: duplicateCount,
    parseFailures: failures.length,
    importableAfterQa: reviewRows.filter((row) => row.status === "importable_after_qa").length,
    needsEnergyOrMinorBackfill: reviewRows.filter((row) => row.status === "needs_energy_or_minor_backfill").length,
    needsBackfillOrFailed: reviewRows.filter((row) => !["importable_after_qa", "needs_energy_or_minor_backfill"].includes(row.status)).length,
    labelKcalRows: rows.filter((row) => row.source_notes.includes("label_energy_used=true")).length,
    estimatedKcalRows: rows.filter((row) => row.source_notes.includes("kcal_estimated=true")).length,
    labelAshRows: rows.filter((row) => row.source_notes.includes("label_ash_used=true")).length,
    calciumRows: rows.filter((row) => row.calcium_percent).length,
    phosphorusRows: rows.filter((row) => row.phosphorus_percent).length,
    sodiumRows: rows.filter((row) => row.sodium_percent).length,
    magnesiumRows: rows.filter((row) => row.magnesium_percent).length,
    feedingGuideRows: rows.filter((row) => row.feeding_guide_text).length,
  };

  await mkdir(path.dirname(paths.importCsv), { recursive: true });
  await mkdir(path.dirname(paths.reviewCsv), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.importCsv, writeCsv(headers, rows), "utf8");
  await writeFile(paths.reviewCsv, writeCsv(reviewHeaders, reviewRows), "utf8");
  await writeFile(
    paths.report,
    [
      "# Gatoskilo Local HTML Batch Extract",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Summary",
      "",
      ...Object.entries(summary).map(([key, value]) => `- ${key}: ${value}`),
      "",
      "## Notes",
      "",
      "- Rows are formula-level and deduped across local pack-size variants.",
      "- Retailer values are accepted as review evidence, not as verified/recommendable production rows.",
      "- Label kcal and label ash from the HTML override future estimated values during human QA/import.",
      "- Missing kcal is estimated only when proximate analysis is sufficient for a dry-food Modified Atwater estimate.",
      "",
      "## Outputs",
      "",
      `- ${paths.importCsv}`,
      `- ${paths.reviewCsv}`,
    ].join("\n"),
    "utf8",
  );

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
