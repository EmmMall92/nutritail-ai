# Customer Product Progress Score

This score answers a different question from automated live readiness.

- **Automated live readiness** proves that routes, QA suites, deploy freshness,
  OpenAI presence, and launch contracts are passing.
- **Customer product progress** estimates how close NutriTail feels to a polished
  customer-ready product for a real pet owner.

Do not raise this score because a pull request merged. Raise it only when a
customer-visible risk is reduced and the evidence below is current.

## Current Estimate

There are now three separate progress numbers. Do not collapse them into one
headline, because that is what made progress feel stuck or misleading.

- Customer UX readiness is currently **85%**.
- Recommendation engine beta confidence is currently **95% beta-candidate**.
- Overall SaaS launch progress is currently **90%**.

Customer UX readiness is the number to use when the question is "does a normal
pet owner experience the site as simple, beautiful, and complete?". It has moved
above the old 80-82% band because a logged-in live browser journey now proves
the non-save recommendation path: intake stays in order, the chatbot shows 3
first choices plus 3 practical/value choices, a food can be selected, and
grams/day plus first-week next steps become visible. It moved one more point
because the food-choice result no longer repeats multiple explanatory panels:
the customer now sees one compact compare, choose, grams/day strip before the
food cards. It has now moved to 85% because a controlled authenticated live
write proof saved a QA pet, opened the report and timeline routes, wrote a
progress note, and returned to the same pet in progress mode. It should not move
higher yet until the live chatbot and report output are proven free of
customer-visible back-office wording across broader journeys.

## Customer UX Scorecard

This scorecard explains why progress can feel flat even while the system is
getting stronger. It separates customer-facing polish from engine confidence and
from overall SaaS launch readiness.

| Track | Current | What is proven now | What blocks the next move |
| --- | --- | --- | --- |
| Customer-facing journey | 85% | Logged-in production proof now covers ordered intake, 3 premium + 3 value cards, food choice, grams/day, selected-food plan, first-week checklist, next steps, save, printable report, timeline, and return-to-progress for the same saved pet. | Needs clean customer wording proof across live chatbot/report output before moving further. |
| Recommendation engine | 95% beta-candidate | Food V2 retrieval, deterministic ranking, OpenAI fact extraction, safety guards, dog 201-600, and cat 001-500 QA are passing. | Keep converting every real manual/live mistake into a ranking or intake guard. |
| Saved-pet retention loop | strong but not fully live-proven | Account, pet profile, report, timeline, progress check, no-result advice, and flavour/brand change paths are protected. | Needs production repeat proof with the same saved pet after an earlier analysis. |
| Report/account clarity | good foundation | Report/account surfaces calories, selected food, progress context, timeline, and return actions. | Needs final mobile/customer visual proof that the next action is obvious without reading admin notes. |
| SaaS launch readiness | 90% | Public trust pages, beta plan direction, auth recovery, monitoring contracts, and post-deploy QA exist. | Paid checkout/billing enforcement, final legal review, monitoring freshness, and first beta-user feedback are still open. |

Recommendation engine beta confidence is higher because Food V2, ranking rules,
dog/cat QA banks, OpenAI fact extraction, safety guards, and deterministic food
selection have broad automated evidence. That does not mean the customer-facing
experience is already 95%.

Overall SaaS launch progress is lower on purpose. It includes everything needed
for a real public SaaS, not just the nutrition engine: business limits, beta
access, subscription or payment direction, production monitoring, legal/trust
readiness, live post-deploy proof, and operational support.

The latest launch-wide move from **89%** to **90%** is justified by completing
fresh dog live QA coverage across the full 201-600 scenario bank:

- Dog live QA cases **201-600** now pass with **400/400** checked and
  **0 review** after the recommendation engine handled sterilised, active,
  allergy, senior, puppy, large-breed puppy, rescue, budget, premium,
  preference, sensitive digestion, and growth scenarios in live Food V2
  recommendation checks.
- The previously reviewed dog case **534** now passes in the chunk that
  contains it, so the large-breed puppy allergy/growth path is protected by the
  live runner instead of relying on manual confidence.
