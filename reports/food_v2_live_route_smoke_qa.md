# Food V2 Live Route Smoke QA

Generated: 2026-06-22T20:54:31.191Z
Site: https://nutritail.ai

## Summary

- Routes checked: 10
- Passed: 10
- Failed: 0

Admin API routes may return 401/403 without an authenticated admin session; that is accepted for this smoke check because it proves the route is deployed and protected.

## Results

| Route | Status | Result | Time | Notes |
| --- | ---: | --- | ---: | --- |
| / | 200 | pass | 225ms | - |
| /admin/foods | 200 | pass | 193ms | - |
| /admin/foods/v2-preview | 200 | pass | 84ms | - |
| /admin/foods/v2-post-import-qa | 200 | pass | 101ms | - |
| /admin/foods/v2-recommendation-visibility | 200 | pass | 78ms | - |
| /admin/validation | 200 | pass | 79ms | - |
| /api/admin/foods/v2-best-candidates/summary | 401 | pass | 1127ms | - |
| /api/admin/foods/v2-post-import-qa | 401 | pass | 172ms | - |
| /api/admin/foods/v2-brand-batches | 401 | pass | 166ms | - |
| /api/admin/ai-status | 401 | pass | 187ms | - |