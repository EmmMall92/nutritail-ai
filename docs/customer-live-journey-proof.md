# Customer Live Journey Proof

This proof decides whether Customer UX can move beyond the current 84% gate.
It is intentionally stricter than API-only QA because the customer journey must
work as a real logged-in pet owner experience.

## What The Runner Checks

Run:

```powershell
npm.cmd run qa:customer-live-journey-proof
```

The runner checks:

- logged-in `/account/chatbot` access when a QA auth cookie is available
- OpenAI intake extraction for a Greek customer message
- Food V2 returns 3 first-choice cards and 3 value-style alternatives
- manual browser proof for save, report, timeline, and returning progress

## Auth Cookie

Store a QA account cookie in:

```txt
.qa-secrets/nutritail-auth-cookie.txt
```

The runner also accepts the existing local alias:

```txt
.qa-secrets/account-cookie.txt
```

or point to another ignored file:

```powershell
$env:NUTRITAIL_QA_AUTH_COOKIE_FILE="C:\path\to\cookie.txt"
```

Never commit cookies or secrets.

## Manual Browser Proof File

After completing the browser part of the flow, create:

```txt
.qa-secrets/customer-live-journey-proof.json
```

Start from the committed template:

```powershell
Copy-Item docs/customer-live-journey-proof.template.json .qa-secrets/customer-live-journey-proof.json
```

Then keep only evidence that really passed in the live browser. Use this shape:

```json
{
  "food_choice_grams": {
    "passed": true,
    "evidence": ["Tapped a food card and the selected-food plan showed grams/day and first-week next steps."]
  },
  "save_analysis": {
    "passed": true,
    "evidence": ["Selected a food, grams/day appeared, and Save completed."]
  },
  "open_report": {
    "passed": true,
    "evidence": ["Printable report showed calories, selected food, grams/day, transition plan, and next actions."]
  },
  "open_timeline": {
    "passed": true,
    "evidence": ["Timeline opened for the same saved pet and showed current plan/progress context."]
  },
  "return_for_progress": {
    "passed": true,
    "evidence": ["Same saved pet returned to progress mode without restarting intake."]
  }
}
```

Each evidence note must include the core proof terms for that journey. The runner
checks those terms so a vague note such as "looks good" cannot unlock
`PASS_FULL`.

| Key | Required evidence terms |
| --- | --- |
| `food_choice_grams` | `food`, `grams/day`, `first-week` |
| `save_analysis` | `save`, `profile`, `report`, `timeline`, `progress` |
| `open_report` | `report`, `calories`, `selected food`, `grams/day`, `transition` |
| `open_timeline` | `timeline`, `same saved pet`, `plan`, `progress` |
| `return_for_progress` | `same saved pet`, `progress`, `without restarting` |

To avoid typing the keys by hand, you can ask the runner to create a local
ignored draft:

```powershell
$env:NUTRITAIL_QA_WRITE_MANUAL_PROOF_DRAFT="1"
npm.cmd run qa:customer-live-journey-proof
Remove-Item Env:\NUTRITAIL_QA_WRITE_MANUAL_PROOF_DRAFT
```

This writes:

```txt
.qa-secrets/customer-live-journey-proof.draft.json
```

Rename or copy it to `.qa-secrets/customer-live-journey-proof.json` only after
the browser journey really passed and each TODO note has been replaced with
evidence from the live page. The draft is a checklist helper, not proof by
itself.

The runner rejects TODO, placeholder, draft, or example evidence text even if
`passed` is set to `true`. Proof notes must describe what actually happened in
the live browser.

## Optional Controlled Live Write Proof

By default, the runner is non-destructive. It does not save pets, reports, or
progress notes. When you intentionally want the runner to prove the full live
journey, you can enable a controlled write proof:

```powershell
$env:NUTRITAIL_QA_ENABLE_LIVE_WRITE_PROOF="1"
npm.cmd run qa:customer-live-journey-proof
Remove-Item Env:\NUTRITAIL_QA_ENABLE_LIVE_WRITE_PROOF
```

This mode uses the authenticated QA cookie, creates a clearly named QA pet in
the live account, saves a test analysis with grams/day, opens the report and
timeline routes, and writes one progress note. Use it only when you are ready
to create live QA data. The runner never prints the cookie or the user id.

## Status Meaning

- `SKIP_AUTH`: API recommendation proof ran, but logged-in production proof is missing.
- `PASS_NON_DESTRUCTIVE`: logged-in chatbot, OpenAI extraction, and Food V2 card proof passed, but save/report/timeline/progress browser proof is still missing.
- `PASS_FULL`: authenticated extraction, recommendations, save, report, timeline, and returning progress all have current proof.
- `REVIEW`: at least one checked route or shape failed.

Only `PASS_FULL` should justify moving Customer UX above 84%.

## Current Practical Gate

If the runner returns `PASS_NON_DESTRUCTIVE`, the customer journey is no longer
blocked by login, OpenAI extraction, or Food V2 card retrieval. The remaining
work is the live browser part that writes and reopens a real customer flow:

1. choose a food and confirm grams/day plus first-week next steps
2. save the analysis
3. open the saved pet report
4. open the same pet timeline
5. return to the same pet for progress without restarting intake

That browser proof can then be written to the ignored
`.qa-secrets/customer-live-journey-proof.json` file and rechecked by the runner.
Alternatively, the controlled live write proof can produce the same proof
directly when `NUTRITAIL_QA_ENABLE_LIVE_WRITE_PROOF=1` is set intentionally.
