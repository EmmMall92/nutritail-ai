# Public Launch Live Route Smoke QA

Generated: 2026-06-29T22:45:36.683Z
Site: https://nutritail.ai

## Summary

- Routes checked: 14
- Passed: 14
- Failed: 0

This smoke check guards the public launch surface: homepage, auth pages, legal pages, SEO files, web manifest, and OpenGraph image.

## Results

| Route | Status | Result | Time | Content-Type | Notes |
| --- | ---: | --- | ---: | --- | --- |
| / | 200 | pass | 773ms | text/html; charset=utf-8 | - |
| /login | 200 | pass | 489ms | text/html; charset=utf-8 | - |
| /register | 200 | pass | 492ms | text/html; charset=utf-8 | - |
| /forgot-password | 200 | pass | 363ms | text/html; charset=utf-8 | - |
| /reset-password | 200 | pass | 535ms | text/html; charset=utf-8 | - |
| /privacy | 200 | pass | 431ms | text/html; charset=utf-8 | - |
| /terms | 200 | pass | 310ms | text/html; charset=utf-8 | - |
| /chatbot | 307 | pass | 427ms | text/html; charset=utf-8 | redirect=/account/chatbot |
| /dashboard | 307 | pass | 544ms | text/html; charset=utf-8 | redirect=/account |
| /create-pet | 307 | pass | 460ms | text/html; charset=utf-8 | redirect=/account/chatbot |
| /sitemap.xml | 200 | pass | 188ms | application/xml | - |
| /robots.txt | 200 | pass | 185ms | text/plain; charset=utf-8 | - |
| /manifest.webmanifest | 200 | pass | 382ms | application/manifest+json; charset=utf-8 | - |
| /opengraph-image | 200 | pass | 363ms | image/png | - |