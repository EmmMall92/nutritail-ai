# Customer Product Progress Score

This score answers a different question from automated live readiness.

- **Automated live readiness** proves that routes, QA suites, deploy freshness,
  OpenAI presence, and launch contracts are passing.
- **Customer product progress** estimates how close NutriTail feels to a polished
  customer-ready product for a real pet owner.

Do not raise this score because a pull request merged. Raise it only when a
customer-visible risk is reduced and the evidence below is current.

## Current Estimate

Customer product progress is currently **89-90%**.

This means the product is beyond the old 78-80% foundation stage and is now in
the beta-readiness band. The remaining work is harder because each point now
requires live UX proof, recommendation accuracy proof, or business/launch proof.

## Latest Movement

The latest move from **88-89%** to **89-90%** is justified by customer-visible
work that reduced real user friction:

- Auth copy and auth error states now use safer customer language.
- Saved analysis handoff gives clearer profile, report, timeline, and progress
  check next steps.
- Printable saved reports are more customer-facing and avoid back-office labels.
- Saved-pet continuation supports progress checks, no-result follow-up,
  another-food guidance, flavour/company change, and timeline review.

This is not a 90%+ launch claim yet. The next point should come from live
dog/cat chatbot QA that finds and fixes real recommendation mistakes, or from a
fresh authenticated OpenAI chatbot proof after deploy.

## Ten Launch Categories

| Category | Weight | Current Status | Evidence To Raise |
| --- | ---: | --- | --- |
| Final chatbot experience | 16 | Strong, but still needs more real-flow polish | Live conversations show clean answers, 3 premium + 3 value choices, food buttons, grams/day, and next steps without back-office wording. |
| Saved pet continuation | 10 | Working, needs repeated live progress checks | Returning to a saved pet supports progress check, no-progress advice, new food, flavour change, brand change, and timeline review. |
| Pet report page | 9 | Useful, still needs visual/customer polish | Report clearly shows calories, goal, selected food, why it fits, grams/day, transition plan, and next action. |
| Food recommendation accuracy | 18 | Good automated coverage, still needs stricter live review | Dog and cat batches continue to pass, and real mistakes from manual review become ranking guards. |
| User account polish | 8 | Solid dashboard foundation | Account page makes pets, latest analysis, progress, reports, and actions obvious on mobile and desktop. |
| Email/auth polish | 7 | Stronger after customer-safe auth errors | Login, register, forgot password, reset password, and email-confirmation states use plain customer language. |
| Public trust pages | 7 | Good foundation | About, how-it-works, methodology, privacy, terms, and AI-boundaries explain trust without overclaiming. |
| Analytics/feedback loop | 8 | Present, needs real usage review | Admin can see not-helpful feedback, selected foods, funnel drop-off, and recurring recommendation issues. |
| Launch QA | 10 | Strong automated evidence | Mobile, live routes, SEO, GSC assets, speed, error monitoring, and post-deploy checks stay fresh after deploys. |
| Business layer | 7 | Beta/waitlist exists; paid plans later | Beta access, plan limits, subscription/payment direction, and launch gating are clear enough for first users. |

## Why It Feels Stuck

At 89-90%, small polish work improves the product but may not move the score.
The next points require one of these:

- A live chatbot QA run finds a real mistake and the fix is locked by a test.
- A customer flow becomes clearly simpler, not just slightly prettier.
- A report/account/auth page removes a launch blocker.
- A post-deploy proof changes from skipped or stale to fresh and passing.
- A business-launch gap is closed enough for beta users.

## Next Score Moves

These are the most likely moves from 89-90 toward 91-92:

1. Run live dog/cat chatbot QA and convert any real mistake into a ranking guard.
2. Polish the final report so it reads like a useful customer handout.
3. Verify saved-pet continuation with progress/no-progress/food-change flows.
4. Complete one authenticated live chatbot extract proof with a QA account cookie.
5. Add clearer beta limits or first subscription direction.

## Reporting Rule

When reporting progress, always say both numbers if available:

- `Automated live readiness`: from `reports/live_readiness_dashboard.md`.
- `Customer product progress`: from this rubric and the latest customer-flow QA.

Example:

> Automated live readiness is 98/100, but customer product progress is about
> 89-90%. The next point depends on live chatbot accuracy fixes or live OpenAI
> proof, not another generic PR.
