import csv
import json
import re
from datetime import datetime, timezone
from pathlib import Path

from pypdf import PdfReader


SOURCE_DIR = Path("C:/Users/NIOstb/Desktop/photo_foods_nutritail")
SOURCE_FILE = next(SOURCE_DIR.glob("*Prochoice*.pdf"))

TEMPLATE = Path("data/templates/nutritail-food-v2-template.csv")
OUTPUT = Path("data/imports/prochoice_pdf_extract_v2.csv")
REVIEW = Path("data/review/prochoice_pdf_extract_review.csv")
REPORT = Path("reports/prochoice_pdf_extract.md")

REVIEW_HEADERS = [
    "formula_key",
    "brand",
    "formula_name",
    "species",
    "format",
    "status",
    "missing_fields",
    "evidence_path",
    "duplicate_blocks_skipped",
    "recommended_action",
    "notes",
]


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def slugify(value: str) -> str:
    text = clean_text(value).lower()
    text = re.sub(r"[^a-z0-9α-ωάέήίόύώϊϋΐΰ]+", "-", text)
    return re.sub(r"-+", "-", text).strip("-")


def number_value(value: str) -> str:
    match = re.search(r"\d+(?:[,.]\d+)?", value or "")
    if not match:
        return ""
    return str(float(match.group(0).replace(",", "."))).rstrip("0").rstrip(".")


def percent_value(text: str, labels: list[str]) -> str:
    for label in labels:
        match = re.search(rf"{re.escape(label)}\s*(?:-|:)?\s*(\d+(?:[,.]\d+)?)\s*%", text, flags=re.I)
        if match:
            return number_value(match.group(1))
    return ""


def extract_between(text: str, start: str, stops: list[str]) -> str:
    start_match = re.search(start, text, flags=re.I)
    if not start_match:
        return ""
    tail = text[start_match.end() :]
    stop_positions = [m.start() for stop in stops if (m := re.search(stop, tail, flags=re.I))]
    end = min(stop_positions) if stop_positions else len(tail)
    return clean_text(tail[:end])


def split_ingredients(text: str) -> list[str]:
    ingredients: list[str] = []
    current = ""
    depth = 0
    for index, char in enumerate(text):
        if char == "(":
            depth += 1
        elif char == ")":
            depth = max(0, depth - 1)
        decimal_comma = (
            char == ","
            and index > 0
            and index + 1 < len(text)
            and text[index - 1].isdigit()
            and text[index + 1].isdigit()
        )
        if char == "," and depth == 0 and not decimal_comma:
            ingredients.append(current)
            current = ""
            continue
        current += char
    ingredients.append(current)
    seen: set[str] = set()
    cleaned: list[str] = []
    for ingredient in ingredients:
        item = clean_text(ingredient).rstrip(".")
        key = item.lower()
        if item and key not in seen:
            seen.add(key)
            cleaned.append(item)
    return cleaned


def tags_for(name: str, ingredients: list[str]) -> str:
    text = f"{name} {' '.join(ingredients)}".lower()
    tags = ["cat", "dry"]
    for needle, tag in [
        ("kitten", "kitten"),
        ("steril", "sterilised"),
        ("salmon", "salmon"),
        ("shrimp", "shrimp"),
        ("lamb", "lamb"),
        ("chicken", "chicken"),
        ("rice", "rice"),
        ("αρν", "lamb"),
        ("κοτόπου", "chicken"),
        ("σολομ", "salmon"),
        ("ρύζ", "rice"),
    ]:
        if needle in text:
            tags.append(tag)
    return ";".join(dict.fromkeys(tags))


def primary_proteins(ingredients: list[str]) -> str:
    return ";".join(
        item
        for item in ingredients
        if re.search(r"κοτόπου|αρν|σολομ|γαρίδ|chicken|lamb|salmon|shrimp", item, flags=re.I)
    )


def carb_sources(ingredients: list[str]) -> str:
    return ";".join(item for item in ingredients if re.search(r"ρύζ|αραβόσιτ|μπιζέλ|rice|corn|pea", item, flags=re.I))


