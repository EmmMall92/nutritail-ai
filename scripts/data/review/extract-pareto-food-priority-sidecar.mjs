import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

const sourceDirectory = "C:/Users/NIOstb/Desktop/photo_foods_nutritail";

const paths = {
  output: "data/review/pareto_food_priority_sidecar.csv",
  report: "reports/pareto_food_priority_sidecar.md",
};

const headers = [
  "source_sheet",
  "source_code",
  "source_description",
  "formula_name",
  "brand",
  "species",
  "format",
  "life_stage",
  "size_class",
  "category_tags",
  "quantity",
  "value",
  "revenue_share_percent",
  "pareto_percent",
  "formula_key_guess",
  "has_eshop_title",
  "has_eshop_detail",
  "review_priority",
  "recommended_action",
  "source_document",
];

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header] ?? "")).join(","))
    .join("\n")}\n`;
}

function decodeXml(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function zipEntries(buffer) {
  const entries = new Map();
  let eocdOffset = -1;
  for (let index = buffer.length - 22; index >= 0; index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      eocdOffset = index;
      break;
    }
  }
  if (eocdOffset === -1) throw new Error("Could not find XLSX central directory.");
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  let centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  for (let entryIndex = 0; entryIndex < totalEntries; entryIndex += 1) {
    if (buffer.readUInt32LE(centralDirectoryOffset) !== 0x02014b50) {
      throw new Error("Invalid XLSX central directory entry.");
    }
    const compressionMethod = buffer.readUInt16LE(centralDirectoryOffset + 10);
    const compressedSize = buffer.readUInt32LE(centralDirectoryOffset + 20);
    const fileNameLength = buffer.readUInt16LE(centralDirectoryOffset + 28);
    const extraLength = buffer.readUInt16LE(centralDirectoryOffset + 30);
    const commentLength = buffer.readUInt16LE(centralDirectoryOffset + 32);
    const localHeaderOffset = buffer.readUInt32LE(centralDirectoryOffset + 42);
    const fileName = buffer
      .subarray(centralDirectoryOffset + 46, centralDirectoryOffset + 46 + fileNameLength)
      .toString("utf8");
    const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
    entries.set(
      fileName,
      compressionMethod === 8 ? inflateRawSync(compressed).toString("utf8") : compressed.toString("utf8"),
    );
    centralDirectoryOffset += 46 + fileNameLength + extraLength + commentLength;
  }
  return entries;
}

function sharedStrings(entries) {
  const xml = entries.get("xl/sharedStrings.xml");
  if (!xml) return [];
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) =>
    decodeXml(
      [...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
        .map((textMatch) => textMatch[1])
        .join("")
        .replace(/\s+/g, " ")
        .trim(),
    ),
  );
}

function workbookSheets(entries) {
  const workbook = entries.get("xl/workbook.xml") ?? "";
  const rels = entries.get("xl/_rels/workbook.xml.rels") ?? "";
  const relationshipTargets = new Map(
    [...rels.matchAll(/<Relationship\b([^>]+)>/g)].map((match) => {
      const attrs = Object.fromEntries([...match[1].matchAll(/(\w+)="([^"]*)"/g)].map((attr) => [attr[1], attr[2]]));
      const target = attrs.Target?.replace(/^\/?xl\//u, "") ?? "";
      return [attrs.Id, target.startsWith("xl/") ? target : `xl/${target}`];
    }),
  );
  return [...workbook.matchAll(/<sheet\b([^>]+)>/g)].map((match) => {
    const attrs = Object.fromEntries([...match[1].matchAll(/([\w:]+)="([^"]*)"/g)].map((attr) => [attr[1], attr[2]]));
    return { name: decodeXml(attrs.name ?? ""), path: relationshipTargets.get(attrs["r:id"]) ?? "" };
  });
}

function columnIndex(cellRef) {
  const letters = cellRef.match(/[A-Z]+/u)?.[0] ?? "A";
  return [...letters].reduce((sum, letter) => sum * 26 + (letter.charCodeAt(0) - 64), 0) - 1;
}

function sheetRows(entries, sheetPath, strings) {
  const xml = entries.get(sheetPath);
  if (!xml) return [];
  return [...xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map((rowMatch) => {
    const values = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = Object.fromEntries([...cellMatch[1].matchAll(/(\w+)="([^"]*)"/g)].map((attr) => [attr[1], attr[2]]));
      const index = columnIndex(attrs.r ?? "A1");
      const raw = cellMatch[2].match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
      const inline = cellMatch[2].match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] ?? "";
      values[index] = attrs.t === "s" ? strings[Number(raw)] ?? "" : decodeXml(inline || raw);
    }
    return values.map((value) => cleanText(value));
  });
}

function cleanText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
}

function normalizedText(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugify(value) {
  return normalizedText(value)
    .replace(/[^a-z0-9\u0370-\u03ff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function removePackSize(value) {
  return cleanText(value.replace(/\b\d+(?:[,.]\d+)?\s*(?:kg|gr|g)\b/giu, "").replace(/\s+/g, " "));
}

function cleanFormulaName(value) {
  return removePackSize(
    cleanText(value)
      .replace(/^ξηρα(?:\s+τροφη)?\.?\s*(?:σκ|γ)?\s*/iu, "")
      .replace(/^ξηρα\.(?:σκ|γ)\s*/iu, "")
      .replace(/^τροφη\s+(?:σκυλου|γατας)\s*/iu, "")
      .replace(/^κονσερβα\s*/iu, "")
      .replace(/^φακελακια?\s*\/?\s*pouch\s*/iu, "")
      .replace(/^σαλαμι\s*/iu, ""),
  );
}

function isMeaningfulTitle(value) {
  const text = cleanText(value);
  if (!text || text === "-" || text === "Υπαρχει") return false;
  if (/^\d+(?:[,.]\d+)?$/u.test(text)) return false;
  return /[A-Za-zΑ-Ωα-ω]/u.test(text);
}

function isFoodDescription(value) {
  const text = normalizedText(value);
  return (
    text.includes("ξηρα") ||
    text.includes("ξηρ.") ||
    text.includes("τροφη") ||
    text.includes("κονσερβα") ||
    text.includes("φακελα") ||
    text.includes("pouch") ||
    text.includes("σαλαμ") ||
    text.includes("barf")
  );
}

function isExcludedNonFood(value) {
  const text = normalizedText(value);
  return [
    "σαμπουαν",
    "shampoo",
    "conditioner",
    "spray",
    "λουρι",
    "collar",
    "οδηγος",
    "leash",
    "παιχνιδ",
    "toy",
    "κρεβατ",
    "bed",
    "αμμος",
    "litter",
    "μπολ",
    "bowl",
    "plant",
  ].some((needle) => text.includes(needle));
}

function normalizeNumber(value) {
  const text = String(value ?? "").replace(",", ".").trim();
  const number = Number(text);
  if (!Number.isFinite(number)) return "";
  return String(Math.round(number * 10000) / 10000);
}

function normalizeBrand(value, title) {
  const raw = cleanText(value);
  const inferred = brandFromText(title);
  const brand = raw && raw !== "-" ? raw : inferred || cleanFormulaName(title).split(/\s+/u)[0] || "Unknown";
  return brand
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bAcana\b/g, "ACANA")
    .replace(/\bAatu\b/g, "AATU")
    .replace(/\bOrijen\b/g, "ORIJEN")
    .replace(/\bPurina\b/g, "Purina")
    .replace(/\bRoyal Canin\b/g, "Royal Canin")
    .replace(/\bHill'S\b/g, "Hill's")
    .replace(/\bNature'S Food\b/g, "Nature's Food")
    .replace(/\bSam'S Field\b/g, "Sam's Field")
    .replace(/\bBelcnado\b/g, "Belcando")
    .replace(/\bDr\. Clauders\b/g, "Dr. Clauder's");
}

function brandFromText(value) {
  const text = normalizedText(value);
  const brands = [
    ["royal canin", "Royal Canin"],
    ["royal vhn", "Royal Canin"],
    ["royal cat", "Royal Canin"],
    ["royal gastro", "Royal Canin"],
    ["royal ", "Royal Canin"],
    ["purina", "Purina"],
    ["pro plan", "Purina"],
    ["acana", "ACANA"],
    ["orijen", "ORIJEN"],
    ["hill", "Hill's"],
    ["josera", "Josera"],
    ["schesir", "Schesir"],
    ["gheda", "Gheda"],
    ["gemon", "Gemon"],
    ["ambrosia", "Ambrosia"],
    ["belcando", "Belcando"],
    ["sam's field", "Sam's Field"],
    ["sams field", "Sam's Field"],
    ["barking heads", "Barking Heads"],
    ["meowing heads", "Meowing Heads"],
    ["aatu", "AATU"],
    ["flatazor", "Flatazor"],
    ["prestige", "Flatazor"],
    ["reflex", "Reflex"],
    ["leonardo", "Leonardo"],
    ["whiskas", "Whiskas"],
    ["sheba", "Sheba"],
    ["kitekat", "Kitekat"],
    ["animonda", "Animonda"],
    ["dr. clauder", "Dr. Clauder's"],
    ["dog & dog", "Dog & Dog"],
    ["cat & co", "Cat & Co"],
    ["unica classe", "Unica Classe"],
    ["unica natura", "Unica Natura"],
    ["proper ", "Gheda"],
  ];
  return brands.find(([needle]) => text.includes(needle))?.[1] ?? "";
}

function normalizeSpecies(value, title, description) {
  const text = normalizedText(`${value} ${title} ${description}`);
  if (text.includes("γατα") || text.includes("cat") || text.includes("kitten")) return "cat";
  if (text.includes("σκυλος") || text.includes("dog") || text.includes("puppy")) return "dog";
  return "";
}

function normalizeFormat(value, title, description) {
  const text = normalizedText(`${value} ${title} ${description}`);
  if (text.includes("ξηρα") || text.includes("ξηρ.") || text.includes("dry")) return "dry";
  if (text.includes("barf") || text.includes("raw")) return "raw";
  if (text.includes("κονσερβα") || text.includes("φακελα") || text.includes("pouch") || text.includes("σαλαμ")) {
    return "wet";
  }
  return "";
}

function normalizeLifeStage(value, title) {
  const text = normalizedText(`${value} ${title}`);
  if (text.includes("puppy") || text.includes("junior")) return "puppy";
  if (text.includes("kitten")) return "kitten";
  if (text.includes("senior") || text.includes("ageing")) return "senior";
  if (text.includes("all life")) return "all_life_stages";
  if (text.includes("adult")) return "adult";
  return "";
}

function normalizeSize(value, species) {
  if (species !== "dog") return "";
  const text = normalizedText(value);
  if (text.includes("mini") || text.includes("small")) return "small";
  if (text.includes("medium")) return "medium";
  if (text.includes("large") || text.includes("maxi")) return "large";
  if (text.includes("giant")) return "giant";
  if (text.includes("all")) return "all";
  return "";
}

function tagsFrom(values) {
  return [...new Set(values.map(cleanText).filter(Boolean).filter((value) => value !== "-"))].join(";");
}

function priorityFor(row) {
  const pareto = Number(row.pareto_percent || 999);
  const revenueShare = Number(row.revenue_share_percent || 0);
  const missingContent = row.has_eshop_title !== "yes" || row.has_eshop_detail !== "yes";
  if (pareto > 0 && pareto <= 0.8) return missingContent ? "high_content_gap" : "high_review";
  if (revenueShare >= 0.005) return missingContent ? "medium_content_gap" : "medium_review";
  return missingContent ? "low_content_gap" : "low_review";
}

function actionFor(row) {
  if (row.review_priority.includes("content_gap")) {
    return "Fill missing e-shop/product content first, then attach official nutrition source before Food V2 import.";
  }
  return "Use as review priority signal only; verify nutrition from official source or label before import.";
}

function rowFromWideSheet(sheetName, row, sourcePath) {
  const title = isMeaningfulTitle(row[7]) ? row[7] : row[2] || "";
  const description = row[2] || "";
  const brand = normalizeBrand(row[12], title);
  const species = normalizeSpecies(row[16], title, description);
  const format = normalizeFormat(row[19], title, description);
  const formulaName = cleanFormulaName(title || description);
  const result = {
    source_sheet: sheetName,
    source_code: row[1] ?? "",
    source_description: description,
    formula_name: formulaName,
    brand,
    species,
    format,
    life_stage: normalizeLifeStage(row[20], title),
    size_class: normalizeSize(row[22], species),
    category_tags: tagsFrom([row[21], row[23], row[24], row[25], row[26], row[27], row[28]]),
    quantity: normalizeNumber(row[3]),
    value: normalizeNumber(row[4]),
    revenue_share_percent: normalizeNumber(row[5]),
    pareto_percent: normalizeNumber(row[6]),
    formula_key_guess: `${slugify(brand)}-${slugify(formulaName)}-${species || "unknown"}-${format || "unknown"}-gr-pareto`,
    has_eshop_title: isMeaningfulTitle(row[7]) ? "yes" : "no",
    has_eshop_detail: row[10] && row[10] !== "-" ? "yes" : "no",
    source_document: sourcePath.replace(/\\/g, "/"),
  };
  result.review_priority = priorityFor(result);
  result.recommended_action = actionFor(result);
  return result;
}

function rowFromCatalogSheet(sheetName, row, sourcePath) {
  const title = row[2] || "";
  const brand = normalizeBrand(sheetName === "ΓΑΤΑ" ? row[7] : row[6], title);
  const species = normalizeSpecies(sheetName === "ΓΑΤΑ" ? row[11] : row[10], title, row[3]);
  const format = normalizeFormat(sheetName === "ΓΑΤΑ" ? row[13] : row[13], title, row[3]);
  const formulaName = cleanFormulaName(title);
  const result = {
    source_sheet: sheetName,
    source_code: row[1] ?? "",
    source_description: title,
    formula_name: formulaName,
    brand,
    species,
    format,
    life_stage: normalizeLifeStage(sheetName === "ΓΑΤΑ" ? row[14] : row[14], title),
    size_class: normalizeSize(sheetName === "ΓΑΤΑ" ? row[16] : row[16], species),
    category_tags: tagsFrom(sheetName === "ΓΑΤΑ" ? [row[15], row[17], row[18], row[19], row[20], row[21], row[22]] : [row[15], row[17], row[18], row[19], row[20], row[21], row[22]]),
    quantity: "",
    value: "",
    revenue_share_percent: "",
    pareto_percent: "",
    formula_key_guess: `${slugify(brand)}-${slugify(formulaName)}-${species || "unknown"}-${format || "unknown"}-gr-pareto-catalog`,
    has_eshop_title: title && title !== "-" ? "yes" : "no",
    has_eshop_detail: (sheetName === "ΓΑΤΑ" ? row[5] : row[4]) && (sheetName === "ΓΑΤΑ" ? row[5] : row[4]) !== "-" ? "yes" : "no",
    source_document: sourcePath.replace(/\\/g, "/"),
  };
  result.review_priority = priorityFor(result);
  result.recommended_action = actionFor(result);
  return result;
}

function isFoodRow(row) {
  return (
    row.formula_name &&
    row.brand &&
    row.species &&
    row.format &&
    isFoodDescription(`${row.source_description} ${row.formula_name} ${row.format}`) &&
    !isExcludedNonFood(`${row.source_description} ${row.formula_name}`)
  );
}

function dedupeRows(rows) {
  const seen = new Set();
  const deduped = [];
  for (const row of rows) {
    const key = `${row.source_sheet}|${row.formula_key_guess}|${row.source_code}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }
  return deduped;
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

