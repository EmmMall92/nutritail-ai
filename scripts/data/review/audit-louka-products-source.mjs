import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

const sourceDirectory = "C:/Users/NIOstb/Desktop/photo_foods_nutritail";

const paths = {
  output: "data/review/louka_products_source_audit.csv",
  report: "reports/louka_products_source_audit.md",
};

const headers = [
  "source_sheet",
  "source_code",
  "source_description",
  "eshop_title",
  "source_brand",
  "decision",
  "reason",
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
    if (buffer.readUInt32LE(centralDirectoryOffset) !== 0x02014b50) throw new Error("Invalid XLSX central directory.");
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

function cleanText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
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

function decisionFor(sheetName) {
  if (sheetName.includes("ΛΙΧΟΥΔΙΕΣ")) {
    return {
      decision: "defer_treats_workflow",
      reason: "Treat/snack products are outside the current complete-food Food V2 nutrition import scope.",
      recommended_action: "Keep for a future treats/supplements catalog after complete food ingestion is stable.",
    };
  }
  return {
    decision: "exclude_non_food",
    reason: "Accessory rows are not pet food nutrition records.",
    recommended_action: "Do not import into Food V2; keep only as source audit evidence.",
  };
}

function rowFromSheet(sheetName, row, sourcePath) {
  const decision = decisionFor(sheetName);
  return {
    source_sheet: sheetName,
    source_code: row[1] ?? "",
    source_description: row[2] ?? "",
    eshop_title: row[3] ?? "",
    source_brand: row[7] ?? "",
    source_document: sourcePath.replace(/\\/g, "/"),
    ...decision,
  };
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

function renderReport(rows, sourcePath) {
  return `# Louka Products Source Audit

Generated: ${new Date().toISOString()}

## Summary

- Source spreadsheet: ${sourcePath}
- Audited rows: ${rows.length}
- Output CSV: ${paths.output}

## By Decision

${renderCounts(countBy(rows, "decision"))}

## By Sheet

${renderCounts(countBy(rows, "source_sheet"))}

## Import Decision

This source file is intentionally excluded from the current Food V2 complete-food nutrition import. It contains accessories plus treats/snacks, not complete dry/wet food formula rows. Treats can become a future catalog workflow, but they should not be mixed into the current nutrition database.
`;
}

async function resolveSourcePath() {
  if (process.argv[2]) return process.argv[2];
  const files = await readdir(sourceDirectory);
  const file = files.find((name) => name.includes("ΛΟΥΚΑ") && name.endsWith(".xlsx"));
  if (!file) throw new Error(`Could not find Louka products spreadsheet in ${sourceDirectory}`);
  return path.join(sourceDirectory, file);
}

async function main() {
  const sourcePath = await resolveSourcePath();
  const entries = zipEntries(await readFile(sourcePath));
  const strings = sharedStrings(entries);
  const rows = [];
  for (const sheet of workbookSheets(entries)) {
    rows.push(
      ...sheetRows(entries, sheet.path, strings)
        .slice(1)
        .map((row) => rowFromSheet(sheet.name, row, sourcePath))
        .filter((row) => row.source_code || row.source_description || row.eshop_title),
    );
  }
  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(rows), "utf8");
  await writeFile(paths.report, renderReport(rows, sourcePath), "utf8");
  console.log(`Louka products audited rows: ${rows.length}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
