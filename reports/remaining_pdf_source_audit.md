# Remaining PDF Source Audit

Generated: 2026-05-30T17:37:17.842075+00:00

## Summary

- Audited PDF sources: 3
- Output CSV: data\review\remaining_pdf_source_audit.csv

## Decisions

### Canine-Section-with-cover-compressed.pdf

- Pages: 226
- Extracted text length: 502125
- Composition hits: 93
- Analysis hits: 95
- Protein hits: 408
- Kcal hits: 164
- Decision: defer_custom_table_parser
- Reason: Royal Canin analysis tables are extractable but PDF text order interleaves columns and product names; blind import would risk nutrient/product mismatches.
- Recommended action: Build a dedicated Royal Canin table parser or manually review analysis table pages before Food V2 import.

### Raw-Paleo-Dog-Cat-Food.pdf

- Pages: 28
- Extracted text length: 43399
- Composition hits: 19
- Analysis hits: 0
- Protein hits: 88
- Kcal hits: 19
- Decision: defer_custom_multi_column_parser
- Reason: Raw Paleo has valuable formula data, but many pages contain 2-4 product columns per page; direct text extraction requires a custom column-aware parser.
- Recommended action: Process as a focused Raw Paleo extraction wave with page-specific column parsing and manual QA.

### MONO UNICA NATURA.pdf

- Pages: 4
- Extracted text length: 3
- Composition hits: 0
- Analysis hits: 0
- Protein hits: 0
- Kcal hits: 0
- Decision: defer_ocr_or_manual_transcription
- Reason: PDF text extraction returns almost no useful text, indicating image-only/scanned source.
- Recommended action: Use OCR or manual transcription from rendered pages before Food V2 import.

## Import Decision

These PDFs are intentionally not added to the Food V2 import queue yet. They are processed as source audits because each requires either a dedicated parser or OCR/manual review to avoid corrupt nutrition facts.
