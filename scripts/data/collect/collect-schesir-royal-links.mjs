import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const sourceDirectory = "C:/Users/NIOstb/Desktop/photo_foods_nutritail";

const paths = {
  registry: "data/sources/schesir_royal_link_registry.csv",
  candidates: "data/review/schesir_royal_enrichment_candidates.csv",
  report: "reports/schesir_royal_links.md",
};

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
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(value) {
  return cleanText(
    String(value ?? "")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#039;|&#39;/g, "'")
      .replace(/&ndash;/g, "-")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">"),
  );
}

async function resolveSourcePath() {
  const files = await readdir(sourceDirectory);
  const file = files.find((name) => name.toLowerCase() === "schesir-royal links.txt");
  if (!file) throw new Error(`Could not find schesir-royal links.txt in ${sourceDirectory}`);
  return path.join(sourceDirectory, file);
}

function parseSourceLinks(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("http"))
    .map((listing_url) => ({
      source_group: sourceGroupForUrl(listing_url),
      listing_url,
    }));
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "NutriTail Schesir Royal link registry/1.0",
      accept: "text/html,application/xhtml+xml",
    },
  });
  if (!response.ok) throw new Error(`Fetch failed ${response.status} ${url}`);
  return response.text();
}

async function fetchTextOrEmpty(url) {
  try {
    return await fetchText(url);
  } catch (error) {
    console.warn(error instanceof Error ? error.message : `Fetch failed ${url}`);
    return "";
  }
}

function sourceGroupForUrl(url) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  if (host.includes("royalcanin")) return "royal canin official gr";
  if (host.includes("schesir")) return "schesir official";
  if (host.includes("gatoskilo")) return "gatoskilo retailer";
  if (host.includes("kompa")) return "kompa distributor";
  if (host.includes("aigan")) return "aigan retailer";
  return host;
}

function sourceTypeForUrl(url) {
  const parsed = new URL(url);
  const host = parsed.hostname;
  if (host.includes("royalcanin.com")) return "official_listing_page";
  if (host.includes("schesir.com") && parsed.pathname.includes("/products/")) return "official_product_page";
  if (host.includes("schesir.com")) return "official_collection_page";
  if (host.includes("kompa.gr")) return "distributor_listing_page";
  return "retailer_listing_page";
}

function sourceTierForUrl(url) {
  const host = new URL(url).hostname;
  if (host.includes("royalcanin.com") || host.includes("schesir.com")) return "official";
  if (host.includes("kompa.gr")) return "distributor";
  return "retailer";
}

function brandForUrl(url, title = "") {
  const text = `${url} ${title}`.toLowerCase();
  if (text.includes("royalcanin") || text.includes("royal-canin")) return "Royal Canin";
  if (text.includes("schesir")) return "Schesir";
  if (text.includes("acana")) return "ACANA";
  if (text.includes("orijen")) return "ORIJEN";
  return "";
}

function speciesForUrl(url, title = "") {
  const text = `${url} ${title}`.toLowerCase();
  if (text.includes("/cats/") || text.includes("/cat") || text.includes("gatas") || text.includes("gata")) return "cat";
  if (text.includes("/dogs/") || text.includes("/dog") || text.includes("skyloy") || text.includes("skylou")) return "dog";
  return "";
}

function formatForUrl(url, title = "") {
  const text = `${url} ${title}`.toLowerCase();
  if (text.includes("dry") || text.includes("ksira") || text.includes("xira") || text.includes("trofi")) return "dry";
  if (text.includes("wet")) return "wet";
  return "";
}

function titleFromHtml(html) {
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (h1) return decodeHtml(h1.replace(/<[^>]+>/g, " "));
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  return decodeHtml(title.replace(/\s*[–|-]\s*Schesir\s*$/i, "").replace(/\s*\|\s*.*$/i, ""));
}

function productLinksFromHtml(html, listingUrl) {
  const source = new URL(listingUrl);
  const hrefs = [...html.matchAll(/href=["']([^"'#]+)["']/g)].map((match) => {
    try {
      return new URL(decodeHtml(match[1]), listingUrl).toString();
    } catch {
      return "";
    }
  });

  return [
    ...new Set(
      hrefs.filter((url) => {
        const parsed = new URL(url);
        if (source.hostname.includes("schesir.com")) {
          return parsed.hostname.includes("schesir.com") && parsed.pathname.includes("/en/products/");
        }
        if (source.hostname.includes("aigan.gr")) {
          return parsed.hostname.includes("aigan.gr") && parsed.pathname.includes("/product/");
        }
        if (source.hostname.includes("kompa.gr")) {
          return parsed.hostname.includes("kompa.gr") && parsed.pathname.includes("/en/product/");
        }
        return false;
      }),
    ),
  ].sort();
}

function productScope(url, title) {
  const text = `${url} ${title}`.toLowerCase();
  if (text.includes("snack") || text.includes("stix") || text.includes("oil") || text.includes("supplement")) {
    return "defer_supplement_or_treat";
  }
  if (text.includes("/products/") || text.includes("/product/")) return "complete_food_candidate";
  return "listing_only";
}

