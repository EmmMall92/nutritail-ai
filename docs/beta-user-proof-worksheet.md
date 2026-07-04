# Beta User Proof Worksheet

Use this worksheet after each real beta session. It converts customer behavior
into a score-safe decision without guessing or raising readiness too early.

## Session Identity

- Tester slot: `dog_owner`, `cat_owner`, or `returning_saved_pet`
- Tester label:
- Date:
- Moderator:
- Language used:
- Device: desktop or mobile

## Required Journey Evidence

Mark each item as `PASS`, `REVIEW`, or `FAIL`.

| Step | Evidence to capture | Result |
| --- | --- | --- |
| signup/login | User reached the account flow without help. | |
| pet intake | User entered species, name, age, weight, activity, neutered status, health notes, and preferences. | |
| food cards | User saw clear food options, not technical back-office wording. | |
| selected food | User selected one food from the options. | |
| grams/day | User understood the grams/day estimate and daily calorie context. | |
| save | User saved the analysis. | |
| report | User opened the pet report and understood the result. | |
| timeline or progress | User found progress/timeline or knew how to return later. | |
| feedback | User submitted feedback or explained what was confusing. | |
| no manual help | Moderator did not explain what button to press or what the result meant. | |

## Score-Safe Decision

- `PASS`: every required journey step passed and no manual help was needed.
- `REVIEW`: the user completed the journey, but wording, food choice, report,
  or next step was confusing.
- `FAIL`: the user could not complete the journey without help.

Do not move the percentage from this session unless the result is `PASS`.
Review and fail sessions are still valuable, but they become follow-up tasks
under the ten launch tracks.

## Launch Track Follow-Up

If the result is `REVIEW` or `FAIL`, choose the main track that needs work:

- Final chatbot experience
- Saved pet continuation
- Pet report page
- Food recommendation accuracy
- User account polish
- Email/auth polish
- Public trust pages
- Analytics/feedback loop
- Launch QA
- Business layer

## Evidence Note To Paste

Use one short factual note in `.qa-secrets/beta-user-proof.json`.

```text
signup/login completed; pet intake completed in Greek or English; food cards
were visible; selected food was [food name]; grams/day was shown; save
completed; report opened; timeline or progress opened; feedback submitted; no
manual help. Worksheet result: PASS.
```

If the result is `REVIEW` or `FAIL`, keep `passed: false` and include the exact
reason, for example:

```text
signup/login completed; pet intake completed; food cards were visible; selected
food was [food name]; grams/day was shown; save completed; report opened; user
could not find timeline or progress without help; feedback submitted; manual
help was needed. Worksheet result: REVIEW. Follow-up track: Saved pet
continuation.
```

## Command

```powershell
npm.cmd run qa:beta-user-proof-contract
```

Only a `PASS` result for all three required tester slots should justify moving
Customer UX readiness above the current beta-user proof gate.
