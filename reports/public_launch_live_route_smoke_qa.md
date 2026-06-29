# Public Launch Live Route Smoke QA

Generated: 2026-06-29T23:38:32.959Z
Site: https://nutritail.ai

## Summary

- Routes checked: 14
- Passed: 14
- Failed: 0

This smoke check guards the public launch surface: homepage, auth pages, legal pages, SEO files, web manifest, and OpenGraph image.

## Results

| Route | Status | Result | Time | Content-Type | Notes |
| --- | ---: | --- | ---: | --- | --- |
| / | 200 | pass | 751ms | text/html; charset=utf-8 | - |
| /login | 200 | pass | 955ms | text/html; charset=utf-8 | - |
| /register | 200 | pass | 427ms | text/html; charset=utf-8 | - |
| /forgot-password | 200 | pass | 438ms | text/html; charset=utf-8 | - |
| /reset-password | 200 | pass | 397ms | text/html; charset=utf-8 | - |
| /privacy | 200 | pass | 364ms | text/html; charset=utf-8 | - |
| /terms | 200 | pass | 472ms | text/html; charset=utf-8 | - |
| /chatbot | 307 | pass | 369ms | text/html; charset=utf-8 | redirect=/account/chatbot |
| /dashboard | 307 | pass | 613ms | text/html; charset=utf-8 | redirect=/account |
| /create-pet | 307 | pass | 342ms | text/html; charset=utf-8 | redirect=/account/chatbot |
| /sitemap.xml | 200 | pass | 235ms | application/xml | - |
| /robots.txt | 200 | pass | 176ms | text/plain; charset=utf-8 | - |
| /manifest.webmanifest | 200 | pass | 197ms | application/manifest+json; charset=utf-8 | - |
| /opengraph-image | 200 | pass | 391ms | image/png | - |