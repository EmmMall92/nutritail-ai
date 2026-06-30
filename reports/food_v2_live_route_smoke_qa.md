# Food V2 Live Route Smoke QA

Generated: 2026-06-30T13:50:11.440Z
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
| /admin/foods | 200 | pass | 489ms | - |
| /admin/foods/v2-preview | 200 | pass | 400ms | - |
| /admin/foods/v2-post-import-qa | 200 | pass | 371ms | - |
| /admin/foods/v2-recommendation-visibility | 200 | pass | 342ms | - |
| /admin/validation | 200 | pass | 424ms | - |
| /api/admin/foods/v2-best-candidates/summary | 401 | pass | 532ms | - |
| /api/admin/foods/v2-post-import-qa | 401 | pass | 339ms | - |
| /api/admin/foods/v2-brand-batches | 401 | pass | 326ms | - |
| /api/admin/ai-status | 401 | pass | 329ms | - |