# NutriTail AI SEO Visibility Audit

Date: 2026-11-01

## Evidence baseline

The starting Search Console evidence supplied for this work was:

- Homepage indexed.
- 78 impressions and 2 clicks in the previous three months.
- Average position 34.5.
- Existing impressions around kitten feeding quantities, cat feeding amounts,
  and puppy portions.

These figures are a baseline, not a performance claim or forecast.

## Findings by SEO impact

### High: existing demand was only partially answered

The two portion guides targeted adult dog and cat wording in their titles and
main headings. Puppy and kitten information appeared mainly as a veterinary
caution, despite those topics already producing impressions.

Implemented:

- Expanded the existing dog and cat portion guides instead of creating
  competing thin pages.
- Added direct, visible answers for puppy and kitten portions.
- Aligned title, H1, description, homepage anchors, and guide-hub anchors.
- Kept all quantities non-prescriptive and tied to the specific food label,
  age, weight, expected adult size, and follow-up of body condition.

### High: guide journeys stopped before product tools

The guides linked to related editorial content and registration, but not
consistently to food comparison or directly into the chatbot onboarding flow.

Implemented:

- Added contextual links from all four guides to food comparison.
- Added chatbot CTAs through `/register?next=/account/chatbot`.
- Preserved the existing private routes and their `noindex` protection.

### Medium: guide structured data was absent

The homepage already emitted valid Organization, WebSite, and WebApplication
JSON-LD. The four guides had no page-specific Article or BreadcrumbList data.

Implemented:

- Added shared Article and BreadcrumbList JSON-LD for all four guides.
- Used NutriTail AI as the organization author and publisher.
- Used the actual publication date and this significant-update date.

### Medium: sitemap had no reliable modification dates

Coverage was complete and canonical URLs were consistent, but the sitemap had
no `lastmod` values. Fixed dates were added only to pages significantly changed
in this update. Dynamic deployment-time dates were intentionally avoided.

### No fix needed

- Homepage canonical, robots directives, Open Graph, Twitter metadata, and
  rendered Greek metadata were already correct.
- No `Create Next App` title or description remains in source or rendered HTML.
- All four guide URLs were already included in the sitemap.
- The two feeding examples are arithmetically correct:
  `200 kcal / 4 kcal per g = 50 g` and `120 kcal / 4 kcal per g = 30 g`.
- Selection and portion guides serve distinct intents; no duplicate SEO page
  was added.

Scope note: this audit validates the public-guide calculations and examples.
The existing account/chatbot calorie engine was intentionally not recalibrated,
because changing its RER/MER factors would alter product behavior and requires a
separate nutrition-logic review. This SEO work does not certify those internal
factors as clinical recommendations.

## Source review

Feeding guidance was checked against current primary or institutional sources:

- [FEDIAF Nutritional Guidelines 2025](https://europeanpetfood.org/self-regulation/nutritional-guidelines/)
- [WSAVA feeding amount questions](https://wsava.org/wp-content/uploads/2020/01/Frequently-Asked-Questions-and-Myths.pdf)
- [Cornell Feline Health Center meal-frequency guidance](https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/how-often-should-you-feed-your-cat)

## Changed URLs

- `https://nutritail.ai/`
- `https://nutritail.ai/guides`
- `https://nutritail.ai/guides/choosing-dog-food`
- `https://nutritail.ai/guides/dog-food-portion`
- `https://nutritail.ai/guides/choosing-cat-food`
- `https://nutritail.ai/guides/cat-food-portion`
- `https://nutritail.ai/sitemap.xml`

## Search Console follow-up

### After deployment

- Inspect the homepage and both portion-guide URLs with URL Inspection.
- Confirm that the live canonical matches each inspected URL.
- Request indexing once for the two substantially expanded portion guides.
- Resubmit `https://nutritail.ai/sitemap.xml` only if Search Console reports a
  fetch problem; otherwise the existing submission is sufficient.

### Day 14

- Confirm all six changed public pages are indexed and the declared canonical
  is selected by Google.
- Compare page-level impressions, clicks, CTR, and average position for the two
  portion guides against the pre-deployment period.
- Review queries containing the Greek equivalents of puppy, kitten, portion,
  amount, grams, dog food, and cat food.
- Check whether Google is showing the updated titles. Recrawling and title
  reprocessing can take days or weeks, so do not rewrite again solely because
  an old title still appears.
- Record observations without claiming uplift from a small sample.

### Day 30

- Compare the same pages and queries over equal date ranges.
- Prioritize queries with impressions and positions roughly 10-40 for the next
  content refinement.
- If impressions rise but CTR remains weak, test title and description wording
  on the existing page rather than creating a duplicate URL.
- If a genuinely distinct intent appears repeatedly, document it first and add
  a new page only when the existing guides cannot answer it without becoming
  unfocused.
- Review internal-link clicks to food comparison and chatbot separately from
  organic ranking; they measure different outcomes.

## Verification completed

- `npm run lint`
- `npm run typecheck`
- `npm run qa:seo-contract`
- `npm run build`
- Rendered metadata, canonical, robots, JSON-LD parsing, sitemap output, private
  `X-Robots-Tag` headers, desktop layout, mobile layout, and browser console.

No ranking or traffic improvement is guaranteed by these changes. Search
performance should be evaluated from Search Console after recrawl and with
enough data to reduce noise.
