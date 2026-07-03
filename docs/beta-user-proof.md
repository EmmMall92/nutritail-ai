# Beta User Proof

This proof is the next Customer UX gate after the controlled QA-account journey.
It decides whether Customer UX can move from 88% toward 90%.

The point is simple: a real beta user should complete the full nutrition
journey without a developer, admin, or pet-shop expert explaining what to do.

## Run

```powershell
npm.cmd run qa:beta-user-proof-contract
```

The runner is intentionally non-blocking when no real beta proof file exists. In
that case it writes a `PENDING` report so the dashboard can show what still
needs to be collected.

## Evidence File

Create this ignored local file only after real beta users have tested the flow:

```txt
.qa-secrets/beta-user-proof.json
```

Start from:

```powershell
Copy-Item docs/beta-user-proof.template.json .qa-secrets/beta-user-proof.json
```

For each beta user, keep `passed: true` only if the evidence note proves the
whole flow:

- signup/login
- pet intake
- food cards
- selected food
- grams/day
- save
- report
- timeline or progress
- feedback
- no manual help

The runner rejects TODO, placeholder, draft, or example notes.

## Suggested Minimum

For the next score move, collect at least three real beta journeys:

1. one dog owner
2. one cat owner
3. one returning saved-pet user who comes back for progress or a new food

The proof is not about perfect scientific accuracy. That is covered by the
Food V2 and recommendation QA banks. This proof is about whether the online
customer experience is understandable enough to use.

## Status Meaning

- `PENDING`: no real beta proof file exists yet, or fewer than three users have
  complete evidence.
- `PASS`: at least three beta users completed the full journey with usable
  feedback and no manual help.
- `REVIEW`: a local proof file exists, but one or more entries has vague,
  placeholder, or incomplete evidence.

Only `PASS` should justify moving Customer UX from 88% toward 90%.
