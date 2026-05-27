# NutriTail AI Chatbot Quality Roadmap

This roadmap turns the production chatbot blueprint into small implementation phases that can be shipped without large rewrites.

## Goal

The chatbot should answer like a careful pet nutrition assistant: product-aware, condition-aware, transparent about missing data, and cautious when a case belongs with a veterinarian.

The model should not rely on memory for brand or formula facts. Product facts should come from the NutriTail food database, then deterministic logic should shape the recommendation before any final conversational wording.

## Phase 1: Safer Current Chatbot

Status: shipped foundation.

Focus:

- Improve Greek, Greeklish, typo, and alias parsing.
- Show data quality confidence when a food is matched.
- Add guardrails for urinary, kidney, GI, allergy, senior weight-loss, and puppy growth cases.
- Avoid simplistic ingredient myths such as “grain is bad” or “by-products are always bad.”

Exit criteria:

- `npm run build` passes.
- Account chatbot can parse common Greek/Greeklish answers.
- Safety notes appear before confident food advice when health issues are present.

## Phase 2: Product Resolver And Compare Mode

Status: shipped foundation.

Focus:

- Centralize fuzzy food matching.
- Support aliases such as `RC`, `RoyalCanin`, `N&D`, and common typos.
- Add an API route that compares 2-5 matched foods using structured nutrient fields.
- Return missing nutrition fields and data confidence per product.

Exit criteria:

- Resolver returns a top candidate and shortlist.
- Compare API returns kcal, protein, fat, fiber, minerals, missing fields, and source confidence.
- Low-confidence matches are not presented as certain.

## Phase 3: Golden Evaluation Harness

Status: shipped foundation.

Focus:

- Maintain a reviewed set of representative prompts.
- Cover English, Greek, and Greeklish.
- Include safety red flags, food comparison, ingredient myths, allergy questions, weight management, and vague “best food” prompts.
- Validate the eval file structure in CI-style scripts before future chatbot changes.

Exit criteria:

- `npm run review:chatbot` passes.
- Golden cases cover normal, caution, and urgent safety levels.
- Every future chatbot PR can be checked against the same scenarios.

## Phase 4: Recommendation Rule Engine

Focus:

- Convert pet context and food data into deterministic suitability signals before text generation.
- Separate hard exclusions from soft ranking signals.
- Weight life stage, weight goal, size/breed, condition fit, ingredient suitability, and data confidence.

Initial conditions:

- Neutered or weight gain risk.
- Weight loss or obesity.
- Large/giant puppy growth.
- Chronic GI sensitivity.
- Suspected food allergy.
- Urinary concerns.
- Kidney/renal disease.

Exit criteria:

- The chatbot can explain why a product is boosted, penalized, or excluded.
- Multi-condition pets show tradeoffs instead of a single overconfident answer.

## Phase 5: Admin Review And Feedback Loop

Status: foundation in progress.

Focus:

- Let admins review unresolved chatbot matches.
- Track “was this helpful?” feedback.
- Store anonymized failure modes such as no match, unsafe prompt, missing kcal, missing minerals, or ambiguous brand/formula.

Exit criteria:

- Admin can see common chatbot failure reasons.
- Food data cleanup can be prioritized by real user demand.
- Repeated no-match product queries feed the food data backlog.

## Implementation Rules

- Keep database schema unchanged until a specific migration is approved.
- Do not remove existing routes.
- Prefer additive APIs and helpers.
- Keep PRs small enough to review quickly.
- Run `npm run lint`, `npx tsc --noEmit`, and `npm run build` before merge.

## Near-Term PR Order

1. Chatbot parsing and confidence polish. Done.
2. Safety guardrails. Done.
3. Food compare API. Done.
4. Golden eval cases and validator. Done.
5. Recommendation rule engine helper. Done.
6. Chatbot UI integration for compare mode. Done.
7. Admin feedback capture for failed matches. Done.
8. Next: expand golden evals from structure checks into response regression checks.
9. Next: connect admin feedback trends directly to food-data cleanup batches.
