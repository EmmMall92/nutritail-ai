# OpenAI Full Proof Runbook

This runbook closes the only advisory OpenAI proof that can remain pending even
when the customer-ready core is passing.

OpenAI is used only for:

- structured pet-fact extraction from natural Greek/English messages
- final human wording after NutriTail has already selected and ranked foods

NutriTail remains responsible for:

- food retrieval from Food V2
- allergy and species hard rejects
- medical safety guards
- nutrient truth
- recommendation ranking

## What Must Pass

Full OpenAI proof is complete only when both checks pass:

1. `npm.cmd run qa:openai-intake-smoke`
2. `npm.cmd run qa:account-chatbot-extract-live-route`

The rollup command is:

```powershell
npm.cmd run qa:openai-full-proof
```

Use the report-only command when you want to summarize existing evidence without
rerunning the live checks:

```powershell
npm.cmd run qa:openai-full-proof:report
```

## Required Local Secrets

Never paste keys or cookies into committed files, PR comments, screenshots, or
reports.

Use ignored local files under `.qa-secrets/`:

```powershell
New-Item -ItemType Directory -Force .qa-secrets
```

For the OpenAI key, either keep it in the shell session:

```powershell
$env:OPENAI_API_KEY="sk-..."
```

or put only the key value in:

```text
.qa-secrets/openai-api-key.txt
```

and run:

```powershell
$env:NUTRITAIL_QA_OPENAI_API_KEY_FILE=".qa-secrets/openai-api-key.txt"
```

For the authenticated NutriTail account cookie, put the full Cookie header value
in:

```text
.qa-secrets/nutritail-auth-cookie.txt
```

The authenticated route proof now reads this file by default. You can also set
an explicit file path when needed:

```powershell
$env:NUTRITAIL_QA_AUTH_COOKIE_FILE=".qa-secrets/nutritail-auth-cookie.txt"
```

For compatibility with older local QA setup, `.qa-secrets/account-cookie.txt` is
also accepted as a fallback when the main file is not present.

## Safe Pass Criteria

The generated reports must show:

- `reports/openai_intake_smoke_qa.md`: completed, all cases passed
- `reports/account_chatbot_extract_live_route_qa.md`: completed, route passed
- `reports/openai_full_proof_qa.md`: `Status: PASS`
- `reports/live_readiness_dashboard.md`: `Full OpenAI proof status: PASS`

The reports must not contain:

- raw OpenAI API keys
- Supabase tokens
- browser cookies
- session values

## If It Skips

If the authenticated route skips, the most common reason is:

```text
NUTRITAIL_QA_AUTH_COOKIE or NUTRITAIL_QA_AUTH_COOKIE_FILE was not available
```

Refresh the authenticated account cookie from a logged-in QA browser session,
store it in `.qa-secrets/nutritail-auth-cookie.txt` or
`.qa-secrets/account-cookie.txt`, and rerun:

```powershell
npm.cmd run qa:openai-full-proof
npm.cmd run qa:live-readiness-dashboard
```

## Why This Matters

This proof is separate from ordinary chatbot QA. The large dog/cat batches prove
that deterministic NutriTail recommendation logic behaves correctly. This proof
shows that the live authenticated OpenAI extraction route is also working in
production without exposing secrets.
