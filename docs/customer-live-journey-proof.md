# Customer Live Journey Proof

This proof decides whether Customer UX can move beyond the current 83% gate.
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

## Status Meaning

- `SKIP_AUTH`: API recommendation proof ran, but logged-in production proof is missing.
- `PASS_NON_DESTRUCTIVE`: logged-in chatbot, OpenAI extraction, and Food V2 card proof passed, but save/report/timeline/progress browser proof is still missing.
- `PASS_FULL`: authenticated extraction, recommendations, save, report, timeline, and returning progress all have current proof.
- `REVIEW`: at least one checked route or shape failed.

Only `PASS_FULL` should justify moving Customer UX above 83%.
