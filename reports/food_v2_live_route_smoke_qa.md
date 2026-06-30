# Food V2 Live Route Smoke QA

Generated: 2026-06-30T05:38:47.938Z
Site: https://nutritail.ai

## Summary

- Routes checked: 10
- Passed: 10
- Failed: 0

Admin API routes may return 401/403 without an authenticated admin session; that is accepted for this smoke check because it proves the route is deployed and protected.

## Results

| Route | Status | Result | Time | Notes |
| --- | ---: | --- | ---: | --- |
| / | 200 | pass | 213ms | - |
| /admin/foods | 200 | pass | 437ms | - |
| /admin/foods/v2-preview | 200 | pass | 334ms | - |
| /admin/foods/v2-post-import-qa | 200 | pass | 336ms | - |
| /admin/foods/v2-recommendation-visibility | 200 | pass | 368ms | - |
| /admin/validation | 200 | pass | 367ms | - |
| /api/admin/foods/v2-best-candidates/summary | 401 | pass | 558ms | - |
| /api/admin/foods/v2-post-import-qa | 401 | pass | 342ms | - |
| /api/admin/foods/v2-brand-batches | 401 | pass | 332ms | - |
| /api/admin/ai-status | 401 | pass | 349ms | - |