def fat_sources(ingredients: list[str]) -> str:
    return ";".join(item for item in ingredients if re.search(r"λίπος|έλαιο|fat|oil", item, flags=re.I))


def row_for_block(title: str, block: str) -> dict[str, str]:
    formula_name = clean_text(title.title().replace("Prochoice", "PROCHOICE"))
    ingredients_text = extract_between(block, r"Σύνθεση\s*:", [r"Αναλυτικά\s+συστατικά\s*:", r"Πρόσθετα", r"$"])
    analysis_text = extract_between(block, r"Αναλυτικά\s+συστατικά\s*:", [r"Πρόσθετα", r"$"])
    additives_text = extract_between(block, r"Πρόσθετα\s*(?:\(ανά Kg\))?", [r"PROCHOICE", r"$"])
    ingredients = split_ingredients(ingredients_text)
    commercial_tags = tags_for(formula_name, ingredients)
    life_stage = "kitten" if "kitten" in formula_name.lower() else "adult"
    return {
        "brand": "Prochoice",
        "formula_name": formula_name,
        "display_name": formula_name,
        "species": "cat",
        "format": "dry",
        "life_stage": life_stage,
        "dog_size": "",
        "breed_target": "",
        "medical_tags": "obesity" if "steril" in formula_name.lower() else "",
        "commercial_tags": commercial_tags,
        "ingredient_text": ingredients_text,
        "ingredients": json.dumps(ingredients, ensure_ascii=False) if ingredients else "",
        "primary_animal_proteins": primary_proteins(ingredients),
        "carbohydrate_sources": carb_sources(ingredients),
        "fat_sources": fat_sources(ingredients),
        "fiber_sources": ";".join(item for item in ingredients if re.search(r"τεύτλ|fiber|fibre", item, flags=re.I)),
        "additives_text": additives_text,
        "feeding_guide_text": "",
        "kcal_per_100g": "",
        "kcal_per_kg": "",
        "protein_percent": percent_value(analysis_text, ["Ακατέργαστες πρωτεΐνες", "Πρωτεΐνη"]),
        "fat_percent": percent_value(analysis_text, ["ακατέργαστες λιπαρές ουσίες", "Λιπαρές ουσίες"]),
        "fiber_percent": percent_value(analysis_text, ["ακατέργαστες ίνες", "ίνες"]),
        "ash_percent": percent_value(analysis_text, ["ανόργανες ύλες", "τέφρα"]),
        "moisture_percent": percent_value(analysis_text, ["υγρασία"]),
        "calcium_percent": "",
        "phosphorus_percent": "",
        "sodium_percent": "",
        "magnesium_percent": "",
        "potassium_percent": "",
        "omega3_percent": percent_value(analysis_text, ["ωμέγα 3 λιπαρά οξέα", "ωμέγα 3"]),
        "omega6_percent": percent_value(analysis_text, ["ωμέγα 6 λιπαρά οξέα", "ωμέγα 6"]),
        "dha_percent": "",
        "epa_percent": "",
        "taurine_mgkg": number_value(re.search(r"Ταυρίνη\s*:\s*([\d,.]+)", additives_text or "", flags=re.I).group(1))
        if re.search(r"Ταυρίνη\s*:\s*([\d,.]+)", additives_text or "", flags=re.I)
        else "",
        "l_carnitine_mgkg": "",
        "glucosamine_mgkg": "",
        "chondroitin_mgkg": "",
        "vitamin_a_iukg": number_value(re.search(r"Α\s*:\s*([\d,.]+)", additives_text or "", flags=re.I).group(1))
        if re.search(r"Α\s*:\s*([\d,.]+)", additives_text or "", flags=re.I)
        else "",
        "vitamin_d3_iukg": number_value(re.search(r"D3\s*:\s*([\d,.]+)", additives_text or "", flags=re.I).group(1))
        if re.search(r"D3\s*:\s*([\d,.]+)", additives_text or "", flags=re.I)
        else "",
        "vitamin_e_mgkg": number_value(re.search(r"Ε\s*:\s*([\d,.]+)", additives_text or "", flags=re.I).group(1))
        if re.search(r"Ε\s*:\s*([\d,.]+)", additives_text or "", flags=re.I)
        else "",
        "iron_mgkg": "",
        "zinc_mgkg": "",
        "copper_mgkg": "",
        "manganese_mgkg": "",
        "iodine_mgkg": "",
        "selenium_mgkg": "",
        "data_quality_status": "needs_review",
        "data_source_url": "",
        "source_priority": "unknown",
        "source_notes": "; ".join(
            [
                "market=GR",
                "basis=as-fed",
                "source_tier=uploaded_pdf",
                f"source_document={SOURCE_FILE.as_posix()}",
                "official_url_required=true",
                "Auto-extracted from Prochoice presentation PDF; verify against official source or label before import.",
            ]
        ),
        "formula_key": f"prochoice-{slugify(formula_name)}-cat-dry-gr-pdf",
        "ean": "",
    }


