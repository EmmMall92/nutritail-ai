# Beta User Test Card

Use this card when a real beta user tests NutriTail without help. The goal is
not to guide the user through every click. The goal is to prove whether the
online experience is clear enough on its own.

## Who To Test

Collect at least one complete journey from each group:

- dog owner journey
- cat owner journey
- returning saved-pet journey

Do not count three nearly identical journeys as the next Customer UX proof move.
At least one of the first three complete journeys should be done on mobile.

## What The Tester Should Do

Ask the tester to complete this flow on `https://nutritail.ai`:

1. Sign up or log in.
2. Start a chatbot nutrition analysis.
3. Enter pet details naturally, in Greek or English.
4. Reach the food recommendation cards.
5. Choose one food.
6. See grams/day.
7. Save the analysis.
8. Open the pet report.
9. Open timeline or progress check.
10. Leave feedback about whether the answer helped.

The tester should do this without a developer, admin, or pet-shop expert
explaining what to click.

## Evidence To Capture

For every beta user, write short factual notes that include these exact
evidence terms so `qa:beta-user-proof-contract` can validate the proof:

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

Good evidence note:

```text
signup/login completed; pet intake completed in Greek; food cards were visible;
selected food was Royal Canin Mini Adult; grams/day was shown; save completed;
report opened; timeline or progress opened; feedback submitted; no manual help;
device captured: mobile.
```

Weak evidence note:

```text
User tested and liked it.
```

Weak notes do not prove the journey and should remain `passed: false`.

## How To Store Proof

Copy the template:

```powershell
Copy-Item docs/beta-user-proof.template.json .qa-secrets/beta-user-proof.json
```

Then replace each placeholder with real notes from the tester. Keep
`passed: true` only when the journey is complete and the tester did not need
manual explanation.

Run:

```powershell
npm.cmd run qa:beta-user-proof-contract
```

Only a `PASS` result should justify moving Customer UX readiness from 88%
toward 90%.
