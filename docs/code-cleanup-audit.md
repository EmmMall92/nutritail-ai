# Code Cleanup Audit

Last reviewed: 2026-06-14

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
  - It is still listed in `app/sitemap.ts`, has its own layout metadata, and uses `/api/chatbot/analyze`.
  - Recommendation: decide whether this should remain a public demo or redirect users to `/account/chatbot`. Do not delete until that product decision is made.

- `app/dashboard/page.tsx` and `app/create-pet/page.tsx`
  - Older local-session style flow.
  - Current product direction is `/account`, but these routes still exist and are blocked from indexing in `app/robots.ts`.
  - Recommendation: keep for now, then convert to redirects after confirming no current workflow depends on them.

- `components/PetForm.tsx`, `components/SavedPetsList.tsx`, `components/PetSummaryStats.tsx`, `components/PetProfileCard.tsx`, `components/NutritionResult.tsx`, `components/NutritionAdvice.tsx`, `components/FoodRecommendations.tsx`, `components/DashboardHeader.tsx`, `components/SectionCard.tsx`
  - Mostly used by the older dashboard/create-pet flow.
  - Recommendation: keep while `/dashboard` and `/create-pet` exist. Remove only together with those routes.

- `database/foods.ts`, `repositories/petRepository.ts`, `repositories/sessionRepository.ts`, `repositories/editingPetRepository.ts`, `services/petAnalysisService.ts`
  - Legacy/local analysis support used by the old flow and some shared analysis endpoints.
  - Recommendation: do not delete until legacy routes are redirected and `/api/chatbot/analyze` is reviewed.

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

1. Redirect or retire the legacy public `/chatbot` route after deciding whether public demo access is still useful.
2. Redirect `/dashboard` and `/create-pet` to account routes if the account experience fully replaces them.
3. Remove unused mock/local repositories and components once those legacy routes are gone.
4. Split `app/account/chatbot/page.tsx` into smaller modules after behavior stabilizes; it is over 3,000 lines and is the highest-maintenance file.
5. Add a lightweight unused-export check script so future cleanup is easier and safer.
