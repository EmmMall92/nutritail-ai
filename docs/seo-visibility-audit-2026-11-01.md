# NutriTail AI SEO Growth Sprint

Date: 2026-11-01

## Evidence baseline

The Search Console evidence supplied for this sprint was:

- 78 impressions and 2 clicks in the previous three months.
- Average CTR 2.6% and average position 34.5.
- Brand query `nutritail`: 6 impressions, average position 5.2.
- Homepage indexed successfully.
- Existing impressions for kitten ages and portions, cat feeding amounts,
  sterilised cats, and puppy portions.

These figures are a baseline, not proof of broad demand or a performance
forecast.

## Findings by SEO impact

### High: demonstrated kitten demand was answered too briefly

The existing cat portion URL was the correct page to target this intent, but it
did not directly answer the age-specific queries already visible in Search
Console.

Implemented on `/guides/cat-food-portion`:

- Kept the existing URL, title, canonical, and Article/BreadcrumbList data.
- Added distinct guidance for 1 month, 2 months, 3 months, 4-6 months, and
  6-12 months.
- Added weaning and commercial milk-replacer boundaries for very young or
  orphaned kittens.
- Added meal frequency, wet/dry accounting, growth monitoring, and
  age-relative energy context.
- Added a calorie-density conversion method without inventing universal grams.
- Added a dedicated answer for a sterilised cat without prescribing a fixed
  percentage reduction.

### High: puppy intent lacked enough age and size context

The existing dog portion URL already matched the intent and did not need a
second calculator or another SEO page.

Implemented on `/guides/dog-food-portion`:

- Added stages before weaning, from weaning to 6 months, 6-12 months, and
  after 12 months.
- Explained why current weight and expected adult weight both matter.
- Added small, medium, large, and giant breed considerations.
- Added meal frequency, weekly growth monitoring, food-energy density, and a
  non-prescriptive grams formula.
- Added calcium/phosphorus and vitamin D cautions for complete growth diets,
  especially for large and giant breeds.
- Added a safe transition path to the existing food-change guide.

### Medium: the next useful editorial step was not prominent

Both portion guides already linked to food comparison and chatbot onboarding.
They now also link descriptively to `/guides/changing-pet-food`, so the path is:

`Homepage -> guides -> portion guide -> food-change guide / comparison -> chatbot`

### No change needed

- Homepage title and description already match the demonstrated food and
  portion intent better than the stale title quoted in the task brief.
- Homepage canonical, robots, Open Graph, Twitter, and Organization/WebSite/
  WebApplication JSON-LD were already correct.
- Guide Article and BreadcrumbList JSON-LD were already valid and supported by
  the page content.
- Sitemap coverage and fixed `lastModified` values were already correct.
- The existing food-change guide serves a distinct intent; no duplicate or
  thin route was added.
- Food V2, chatbot, account, auth, APIs, database, and medical interrupts were
  not modified.

## Metadata decisions

### Homepage

- Title before and after:
  `Nutritail AI | Τροφή και μερίδα για σκύλο ή γάτα`
- Description before and after:
  `Βρες ενημερωτική καθοδήγηση για επιλογή τροφής σκύλου ή γάτας, ενδεικτικές θερμίδες και ημερήσια μερίδα, με σαφή όρια κτηνιατρικής συμβουλής.`
- Decision: no title churn without new evidence. The current wording is
  accurate, readable, and closer to the queries already producing impressions.

### Cat portion guide

- Title before and after:
  `Πόση τροφή χρειάζεται η γάτα ή το γατάκι μου; | Nutritail AI`
- Description before:
  `Πρακτικός οδηγός για την ημερήσια ποσότητα τροφής για γάτα ή γατάκι: ηλικία, γεύματα, υγρή και ξηρά τροφή, θερμίδες και έλεγχος βάρους.`
- Description after:
  `Πρακτικός οδηγός για ποσότητα τροφής σε γατάκι 1-12 μηνών και ενήλικη ή στειρωμένη γάτα: γεύματα, θερμίδες, υγρή και ξηρά τροφή.`

### Dog portion guide

