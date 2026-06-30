# Nutritail AI

Nutritail AI is a Next.js 16 and Supabase pet nutrition SaaS for dog and cat
nutrition guidance, pet profiles, food matching, saved analyses, printable
reports, and admin food database management.

Live site: https://nutritail.ai

## Current Stack

- Next.js 16 App Router
- React 19
- Supabase Auth and database
- Vercel production hosting
- GitHub Actions CI

## Core Areas

- Public homepage, SEO metadata, sitemap, robots, manifest, and Open Graph image
- Customer auth, profile, pet profiles, chatbot, saved analyses, and reports
- Food scoring, nutrition insights, ingredient insights, and food matching
- Admin dashboard, foods database, enrichment import, validation checks, trash,
  restore, activity logs, customers, pets, and duplicate tools

## Local Setup

Install dependencies:

```bash
npm install
```

Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Run the development server:

```bash
npm run dev
```

Open http://localhost:3000.

## Quality Checks

Run the full local gate before opening or merging a PR:

```bash
npm run check
```

Or run the steps separately when you need to isolate a failure:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run qa:ci-readiness
```

On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`:

```bash
npm.cmd run check
```

Or separately:

```bash
npm.cmd run build
npm.cmd run qa:ci-readiness
```

When a PR changes chatbot intake, Food V2 recommendation ranking, customer
recommendation copy, nutrition rules, or medical/safety guardrails, also run:

```bash
npm.cmd run qa:chatbot-golden-suite:fast
```

This suite intentionally includes live production smoke coverage, so it is kept
out of the default `npm run check` loop. Use it as the deeper signoff for
recommendation-quality changes.

Optional live chatbot QA checks can use local secret files so keys and cookies
do not appear in shell history or reports. Put them under `.qa-secrets/`, which
is ignored by git:

```bash
NUTRITAIL_QA_OPENAI_API_KEY_FILE=.qa-secrets/openai-key.txt npm.cmd run qa:openai-intake-smoke
NUTRITAIL_QA_AUTH_COOKIE_FILE=.qa-secrets/account-cookie.txt npm.cmd run qa:account-chatbot-extract-live-route
```

The QA reports record only whether the secret came from an env var, a local
file, or was missing. They never print the key or cookie value.

## Deployment

The project is linked to Vercel as `nutritail-ai` and production is served at
https://nutritail.ai.

Manual production deploy:

```bash
npx vercel deploy --prod --yes
```

After deploy, verify:

```bash
https://nutritail.ai
https://nutritail.ai/sitemap.xml
https://nutritail.ai/robots.txt
https://nutritail.ai/manifest.webmanifest
https://nutritail.ai/opengraph-image
```

Post-deploy QA:

```bash
npm.cmd run qa:post-deploy-readiness
```

Use the stricter freshness gate when you want the readiness source reports to be
newer than the current deploy run:

```bash
npm.cmd run qa:post-deploy-readiness:deploy-freshness
```

If the deploy touches chatbot intake, recommendation logic, Food V2 ranking, or
customer chatbot copy, refresh the chatbot QA evidence too:

```bash
npm.cmd run qa:post-deploy-readiness:refresh-chatbot
```

For a full release signoff, run:

```bash
npm.cmd run qa:post-deploy-readiness:full
```

The post-deploy report includes the live readiness result, the 95/100 readiness
score, the minimum readiness gate, and the core/advisory evidence split.

## Data Notes

Food data quality is tracked with `data_quality_status`, `data_source_url`,
`data_notes`, and nutrition fields such as `kcal_per_100g`. Use official product
pages or packaging when enriching foods. Do not guess analytical constituents or
calorie density when a reliable source is not available.

Placeholder/demo foods should not be active production data. Use the admin
validation page to find production blockers before launch.

## Medical Disclaimer

Nutritail AI provides educational nutrition guidance only. It does not replace
veterinary diagnosis, treatment, or medical advice.
