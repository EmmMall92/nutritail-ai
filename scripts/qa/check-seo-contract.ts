import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function read(path: string) {
  return readFileSync(path, "utf8");
}

const metadataHelper = read("lib/seo/metadata.ts");
const rootLayout = read("app/layout.tsx");
const homePage = read("app/page.tsx");
const sitemap = read("app/sitemap.ts");
const robots = read("app/robots.ts");
const nextConfig = read("next.config.ts");
const proxy = read("proxy.ts");
const openGraphImage = read("app/opengraph-image.tsx");
const publicFooter = read("components/PublicFooter.tsx");
const publicHeader = read("components/PublicHeader.tsx");
const supportPage = read("app/support/page.tsx");
const packageJson = read("package.json");

for (const marker of [
  "createPublicMetadata",
  "createNoIndexMetadata",
  "alternates: { canonical: path }",
  "noarchive: true",
  '"max-image-preview": "large"',
  'card: "summary_large_image"',
  "images: [socialImage]",
]) {
  assert(metadataHelper.includes(marker), `SEO metadata helper is missing: ${marker}`);
}

assert(
  rootLayout.includes("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION"),
  "Root metadata must support Google Search Console verification."
);

for (const path of [
  "app/page.tsx",
  "app/about/page.tsx",
  "app/how-it-works/page.tsx",
  "app/support/page.tsx",
  "app/privacy/page.tsx",
  "app/terms/page.tsx",
  "app/ai-transparency/page.tsx",
  "app/guides/page.tsx",
  "app/guides/choosing-dog-food/page.tsx",
  "app/guides/dog-food-portion/page.tsx",
  "app/guides/choosing-cat-food/page.tsx",
  "app/guides/cat-food-portion/page.tsx",
]) {
  assert(
    read(path).includes("createPublicMetadata"),
    `${path} must use shared public SEO metadata.`
  );
}

for (const marker of [
  '"@type": "Organization"',
  '"@type": "WebSite"',
  '"@type": "WebApplication"',
  '"@graph"',
  'inLanguage: "el-GR"',
]) {
  assert(homePage.includes(marker), `Homepage JSON-LD is missing: ${marker}`);
}

assert(
  sitemap.includes('path: "/ai-transparency"'),
  "Sitemap must include the public AI transparency page."
);
for (const path of ["/guides", "/guides/choosing-dog-food", "/guides/dog-food-portion", "/guides/choosing-cat-food", "/guides/cat-food-portion"]) {
  assert(sitemap.includes(`path: "${path}"`), `Sitemap must include ${path}.`);
}
assert(
  publicHeader.includes('href: "/guides"') &&
    publicFooter.includes('href: "/guides"') &&
    homePage.includes('href="/guides/choosing-dog-food"') &&
    homePage.includes('href="/guides/dog-food-portion"') &&
    homePage.includes('href="/guides/choosing-cat-food"') &&
    homePage.includes('href="/guides/cat-food-portion"'),
  "Nutrition guides must be discoverable from public navigation and the homepage."
);
assert(
  publicHeader.includes('href: "/account/food-compare"') &&
    publicFooter.includes('href: "/account/food-compare"') &&
    homePage.includes('href="/account/food-compare"'),
  "Food comparison must be discoverable from the public website."
);
for (const path of [
  "app/guides/dog-food-portion/page.tsx",
  "app/guides/cat-food-portion/page.tsx",
]) {
  const guide = read(path);
  assert(
    guide.includes("europeanpetfood.org") && guide.includes("wsava.org") &&
      guide.includes("κτηνίατρο") && guide.includes("προτεινόμενος"),
    `${path} must cite primary sources and keep examples non-prescriptive.`
  );
}
const choosingDogFoodGuide = read("app/guides/choosing-dog-food/page.tsx");
const choosingCatFoodGuide = read("app/guides/choosing-cat-food/page.tsx");
const guidesHub = read("app/guides/page.tsx");
assert(
  choosingDogFoodGuide.includes('path: "/guides/choosing-dog-food"') &&
    choosingDogFoodGuide.includes("Τι τροφή να πάρω στον σκύλο μου;") &&
    choosingDogFoodGuide.includes("europeanpetfood.org") &&
    choosingDogFoodGuide.includes("wsava.org") &&
    choosingDogFoodGuide.includes("κτηνίατρο") &&
    choosingDogFoodGuide.includes('href="/guides/dog-food-portion"') &&
    guidesHub.includes('href: "/guides/choosing-dog-food"'),
  "Dog food selection guide must be sourced, bounded, and discoverable."
);
assert(
  choosingCatFoodGuide.includes('path: "/guides/choosing-cat-food"') &&
    choosingCatFoodGuide.includes("Τι τροφή να πάρω στη γάτα μου;") &&
    choosingCatFoodGuide.includes("europeanpetfood.org") &&
    choosingCatFoodGuide.includes("wsava.org") &&
    choosingCatFoodGuide.includes("vet.cornell.edu") &&
    choosingCatFoodGuide.includes("κτηνίατρο") &&
    choosingCatFoodGuide.includes('href="/guides/cat-food-portion"') &&
    read("app/guides/cat-food-portion/page.tsx").includes('href="/guides/choosing-cat-food"') &&
    guidesHub.includes('href: "/guides/choosing-cat-food"'),
  "Cat food selection guide must be sourced, bounded, and linked to the portion guide."
);
assert(
  !sitemap.includes("lastModified: now") && !sitemap.includes("new Date()"),
  "Sitemap must not claim that every page changed at deployment time."
);

for (const path of ["/account", "/admin", "/api", "/print"]) {
  assert(robots.includes(`"${path}"`), `robots.ts must disallow ${path}.`);
}
for (const path of ["/login", "/register", "/forgot-password", "/reset-password"]) {
  assert(
    !robots.includes(`"${path}"`),
    `robots.ts must allow crawling ${path} so crawlers can see noindex.`
  );
}

for (const path of [
  "app/login/layout.tsx",
  "app/register/layout.tsx",
  "app/forgot-password/layout.tsx",
  "app/reset-password/layout.tsx",
]) {
  const routeLayout = read(path);

  assert(
    routeLayout.includes("createNoIndexMetadata") && routeLayout.includes('"/'),
    `${path} must keep the auth route out of search results.`
  );
}

assert(
  nextConfig.includes('key: "X-Robots-Tag"') &&
    nextConfig.includes('value: "noindex, nofollow, noarchive"') &&
    proxy.includes('"X-Robots-Tag", "noindex, nofollow, noarchive"'),
  "Private routes must emit an X-Robots-Tag header."
);
assert(
  read("app/plans/page.tsx").includes("index: launchFeatures.paidPlans"),
  "Plans must be indexable only when paid plans are enabled."
);
assert(
  openGraphImage.includes("ενημερωτική επιλογή τροφής") &&
    openGraphImage.includes("Επιλογή τροφής για σκύλους και γάτες"),
  "Open Graph image copy must match the Greek public experience."
);
assert(
  supportPage.includes("Βοήθεια για λογαριασμό, αναφορές και στοιχεία τροφών") &&
    !supportPage.includes('href="/account/chatbot"'),
  "Support must be Greek and avoid linking crawlers directly to a private route."
);
assert(
  !homePage.includes("#90a198") &&
    !homePage.includes("#6b7b72") &&
    !publicFooter.includes("#6b7b72"),
  "Known low-contrast public text colors must not return."
);
assert(
  packageJson.includes('"qa:seo-contract"'),
  "package.json must expose qa:seo-contract."
);

console.log("SEO contract passed.");
