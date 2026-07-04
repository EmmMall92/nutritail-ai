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

Use `docs/beta-user-test-card.md` during the actual beta session. It gives the
tester flow, the minimum evidence checklist, and examples of strong versus weak
proof notes. Use `docs/beta-user-session-playbook.md` as the moderator runbook:
it explains what the moderator may say, what counts as no manual help, and how
to turn review/fail sessions into follow-up work across the ten launch tracks.
Use `docs/beta-user-proof-session-packet.md` as the quick operating packet
right before the tester starts.
Use `docs/beta-user-proof-worksheet.md` immediately after the session to mark
each required step as `PASS`, `REVIEW`, or `FAIL` and turn unclear sessions into
follow-up work under the ten launch tracks.

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
- device captured: mobile or desktop

Each entry must also include one of these `journey_type` values:

- `dog_owner`
- `cat_owner`
- `returning_saved_pet`

The score should not move with three nearly identical tests. The proof needs one
dog owner, one cat owner, and one returning saved-pet user so the main customer
journeys are covered.

At least one of the three sessions should be completed on mobile before using
the proof to move Customer UX readiness. Desktop proof is still useful, but the
public customer experience depends heavily on the mobile chatbot, cards, report,
and progress loop.

The runner rejects TODO, placeholder, draft, or example notes.

Do not move the percentage from a session unless the worksheet result is
`PASS`. A `REVIEW` or `FAIL` result is still useful evidence, but it should
create a product task instead of raising Customer UX readiness.

## Suggested Minimum

For the next score move, collect at least three real beta journeys:

1. one dog owner (`journey_type: "dog_owner"`)
2. one cat owner (`journey_type: "cat_owner"`)
3. one returning saved-pet user who comes back for progress or a new food
   (`journey_type: "returning_saved_pet"`)

The proof is not about perfect scientific accuracy. That is covered by the
Food V2 and recommendation QA banks. This proof is about whether the online
customer experience is understandable enough to use.

## Status Meaning

- `PENDING`: no real beta proof file exists yet, or fewer than three users have
  complete evidence.
- `PASS`: at least three beta users completed the full journey with usable
  feedback and no manual help, including one dog owner, one cat owner, and one
  returning saved-pet user.
- `REVIEW`: a local proof file exists, but one or more entries has vague,
  placeholder, or incomplete evidence.

Only `PASS` should justify moving Customer UX from 88% toward 90%.

## Operating Rule

The proof file is evidence, not a wish list. If a tester needed manual help,
mark that entry as `passed: false` even if the feedback was positive. If a
tester completed the journey but found confusing copy, keep the entry factual
and create a follow-up task from the session playbook.
