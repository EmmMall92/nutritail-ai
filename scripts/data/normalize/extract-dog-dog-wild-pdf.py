import csv
import json
import re
from datetime import datetime, timezone
from pathlib import Path

from pypdf import PdfReader


SOURCE_DIR = Path("C:/Users/NIOstb/Desktop/photo_foods_nutritail")
SOURCE_FILE = next(SOURCE_DIR.glob("PA brochureA5-Dog&DogWILD*.pdf"))
TEMPLATE = Path("data/templates/nutritail-food-v2-template.csv")
OUTPUT = Path("data/imports/dog_dog_wild_pdf_extract_v2.csv")
REVIEW = Path("data/review/dog_dog_wild_pdf_extract_review.csv")
REPORT = Path("reports/dog_dog_wild_pdf_extract.md")

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

PAGE_PAIRS = [
    (18, 19, "Dog & Dog Wild Puppy All Breeds Natural Instinct"),
    (20, 21, "Dog & Dog Wild Adult All Breeds Regional Farm"),
    (22, 23, "Dog & Dog Wild Adult All Breeds Regional Forest"),
    (24, 25, "Dog & Dog Wild Adult All Breeds Regional Grassland"),
    (26, 27, "Dog & Dog Wild Adult All Breeds Regional Ocean"),
]


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def slugify(value: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", clean_text(value).lower())).strip("-")


def number_value(value: str) -> str:
    match = re.search(r"\d+(?:[,.]\d+)?", value or "")
    if not match:
        return ""
    return str(float(match.group(0).replace(",", "."))).rstrip("0").rstrip(".")


def percent_value(text: str, label: str) -> str:
    match = re.search(rf"{re.escape(label)}\s*(\d+(?:[,.]\d+)?)\s*%", text, flags=re.I)
    return number_value(match.group(1)) if match else ""


def extract_between(text: str, start: str, stops: list[str]) -> str:
    start_match = re.search(start, text, flags=re.I)
    if not start_match:
        return ""
    tail = text[start_match.end() :]
    stop_positions = [m.start() for stop in stops if (m := re.search(stop, tail, flags=re.I))]
    end = min(stop_positions) if stop_positions else len(tail)
    return clean_text(tail[:end])


def split_ingredients(text: str) -> list[str]:
    ingredients = []
    current = ""
    depth = 0
    for index, char in enumerate(text):
        if char == "(":
            depth += 1
        elif char == ")":
            depth = max(0, depth - 1)
        decimal_comma = char == "," and index > 0 and index + 1 < len(text) and text[index - 1].isdigit() and text[index + 1].isdigit()
        if char == "," and depth == 0 and not decimal_comma:
            ingredients.append(current)
            current = ""
            continue
        current += char
    ingredients.append(current)
    seen = set()
    output = []
    for ingredient in ingredients:
        item = clean_text(ingredient).rstrip(".")
        key = item.lower()
        if item and key not in seen:
            seen.add(key)
            output.append(item)
    return output


def tags_for(name: str, ingredients: list[str]) -> str:
    text = f"{name} {' '.join(ingredients)}".lower()
    tags = ["dog", "dry", "grain_free"]
    for needle, tag in [
        ("puppy", "puppy"),
        ("duck", "duck"),
        ("salmon", "salmon"),
        ("chicken", "chicken"),
        ("rabbit", "rabbit"),
        ("boar", "boar"),
        ("venison", "venison"),
        ("lamb", "lamb"),
        ("buffalo", "buffalo"),
        ("fish", "fish"),
        ("cod", "cod"),
        ("pea", "pea"),
    ]:
        if needle in text:
            tags.append(tag)
    return ";".join(dict.fromkeys(tags))


def row_for_pair(reader: PdfReader, intro_page: int, data_page: int, formula_name: str) -> dict[str, str]:
    intro_text = reader.pages[intro_page - 1].extract_text() or ""
    data_text = reader.pages[data_page - 1].extract_text() or ""
    ingredient_text = extract_between(data_text, r"COMPOSITION\s*:", [r"ADDITIVES PER KG", r"ANALYTICAL CONSTITUENTS", r"$"])
    analysis_text = extract_between(data_text, r"ANALYTICAL CONSTITUENTS\s*:", [r"SUGGESTED DAILY DOSES", r"$"])
    additives_text = extract_between(data_text, r"ADDITIVES PER KG\.", [r"ANALYTICAL CONSTITUENTS", r"$"])
    feeding_text = extract_between(data_text, r"SUGGESTED DAILY DOSES", [r"$"])
    ingredients = split_ingredients(ingredient_text)
    life_stage = "puppy" if "puppy" in formula_name.lower() else "adult"
    commercial_tags = tags_for(formula_name, ingredients)
    return {
        "brand": "Dog & Dog",
        "formula_name": formula_name,
        "display_name": formula_name,
        "species": "dog",
        "format": "dry",
        "life_stage": life_stage,
        "dog_size": "all",
        "breed_target": "",
        "medical_tags": "",
        "commercial_tags": commercial_tags,
        "ingredient_text": ingredient_text,
        "ingredients": json.dumps(ingredients, ensure_ascii=False) if ingredients else "",
        "primary_animal_proteins": ";".join(
            item for item in ingredients if re.search(r"pork|duck|salmon|chicken|rabbit|boar|venison|lamb|buffalo|bluefish|cod", item, flags=re.I)
        ),
        "carbohydrate_sources": ";".join(item for item in ingredients if re.search(r"peas|pea starch|chestnut", item, flags=re.I)),
        "fat_sources": ";".join(item for item in ingredients if re.search(r"fat|oil", item, flags=re.I)),
        "fiber_sources": "",
        "additives_text": additives_text,
        "feeding_guide_text": feeding_text,
        "kcal_per_100g": "",
        "kcal_per_kg": "",
        "protein_percent": percent_value(analysis_text, "Crude protein"),
        "fat_percent": percent_value(analysis_text, "Crude fat"),
        "fiber_percent": percent_value(analysis_text, "Crude fibres"),
        "ash_percent": percent_value(analysis_text, "Crude ash"),
        "moisture_percent": "",
        "calcium_percent": "",
        "phosphorus_percent": "",
        "sodium_percent": "",
        "magnesium_percent": "",
        "potassium_percent": "",
        "omega3_percent": "",
        "omega6_percent": "",
        "dha_percent": "",
        "epa_percent": "",
        "taurine_mgkg": "",
        "l_carnitine_mgkg": "",
        "glucosamine_mgkg": "",
        "chondroitin_mgkg": "",
        "vitamin_a_iukg": number_value(re.search(r"Vitamin A\s*([\d,.]+)", additives_text, flags=re.I).group(1))
        if re.search(r"Vitamin A\s*([\d,.]+)", additives_text, flags=re.I)
        else "",
        "vitamin_d3_iukg": number_value(re.search(r"Vitamin D3\s*([\d,.]+)", additives_text, flags=re.I).group(1))
        if re.search(r"Vitamin D3\s*([\d,.]+)", additives_text, flags=re.I)
        else "",
        "vitamin_e_mgkg": "",
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
                "market=EU",
                "basis=as-fed",
                "source_tier=uploaded_pdf",
                f"source_document={SOURCE_FILE.as_posix()}",
                f"source_pages={intro_page}-{data_page}",
                "official_url_required=true",
                "Auto-extracted from Dog & Dog Wild brochure PDF; verify against official source or label before import.",
                f"intro_excerpt={clean_text(intro_text[:180])}",
            ]
        ),
        "formula_key": f"dog-dog-{slugify(formula_name)}-dog-dry-eu-pdf",
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
    reader = PdfReader(str(SOURCE_FILE))
    rows = [row_for_pair(reader, intro, data, name) for intro, data, name in PAGE_PAIRS]
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
                    "notes": "Dog & Dog Wild PDF extraction; rows stay in review because provenance is uploaded PDF only.",
                }
            )
    REPORT.write_text(
        f"""# Dog & Dog Wild PDF Extract

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
- Kcal/ME: {sum(1 for row in rows if row['kcal_per_kg'])}/{len(rows)}
- Official URL: 0/{len(rows)}

## Import Decision

All rows are marked needs_review/hold. This PDF has useful label-like data, but official URLs/provenance are still required before import.
""",
        encoding="utf-8",
    )
    print(f"Dog & Dog Wild PDF rows: {len(rows)}")
    print(f"Wrote {OUTPUT}")
    print(f"Wrote {REVIEW}")
    print(f"Wrote {REPORT}")


if __name__ == "__main__":
    main()
