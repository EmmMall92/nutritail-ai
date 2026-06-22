# Food V2 Live Route Smoke QA

Generated: 2026-06-22T20:38:24.778Z
Site: https://nutritail.ai

## Summary

- Routes checked: 8
- Passed: 8
- Failed: 0

Admin API routes may return 401/403 without an authenticated admin session; that is accepted for this smoke check because it proves the route is deployed and protected.

## Results

| Route | Status | Result | Time | Notes |
| --- | ---: | --- | ---: | --- |
| / | 200 | pass | 713ms | - |
| /admin/foods | 200 | pass | 1141ms | - |
| /admin/foods/v2-preview | 200 | pass | 341ms | - |
| /admin/foods/v2-post-import-qa | 200 | pass | 404ms | - |
| /admin/foods/v2-recommendation-visibility | 200 | pass | 437ms | - |
| /api/admin/foods/v2-best-candidates/summary | 401 | pass | 1528ms | - |
| /api/admin/foods/v2-post-import-qa | 401 | pass | 452ms | - |
| /api/admin/foods/v2-brand-batches | 401 | pass | 329ms | - |