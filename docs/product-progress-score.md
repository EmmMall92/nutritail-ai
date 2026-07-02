# Customer Product Progress Score

This score answers a different question from automated live readiness.

- **Automated live readiness** proves that routes, QA suites, deploy freshness,
  OpenAI presence, and launch contracts are passing.
- **Customer product progress** estimates how close NutriTail feels to a polished
  customer-ready product for a real pet owner.

Do not raise this score because a pull request merged. Raise it only when a
customer-visible risk is reduced and the evidence below is current.

## Current Estimate

Customer product progress is currently **95% beta-candidate**.

This means the product is beyond the old 78-80% foundation stage and is now in
the beta-readiness band. The remaining work is harder because each point now
requires live UX proof, recommendation accuracy proof, or business/launch proof.

Overall SaaS launch progress is currently **87%**.

This is lower on purpose. It includes everything needed for a real public SaaS,
not just the customer nutrition flow: business limits, beta access, subscription
or payment direction, production monitoring, legal/trust readiness, live
post-deploy proof, and operational support. Use this number when the question is
"is the whole company/product ready to launch?", and use customer product
progress when the question is "does the customer-facing nutrition experience
feel close to ready?"

The latest launch-wide move from **86%** to **87%** is justified by fresh live
recommendation QA evidence and a real safety-sensitive intake fix:

- Dog live QA cases **93-120**, **121-150**, **151-175**, and **176-200** now
  pass with **108/108** checked and **0 review** after the latest recommendation
  and intake changes.
- The live dog case "διάρροια με αίμα και είναι κουτάβι" now preserves puppy
  context while keeping the blood red flag, so growth/safety logic does not lose
  a vulnerable life-stage signal in an urgent scenario.
- The fix is locked by `qa:chatbot-intake-cleanup`, the focused
  `NUTRITAIL_QA_CASE_IDS=86 qa:dog-chatbot-live-cases` proof, and the broader
  customer recommendation smoke suite.
- This raises launch confidence because it converts a real live QA review into
  a protected intake guard, but it does not close paid checkout, billing
  enforcement, final legal review, production monitoring, or real beta-user
  operating feedback.

The previous launch-wide move from **85%** to **86%** was justified by clearer
commercial and recovery readiness:

- The beta page now explains that beta users can start without a card, while the
  future Personal and Pro paid-plan direction is visible enough to avoid a vague
  business model.
- Auth recovery flows now have customer-facing copy, password visibility,
  recovery-email guidance, expired-link guidance, and QA contracts for login,
  register, forgot password, and reset password.
- This raises launch confidence, but it does not close paid checkout, billing
  enforcement, final legal review, production monitoring, or real beta-user
  operating feedback.

## Latest Movement

The latest move from **94-95%** to **95% beta-candidate** is justified by the
returning-customer nutrition loop becoming visible in the account dashboard:

- Saved plans now surface a clear 2-4 week progress-check reminder instead of
  leaving the customer to remember what to do after the first recommendation.
- The account dashboard tells the customer exactly what to bring back: new
  weight, real grams/day, treats, appetite, stool, energy, and whether the pet
  still accepts the flavour.
- The progress reminder links directly into the saved-pet progress-check flow,
  so customers can continue from the same pet instead of restarting the chatbot.
- This does not close the broader SaaS launch gap, but it removes a real
  customer-retention weakness in the nutrition journey.

The previous move from **93-94%** to **94-95%** is justified by customer-facing
launch polish that reduced real signup, trust, and saved-report friction:

- Auth success states now give clear next steps after register, forgot password,
  and reset password, including direct continuation actions instead of leaving
  the customer wondering what to do next.
- The printable pet report now surfaces the latest progress check, including
  current weight, weight change, grams/day, treats, appetite, stool, and energy
  context when those details exist.
- Admin activity now exposes beta waitlist visibility, and public beta/terms
  copy clarifies beta access, no card requirement, and subscription/payment
  boundaries for early users.
