import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const defaultSourceDir =
  "C:/Users/NIOstb/Desktop/photo_foods_nutritail/nutrital links";

const sourceDir = process.argv[2] || defaultSourceDir;

const paths = {
  csv: "data/review/local_html_intake_audit.csv",
  report: "reports/local_html_intake_audit.md",
};

const headers = [
  "source_file",
  "extension",
  "title",
  "source_url",
  "source_domain",
  "probable_food_page",
  "has_ingredients",
  "has_analysis",
  "has_kcal",
  "has_ash",
  "has_minerals",
  "has_feeding_guide",
  "duplicate_url_count",
  "duplicate_title_count",
  "readiness",
  "notes",
];

const foodSignals = [
  "τροφή",
  "τροφ",
  "food",
  "kibble",
  "κροκέτα",
  "ξηρά",
  "dry",
  "dog",
  "cat",
  "σκύλ",
  "γάτ",
  "σκυλ",
  "γατ",
];

const ingredientSignals = [
  "συστατικά",
  "σύνθεση",
  "συνθεση",
  "composition",
  "ingredients",
  "ingredient",
];

const analysisSignals = [
  "αναλυτικά συστατικά",
  "αναλυτικα συστατικα",
  "analytical constituents",
  "analytical components",
  "guaranteed analysis",
  "analysis",
  "πρωτεΐνη",
  "πρωτεινη",
  "protein",
  "λιπαρά",
  "λιπαρα",
  "fat",
];

const kcalSignals = [
  "kcal",
  "θερμίδες",
  "θερμιδες",
  "μεταβολιστέα ενέργεια",
  "μεταβολιστεα ενεργεια",
  "metabolisable energy",
  "metabolizable energy",
  "energy",
];

const ashSignals = ["τέφρα", "τεφρα", "ash", "τέφρας", "τεφρας"];

const mineralSignals = [
  "calcium",
  "ασβέστιο",
  "ασβεστιο",
  "phosphorus",
  "φώσφορος",
  "φωσφορος",
  "sodium",
  "νάτριο",
  "νατριο",
  "magnesium",
  "μαγνήσιο",
  "μαγνησιο",
];

