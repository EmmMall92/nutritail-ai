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

Run these before opening or merging a PR:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`:

```bash
npm.cmd run build
```

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
