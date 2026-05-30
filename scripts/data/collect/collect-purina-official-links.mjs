import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const sourceDirectory = "C:/Users/NIOstb/Desktop/photo_foods_nutritail";

const paths = {
  registry: "data/sources/purina_official_link_registry.csv",
  candidates: "data/review/purina_official_enrichment_candidates.csv",
  report: "reports/purina_official_links.md",
};

const registryHeaders = [
  "source_group",
  "listing_url",
  "product_url",
  "product_title",
  "species",
  "brand_family",
  "source_tier",
  "source_type",
  "market",
  "status",
  "product_scope",
  "notes",
];

const candidateHeaders = [
  "brand",
  "species",
  "formula_name_guess",
  "source_group",
  "product_url",
  "product_title",
  "recommended_action",
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

function cleanText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(value) {
  return cleanText(
    String(value ?? "")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">"),
  );
}

async function resolveSourcePath() {
  const files = await readdir(sourceDirectory);
  const file = files.find((name) => name.toLowerCase() === "purina links.txt");
  if (!file) throw new Error(`Could not find purina links.txt in ${sourceDirectory}`);
  return path.join(sourceDirectory, file);
}

function parseSourceLinks(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const pairs = [];
  for (let index = 0; index < lines.length; index += 2) {
    pairs.push({ source_group: lines[index], listing_url: lines[index + 1] });
  }
  return pairs.filter((pair) => pair.source_group && pair.listing_url?.startsWith("http"));
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "NutriTail food source registry/1.0",
      accept: "text/html,application/xhtml+xml",
    },
  });
  if (!response.ok) throw new Error(`Fetch failed ${response.status} ${url}`);
  return response.text();
}

function absoluteUrl(href) {
  return new URL(decodeHtml(href), "https://www.purina.gr").toString();
}

function productLinksFromHtml(html) {
  return [
    ...new Set(
      [...html.matchAll(/href="([^"]*\/(?:cat|dog)\/(?:cat-food|dog-food)\/product-[^"]+)"/g)].map((match) =>
        absoluteUrl(match[1]),
      ),
    ),
  ].sort();
}

function nextPageUrls(html) {
  return [
    ...new Set(
      [...html.matchAll(/href="([^"]*\/(?:cat|dog)\/(?:cat-food|dog-food)\?[^"]*page=\d+[^"]*)"/g)].map((match) =>
        absoluteUrl(match[1]),
      ),
    ),
  ].sort();
}

function titleFromHtml(html) {
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (h1) return decodeHtml(h1.replace(/<[^>]+>/g, " "));
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  return decodeHtml(title.replace(/\s*\|\s*Purina GR\s*$/i, ""));
}

function speciesFromUrl(url) {
  if (url.includes("/cat/")) return "cat";
  if (url.includes("/dog/")) return "dog";
  return "";
}

function brandFamilyFor(group, title, url) {
  const text = `${group} ${title} ${url}`.toLowerCase();
  if (text.includes("veterinary") || text.includes("vet diets")) return "Purina Pro Plan Veterinary Diets";
  if (text.includes("cat chow")) return "Purina Cat Chow";
  if (text.includes("dog chow")) return "Purina Dog Chow";
  if (text.includes("proplan") || text.includes("pro plan")) return "Purina Pro Plan";
  return "Purina";
}

function formulaGuess(title) {
  return cleanText(title.replace(/^Purina\s+/i, "").replace(/^PRO PLAN\s+/i, "PRO PLAN "));
}

function productScope(title, url) {
  const text = `${title} ${url}`.toLowerCase();
  if (text.includes("supplement") || text.includes("συμπλήρω") || text.includes("fortiflora") || text.includes("chews")) {
    return "defer_supplement_or_treat";
  }
  return "complete_food_candidate";
}

async function collectListing(pair) {
  const seenPages = new Set();
  const pending = [pair.listing_url];
  const products = new Set();
  while (pending.length) {
    const pageUrl = pending.shift();
    if (!pageUrl || seenPages.has(pageUrl)) continue;
    seenPages.add(pageUrl);
    const html = await fetchText(pageUrl);
    for (const product of productLinksFromHtml(html)) products.add(product);
    for (const next of nextPageUrls(html)) {
      if (!seenPages.has(next)) pending.push(next);
    }
  }
  return [...products].sort().map((product_url) => ({ ...pair, product_url }));
}

async function enrichProduct(row) {
  const html = await fetchText(row.product_url);
  const product_title = titleFromHtml(html);
  const species = speciesFromUrl(row.product_url);
  const brand_family = brandFamilyFor(row.source_group, product_title, row.product_url);
  const scope = productScope(product_title, row.product_url);
  return {
    ...row,
    product_title,
    species,
    brand_family,
    source_tier: "official",
    source_type: "official_product_page",
    market: "GR",
    status: scope === "complete_food_candidate" ? "ready_for_manual_food_match" : "defer_not_complete_food",
    product_scope: scope,
    notes:
      scope === "complete_food_candidate"
        ? "Official Purina Greece product page discovered from user-supplied official listing URL; use to backfill data_source_url and verify nutrients before import."
        : "Official Purina Greece product page discovered, but product appears to be a supplement/treat and should not be mixed into complete-food import.",
  };
}

function candidateFromRegistry(row) {
  return {
    brand: row.brand_family,
    species: row.species,
    formula_name_guess: formulaGuess(row.product_title),
    source_group: row.source_group,
    product_url: row.product_url,
    product_title: row.product_title,
    recommended_action:
      "Match against existing Purina Food V2 rows, then use this official URL as provenance for nutrition/ingredients backfill.",
    notes: row.notes,
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
  return `# Purina Official Links Registry

Generated: ${new Date().toISOString()}

## Summary

- Source file: ${sourcePath}
- Official listing groups: ${new Set(rows.map((row) => row.source_group)).size}
- Official product URLs discovered: ${rows.length}
- Registry CSV: ${paths.registry}
- Enrichment candidates CSV: ${paths.candidates}

## By Source Group

${renderCounts(countBy(rows, "source_group"))}

## By Brand Family

${renderCounts(countBy(rows, "brand_family"))}

## By Species

${renderCounts(countBy(rows, "species"))}

## By Product Scope

${renderCounts(countBy(rows, "product_scope"))}

## Operating Rule

This registry is official-source provenance, not an automatic nutrition import. Each URL should be matched to an existing or staged Purina food row, then reviewed before any ingredient or nutrient values are committed.
`;
}

async function main() {
  const sourcePath = await resolveSourcePath();
  const pairs = parseSourceLinks(await readFile(sourcePath, "utf8"));
  const discovered = [];
  for (const pair of pairs) {
    discovered.push(...(await collectListing(pair)));
  }
  const deduped = [...new Map(discovered.map((row) => [row.product_url, row])).values()];
  const enriched = [];
  for (const row of deduped) {
    enriched.push(await enrichProduct(row));
  }
  enriched.sort((a, b) => a.species.localeCompare(b.species) || a.brand_family.localeCompare(b.brand_family) || a.product_title.localeCompare(b.product_title));

  await mkdir(path.dirname(paths.registry), { recursive: true });
  await mkdir(path.dirname(paths.candidates), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.registry, writeCsv(registryHeaders, enriched), "utf8");
  await writeFile(paths.candidates, writeCsv(candidateHeaders, enriched.map(candidateFromRegistry)), "utf8");
  await writeFile(paths.report, renderReport(enriched, sourcePath), "utf8");

  console.log(`Purina official product URLs: ${enriched.length}`);
  console.log(`Wrote ${paths.registry}`);
  console.log(`Wrote ${paths.candidates}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
