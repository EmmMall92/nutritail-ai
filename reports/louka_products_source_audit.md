# Louka Products Source Audit

Generated: 2026-05-30T17:23:11.687Z

## Summary

- Source spreadsheet: C:\Users\NIOstb\Desktop\photo_foods_nutritail\ΠΡΟΙΟΝΤΑ ΓΙΑ ESHOP ΑΝΑ ΚΑΤΗΓΟΡΙΑ & ΠΑΡΕΤΟ ΓΙΑ ΛΟΥΚΑ.xlsx
- Audited rows: 1131
- Output CSV: data/review/louka_products_source_audit.csv

## By Decision

- exclude_non_food: 851
- defer_treats_workflow: 280

## By Sheet

- ΑΞΕΣΟΥΑΡ ΣΚΥΛΟΥ ΓΑΤΑΣ: 851
- ΛΙΧΟΥΔΙΕΣ ΣΚ-Γ: 280

## Import Decision

This source file is intentionally excluded from the current Food V2 complete-food nutrition import. It contains accessories plus treats/snacks, not complete dry/wet food formula rows. Treats can become a future catalog workflow, but they should not be mixed into the current nutrition database.
