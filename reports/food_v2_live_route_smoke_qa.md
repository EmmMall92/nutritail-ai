# Food V2 Live Route Smoke QA

Generated: 2026-06-29T22:12:36.689Z
Site: https://nutritail.ai

## Summary

- Routes checked: 10
- Passed: 10
- Failed: 0

Admin API routes may return 401/403 without an authenticated admin session; that is accepted for this smoke check because it proves the route is deployed and protected.

## Results

| Route | Status | Result | Time | Notes |
| --- | ---: | --- | ---: | --- |
| / | 200 | pass | 221ms | - |
| /admin/foods | 200 | pass | 432ms | - |
| /admin/foods/v2-preview | 200 | pass | 350ms | - |
| /admin/foods/v2-post-import-qa | 200 | pass | 455ms | - |
| /admin/foods/v2-recommendation-visibility | 200 | pass | 534ms | - |
| /admin/validation | 200 | pass | 374ms | - |
| /api/admin/foods/v2-best-candidates/summary | 401 | pass | 625ms | - |
| /api/admin/foods/v2-post-import-qa | 401 | pass | 347ms | - |
| /api/admin/foods/v2-brand-batches | 401 | pass | 379ms | - |
| /api/admin/ai-status | 401 | pass | 333ms | - |