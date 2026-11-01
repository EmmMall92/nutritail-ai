import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function read(path: string) {
  return readFileSync(path, "utf8");
}

const metadataHelper = read("lib/seo/metadata.ts");
const guideStructuredData = read("lib/seo/guideStructuredData.ts");
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
  "canonical: canonicalPath",
  "languages: {",
  '"el-GR": localizePath(path, "el")',
  'en: localizePath(path, "en")',
  "noarchive: true",
  '"max-image-preview": "large"',
  'card: "summary_large_image"',
  "images: [socialImage(locale)]",
  "alternateLocale:",
]) {
  assert(metadataHelper.includes(marker), `SEO metadata helper is missing: ${marker}`);
}

for (const marker of [
  '"@type": "Article"',
  '"@type": "BreadcrumbList"',
  '"@type": "Organization"',
  "inLanguage: localeTag(locale)",
  "datePublished",
  "dateModified",
]) {
  assert(
    guideStructuredData.includes(marker),
    `Guide structured data is missing: ${marker}`
  );
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
  "app/guides/can-dogs-eat-cat-food/page.tsx",
  "app/guides/choosing-dog-food/page.tsx",
  "app/guides/dog-food-portion/page.tsx",
  "app/guides/choosing-cat-food/page.tsx",
  "app/guides/cat-food-portion/page.tsx",
  "app/guides/changing-pet-food/page.tsx",
]) {
  const guide = read(path);
  assert(
    guide.includes("createPublicMetadata"),
    `${path} must use shared public SEO metadata.`
  );

  if (path.startsWith("app/guides/") && path !== "app/guides/page.tsx") {
    assert(
      guide.includes("createGuideStructuredData") &&
        guide.includes('type="application/ld+json"'),
      `${path} must emit Article and BreadcrumbList structured data.`
    );
  }
}

assert(
  homePage.includes("Τροφή και μερίδα για σκύλο ή γάτα") &&
    !rootLayout.toLowerCase().includes("create next app") &&
    !homePage.toLowerCase().includes("create next app"),
  "Homepage metadata must describe the live product and exclude starter metadata."
);

for (const marker of [
  '"@type": "Organization"',
  '"@type": "WebSite"',
  '"@type": "WebApplication"',
  '"@graph"',
  "inLanguage: localeTag(locale)",
]) {
  assert(homePage.includes(marker), `Homepage JSON-LD is missing: ${marker}`);
}

assert(
  sitemap.includes('path: "/ai-transparency"'),
  "Sitemap must include the public AI transparency page."
);
for (const marker of [
  'const locales: Locale[] = ["el", "en"]',
  '"el-GR":',
  '"x-default":',
  "alternates: { languages }",
]) {
  assert(sitemap.includes(marker), `Localized sitemap is missing: ${marker}`);
}
for (const path of ["/guides", "/guides/can-dogs-eat-cat-food", "/guides/choosing-dog-food", "/guides/dog-food-portion", "/guides/choosing-cat-food", "/guides/cat-food-portion", "/guides/changing-pet-food"]) {
  assert(sitemap.includes(`path: "${path}"`), `Sitemap must include ${path}.`);
}
assert(
  sitemap.includes('lastModified: "2026-11-01"'),
  "Significantly updated public pages must expose an accurate fixed lastModified date."
);
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
const dogPortionGuide = read("app/guides/dog-food-portion/page.tsx");
const catPortionGuide = read("app/guides/cat-food-portion/page.tsx");

for (const [path, guide] of [
  ["app/guides/dog-food-portion/page.tsx", dogPortionGuide],
  ["app/guides/cat-food-portion/page.tsx", catPortionGuide],
] as const) {
  assert(
    guide.includes("europeanpetfood.org") && guide.includes("wsava.org") &&
      guide.includes("merckvetmanual.com") && guide.includes("κτηνίατρο") &&
      guide.includes("προτεινόμενος"),
    `${path} must cite primary sources and keep examples non-prescriptive.`
  );
  assert(
    guide.includes('href="/account/food-compare"') &&
      guide.includes('href="/register?next=/account/chatbot"') &&
      guide.includes('href="/guides/changing-pet-food"'),
    `${path} must connect readers to comparison, chatbot, and transition guidance.`
  );
}

for (const marker of [
  "Πόση τροφή χρειάζεται ένα γατάκι ανά ηλικία;",
  "Γατάκι 1 μήνα",
  "Γατάκι 2 μηνών",
  "Γατάκι 3 μηνών",
  "Γατάκι 4-6 μηνών",
  "Γατάκι 6-12 μηνών",
  "Γραμμάρια τροφής/ημέρα",
  "kcal ανά 100 g",
  "Πόσο πρέπει να τρώει μια στειρωμένη γάτα;",
  "vet.cornell.edu",
]) {
  assert(
    catPortionGuide.includes(marker),
    `Cat portion guide is missing search-demand coverage: ${marker}`
  );
}