- These changes do not make the nutrition engine perfect, but they close
  launch-facing gaps around trust, account recovery, saved progress, and beta
  expectations.

The latest move from **92-93%** to **93-94%** is justified by the authenticated
OpenAI/chatbot intake-context fix that closed a real customer-facing QA gap:

- The live chatbot now passes saved/selected pet species context into the intake
  extractor, so follow-up messages such as food transition, portions, flavour
  change, or progress questions do not lose whether the pet is a dog or cat.
- The dog 001-200 live QA moved from the old perceived 78-80% plateau to an
  effective **199/200**: the remaining review case is intentionally not guessed
  because "puppy" alone does not prove an exact age.
- The QA runner now uses the same shared OpenAI prompt contract, deterministic
  fallback merge, and message guards as the production chatbot path, so the
  score reflects the real product instead of a separate test-only interpretation.
- New regression coverage protects Greek/English allergy, sensitivity, mixed
  feeding, increased thirst, chewing/choking risk, activity, and ingredient
  preference parsing.

The previous move from **91-92%** to **92-93%** was justified by a live
recommendation-accuracy review that found and fixed a real customer-visible
ranking issue:

- A working Husky/high-activity dog case no longer treats metadata-only
  `dog_size` as proof that a food is small/mini when the product name and
  visible positioning do not say that.
- The ranking logic still protects true visible mini/small mismatches, so a
  visibly Mini food can be held for a 10kg sterilised dog while metadata-only
  noise does not bury a suitable active formula.
- Activity-context guard scenarios now cover mountain working dogs and
  low-activity apartment dogs, and the Food V2 ranking audit passes 38/38.

The previous move from **90-91%** to **91-92%** was justified by a real
recommendation-accuracy fix that is now protected by QA:

- Weight goal is now preserved when the chatbot asks Food V2 for candidates, so
  weight-loss, weight-maintenance, and weight-gain cases are not flattened into
  the same generic recommendation request.
- The active weight-gain dog guard prevents light/low-fat formulas from
  outranking better energy-support options when the pet profile asks for gain.
- The Food V2 launch-edge accuracy, customer recommendation, AI intake,
  preference-ranking, copy-encoding, typecheck, lint, and build checks passed
  after the change.

The previous move from **89-90%** to **90-91%** was justified by a stronger
analytics/feedback loop that makes the remaining customer-flow risks visible:

- Admin feedback now shows customer drop-off priorities for analyses without
  food choices, food choices without saved plans, failed food matches, and
  not-helpful answers.
- The drop-off panel turns vague "the chatbot needs polish" concerns into
  specific next actions: choice clarity, save confidence, food matching, and
  answer usefulness.
- Chat feedback and funnel QA contracts now protect the drop-off metrics so the
  launch learning loop survives future refactors.

The earlier move from **88-89%** to **89-90%** was justified by
customer-visible work that reduced real user friction:

- Auth copy and auth error states now use safer customer language.
- Saved analysis handoff gives clearer profile, report, timeline, and progress
  check next steps.
- Printable saved reports are more customer-facing and avoid back-office labels.
- Saved-pet continuation supports progress checks, no-result follow-up,
  another-food guidance, flavour/company change, and timeline review.

This is now just under the 95% beta-launch line for the customer experience.
The next point should come from live chatbot proof with real customer journeys,
cat live QA fixes, or a fresh post-deploy proof that the OpenAI-assisted chatbot
flow works cleanly on production after the latest merge.

## Ten Launch Categories

