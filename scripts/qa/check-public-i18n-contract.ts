import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const localizedPages = [
  ["/", "app/page.tsx"],
  ["/about", "app/about/page.tsx"],
  ["/ai-transparency", "app/ai-transparency/page.tsx"],
  ["/guides", "app/guides/page.tsx"],
  ["/guides/cat-food-portion", "app/guides/cat-food-portion/page.tsx"],
  ["/guides/can-dogs-eat-cat-food", "app/guides/can-dogs-eat-cat-food/page.tsx"],
  ["/guides/changing-pet-food", "app/guides/changing-pet-food/page.tsx"],
  ["/guides/choosing-cat-food", "app/guides/choosing-cat-food/page.tsx"],
  ["/guides/choosing-dog-food", "app/guides/choosing-dog-food/page.tsx"],
  ["/guides/dog-food-portion", "app/guides/dog-food-portion/page.tsx"],
  ["/how-it-works", "app/how-it-works/page.tsx"],
  ["/privacy", "app/privacy/page.tsx"],
  ["/support", "app/support/page.tsx"],
  ["/terms", "app/terms/page.tsx"],
] as const;

const localeConfig = read("lib/i18n/config.ts");
const proxy = read("proxy.ts");
const metadata = read("lib/seo/metadata.ts");
const sitemap = read("app/sitemap.ts");
const rootLayout = read("app/layout.tsx");
const header = read("components/PublicHeader.tsx");
const footer = read("components/PublicFooter.tsx");
const switcher = read("components/LanguageSwitcher.tsx");

for (const marker of [
  'supportedLocales = ["el", "en"]',
  "localizePath",
  "stripLocalePrefix",
  "localeRequestHeader",
]) {
  assert(localeConfig.includes(marker), `Locale configuration is missing: ${marker}`);
}

for (const privatePrefix of [
  '"/login"',
  '"/register"',
  '"/forgot-password"',
  '"/reset-password"',
]) {
  assert(
    !localeConfig.includes(privatePrefix),
    `${privatePrefix} must stay outside the first public translation release.`
  );
}

for (const marker of [
  "NextResponse.rewrite",
  "isLocalizedRoute(pathname)",
  "requestHeaders.set(localeRequestHeader, locale)",
]) {
  assert(proxy.includes(marker), `Locale proxy is missing: ${marker}`);
}

for (const [route, file] of localizedPages) {
  const page = read(file);
  assert(page.includes("getRequestLocale"), `${route} must read the request locale.`);
  assert(page.includes("translatePublicTree"), `${route} must translate rendered content.`);
  assert(page.includes("locale,"), `${route} must generate locale-aware metadata.`);
}

for (const marker of [
  "canonical: canonicalPath",
  '"el-GR": localizePath(path, "el")',
  'en: localizePath(path, "en")',
  '"x-default": localizePath(path, "el")',
  "alternateLocale:",
]) {
  assert(metadata.includes(marker), `Localized metadata is missing: ${marker}`);
}

for (const marker of [
  'const locales: Locale[] = ["el", "en"]',
  "localizePath(route.path, locale)",
  "alternates: { languages }",
]) {
  assert(sitemap.includes(marker), `Localized sitemap is missing: ${marker}`);
}

assert(rootLayout.includes("<html lang={locale}>"), "Root html language must follow the request locale.");
assert(header.includes("<LanguageSwitcher"), "Public header must expose the language switcher.");
assert(header.includes("localizePath(link.href, locale)"), "Header links must preserve the locale.");
assert(footer.includes("localizePath(link.href, locale)"), "Footer links must preserve the locale.");
assert(switcher.includes('shortLabel: "EL"') && switcher.includes('shortLabel: "EN"'), "Language switcher must offer EL and EN.");

console.log(`Public i18n contract passed for ${localizedPages.length} routes.`);
