# Food V2 Live Route Smoke QA

Generated: 2026-06-05T18:05:05.076Z
Site: https://nutritail.ai

## Summary

- Routes checked: 8
- Passed: 8
- Failed: 0

Admin API routes may return 401/403 without an authenticated admin session; that is accepted for this smoke check because it proves the route is deployed and protected.

## Results

| Route | Status | Result | Time | Notes |
| --- | ---: | --- | ---: | --- |
| / | 200 | pass | 225ms | - |
| /admin/foods | 200 | pass | 1137ms | - |
| /admin/foods/v2-preview | 200 | pass | 83ms | - |
| /admin/foods/v2-post-import-qa | 200 | pass | 157ms | - |
| /admin/foods/v2-recommendation-visibility | 200 | pass | 83ms | - |
| /api/admin/foods/v2-best-candidates/summary | 401 | pass | 1555ms | - |
| /api/admin/foods/v2-post-import-qa | 401 | pass | 315ms | - |
| /api/admin/foods/v2-brand-batches | 401 | pass | 355ms | - |