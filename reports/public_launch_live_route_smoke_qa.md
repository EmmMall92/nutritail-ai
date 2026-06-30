# Public Launch Live Route Smoke QA

Generated: 2026-06-30T05:45:38.489Z
Site: https://nutritail.ai

## Summary

- Routes checked: 14
- Passed: 14
- Failed: 0

This smoke check guards the public launch surface: homepage, auth pages, legal pages, SEO files, web manifest, and OpenGraph image.

## Results

| Route | Status | Result | Time | Content-Type | Notes |
| --- | ---: | --- | ---: | --- | --- |
| / | 200 | pass | 233ms | text/html; charset=utf-8 | - |
| /login | 200 | pass | 348ms | text/html; charset=utf-8 | - |
| /register | 200 | pass | 85ms | text/html; charset=utf-8 | - |
| /forgot-password | 200 | pass | 79ms | text/html; charset=utf-8 | - |
| /reset-password | 200 | pass | 88ms | text/html; charset=utf-8 | - |
| /privacy | 200 | pass | 61ms | text/html; charset=utf-8 | - |
| /terms | 200 | pass | 61ms | text/html; charset=utf-8 | - |
| /chatbot | 307 | pass | 63ms | text/html; charset=utf-8 | redirect=/account/chatbot |
| /dashboard | 307 | pass | 177ms | text/html; charset=utf-8 | redirect=/account |
| /create-pet | 307 | pass | 100ms | text/html; charset=utf-8 | redirect=/account/chatbot |
| /sitemap.xml | 200 | pass | 56ms | application/xml | - |
| /robots.txt | 200 | pass | 56ms | text/plain; charset=utf-8 | - |
| /manifest.webmanifest | 200 | pass | 56ms | application/manifest+json; charset=utf-8 | - |
| /opengraph-image | 200 | pass | 57ms | image/png | - |