- Title before and after:
  `Πόση τροφή χρειάζεται ο σκύλος ή το κουτάβι μου; | Nutritail AI`
- Description before:
  `Πρακτικός οδηγός για την ημερήσια ποσότητα τροφής για σκύλο ή κουτάβι: ετικέτα, θερμίδες, γραμμάρια, λιχουδιές και έλεγχος βάρους.`
- Description after:
  `Πρακτικός οδηγός για ποσότητα τροφής σε κουτάβι ανά ηλικία, βάρος και αναμενόμενο ενήλικο μέγεθος: γεύματα, θερμίδες και ανάπτυξη.`

## Source review

The new feeding content was checked against institutional sources:

- [FEDIAF Nutritional Guidelines 2025](https://europeanpetfood.org/self-regulation/nutritional-guidelines/)
- [WSAVA feeding amount questions](https://wsava.org/wp-content/uploads/2020/01/Frequently-Asked-Questions-and-Myths.pdf)
- [Merck feeding practices in small animals](https://www.merckvetmanual.com/management-and-nutrition/nutrition-small-animals/feeding-practices-in-small-animals)
- [Merck management of dog and cat neonates](https://www.merckvetmanual.com/management-and-nutrition/management-of-the-neonate/management-of-the-neonate-in-dogs-and-cats)
- [Cornell Feline Health Center meal-frequency guidance](https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/how-often-should-you-feed-your-cat)

The content remains educational. It does not present a clinical diagnosis,
universal gram amount, or personalised treatment plan.

## Changed URLs

- `https://nutritail.ai/guides/cat-food-portion`
- `https://nutritail.ai/guides/dog-food-portion`

## Files modified

- `app/guides/cat-food-portion/page.tsx`
- `app/guides/dog-food-portion/page.tsx`
- `scripts/qa/check-seo-contract.ts`
- `docs/seo-visibility-audit-2026-11-01.md`

## QA completed

- `git diff --check`
- `npm run qa:seo-contract`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- All seven important public routes return HTTP 200.
- Important public titles are unique.
- Canonicals are present and consistent; public pages emit `index, follow`.
- Article and BreadcrumbList JSON-LD parse successfully on both changed pages.
- Both changed pages have one H1 and server-rendered content.
- Sitemap includes all guide URLs.
- All 15 unique internal destinations from each changed guide are reachable.
- Desktop and 390 x 844 mobile rendering have no horizontal overflow.
- Browser console has no warnings or errors on the changed pages.

## Remaining issues and limits

- This sprint does not claim that the pages will gain rankings or traffic.
- Search Console query data is still sparse, so a new route or major title test
  is not justified yet.
- The account/chatbot calorie engine was not recalibrated. That is a separate
  nutrition-logic review with product-behaviour impact.
- Live indexing and Google's selected title/canonical can only be evaluated
  after deployment and recrawl.

## Search Console follow-up

### After deployment

- Inspect and request indexing once for both changed portion-guide URLs.
- Confirm the declared canonical and rendered HTML in URL Inspection.
- Keep the existing sitemap submission unless Search Console reports a fetch
  problem.

### Day 7

- Confirm both URLs were recrawled and remain indexed.
- Check total impressions, clicks, CTR, average position, branded performance,
  and indexed page count.
- Record whether the new age-specific kitten and puppy queries begin appearing;
  do not draw conclusions from a few impressions.

### Day 14

- Compare equal date ranges for each changed URL.
- Review queries containing `γατάκι`, `κουτάβι`, `στειρωμένη`, `ποσότητα`,
  `γραμμάρια`, and age terms.
- Check whether Google shows the current titles and selected canonicals.
- Avoid another rewrite solely because processing is still incomplete.

### Day 30

- Compare page-level and query-level results over equal periods.
- Prioritise queries with repeat impressions and positions roughly 10-40.
- If impressions increase but CTR remains weak, test metadata on the existing
  URL rather than creating a duplicate page.
- Add a new URL only when repeated evidence shows a genuinely distinct intent
  that the existing guide cannot answer clearly.

No ranking position or traffic increase is guaranteed by these changes.
