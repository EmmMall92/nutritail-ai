# Beta User Proof Session Packet

Use this packet when a real customer tests NutriTail. It keeps the evidence
consistent enough to move Customer UX only when the product itself is clear.

## Session Slots

Run one complete session for each slot:

| Slot | Tester profile | Must prove |
| --- | --- | --- |
| dog owner journey | A dog owner starting a new nutrition analysis | The user can reach food cards, choose one food, see grams/day, save, open report, and leave feedback. |
| cat owner journey | A cat owner starting a new nutrition analysis | The same flow works for cat language, cat goals, and cat food cards. |
| returning saved-pet journey | A user who already saved a pet and comes back later | The user can find the saved pet, check progress or request a new food, open timeline/report, and leave feedback. |

## Moderator Script

Say this before the tester starts:

```text
Please use NutriTail as if you found it online. Log in or sign up, enter a real
or realistic pet, read the recommendation, choose one food, check grams/day,
save the plan, open the report, return to timeline or progress, and leave
feedback. I will not help unless something blocks you completely.
```

## Evidence Note Template

Paste one factual note per user into `.qa-secrets/beta-user-proof.json`.

```text
signup/login completed; pet intake completed in Greek or English; food cards
were visible; selected food was [food name]; grams/day was shown; save
completed; report opened; timeline or progress opened; feedback submitted; no
manual help; device captured: mobile or desktop.
```

## Pass Rule

Mark `passed: true` only when all required evidence terms are present and the
tester did not need help understanding what to do next.

If the tester needed help, mark `passed: false`, keep the note factual, and turn
the confusion into a follow-up task under one of the ten launch tracks.

At least one of the first three proof sessions should be mobile. If all three
sessions are desktop-only, keep the result as useful evidence but do not use it
as the final Customer UX unlock yet.

## Commands

```powershell
Copy-Item docs/beta-user-proof.template.json .qa-secrets/beta-user-proof.json
npm.cmd run qa:beta-user-proof-contract
```

Only `qa:beta-user-proof-contract` returning `PASS` should justify moving
Customer UX readiness above the current beta-user proof gate.
