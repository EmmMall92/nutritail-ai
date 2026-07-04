# Customer Launch 10-Track Audit

This audit keeps the broad NutriTail launch goal honest. The score should move
only when a track gains current customer-facing proof, not when a PR merely
adds internal code.

## Current Position

- Customer UX readiness: 88%
- Recommendation engine beta confidence: 95% beta-candidate
- Overall SaaS launch progress: 90%
- Next honest unlock: real beta-user proof across dog, cat, and returning
  saved-pet journeys without manual help.

## Progress Ladder

| Band | Meaning | Honest next unlock |
| --- | --- | --- |
| 78-80% | Old foundation stage: routes, auth, data architecture, and first chatbot logic existed but the customer journey was not yet proven. | Already passed. Do not keep reporting this as the current state. |
| 88% Customer UX | Controlled production proof covers the customer journey from intake to saved plan, report, timeline, and returning progress. | Three real beta users complete the same flow without manual help. |
| 90% SaaS launch | The wider product has strong automated QA, trust pages, auth recovery, monitoring contracts, and beta direction. | Business enforcement, final legal/trust review, fresh monitoring, and beta feedback loop. |
| 95%+ launch candidate | Real users have completed the core journeys and recurring issues are captured in analytics/feedback. | Paid launch operations and ongoing support readiness. |

## Track Audit

| Track | State | Current proof | Next proof needed |
| --- | --- | --- | --- |
| Final chatbot experience | Partial | Controlled QA proves ordered intake, cleaner customer wording, 3 premium + 3 value style cards, food choice, grams/day, and next steps. | Real beta users complete the same flow and understand the final recommendation without back-office explanation. |
| Saved pet continuation | Partial | Controlled QA proves progress check, no-result, flavour/brand change, new food recommendation, timeline, and saved-pet return paths. | A returning beta user reopens the same pet, reports progress or no progress, and gets a useful next recommendation without restarting intake. |
| Pet report page | Partial | Report/account proof shows calories, selected food, grams/day, why it fits, transition, timeline, and next check-in for a controlled saved pet. | Real users can read the report on mobile and know what to feed, what to watch, and what to do next. |
| Food recommendation accuracy | Strong beta | Dog 001-200, dog 201-600, and cat 001-500 QA banks pass with deterministic Food V2 ranking and OpenAI extraction guarded from inventing foods. Fresh July 4 proof: dog 001-200 passed 200/200 live with OpenAI extraction enabled and 0 review. | Convert every real beta mistake into a ranking/intake guard and keep dog/cat suites fresh after recommendation changes. |
| User account polish | Partial | Dashboard, saved pets, reports, progress reminders, and action links exist. | Beta users can find latest analysis, progress actions, and reports without being guided. |
| Email/auth polish | Partial | Login/register/forgot/reset copy and destination guidance are protected by QA. | Confirm real users understand email confirmation/recovery states on production. |
| Public trust pages | Partial | How-it-works, beta/plan direction, privacy/terms, and recommendation boundaries exist. | Final legal/trust review and clearer public confidence copy before wider launch. |
| Analytics/feedback loop | Partial | Admin feedback shows selected foods, failed matches, not-helpful groups, funnel drop-offs, and beta proof signals. | Use real beta feedback to choose the next fix, then prove the fix reduced a customer-visible issue. |
| Launch QA | Strong automated | Live routes, deploy freshness, monitoring contracts, OpenAI env checks, and readiness dashboards exist. | Keep post-deploy evidence fresh after every chatbot, Food V2, account, report, auth, or public-route change. |
| Business layer | Partial | Beta access, waitlist, plan-limit direction, and no-card beta messaging exist. | Decide and implement paid checkout/billing enforcement or a clear beta-only launch limit. |

## Why The Percentage May Stay Flat

- Customer UX readiness is blocked by real beta-user proof, not by missing
  internal scaffolding.
- Recommendation confidence is already high enough for beta, but it does not
  prove the whole SaaS is 95%.
- Overall launch progress still includes business, legal, monitoring freshness,
  and operational feedback loops.

## Next Actions

1. Run three real beta journeys: one dog owner, one cat owner, and one returning
   saved-pet user.
2. Record whether each user chose a food, understood grams/day, saved the plan,
   opened the report, and knew the next step.
3. Put the evidence into `.qa-secrets/beta-user-proof.json`.
4. Run `npm.cmd run qa:beta-user-proof-contract`.
5. Raise Customer UX readiness only if the proof reports PASS.
