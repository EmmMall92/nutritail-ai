# Food V2 Live Route Smoke QA

Generated: 2026-06-29T22:28:24.455Z
Site: https://nutritail.ai

## Summary

- Routes checked: 10
- Passed: 10
- Failed: 0

Admin API routes may return 401/403 without an authenticated admin session; that is accepted for this smoke check because it proves the route is deployed and protected.

## Results

| Route | Status | Result | Time | Notes |
| --- | ---: | --- | ---: | --- |
| / | 200 | pass | 222ms | - |
| /admin/foods | 200 | pass | 472ms | - |
| /admin/foods/v2-preview | 200 | pass | 370ms | - |
| /admin/foods/v2-post-import-qa | 200 | pass | 374ms | - |
| /admin/foods/v2-recommendation-visibility | 200 | pass | 389ms | - |
| /admin/validation | 200 | pass | 348ms | - |
| /api/admin/foods/v2-best-candidates/summary | 401 | pass | 526ms | - |
| /api/admin/foods/v2-post-import-qa | 401 | pass | 351ms | - |
| /api/admin/foods/v2-brand-batches | 401 | pass | 376ms | - |
| /api/admin/ai-status | 401 | pass | 356ms | - |