| Category | Weight | Current Status | Evidence To Raise |
| --- | ---: | --- | --- |
| Final chatbot experience | 16 | Strong, needs fresh real-flow proof after each deploy | Live conversations show clean answers, 3 premium + 3 value choices, food buttons, grams/day, and next steps without back-office wording. |
| Saved pet continuation | 10 | Strong account and chatbot loop, needs production repeat proof | Returning to a saved pet supports progress check, no-progress advice, new food, flavour change, brand change, and timeline review. |
| Pet report page | 9 | Useful, still needs visual/customer polish | Report clearly shows calories, goal, selected food, why it fits, grams/day, transition plan, and next action. |
| Food recommendation accuracy | 18 | Good automated coverage, still needs stricter live review | Dog and cat batches continue to pass, and real mistakes from manual review become ranking guards. |
| User account polish | 8 | Solid dashboard foundation | Account page makes pets, latest analysis, progress, reports, and actions obvious on mobile and desktop. |
| Email/auth polish | 7 | Stronger after customer-safe auth errors | Login, register, forgot password, reset password, and email-confirmation states use plain customer language. |
| Public trust pages | 7 | Good foundation | About, how-it-works, methodology, privacy, terms, and AI-boundaries explain trust without overclaiming. |
| Analytics/feedback loop | 8 | Stronger: drop-off priorities are visible | Admin can see not-helpful feedback, selected foods, funnel drop-off, and recurring recommendation issues, then act on the highest-impact customer drop-off group first. |
| Launch QA | 10 | Strong automated evidence | Mobile, live routes, SEO, GSC assets, speed, error monitoring, and post-deploy checks stay fresh after deploys. |
| Business layer | 7 | Beta/waitlist exists; paid plans later | Beta access, plan limits, subscription/payment direction, and launch gating are clear enough for first users. |

## Why It Feels Stuck

At 95%, small polish work improves the product but may not move the score.
The next points require one of these:

- A live chatbot QA run finds a real mistake and the fix is locked by a test.
- A customer flow becomes clearly simpler, not just slightly prettier.
- A report/account/auth page removes a launch blocker.
- A post-deploy proof changes from skipped or stale to fresh and passing.
- A business-launch gap is closed enough for beta users.

## Next Score Moves

These are the most likely moves from 95% beta-candidate toward a firmer 95%+
public beta launch:

1. Verify saved-pet continuation with progress/no-progress/food-change flows on
   production after deploy.
2. Complete one authenticated live chatbot extract proof with a QA account
   cookie after the latest OpenAI intake-context merge.
3. Run real customer chatbot journeys end-to-end and remove any remaining
   confusing copy, loops, or wrong food-choice explanations.
4. Keep dog/cat live QA fresh after each recommendation-ranking change and
   convert any real mistake into a ranking guard.
5. Add first subscription/payment direction when beta limits are ready.

## Overall SaaS Blockers

These are the main reasons the whole project remains around 87% even though the
customer nutrition experience is now a beta candidate:

- Full OpenAI proof still needs the authenticated live chatbot extraction route
  to run with a QA account cookie, not just local or unauthenticated checks.
- Subscription/payment direction is clearer after the beta plan direction work,
  but paid checkout, billing operations, and subscription enforcement are not
  active yet.
- Production monitoring and post-deploy freshness need to remain current after
  every chatbot, Food V2, account, report, auth, or public-route deploy.
- Legal/trust pages exist, but they still need final operating review before
  broader public launch.
- The first real beta-user feedback cycle is not complete yet: users need to
  run analyses, choose foods, save plans, return for progress, and generate
  actionable feedback.

## Reporting Rule

When reporting progress, always say all relevant numbers if available:

- `Automated live readiness`: from `reports/live_readiness_dashboard.md`.
- `Customer product progress`: from this rubric and the latest customer-flow QA.
- `Overall SaaS launch progress`: from this rubric's launch-wide estimate.

Example:

> Automated live readiness is 98/100, but customer product progress is about
> 95% beta-candidate and overall SaaS launch progress is about 87%. The next
> product confidence point depends on real customer chatbot journey proof or
> live OpenAI proof, while the launch-wide score depends on monitoring,
> payments/subscription direction, and production operating proof.