- This raises launch confidence because dog-side recommendation QA now has
  broad fresh evidence beyond the earlier 93-200 range, but it still does not
  close paid checkout, billing enforcement, final legal review, production
  monitoring, authenticated OpenAI proof, or real beta-user operating feedback.

The previous launch-wide move from **88%** to **89%** was justified by completing
fresh cat live QA coverage across the full 001-500 scenario bank:

- Cat live QA cases **201-500** now pass with **300/300** checked and
  **0 review** after the QA runner learned that renal/urinary therapeutic
  priority is valid for multi-condition cats that also have obesity.
- The full fresh cat evidence is now **500/500** live cases with **0 review**
  across sterilised, kitten, urinary, renal, weight-control, allergy, hairball,
  fussy eater, rescue, GI, IBD, pancreatitis, diabetes, senior, pregnancy,
  lactation, transition, urgent safety, budget, premium, and preference
  scenarios.
- This raises launch confidence because cat-side recommendation QA is no longer
  partial or stale, but it still does not close paid checkout, billing
  enforcement, final legal review, production monitoring, or real beta-user
  operating feedback.

The previous launch-wide move from **87%** to **88%** was justified by fresh cat
live recommendation QA evidence after a real ranking-context fix:

- Cat live QA cases **001-050** now pass with **50/50** checked and **0 review**
  after the latest cat weight-context guard, including the previously reviewed
  non-neutered general cat cases.
- Cat live QA cases **051-200** now pass with **150/150** checked and
  **0 review**, covering overweight, allergy, elimination diet, hairball, fussy
  eater, rescue, GI, IBD, pancreatitis, diabetes, renal/urinary combinations,
  recovery, kitten, indoor/outdoor energy, multi-cat, and preference scenarios.
- The ranking fix prevents low activity alone from producing
  sterilised/weight-prone reasoning for a general non-neutered cat, so customer
  explanations are less likely to imply the wrong nutrition context.
- This raises launch confidence because it adds fresh cat-side live proof to the
  dog-side evidence, but it does not close paid checkout, billing enforcement,
  final legal review, production monitoring, or real beta-user operating
  feedback.

The previous launch-wide move from **86%** to **87%** was justified by fresh live
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

The latest customer-facing work moves Customer UX readiness from **84%** to
**85%** because the first full customer journey gate now has current
authenticated production proof:

- `qa:customer-live-journey-proof` now reaches **PASS_FULL** with a controlled
  live write proof.
- The proof saved a clearly named QA pet, kept a selected food and
  **95 grams/day**, opened the printable report route, opened the timeline
  route, wrote one progress note, and returned to the same pet in progress
  mode.
- The proof also kept the non-destructive checks passing: logged-in chatbot
  access, OpenAI intake extraction, and Food V2 3 premium + 3 value recommendation
  cards.
- This is enough to move out of the 84% gate, but not enough to jump past the
  next gate because broader live customer wording and report-output cleanliness
  still need proof.

The previous customer-facing work moved Customer UX readiness from **83%** to
**84%** because it removed a real source of visual noise in the live chatbot
recommendation result:

- The food-choice result no longer shows duplicate guide panels before and
  after the recommendation cards.
- The customer sees one compact decision strip: compare fit and taste, choose
  one food card, then get grams/day.
- The recommendation cards, selected-food grams/day flow, first-week checklist,
  and save gate remain protected by QA. This is a customer-visible simplicity
  improvement, but it still does not prove save, printable report, timeline, or
  returning-progress completion.

The previous customer-facing work moved Customer UX readiness from **82%** to
**83%** because it fixed and proved a real live-chatbot flow issue:

- The chatbot intake now scopes OpenAI/fallback extracted facts to the active
  question, so an unrelated inference can no longer skip the activity question
  and jump straight to neuter status.
- A logged-in production browser smoke completed the non-save journey through
  new pet intake, activity, neuter status, health, current food, preferences,
  weight goal, 3 first-choice food cards, 3 practical/value food cards, selected
  food, grams/day, first-week checklist, and next steps.
