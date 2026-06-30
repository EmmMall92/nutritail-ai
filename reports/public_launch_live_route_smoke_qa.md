# Public Launch Live Route Smoke QA

Generated: 2026-06-30T05:38:43.918Z
Site: https://nutritail.ai

## Summary

- Routes checked: 14
- Passed: 14
- Failed: 0

This smoke check guards the public launch surface: homepage, auth pages, legal pages, SEO files, web manifest, and OpenGraph image.

## Results

| Route | Status | Result | Time | Content-Type | Notes |
| --- | ---: | --- | ---: | --- | --- |
| / | 200 | pass | 921ms | text/html; charset=utf-8 | - |
| /login | 200 | pass | 587ms | text/html; charset=utf-8 | - |
| /register | 200 | pass | 358ms | text/html; charset=utf-8 | - |
| /forgot-password | 200 | pass | 556ms | text/html; charset=utf-8 | - |
| /reset-password | 200 | pass | 538ms | text/html; charset=utf-8 | - |
| /privacy | 200 | pass | 500ms | text/html; charset=utf-8 | - |
| /terms | 200 | pass | 340ms | text/html; charset=utf-8 | - |
| /chatbot | 307 | pass | 320ms | text/html; charset=utf-8 | redirect=/account/chatbot |
| /dashboard | 307 | pass | 586ms | text/html; charset=utf-8 | redirect=/account |
| /create-pet | 307 | pass | 326ms | text/html; charset=utf-8 | redirect=/account/chatbot |
| /sitemap.xml | 200 | pass | 178ms | application/xml | - |
| /robots.txt | 200 | pass | 193ms | text/plain; charset=utf-8 | - |
| /manifest.webmanifest | 200 | pass | 221ms | application/manifest+json; charset=utf-8 | - |
| /opengraph-image | 200 | pass | 365ms | image/png | - |