const feedingSignals = [
  "οδηγίες ταΐσματος",
  "οδηγιες ταισματος",
  "δοσολογία",
  "δοσολογια",
  "feeding guide",
  "feeding table",
  "feeding instructions",
  "recommended daily allowance",
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

function decodeHtml(value) {
  return String(value ?? "")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;/g, "'")
    .replace(/&ndash;|&mdash;/g, "-")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value) {
  return decodeHtml(
    String(value ?? "")
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|li|td|tr|h\d|div|section)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .normalize("NFC")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return stripTags(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function includesAny(text, signals) {
  return signals.some((signal) => text.includes(signal));
}

function titleFromHtml(html, filePath) {
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (h1) return stripTags(h1);

  const meta = html.match(
    /<meta\b[^>]*(?:property|name)=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i
  )?.[1];
  if (meta) return stripTags(meta);

  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
  if (title) return stripTags(title);

  return path.basename(filePath).replace(/\.(?:html?|mhtml?|mht)$/i, "");
}

function sourceUrlFromHtml(html) {
  return (
    html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] ??
    html.match(/<meta\b[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] ??
    html.match(/https?:\/\/[^\s"'<>]+/i)?.[0] ??
    ""
  );
}

function sourceDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
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

function classifyReadiness(row) {
  if (row.probable_food_page !== "yes") return "not_food_page";
  if (row.has_ingredients === "yes" && row.has_analysis === "yes" && row.has_kcal === "yes") {
    return "strong_import_candidate";
  }
  if (row.has_ingredients === "yes" && row.has_analysis === "yes") {
    return "import_candidate_needs_kcal_or_estimate";
  }
  if (row.has_ingredients === "yes" || row.has_analysis === "yes") {
    return "partial_review";
  }
  return "weak_review";
}

function buildNotes(row) {
  const notes = [];
  if (row.duplicate_url_count > 1) notes.push("duplicate_source_url");
  if (row.duplicate_title_count > 1) notes.push("duplicate_title_or_pack_variant");
  if (row.has_kcal !== "yes") notes.push("missing_kcal");
  if (row.has_ash !== "yes") notes.push("missing_ash");
  if (row.has_feeding_guide === "yes") notes.push("feeding_guide_available");
  return notes.join("|");
}

async function main() {
  const files = await collectHtmlFiles(sourceDir);
  const rows = [];

  for (const file of files) {
    const html = await readFile(file, "utf8");
    const title = titleFromHtml(html, file);
    const sourceUrl = sourceUrlFromHtml(html);
    const normalized = normalizeText(`${title} ${html}`);

    rows.push({
      source_file: file,
      extension: path.extname(file).replace(/^\./, "").toLowerCase(),
      title,
      source_url: sourceUrl,
      source_domain: sourceDomain(sourceUrl),
      probable_food_page: includesAny(normalized, foodSignals) ? "yes" : "no",
      has_ingredients: includesAny(normalized, ingredientSignals) ? "yes" : "no",
      has_analysis: includesAny(normalized, analysisSignals) ? "yes" : "no",
      has_kcal: includesAny(normalized, kcalSignals) ? "yes" : "no",
      has_ash: includesAny(normalized, ashSignals) ? "yes" : "no",
      has_minerals: includesAny(normalized, mineralSignals) ? "yes" : "no",
      has_feeding_guide: includesAny(normalized, feedingSignals) ? "yes" : "no",
      duplicate_url_count: 0,
      duplicate_title_count: 0,
      readiness: "",
      notes: "",
    });
  }

  const urlCounts = new Map();
  const titleCounts = new Map();
  rows.forEach((row) => {
    if (row.source_url) {
      urlCounts.set(row.source_url, (urlCounts.get(row.source_url) ?? 0) + 1);
    }
    const titleKey = row.title.toLowerCase().replace(/\b\d+(?:[.,]\d+)?\s*kg\b/g, "").trim();
    if (titleKey) titleCounts.set(titleKey, (titleCounts.get(titleKey) ?? 0) + 1);
  });

  rows.forEach((row) => {
    const titleKey = row.title.toLowerCase().replace(/\b\d+(?:[.,]\d+)?\s*kg\b/g, "").trim();
    row.duplicate_url_count = row.source_url ? urlCounts.get(row.source_url) ?? 0 : 0;
    row.duplicate_title_count = titleKey ? titleCounts.get(titleKey) ?? 0 : 0;
    row.readiness = classifyReadiness(row);
    row.notes = buildNotes(row);
  });

  const readinessCounts = rows.reduce((acc, row) => {
    acc[row.readiness] = (acc[row.readiness] ?? 0) + 1;
    return acc;
  }, {});
  const domainCounts = rows.reduce((acc, row) => {
    const domain = row.source_domain || "unknown";
    acc[domain] = (acc[domain] ?? 0) + 1;
    return acc;
  }, {});

  await mkdir("data/review", { recursive: true });
  await mkdir("reports", { recursive: true });
  await writeFile(paths.csv, writeCsv(rows), "utf8");
  await writeFile(
    paths.report,
    [
      "# Local HTML Intake Audit",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Summary",
      "",
      `- Source folder: ${sourceDir}`,
      `- HTML/MHTML files scanned: ${rows.length}`,
      `- Probable food pages: ${rows.filter((row) => row.probable_food_page === "yes").length}`,
      `- With ingredients/composition signals: ${rows.filter((row) => row.has_ingredients === "yes").length}`,
      `- With analysis signals: ${rows.filter((row) => row.has_analysis === "yes").length}`,
      `- With kcal/energy signals: ${rows.filter((row) => row.has_kcal === "yes").length}`,
      `- With ash signals: ${rows.filter((row) => row.has_ash === "yes").length}`,
      `- With mineral signals: ${rows.filter((row) => row.has_minerals === "yes").length}`,
      `- With feeding guide signals: ${rows.filter((row) => row.has_feeding_guide === "yes").length}`,
      "",
      "## Readiness",
      "",
      ...Object.entries(readinessCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([key, value]) => `- ${key}: ${value}`),
      "",
      "## Domains",
      "",
      ...Object.entries(domainCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([key, value]) => `- ${key}: ${value}`),
      "",
      "## Outputs",
      "",
      `- ${paths.csv}`,
    ].join("\n"),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        filesScanned: rows.length,
        probableFoodPages: rows.filter((row) => row.probable_food_page === "yes").length,
        readinessCounts,
        output: paths.csv,
        report: paths.report,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
