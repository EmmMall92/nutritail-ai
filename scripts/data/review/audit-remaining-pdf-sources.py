import csv
import re
from datetime import datetime, timezone
from pathlib import Path

from pypdf import PdfReader


SOURCE_DIR = Path("C:/Users/NIOstb/Desktop/photo_foods_nutritail")
OUTPUT = Path("data/review/remaining_pdf_source_audit.csv")
REPORT = Path("reports/remaining_pdf_source_audit.md")

SOURCES = [
    {
        "file": "Canine-Section-with-cover-compressed.pdf",
        "decision": "defer_custom_table_parser",
        "reason": "Royal Canin analysis tables are extractable but PDF text order interleaves columns and product names; blind import would risk nutrient/product mismatches.",
        "recommended_action": "Build a dedicated Royal Canin table parser or manually review analysis table pages before Food V2 import.",
    },
    {
        "file": "Raw-Paleo-Dog-Cat-Food.pdf",
        "decision": "defer_custom_multi_column_parser",
        "reason": "Raw Paleo has valuable formula data, but many pages contain 2-4 product columns per page; direct text extraction requires a custom column-aware parser.",
        "recommended_action": "Process as a focused Raw Paleo extraction wave with page-specific column parsing and manual QA.",
    },
    {
        "file": "MONO UNICA NATURA.pdf",
        "decision": "defer_ocr_or_manual_transcription",
        "reason": "PDF text extraction returns almost no useful text, indicating image-only/scanned source.",
        "recommended_action": "Use OCR or manual transcription from rendered pages before Food V2 import.",
    },
]

HEADERS = [
    "source_file",
    "pages",
    "text_length",
    "composition_hits",
    "analysis_hits",
    "protein_hits",
    "kcal_hits",
    "decision",
    "reason",
    "recommended_action",
]


def text_for_pdf(path: Path) -> str:
    reader = PdfReader(str(path))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def row_for_source(source: dict[str, str]) -> dict[str, str | int]:
    path = SOURCE_DIR / source["file"]
    reader = PdfReader(str(path))
    text = text_for_pdf(path)
    lowered = text.lower()
    return {
        "source_file": source["file"],
        "pages": len(reader.pages),
        "text_length": len(text),
        "composition_hits": len(re.findall(r"\bcomposition\b|σύνθεση|συνθεση", lowered, flags=re.I)),
        "analysis_hits": len(re.findall(r"analytical|analysis|αναλυτικά|αναλυτικα", lowered, flags=re.I)),
        "protein_hits": lowered.count("protein"),
        "kcal_hits": lowered.count("kcal"),
        "decision": source["decision"],
        "reason": source["reason"],
        "recommended_action": source["recommended_action"],
    }


def render_report(rows: list[dict[str, str | int]]) -> str:
    lines = [
        "# Remaining PDF Source Audit",
        "",
        f"Generated: {datetime.now(timezone.utc).isoformat()}",
        "",
        "## Summary",
        "",
        f"- Audited PDF sources: {len(rows)}",
        f"- Output CSV: {OUTPUT}",
        "",
        "## Decisions",
        "",
    ]
    for row in rows:
        lines.extend(
            [
                f"### {row['source_file']}",
                "",
                f"- Pages: {row['pages']}",
                f"- Extracted text length: {row['text_length']}",
                f"- Composition hits: {row['composition_hits']}",
                f"- Analysis hits: {row['analysis_hits']}",
                f"- Protein hits: {row['protein_hits']}",
                f"- Kcal hits: {row['kcal_hits']}",
                f"- Decision: {row['decision']}",
                f"- Reason: {row['reason']}",
                f"- Recommended action: {row['recommended_action']}",
                "",
            ]
        )
    lines.extend(
        [
            "## Import Decision",
            "",
            "These PDFs are intentionally not added to the Food V2 import queue yet. They are processed as source audits because each requires either a dedicated parser or OCR/manual review to avoid corrupt nutrition facts.",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> None:
    rows = [row_for_source(source) for source in SOURCES]
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=HEADERS)
        writer.writeheader()
        writer.writerows(rows)
    REPORT.write_text(render_report(rows), encoding="utf-8")
    print(f"Remaining PDF sources audited: {len(rows)}")
    print(f"Wrote {OUTPUT}")
    print(f"Wrote {REPORT}")


if __name__ == "__main__":
    main()