async function enrichProduct(pair, productUrl) {
  const html = await fetchTextOrEmpty(productUrl);
  if (!html) {
    return {
      source_group: pair.source_group,
      listing_url: pair.listing_url,
      product_url: productUrl,
      product_title: "",
      brand_guess: brandForUrl(productUrl),
      species: speciesForUrl(productUrl) || speciesForUrl(pair.listing_url),
      format: formatForUrl(productUrl) || formatForUrl(pair.listing_url),
      source_tier: sourceTierForUrl(productUrl),
      source_type: sourceTypeForUrl(productUrl),
      market: "EU/GR",
      status: "fetch_failed_or_blocked",
      product_scope: "complete_food_candidate",
      notes: "Product URL discovered, but static fetch failed or was blocked. Keep as source candidate for manual browser review.",
    };
  }
  const product_title = titleFromHtml(html);
  const source_type = sourceTypeForUrl(productUrl);
  const product_scope = productScope(productUrl, product_title);
  const brand_guess = brandForUrl(productUrl, product_title);
  const species = speciesForUrl(productUrl, product_title) || speciesForUrl(pair.listing_url);
  const format = formatForUrl(productUrl, product_title) || formatForUrl(pair.listing_url);

  return {
    source_group: pair.source_group,
    listing_url: pair.listing_url,
    product_url: productUrl,
    product_title,
    brand_guess,
    species,
    format,
    source_tier: sourceTierForUrl(productUrl),
    source_type,
    market: new URL(productUrl).hostname.includes("royalcanin.com") ? "GR" : "EU",
    status: product_scope === "complete_food_candidate" ? "ready_for_manual_food_match" : "defer_not_complete_food",
    product_scope,
    notes:
      product_scope === "complete_food_candidate"
        ? "Product URL discovered from user-supplied source link; use for Food V2 matching and missing-field backfill."
        : "Source was captured for provenance, but should not be mixed into complete-food imports without review.",
  };
}

function listingRow(pair, discoveredCount) {
  return {
    source_group: pair.source_group,
    listing_url: pair.listing_url,
    product_url: "",
    product_title: "",
    brand_guess: brandForUrl(pair.listing_url),
    species: speciesForUrl(pair.listing_url),
    format: formatForUrl(pair.listing_url),
    source_tier: sourceTierForUrl(pair.listing_url),
    source_type: sourceTypeForUrl(pair.listing_url),
    market: pair.listing_url.includes("royalcanin.com/gr") ? "GR" : "EU/GR",
    status: discoveredCount > 0 ? "product_links_discovered" : "listing_registered_no_product_links",
    product_scope: "listing_only",
    notes:
      discoveredCount > 0
        ? `${discoveredCount} product links discovered from this source.`
        : "Listing/source URL registered. No direct product links were safely extracted from static HTML.",
  };
}

function failedListingRow(pair) {
  return {
    ...listingRow(pair, 0),
    status: "fetch_failed_or_blocked",
    notes: "Source URL was registered, but the site blocked or failed static fetch. Use manually in browser/photo evidence if needed.",
  };
}

function candidateFromRegistry(row) {
  return {
    brand: row.brand_guess,
    species: row.species,
    formula_name_guess: row.product_title,
    source_group: row.source_group,
    product_url: row.product_url,
    product_title: row.product_title,
    recommended_action:
      row.source_tier === "official"
        ? "Match against existing/staged Food V2 rows and use as official provenance for ingredients/nutrients."
        : "Use only as controlled fallback; prefer official page/PDF or label photo before commit.",
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
  const productRows = rows.filter((row) => row.product_url);
  return `# Schesir / Royal Link Registry

Generated: ${new Date().toISOString()}

## Summary

- Source file: ${sourcePath}
- Source/listing URLs supplied: ${new Set(rows.map((row) => row.listing_url)).size}
- Product URLs discovered: ${productRows.length}
- Registry CSV: ${paths.registry}
- Enrichment candidates CSV: ${paths.candidates}

## By Brand

${renderCounts(countBy(rows, "brand_guess"))}

## By Source Tier

${renderCounts(countBy(rows, "source_tier"))}

## By Source Type

${renderCounts(countBy(rows, "source_type"))}

## By Product Scope

${renderCounts(countBy(rows, "product_scope"))}

## Operating Rule

Official product pages can enrich missing ingredients and analytical values. Retailer/distributor URLs are fallback evidence only and should stay in review unless corroborated by official data or label photos.
`;
}

async function main() {
  const sourcePath = await resolveSourcePath();
  const sourceLinks = parseSourceLinks(await readFile(sourcePath, "utf8"));
  const rows = [];

  for (const pair of sourceLinks) {
    const html = await fetchTextOrEmpty(pair.listing_url);
    if (!html) {
      rows.push(failedListingRow(pair));
      continue;
    }
    const products = pair.listing_url.includes("schesir.com/en/products/")
      ? [pair.listing_url]
      : productLinksFromHtml(html, pair.listing_url);
    rows.push(listingRow(pair, products.length));

    for (const productUrl of products) {
      if (productUrl === pair.listing_url && !productUrl.includes("/products/")) continue;
      rows.push(await enrichProduct(pair, productUrl));
    }
  }

  const deduped = [...new Map(rows.map((row) => [`${row.listing_url}|${row.product_url}|${row.source_type}`, row])).values()];
  const candidates = deduped
    .filter((row) => row.product_url && row.product_scope === "complete_food_candidate")
    .map(candidateFromRegistry);

  await mkdir(path.dirname(paths.registry), { recursive: true });
  await mkdir(path.dirname(paths.candidates), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.registry, writeCsv(registryHeaders, deduped), "utf8");
  await writeFile(paths.candidates, writeCsv(candidateHeaders, candidates), "utf8");
  await writeFile(paths.report, renderReport(deduped, sourcePath), "utf8");

  console.log(`Schesir/Royal registry rows: ${deduped.length}`);
  console.log(`Product candidates: ${candidates.length}`);
  console.log(`Wrote ${paths.registry}`);
  console.log(`Wrote ${paths.candidates}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
