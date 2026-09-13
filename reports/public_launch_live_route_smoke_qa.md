# Public Launch Live Route Smoke QA

Generated: 2026-09-13T18:38:55.693Z
Site: https://nutritail.ai

## Summary

- Routes checked: 20
- Passed: 20
- Failed: 0

This smoke check guards the public launch surface: homepage, auth pages, legal pages, SEO files, web manifest, and OpenGraph image.

## Results

| Route | Status | Result | Time | Content-Type | Notes |
| --- | ---: | --- | ---: | --- | --- |
| / | 200 | pass | 260ms | text/html; charset=utf-8 | - |
| /login | 200 | pass | 89ms | text/html; charset=utf-8 | - |
| /register | 200 | pass | 96ms | text/html; charset=utf-8 | - |
| /about | 200 | pass | 79ms | text/html; charset=utf-8 | - |
| /how-it-works | 200 | pass | 71ms | text/html; charset=utf-8 | - |
| /beta | 307 | pass | 70ms | text/html; charset=utf-8 | redirect=/register |
| /plans | 200 | pass | 196ms | text/html; charset=utf-8 | - |
| /support | 200 | pass | 71ms | text/html; charset=utf-8 | - |
| /ai-transparency | 200 | pass | 356ms | text/html; charset=utf-8 | - |
| /forgot-password | 200 | pass | 86ms | text/html; charset=utf-8 | - |
| /reset-password | 200 | pass | 159ms | text/html; charset=utf-8 | - |
| /privacy | 200 | pass | 74ms | text/html; charset=utf-8 | - |
| /terms | 200 | pass | 64ms | text/html; charset=utf-8 | - |
| /chatbot | 307 | pass | 70ms | text/html; charset=utf-8 | redirect=/account/chatbot |
| /dashboard | 307 | pass | 93ms | text/html; charset=utf-8 | redirect=/account |
| /create-pet | 307 | pass | 132ms | text/html; charset=utf-8 | redirect=/account/chatbot |
| /sitemap.xml | 200 | pass | 63ms | application/xml | - |
| /robots.txt | 200 | pass | 269ms | text/plain; charset=utf-8 | - |
| /manifest.webmanifest | 200 | pass | 66ms | application/manifest+json; charset=utf-8 | - |
| /opengraph-image | 200 | pass | 67ms | image/png | - |