- This was a real customer-facing improvement, not only an internal contract.
  At that point the score still stopped at 83% because the same live proof did not save a
  plan or verify the printable report, timeline, and returning progress loop.

The latest engine-confidence move from **94-95%** to **95% beta-candidate** is
still justified by the returning-customer nutrition loop becoming visible in the
account dashboard:

- Saved plans now surface a clear 2-4 week progress-check reminder instead of
  leaving the customer to remember what to do after the first recommendation.
- The account dashboard tells the customer exactly what to bring back: new
  weight, real grams/day, treats, appetite, stool, energy, and whether the pet
  still accepts the flavour.
- The progress reminder links directly into the saved-pet progress-check flow,
  so customers can continue from the same pet instead of restarting the chatbot.
- This does not close the broader SaaS launch gap, but it removes a real
  customer-retention weakness in the nutrition journey.

Fresh recommendation evidence after that move confirms that the recommendation
engine is not the old 78-80% foundation stage:

- Dog live QA cases **101-200** now pass with **100/100** checked and
  **0 review** in deterministic Food V2 mode.
- This covers high-activity and working dogs, apartment/low-activity dogs,
  sterilised and weight-prone cases, GI and allergy/intolerance cases, urinary,
  renal, hepatic, cardiac, joint, recovery, pregnancy/lactation, puppy, senior,
  climate/environment, and rescue scenarios.
- This does not raise the customer UX readiness score by itself, because
  moving beyond the beta-candidate line needs authenticated OpenAI/live journey
  proof and real beta-user feedback. It does strengthen confidence that the
  recommendation engine is no longer sitting at the 78-80% foundation level.

Fresh OpenAI-enabled recommendation evidence also now exists for the first part
of that dog bank:

- Dog live QA cases **101-110** pass with **10/10** checked and **0 review** with
  `NUTRITAIL_QA_OPENAI=1`.
- This proves the hybrid path for working, high-activity, sensitive, and
  large/giant puppy dog cases: OpenAI extracts the pet facts, then NutriTail
  keeps Food V2 retrieval and ranking deterministic.
- This still does not close the full OpenAI proof blocker, because the
  authenticated live chatbot extract route still needs a QA account cookie run.

Fresh current QA evidence on **July 2, 2026** confirms that this is still true
after the latest customer-copy and saved-pet polish:

- Dog live QA cases **101-200** pass again with **100/100** checked and
  **0 review** with OpenAI extraction enabled.
- Cat live QA cases **001-100** pass with **100/100** checked and **0 review**,
  covering sterilised, kitten, urinary, renal, weight-control, allergy,
  hairball, picky-eater, rescue, climate, and premium/value-style scenarios.
- This is evidence for recommendation accuracy and hybrid OpenAI/NutriTail
  stability, but it does not raise the score above 95% because authenticated
  production journey proof, real beta-user feedback, monitoring freshness, and
  business-launch proof are still separate gates.

Fresh Food V2 format coverage also explains why the number should not be
inflated just because dry-food recommendations are strong:

- `qa:food-v2-format-coverage` confirms that dry dog and dry cat scenarios have
  visible premium/value recommendations from Food V2.
- The same check now separates visible wet coverage from safe holds and true
  data gaps. Cat wet has visible options, while dog wet still has no safe
  adult visible option because the current wet dog candidate is puppy-positioned
  and correctly held out.
- This does not invalidate the dry-food chatbot experience, but it is a real
  data-coverage blocker for claiming complete dog wet/canned recommendation
  readiness.

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

This is now strong technically, and the live recommendation path has moved above
the 82% customer UX readiness line. The next customer-facing points should
come from save/report/timeline/progress proof, cleaner report visuals, returning
pet proof, or a real beta-user journey after the latest merge.

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

At 85% Customer UX readiness, small internal polish improves the product but may
not move the customer score unless it removes real customer-facing friction. The
next points require one of these:

- A live chatbot QA run finds a real mistake and the fix is locked by a test.
- A customer flow becomes clearly simpler, not just slightly prettier.
- A report/account/auth page removes a launch blocker.
- A post-deploy proof changes from skipped or stale to fresh and passing.
- A Food V2 format gap closes, especially wet/canned dog or cat recommendations
  moving from "no visible choices" to usable customer cards.