for (const marker of [
  "Πόση τροφή χρειάζεται ένα κουτάβι ανά ηλικία;",
  "Απογαλακτισμός έως 6 μηνών",
  "6-12 μηνών",
  "αναμενόμενο ενήλικο βάρος",
  "Μικρόσωμο",
  "Μεσαίο",
  "Μεγαλόσωμο",
  "Γιγαντόσωμο",
  "Ασβέστιο και φώσφορος σε μεγαλόσωμο κουτάβι",
  "Γραμμάρια κύριας τροφής",
]) {
  assert(
    dogPortionGuide.includes(marker),
    `Dog portion guide is missing search-demand coverage: ${marker}`
  );
}

assert(
  sitemap.match(/path: "\/guides\/dog-food-portion"/g)?.length === 1 &&
    sitemap.match(/path: "\/guides\/cat-food-portion"/g)?.length === 1,
  "Existing portion guides must answer puppy and kitten demand without duplicate sitemap URLs."
);
const choosingDogFoodGuide = read("app/guides/choosing-dog-food/page.tsx");
const choosingCatFoodGuide = read("app/guides/choosing-cat-food/page.tsx");
const changingPetFoodGuide = read("app/guides/changing-pet-food/page.tsx");
const speciesFoodGuide = read("app/guides/can-dogs-eat-cat-food/page.tsx");
const guidesHub = read("app/guides/page.tsx");
assert(
  choosingDogFoodGuide.includes('path: "/guides/choosing-dog-food"') &&
    choosingDogFoodGuide.includes("Τι τροφή να πάρω στον σκύλο μου;") &&
    choosingDogFoodGuide.includes("europeanpetfood.org") &&
    choosingDogFoodGuide.includes("wsava.org") &&
    choosingDogFoodGuide.includes("κτηνίατρο") &&
    choosingDogFoodGuide.includes('href="/guides/dog-food-portion"') &&
    choosingDogFoodGuide.includes('href="/guides/changing-pet-food"') &&
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
    choosingCatFoodGuide.includes('href="/guides/changing-pet-food"') &&
    read("app/guides/cat-food-portion/page.tsx").includes('href="/guides/choosing-cat-food"') &&
    guidesHub.includes('href: "/guides/choosing-cat-food"'),
  "Cat food selection guide must be sourced, bounded, and linked to the portion guide."
);
for (const guide of [choosingDogFoodGuide, choosingCatFoodGuide]) {
  assert(
    guide.includes('href="/account/food-compare"') &&
      guide.includes('href="/register?next=/account/chatbot"'),
    "Food selection guides must connect readers to comparison and chatbot flows."
  );
}
assert(
  changingPetFoodGuide.includes('path: "/guides/changing-pet-food"') &&
    changingPetFoodGuide.includes("Πώς αλλάζω τροφή στον σκύλο ή στη γάτα;") &&
    changingPetFoodGuide.includes("wsava.org") &&
    changingPetFoodGuide.includes("aaha.org") &&
    changingPetFoodGuide.includes("vet.cornell.edu") &&
    changingPetFoodGuide.includes("75%") &&
    changingPetFoodGuide.includes("25%") &&
    changingPetFoodGuide.includes("κτηνίατρο") &&
    changingPetFoodGuide.includes('href="/account/food-compare"') &&
    changingPetFoodGuide.includes('href="/register?next=/account/chatbot"') &&
    guidesHub.includes('href: "/guides/changing-pet-food"') &&
    homePage.includes('href="/guides/changing-pet-food"'),
  "Pet food transition guide must be sourced, bounded, and discoverable."
);
assert(
  speciesFoodGuide.includes('path: "/guides/can-dogs-eat-cat-food"') &&
    speciesFoodGuide.includes("Μπορεί ο σκύλος να φάει γατοτροφή") &&
    speciesFoodGuide.includes("europeanpetfood.org") &&
    speciesFoodGuide.includes("aafco.org") &&
    speciesFoodGuide.includes("msdvetmanual.com") &&
    speciesFoodGuide.includes("vcahospitals.com") &&
    speciesFoodGuide.includes("κτηνίατρο") &&
    speciesFoodGuide.includes('href="/account/food-compare"') &&
    speciesFoodGuide.includes('href="/register?next=/account/chatbot"') &&
    choosingDogFoodGuide.includes('href="/guides/can-dogs-eat-cat-food"') &&
    choosingCatFoodGuide.includes('href="/guides/can-dogs-eat-cat-food"') &&
    guidesHub.includes('href: "/guides/can-dogs-eat-cat-food"'),
  "Species-specific food guide must be sourced, bounded, and discoverable."
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
