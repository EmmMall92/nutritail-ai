# Public Launch Live Route Smoke QA

Generated: 2026-06-30T13:50:07.249Z
Site: https://nutritail.ai

## Summary

- Routes checked: 14
- Passed: 14
- Failed: 0

This smoke check guards the public launch surface: homepage, auth pages, legal pages, SEO files, web manifest, and OpenGraph image.

## Results

| Route | Status | Result | Time | Content-Type | Notes |
| --- | ---: | --- | ---: | --- | --- |
| / | 200 | pass | 1123ms | text/html; charset=utf-8 | - |
| /login | 200 | pass | 645ms | text/html; charset=utf-8 | - |
| /register | 200 | pass | 643ms | text/html; charset=utf-8 | - |
| /forgot-password | 200 | pass | 500ms | text/html; charset=utf-8 | - |
| /reset-password | 200 | pass | 472ms | text/html; charset=utf-8 | - |
| /privacy | 200 | pass | 334ms | text/html; charset=utf-8 | - |
| /terms | 200 | pass | 579ms | text/html; charset=utf-8 | - |
| /chatbot | 307 | pass | 425ms | text/html; charset=utf-8 | redirect=/account/chatbot |
| /dashboard | 307 | pass | 434ms | text/html; charset=utf-8 | redirect=/account |
| /create-pet | 307 | pass | 356ms | text/html; charset=utf-8 | redirect=/account/chatbot |
| /sitemap.xml | 200 | pass | 224ms | application/xml | - |
| /robots.txt | 200 | pass | 194ms | text/plain; charset=utf-8 | - |
| /manifest.webmanifest | 200 | pass | 207ms | application/manifest+json; charset=utf-8 | - |
| /opengraph-image | 200 | pass | 439ms | image/png | - |