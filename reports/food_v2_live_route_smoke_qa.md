# Food V2 Live Route Smoke QA

Generated: 2026-06-22T20:49:32.093Z
Site: https://nutritail.ai

## Summary

- Routes checked: 10
- Passed: 10
- Failed: 0

Admin API routes may return 401/403 without an authenticated admin session; that is accepted for this smoke check because it proves the route is deployed and protected.

## Results

| Route | Status | Result | Time | Notes |
| --- | ---: | --- | ---: | --- |
| / | 200 | pass | 277ms | - |
| /admin/foods | 200 | pass | 741ms | - |
| /admin/foods/v2-preview | 200 | pass | 73ms | - |
| /admin/foods/v2-post-import-qa | 200 | pass | 85ms | - |
| /admin/foods/v2-recommendation-visibility | 200 | pass | 83ms | - |
| /admin/validation | 200 | pass | 334ms | - |
| /api/admin/foods/v2-best-candidates/summary | 401 | pass | 1292ms | - |
| /api/admin/foods/v2-post-import-qa | 401 | pass | 280ms | - |
| /api/admin/foods/v2-brand-batches | 401 | pass | 210ms | - |
| /api/admin/ai-status | 401 | pass | 359ms | - |