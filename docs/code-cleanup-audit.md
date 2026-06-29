# Code Cleanup Audit

Last reviewed: 2026-06-29

This audit separates active production code from legacy or cleanup candidates. The goal is to reduce noise without changing database schema, removing live routes, or weakening the Food V2/chatbot flow.

## Keep As Active

- `app/account/chatbot/page.tsx`
  - Main customer chatbot experience.
  - Used by account dashboard, pet pages, progress check-ins, save flow, Food V2 recommendations, and feedback.

- `app/account/**`
  - Main customer account experience.
  - Keep as the current customer-facing product surface.

- `app/admin/**`
  - Active admin operations for foods, Food V2 review/import, recommendation visibility, customers, pets, activity, trash, and QA.

- `app/api/account/**` and `app/api/admin/**`
  - Active API surface for customer/admin flows.
  - Keep protected by existing server-side auth/admin checks.

- `app/api/account/chatbot/analyze/route.ts`
  - Active account-scoped analysis endpoint for the customer chatbot.
  - Requires a Supabase user session before running the shared pet analysis service.

- `app/api/chatbot/save/route.ts`
  - Legacy public save endpoint.
  - Kept as a route for compatibility, but now returns `410 Gone` and points callers to `/api/account/chatbot/save`.

- `lib/food-v2/**`
  - Active Food V2 recommendation, retrieval, validation, ranking, and chatbot summary layer.
  - Keep; this is currently central to the product recommendation engine.

- `lib/chatbot/**`
  - Structured chatbot intelligence/playbook modules.
  - Keep; these are intended to be connected more deeply into the live chatbot over time.

- `lib/food-extraction/**`, `lib/import/**`, `scripts/data/**`, `data/imports/**`, `data/review/**`
  - Food Intelligence ingestion and review pipeline.
  - Keep; these are operational data tools even if they are not bundled into the customer UI.

- `scripts/qa/**` and `data/evals/**`
  - Regression and smoke checks for Food V2 and chatbot behavior.
  - Keep; these help us avoid recommendation regressions.

## Keep But Revisit

- `app/chatbot/page.tsx`
  - Public/legacy chatbot route.
  - This now redirects to `/account/chatbot`, is noindexed through metadata, and is excluded from `app/sitemap.ts`.
  - Recommendation: keep the redirect while older links may exist, then revisit only if a dedicated public demo is intentionally rebuilt.

- `app/dashboard/page.tsx` and `app/create-pet/page.tsx`
  - Older local-session style flow.
  - These now redirect to the current `/account` and `/account/chatbot` customer flows, while remaining blocked from indexing in `app/robots.ts`.
  - Recommendation: keep the redirects while older bookmarks or links may exist.

- `components/PetForm.tsx`, `components/SavedPetsList.tsx`, `components/PetSummaryStats.tsx`, `components/PetProfileCard.tsx`, `components/NutritionResult.tsx`, `components/NutritionAdvice.tsx`, `components/FoodRecommendations.tsx`, `components/DashboardHeader.tsx`, `components/SectionCard.tsx`
  - Mostly used by the older dashboard/create-pet flow.
  - Recommendation: remove after confirming no active route imports them.

- `database/foods.ts`, `repositories/petRepository.ts`, `repositories/sessionRepository.ts`, `repositories/editingPetRepository.ts`, `services/petAnalysisService.ts`
  - Legacy/local analysis support used by the old flow and some shared analysis endpoints.
  - Recommendation: do not delete until `/api/chatbot/analyze` compatibility usage and older QA dependencies are reviewed.

- `app/api/chatbot/analyze/route.ts`
  - Legacy-compatible public analysis endpoint.
  - The account chatbot now uses `/api/account/chatbot/analyze`; keep this route only while older tests or external links may still call it.

## Cleanup Candidates

- `components/BrandHeader.tsx`
  - No active imports found in the current source tree.
  - Safe candidate for removal after one final `rg BrandHeader` check.

- `services/profileService.ts`
  - No active imports found. The app currently uses direct API/server profile checks instead.
  - Safe candidate for removal after one final `rg profileService` check.

- `repositories/dbFoodRepository.ts` and `repositories/dbPetRepository.ts`
  - No active imports found.
  - They look like old mock/local-storage adapters.
  - Safe candidate for removal after one final `rg dbFoodRepository|dbPetRepository` check.

- `lib/api/petsApi.ts`
  - Not referenced by active app code in the audit.
  - Candidate for removal after confirming no planned client API wrapper migration depends on it.

- `lib/food-v2/recommendationResponseAdapter.ts`, `lib/food-v2/recommendationContract.ts`, `lib/chatbot/groundedAnswerContract.ts`
  - Structured future-facing contracts/adapters.
  - Keep if they are part of the planned chatbot intelligence integration; otherwise revisit after the next chatbot architecture pass.

- `lib/nutrition-v2/examples.ts`, `lib/nutrition-v2/feedingEngine.ts`, `lib/nutrition-v2/foodEvaluationEngine.ts`, `lib/nutrition-v2/foodExpertRules.ts`
  - Scientific layer scaffolding.
  - Keep if this layer will be connected into recommendations soon; otherwise mark as experimental.

## Removed In This Cleanup

- `proxy_old.ts`
  - Old proxy/middleware backup.
  - Not used by Next.js because the active file is `proxy.ts`.
  - Removed to avoid confusion around admin auth behavior.

## Ignored In This Cleanup

The following generated QA reports are ignored locally so routine checks do not dirty the worktree:

- `reports/account_progress_live_route_smoke_qa.md`
- `reports/chatbot_golden_qa.md`
- `reports/customer_chatbot_flow_links_qa.md`
- `reports/food_v2_ranking_scenario_audit.md`
- `reports/food_v2_recommendation_smoke_qa.md`

## Recommended Next Cleanup PRs

1. Review `/api/chatbot/analyze` and older local analysis services after older QA/external compatibility needs are retired.
2. Remove unused mock/local repositories and components once final import checks confirm no active imports remain.
3. Split `app/account/chatbot/page.tsx` into smaller modules after behavior stabilizes; it is over 3,000 lines and is the highest-maintenance file.
4. Add a lightweight unused-export check script so future cleanup is easier and safer.