def missing_fields(row: dict[str, str]) -> str:
    missing = []
    for field in ["ingredient_text", "protein_percent", "fat_percent", "fiber_percent"]:
        if not row.get(field):
            missing.append(field)
    if not row.get("kcal_per_kg"):
        missing.append("kcal_per_100g_or_kcal_per_kg")
    if not row.get("data_source_url"):
        missing.append("data_source_url_or_official_evidence")
    return "|".join(missing)


def main() -> None:
    text = "\n".join(page.extract_text() or "" for page in PdfReader(str(SOURCE_FILE)).pages)
    matches = list(re.finditer(r"PROCHOICE[^\n]+FORMULA", text))
    rows = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        rows.append(row_for_block(match.group(0), text[match.end() : end]))

    headers = next(csv.reader([TEMPLATE.read_text(encoding="utf-8").splitlines()[0]]))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    REVIEW.parent.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)
    with REVIEW.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=REVIEW_HEADERS)
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    "formula_key": row["formula_key"],
                    "brand": row["brand"],
                    "formula_name": row["formula_name"],
                    "species": row["species"],
                    "format": row["format"],
                    "status": "needs_review",
                    "missing_fields": missing_fields(row),
                    "evidence_path": SOURCE_FILE.as_posix(),
                    "duplicate_blocks_skipped": "0",
                    "recommended_action": "Attach official URL or label photo, verify extracted nutrients/ingredients, then preview in Food V2 before commit.",
                    "notes": "Prochoice PDF extraction; rows stay in review because provenance is uploaded PDF only.",
                }
            )
    REPORT.write_text(
        f"""# Prochoice PDF Extract

Generated: {datetime.now(timezone.utc).isoformat()}

## Summary

- Source PDF: {SOURCE_FILE}
- Extracted formula-level rows: {len(rows)}
- Output CSV: {OUTPUT}
- Review CSV: {REVIEW}

## Coverage

- Ingredients: {sum(1 for row in rows if row['ingredient_text'])}/{len(rows)}
- Protein/fat/fiber: {sum(1 for row in rows if row['protein_percent'] and row['fat_percent'] and row['fiber_percent'])}/{len(rows)}
- Ash: {sum(1 for row in rows if row['ash_percent'])}/{len(rows)}
- Moisture: {sum(1 for row in rows if row['moisture_percent'])}/{len(rows)}
- Kcal/ME: {sum(1 for row in rows if row['kcal_per_kg'])}/{len(rows)}
- Official URL: 0/{len(rows)}

## Import Decision

All rows are marked needs_review/hold. This PDF has useful label-like data, but official URLs/provenance are still required before import.
""",
        encoding="utf-8",
    )
    print(f"Prochoice PDF rows: {len(rows)}")
    print(f"Wrote {OUTPUT}")
    print(f"Wrote {REVIEW}")
    print(f"Wrote {REPORT}")


if __name__ == "__main__":
    main()
