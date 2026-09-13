# Food V2 Live Route Smoke QA

Generated: 2026-09-13T18:37:56.035Z
Site: https://nutritail.ai

## Summary

- Routes checked: 10
- Passed: 10
- Failed: 0

Admin API routes may return 401/403 without an authenticated admin session; that is accepted for this smoke check because it proves the route is deployed and protected.

## Results

| Route | Status | Result | Time | Notes |
| --- | ---: | --- | ---: | --- |
| / | 200 | pass | 559ms | - |
| /admin/foods | 200 | pass | 482ms | - |
| /admin/foods/v2-preview | 200 | pass | 342ms | - |
| /admin/foods/v2-post-import-qa | 200 | pass | 346ms | - |
| /admin/foods/v2-recommendation-visibility | 200 | pass | 382ms | - |
| /admin/validation | 200 | pass | 346ms | - |
| /api/admin/foods/v2-best-candidates/summary | 401 | pass | 480ms | - |
| /api/admin/foods/v2-post-import-qa | 401 | pass | 276ms | - |
| /api/admin/foods/v2-brand-batches | 401 | pass | 189ms | - |
| /api/admin/ai-status | 401 | pass | 203ms | - |