- A business-launch gap is closed enough for beta users.
- Broader live customer journeys prove that signup, pet intake, recommendation,
  food choice, grams/day, save, report, and return-progress flow work without
  manual explanation and without back-office wording.

## Next Score Moves

These are the most likely moves from **85% Customer UX readiness** toward a real
90% customer-ready product:

1. Remove remaining customer-facing technical/back-office language from chatbot
   recommendations and reports.
2. Verify saved-pet continuation with progress/no-progress/food-change flows on
   production after deploy.
3. Run five broader full live customer journeys from signup/login through
   chatbot, recommendation, food button, grams/day, save, report, and return
   progress so the single controlled QA pet proof becomes broader customer proof.
4. Keep dog/cat live QA fresh after each recommendation-ranking change and
   convert any real mistake into a ranking guard.
5. Backfill enough wet/canned dog foods that `qa:food-v2-format-coverage` no
   longer reports dog wet-only journeys as safe holds/data gaps.
6. Add first subscription/payment direction when beta limits are ready.

## Customer UX Unlock Gates

Use these gates to decide whether Customer UX readiness can move beyond the
85% line. A merged PR is not enough. Each gate needs current evidence that a
normal customer can complete the flow without manual explanation.

| Gate | Unlocks | Evidence Needed |
| --- | --- | --- |
| Full recommendation journey proof | completed to 85% Customer UX readiness | `qa:customer-live-journey-proof` reached PASS_FULL with authenticated extraction, Food V2 cards, selected food grams/day, save, report, timeline, and return-progress proof for the same saved pet. |
| Clean customer wording proof | 85-86% Customer UX readiness | Live chatbot and report output contain no source-tier, needs-review, missing-field, score-debug, or back-office wording visible to customers. |
| Returning pet proof | 86-87% Customer UX readiness | A saved pet can run progress check, no-progress follow-up, flavour/brand change, new food recommendation, and timeline review without restarting intake. |
| Report/account proof | 87-88% Customer UX readiness | Account dashboard and printable report make calories, chosen food, grams/day, why it fits, transition plan, and next check-in obvious on mobile and desktop. |
| Real beta-user proof | 88-90% Customer UX readiness | At least a small beta group completes analyses, chooses foods, saves plans, returns for progress, and leaves usable feedback with no critical launch blockers. |

## Overall SaaS Blockers

These are the main reasons the whole project remains around 90% even though the
recommendation engine is now a beta candidate and Customer UX readiness is still
around 85%:

- The first full customer journey proof exists, but broader beta-user proof is
  still missing across multiple real customer journeys.
- Subscription/payment direction is clearer after the beta plan direction work,
  but paid checkout, billing operations, and subscription enforcement are not
  active yet.
- Production monitoring and post-deploy freshness need to remain current after
  every chatbot, Food V2, account, report, auth, or public-route deploy.
- Food V2 dry-food recommendations are usable and cat wet now has visible
  options, but dog wet/canned coverage is still not visible enough for dog
  wet-only customer journeys.
- Legal/trust pages exist, but they still need final operating review before
  broader public launch.
- The first real beta-user feedback cycle is not complete yet: users need to
  run analyses, choose foods, save plans, return for progress, and generate
  actionable feedback.

## Reporting Rule

When reporting progress, always say all relevant numbers if available:

- `Automated live readiness`: from `reports/live_readiness_dashboard.md`.
- `Customer UX readiness`: from this rubric and the latest customer-flow QA.
- `Recommendation engine beta confidence`: from Food V2/ranking/OpenAI QA.
- `Overall SaaS launch progress`: from this rubric's launch-wide estimate.

Example:

> Automated live readiness is 98/100. Recommendation engine beta confidence is
> about 95% beta-candidate, Customer UX readiness is about 85%, and overall
> SaaS launch progress is about 90%. The next customer score movement depends on
> clean customer-facing wording across chatbot/report output, broader saved-pet
> continuation proof, and real beta-user feedback, while the launch-wide score
> also depends on monitoring, payments/subscription direction, and production
> operating proof.
