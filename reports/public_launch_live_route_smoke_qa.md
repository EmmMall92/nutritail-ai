# Public Launch Live Route Smoke QA

Generated: 2026-06-29T22:12:32.275Z
Site: https://nutritail.ai

## Summary

- Routes checked: 14
- Passed: 14
- Failed: 0

This smoke check guards the public launch surface: homepage, auth pages, legal pages, SEO files, web manifest, and OpenGraph image.

## Results

| Route | Status | Result | Time | Content-Type | Notes |
| --- | ---: | --- | ---: | --- | --- |
| / | 200 | pass | 282ms | text/html; charset=utf-8 | - |
| /login | 200 | pass | 115ms | text/html; charset=utf-8 | - |
| /register | 200 | pass | 81ms | text/html; charset=utf-8 | - |
| /forgot-password | 200 | pass | 83ms | text/html; charset=utf-8 | - |
| /reset-password | 200 | pass | 73ms | text/html; charset=utf-8 | - |
| /privacy | 200 | pass | 54ms | text/html; charset=utf-8 | - |
| /terms | 200 | pass | 68ms | text/html; charset=utf-8 | - |
| /chatbot | 307 | pass | 67ms | text/html; charset=utf-8 | redirect=/account/chatbot |
| /dashboard | 307 | pass | 181ms | text/html; charset=utf-8 | redirect=/account |
| /create-pet | 307 | pass | 70ms | text/html; charset=utf-8 | redirect=/account/chatbot |
| /sitemap.xml | 200 | pass | 58ms | application/xml | - |
| /robots.txt | 200 | pass | 55ms | text/plain; charset=utf-8 | - |
| /manifest.webmanifest | 200 | pass | 55ms | application/manifest+json; charset=utf-8 | - |
| /opengraph-image | 200 | pass | 165ms | image/png | - |