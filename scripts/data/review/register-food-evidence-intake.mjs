import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const evidenceRoot =
  process.argv[2] ?? "C:/Users/NIOstb/Desktop/photo_foods_nutritail";

const paths = {
  template: "data/templates/food-document-intake-template.csv",
  intake: "data/review/food_document_intake.csv",
  report: "reports/food_document_intake_register.md",
};

const receivedAt = "2026-05-30";

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9α-ω]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function csvEscape(value) {
  if (value == null) return "";
  const text = Array.isArray(value) ? value.join("|") : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
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

function inferBrand(name) {
  const text = name.toLowerCase();
  if (text.includes("royal")) return "Royal Canin";
  if (text.includes("acana")) return "ACANA";
  if (text.includes("orijen")) return "ORIJEN";
  if (text.includes("josera")) return "Josera";
  if (text.includes("purina") || text.includes("pro plan")) return "Purina";
  if (text.includes("ambrosia")) return "Ambrosia";
  if (text.includes("belcando")) return "Belcando";
  if (text.includes("schesir") || text.includes("gheda")) return "Schesir/Gheda";
  if (text.includes("aatu")) return "AATU";
  if (text.includes("barking")) return "Barking Heads";
  if (text.includes("sam")) return "Sam's Field";
  if (text.includes("unica")) return "Unica";
  if (text.includes("prochoice")) return "Prochoice";
  return "";
}

function inferSpecies(name) {
  const text = name.toLowerCase();
  if (text.includes("cat") || text.includes("γατα") || text.includes("γάτα") || text.includes("γατας") || text.includes("γάτας")) {
    return "cat";
  }
  if (text.includes("dog") || text.includes("σκυλ") || text.includes("σκύλ")) {
    return "dog";
  }
  if (text.includes("royal")) return "dog";
  return "";
}

function sourceForExtension(extension, name) {
  const lowerName = name.toLowerCase();
  if (extension === ".pdf") {
    return { source_type: "official_pdf", source_priority: "unknown", evidence_kind: "pdf" };
  }
  if (extension === ".xlsx" || extension === ".ods") {
    return {
      source_type: lowerName.includes("eshop") || lowerName.includes("marketplace") || lowerName.includes("pareto")
        ? "authorized_retailer"
        : "unknown",
      source_priority: lowerName.includes("eshop") || lowerName.includes("marketplace") || lowerName.includes("pareto")
        ? "retailer"
        : "unknown",
      evidence_kind: "spreadsheet",
    };
  }
  if (extension === ".docx" || extension === ".odt") {
    return { source_type: "manufacturer_response", source_priority: "unknown", evidence_kind: "mixed" };
  }
  return { source_type: "unknown", source_priority: "unknown", evidence_kind: "mixed" };
}

function photoRow(directoryName, directoryPath, files) {
  const imageFiles = files.filter((file) => /\.(jpe?g|png|webp)$/i.test(file.name));
  const brand = inferBrand(directoryName);
  const species = inferSpecies(directoryName);

  return {
    intake_id: `photos-${slugify(directoryName)}`,
    received_at: receivedAt,
    brand,
    formula_name_guess: directoryName,
    species,
    market: "GR",
    locale: "el-GR",
    source_type: "pack_photo",
    source_priority: "manual_photo",
    evidence_kind: "photo_set",
    evidence_path_or_url: directoryPath,
    storage_bucket: "",
    storage_path: "",
    has_front_pack: imageFiles.length > 0 ? "yes" : "unknown",
    has_barcode: imageFiles.length >= 4 ? "yes" : "unknown",
    has_ingredients: imageFiles.length >= 4 ? "yes" : "unknown",
    has_analysis: imageFiles.length >= 5 ? "yes" : "unknown",
    has_calories: "unknown",
    has_feeding_guide: imageFiles.length >= 6 ? "yes" : "unknown",
    has_pack_weight: "unknown",
    extraction_status: imageFiles.length >= 4 ? "ready_for_extraction" : "needs_more_photos",
    assigned_to: "",
    linked_formula_key: "",
    review_priority: brand === "Royal Canin" ? "high" : "medium",
    notes: `Auto-registered local photo set with ${imageFiles.length} image files. Verify panels before extraction.`,
  };
}

function documentRow(filePath, name, extension) {
  const source = sourceForExtension(extension.toLowerCase(), name);
  const brand = inferBrand(name);

  return {
    intake_id: `doc-${slugify(path.parse(name).name)}`,
    received_at: receivedAt,
    brand,
    formula_name_guess: path.parse(name).name,
    species: inferSpecies(name),
    market: "GR",
    locale: name.toLowerCase().includes(" en ") || name.toLowerCase().includes("brochure") ? "en" : "el-GR",
    source_type: source.source_type,
    source_priority: source.source_priority,
    evidence_kind: source.evidence_kind,
    evidence_path_or_url: filePath,
    storage_bucket: "",
    storage_path: "",
    has_front_pack: "unknown",
    has_barcode: "unknown",
    has_ingredients: "unknown",
    has_analysis: "unknown",
    has_calories: "unknown",
    has_feeding_guide: "unknown",
    has_pack_weight: "unknown",
    extraction_status: "new",
    assigned_to: "",
    linked_formula_key: "",
    review_priority: brand ? "medium" : "low",
    notes: "Auto-registered local evidence document. Review source quality before extraction.",
  };
}

async function listTopLevelEvidence(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const rows = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const fullPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      const files = [];
      for (const child of await readdir(fullPath, { withFileTypes: true })) {
        if (!child.isFile()) continue;
        const childPath = path.join(fullPath, child.name);
        files.push({
          name: child.name,
          path: childPath,
          stats: await stat(childPath),
        });
      }
      rows.push(photoRow(entry.name, fullPath, files));
      continue;
    }

    if (!entry.isFile()) continue;
    rows.push(documentRow(fullPath, entry.name, path.extname(entry.name)));
  }

  return rows;
}

function writeCsv(headers, rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header])).join(","))
    .join("\n")}\n`;
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
  return `# Food Document Intake Register

Generated: ${new Date().toISOString()}

## Summary

- Evidence rows: ${rows.length}
- Intake CSV: ${paths.intake}
- Source folder: ${evidenceRoot}

## By Evidence Kind

${renderCounts(countBy(rows, "evidence_kind"))}

## By Source Type

${renderCounts(countBy(rows, "source_type"))}

## By Brand

${renderCounts(countBy(rows, "brand"))}

## Recommended Next Step

Start extraction with high-priority Royal Canin photo sets, then official-looking PDF/doc evidence by brand. Keep spreadsheet rows as retailer/supporting evidence unless a manufacturer source confirms the same values.
`;
}

async function main() {
  const templateText = await readFile(paths.template, "utf8");
  const headers = parseCsvLine(templateText.split(/\r?\n/)[0] ?? "");
  const rows = await listTopLevelEvidence(evidenceRoot);

  await mkdir(path.dirname(paths.intake), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.intake, writeCsv(headers, rows), "utf8");
  await writeFile(paths.report, renderReport(rows), "utf8");

  console.log(`Registered food evidence rows: ${rows.length}`);
  console.log(`Wrote ${paths.intake}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
