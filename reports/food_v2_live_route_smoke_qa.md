# Food V2 Live Route Smoke QA

Generated: 2026-06-29T23:22:11.477Z
Site: https://nutritail.ai

## Summary

- Routes checked: 10
- Passed: 10
- Failed: 0

Admin API routes may return 401/403 without an authenticated admin session; that is accepted for this smoke check because it proves the route is deployed and protected.

## Results

| Route | Status | Result | Time | Notes |
| --- | ---: | --- | ---: | --- |
| / | 200 | pass | 209ms | - |
| /admin/foods | 200 | pass | 179ms | - |
| /admin/foods/v2-preview | 200 | pass | 106ms | - |
| /admin/foods/v2-post-import-qa | 200 | pass | 77ms | - |
| /admin/foods/v2-recommendation-visibility | 200 | pass | 73ms | - |
| /admin/validation | 200 | pass | 72ms | - |
| /api/admin/foods/v2-best-candidates/summary | 401 | pass | 220ms | - |
| /api/admin/foods/v2-post-import-qa | 401 | pass | 198ms | - |
| /api/admin/foods/v2-brand-batches | 401 | pass | 188ms | - |
| /api/admin/ai-status | 401 | pass | 174ms | - |