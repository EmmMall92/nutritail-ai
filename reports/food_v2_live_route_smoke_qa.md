# Food V2 Live Route Smoke QA

Generated: 2026-06-28T15:30:25.096Z
Site: https://nutritail.ai

## Summary

- Routes checked: 10
- Passed: 10
- Failed: 0

Admin API routes may return 401/403 without an authenticated admin session; that is accepted for this smoke check because it proves the route is deployed and protected.

## Results

| Route | Status | Result | Time | Notes |
| --- | ---: | --- | ---: | --- |
| / | 200 | pass | 630ms | - |
| /admin/foods | 200 | pass | 642ms | - |
| /admin/foods/v2-preview | 200 | pass | 860ms | - |
| /admin/foods/v2-post-import-qa | 200 | pass | 460ms | - |
| /admin/foods/v2-recommendation-visibility | 200 | pass | 866ms | - |
| /admin/validation | 200 | pass | 92ms | - |
| /api/admin/foods/v2-best-candidates/summary | 401 | pass | 1213ms | - |
| /api/admin/foods/v2-post-import-qa | 401 | pass | 403ms | - |
| /api/admin/foods/v2-brand-batches | 401 | pass | 559ms | - |
| /api/admin/ai-status | 401 | pass | 430ms | - |