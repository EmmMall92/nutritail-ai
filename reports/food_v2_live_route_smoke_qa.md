# Food V2 Live Route Smoke QA

Generated: 2026-06-27T17:43:07.440Z
Site: https://nutritail.ai

## Summary

- Routes checked: 10
- Passed: 10
- Failed: 0

Admin API routes may return 401/403 without an authenticated admin session; that is accepted for this smoke check because it proves the route is deployed and protected.

## Results

| Route | Status | Result | Time | Notes |
| --- | ---: | --- | ---: | --- |
| / | 200 | pass | 696ms | - |
| /admin/foods | 200 | pass | 1125ms | - |
| /admin/foods/v2-preview | 200 | pass | 385ms | - |
| /admin/foods/v2-post-import-qa | 200 | pass | 414ms | - |
| /admin/foods/v2-recommendation-visibility | 200 | pass | 425ms | - |
| /admin/validation | 200 | pass | 379ms | - |
| /api/admin/foods/v2-best-candidates/summary | 401 | pass | 1212ms | - |
| /api/admin/foods/v2-post-import-qa | 401 | pass | 355ms | - |
| /api/admin/foods/v2-brand-batches | 401 | pass | 377ms | - |
| /api/admin/ai-status | 401 | pass | 340ms | - |