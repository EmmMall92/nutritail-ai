# Beta User Session Playbook

This playbook turns the next Customer UX unlock into a repeatable beta session.
Use it when a real pet owner tests NutriTail without help.

The goal is not to make the tester happy in the moment. The goal is to learn
whether the product is clear enough for a normal customer to finish the journey
alone.

## Success Standard

A beta session counts only when the tester completes the journey without manual
help:

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

Do not count a session if the tester needed a developer, admin, or pet-shop
expert to explain the next click.

## Required Mix

Collect at least one complete session from each group before moving Customer UX
readiness above 88%:

- dog owner journey
- cat owner journey
- returning saved-pet journey

Three dog sessions are useful product feedback, but they do not prove the next
Customer UX gate by themselves.

## Moderator Rules

The moderator can set up the call or room, but should not guide the product
flow.

Allowed:

- Ask the tester to open `https://nutritail.ai`.
- Ask the tester to speak out loud when something is confusing.
- Ask follow-up questions after the session ends.
- Record factual notes about what happened.

Not allowed:

- Explain which button to press.
- Explain what a recommendation card means before the tester reacts.
- Tell the tester which food to choose.
- Fix the tester's wording during intake.
- Skip feedback because the session felt successful.

## Session Script

Use this short script before the tester begins:

```text
Please use NutriTail as if you found it online. Start from login or signup,
enter a real or realistic pet, read the recommendation, choose one food, check
grams/day, save the plan, open the report, return to progress or timeline, and
leave feedback. I will not help unless something blocks you completely.
```

After the session, ask:

1. What felt clear?
2. What felt confusing?
3. Did the food choices feel useful?
4. Did you understand grams/day and next steps?
5. Would you come back in 2-4 weeks for progress?

## Evidence Notes

Write evidence in short factual sentences. Include the exact proof terms from
`docs/beta-user-test-card.md` so the QA contract can validate it.

Strong note:

```text
signup/login completed; pet intake completed in Greek; food cards were visible;
selected food was Happy Dog Naturcroq Adult Chicken; grams/day was shown; save
completed; report opened; timeline or progress opened; feedback submitted; no
manual help.
```

Weak note:

```text
The user liked it.
```

Weak notes are still useful feedback, but they do not unlock a score move.

## Decision After Each Session

Use one of these outcomes:

- `pass`: complete journey, no manual help, useful feedback captured.
- `review`: journey happened, but evidence is incomplete or the tester needed
  help.
- `fail`: the tester could not complete a core step.

Every `review` or `fail` should create one follow-up task in the highest-impact
track:

- final chatbot experience
- saved pet continuation
- pet report page
- food recommendation accuracy
- user account polish
- email/auth polish
- public trust pages
- analytics/feedback loop
- launch QA
- business layer

## Score Rule

Only `qa:beta-user-proof-contract` returning `PASS` should justify moving
Customer UX readiness from 88% toward 90%.

Until then, progress can still be real, but the score should stay honest.