function renderReport(rows, rawRows, sourcePath) {
  return `# Pareto Food Priority Sidecar

Generated: ${new Date().toISOString()}

## Summary

- Source spreadsheet: ${sourcePath}
- Raw rows inspected: ${rawRows}
- Food priority sidecar rows: ${rows.length}
- Output CSV: ${paths.output}

## By Review Priority

${renderCounts(countBy(rows, "review_priority"))}

## By Species

${renderCounts(countBy(rows, "species"))}

## By Format

${renderCounts(countBy(rows, "format"))}

## By Sheet

${renderCounts(countBy(rows, "source_sheet"))}

## Operating Rule

This file is not a nutrition import. It is a review-priority sidecar for deciding which food rows should be cleaned, sourced, and validated first. Nutrition values still need official sources or label evidence before Food V2 import.
`;
}

async function resolveSourcePath() {
  if (process.argv[2]) return process.argv[2];
  const files = await readdir(sourceDirectory);
  const file = files.find((name) => name.startsWith("Pareto") && name.endsWith(".xlsx"));
  if (!file) throw new Error(`Could not find Pareto spreadsheet in ${sourceDirectory}`);
  return path.join(sourceDirectory, file);
}

async function main() {
  const sourcePath = await resolveSourcePath();
  const entries = zipEntries(await readFile(sourcePath));
  const strings = sharedStrings(entries);
  const sheets = workbookSheets(entries);
  const rows = [];
  let rawRows = 0;

  for (const sheet of sheets) {
    const sheetData = sheetRows(entries, sheet.path, strings);
    rawRows += Math.max(0, sheetData.length - 1);
    for (const row of sheetData.slice(1)) {
      const candidate =
        sheet.name === "Sheet1"
          ? rowFromWideSheet(sheet.name, row, sourcePath)
          : rowFromCatalogSheet(sheet.name, row, sourcePath);
      if (isFoodRow(candidate)) rows.push(candidate);
    }
  }

  const deduped = dedupeRows(rows).sort(
    (a, b) =>
      a.review_priority.localeCompare(b.review_priority) ||
      Number(a.pareto_percent || 999) - Number(b.pareto_percent || 999) ||
      a.brand.localeCompare(b.brand) ||
      a.formula_name.localeCompare(b.formula_name),
  );

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(deduped), "utf8");
  await writeFile(paths.report, renderReport(deduped, rawRows, sourcePath), "utf8");

  console.log(`Pareto food priority rows: ${deduped.length}`);
  console.log(`Raw rows inspected: ${rawRows}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
