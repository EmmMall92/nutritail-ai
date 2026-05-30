import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const photoRoot = "C:/Users/NIOstb/Desktop/photo_foods_nutritail";

const paths = {
  index: "data/review/royal_canin_photo_panel_index.csv",
  report: "reports/royal_canin_photo_panel_index.md",
};

const headers = [
  "formula_guess",
  "species_guess",
  "folder_path",
  "file_name",
  "panel_guess",
  "sort_order",
  "file_size_bytes",
  "review_action",
];

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header])).join(","))
    .join("\n")}\n`;
}

function formulaGuess(folderName) {
  return folderName.replace(/^royal\s+/i, "Royal Canin ");
}

function speciesGuess(folderName) {
  return folderName.toLowerCase().includes("cat") ? "cat" : "dog";
}

function orderFromName(fileName) {
  const match = fileName.match(/-(\d+)\./);
  if (match) return Number(match[1]);
  if (/\.png$/i.test(fileName)) return 99;
  if (/\.jpe?g$/i.test(fileName)) return 98;
  return 999;
}

function panelGuess(fileName) {
  const order = orderFromName(fileName);
  if (order === 1) return "benefits_or_claims";
  if (order === 2) return "kibble_or_detail";
  if (order === 3) return "pack_front_or_range";
  if (order === 4) return "feeding_guide";
  if (order === 5) return "analysis_and_composition";
  if (order === 6) return "pack_front";
  if (order === 7) return "pack_or_barcode_candidate";
  if (order === 8) return "pack_or_barcode_candidate";
  if (order === 9) return "pack_or_barcode_candidate";
  if (order === 99) return "product_image";
  return "unknown";
}

function reviewAction(panel) {
  if (panel === "analysis_and_composition") {
    return "Open first for ingredients and analytical constituents transcription.";
  }
  if (panel === "feeding_guide") {
    return "Open for feeding table; check whether calories or pack weight are visible.";
  }
  if (panel.includes("barcode")) {
    return "Open for barcode/EAN and exact pack identity.";
  }
  if (panel === "pack_front" || panel === "pack_front_or_range") {
    return "Open for formula identity, species, life stage, and pack artwork confirmation.";
  }
  return "Use as supporting evidence only.";
}

async function buildRows() {
  const entries = await readdir(photoRoot, { withFileTypes: true });
  const rows = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    if (!entry.name.toLowerCase().startsWith("royal ")) continue;

    const folderPath = path.join(photoRoot, entry.name);
    const files = await readdir(folderPath, { withFileTypes: true });
    const imageFiles = files
      .filter((file) => file.isFile() && /\.(jpe?g|png|webp)$/i.test(file.name))
      .sort((a, b) => orderFromName(a.name) - orderFromName(b.name) || a.name.localeCompare(b.name));

    for (const file of imageFiles) {
      const filePath = path.join(folderPath, file.name);
      const stats = await stat(filePath);
      const panel = panelGuess(file.name);
      rows.push({
        formula_guess: formulaGuess(entry.name),
        species_guess: speciesGuess(entry.name),
        folder_path: folderPath.replace(/\\/g, "/"),
        file_name: file.name,
        panel_guess: panel,
        sort_order: orderFromName(file.name),
        file_size_bytes: stats.size,
        review_action: reviewAction(panel),
      });
    }
  }

  return rows;
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
  const formulas = new Set(rows.map((row) => row.formula_guess));
  return `# Royal Canin Photo Panel Index

Generated: ${new Date().toISOString()}

## Summary

- Formula folders: ${formulas.size}
- Image rows: ${rows.length}
- Output CSV: ${paths.index}

## By Species

${renderCounts(countBy(rows, "species_guess"))}

## By Panel Guess

${renderCounts(countBy(rows, "panel_guess"))}

## Review Order

1. Open analysis_and_composition rows first.
2. Open pack_or_barcode_candidate rows second.
3. Use feeding_guide rows for feeding table and possible calories.
4. Use front/product images only for identity confirmation.
`;
}

async function main() {
  const rows = await buildRows();
  await mkdir(path.dirname(paths.index), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.index, writeCsv(rows), "utf8");
  await writeFile(paths.report, renderReport(rows), "utf8");
  console.log(`Royal Canin photo panel rows: ${rows.length}`);
  console.log(`Wrote ${paths.index}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
