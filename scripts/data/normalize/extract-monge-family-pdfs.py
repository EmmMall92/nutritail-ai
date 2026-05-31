import csv
import json
import re
from datetime import datetime, timezone
from pathlib import Path

from pypdf import PdfReader


SOURCE_DIR = Path("C:/Users/NIOstb/Desktop/photo_foods_nutritail")
TEMPLATE = Path("data/templates/nutritail-food-v2-template.csv")
OUTPUT = Path("data/imports/monge_family_pdf_extract_v2.csv")
REVIEW = Path("data/review/monge_family_pdf_extract_review.csv")
REPORT = Path("reports/monge_family_pdf_extract.md")

INCLUDE_PREFIXES = (
    "Antu-",
    "Artu-",
    "Gran-Bonta-",
    "Simba-",
    "Special-Dog-",
    "special_dog_",
    "Gemon-",
    "Monge-",
    "monge_",
    "BWild-",
)

REVIEW_HEADERS = [
    "formula_key",
    "brand",
    "formula_name",
    "species",
    "format",
    "status",
    "source_file",
    "extracted_fields",
    "missing_fields",
    "recommended_action",
    "notes",
]

ANIMAL_TERMS = [
    "chicken",
    "beef",
    "salmon",
    "tuna",
    "lamb",
    "duck",
    "pork",
    "goose",
    "deer",
    "wild boar",
    "boar",
    "trout",
    "rabbit",
    "turkey",
    "anchovies",
    "fish",
]

CARB_TERMS = [
    "rice",
    "maize",
    "corn",
    "wheat",
    "potato",
    "potatoes",
    "pea",
    "peas",
    "cereals",
    "tapioca",
]

FAT_TERMS = ["fat", "oil", "linseed"]
FIBER_TERMS = ["beet pulp", "citrus pulp", "fos", "mos", "xos", "yucca"]

MODIFIED_ATWATER = {
    "protein": 3.5,
    "fat": 8.5,
    "carbohydrate": 3.5,
}

DRY_FOOD_DEFAULTS = {
    "ash_percent": 7.0,
    "moisture_percent": 10.0,
}


def clean_text(value: str) -> str:
    normalized = re.sub(r"([A-Za-z])-[\s\r\n]+([A-Za-z])", r"\1\2", value or "")
    return (
        re.sub(r"\s+", " ", normalized)
        .replace("/f_", "f")
        .replace("/hyphen.cap", "-")
        .replace("/uniF6BA", "")
        .replace("/parenleft.cap", "(")
        .replace("/parenright.cap", ")")
        .replace("ﬁ", "fi")
        .replace("ﬀ", "ff")
        .replace("’", "'")
        .strip()
    )


def slugify(value: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", clean_text(value).lower())).strip("-")


def number_value(value: str) -> str:
    match = re.search(r"\d+(?:[,.]\d+)?", value or "")
    if not match:
        return ""
    token = match.group(0)
    if "," in token and "." not in token:
        parts = token.split(",")
        if len(parts[-1]) == 3:
            token = "".join(parts)
        else:
            token = token.replace(",", ".")
    else:
        token = token.replace(",", "")
    return str(round(float(token), 4)).rstrip("0").rstrip(".")


def file_uri(path: Path) -> str:
    return path.resolve().as_uri()


def text_for_pdf(path: Path) -> str:
    reader = PdfReader(str(path))
    return clean_text("\n".join(page.extract_text() or "" for page in reader.pages))


def extract_between(text: str, start: str, stops: list[str]) -> str:
    start_match = re.search(start, text, flags=re.I)
    if not start_match:
        return ""
    tail = text[start_match.end() :]
    positions = [
        match.start()
        for stop in stops
        if (match := re.search(stop, tail, flags=re.I))
    ]
    end = min(positions) if positions else len(tail)
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

    seen = set()
    output = []
    for ingredient in ingredients:
        item = clean_text(ingredient).rstrip(".")
        key = item.lower()
        if item and key not in seen:
            seen.add(key)
            output.append(item)
    return output


def percent_value(text: str, label: str) -> str:
    patterns = [
        rf"{label}\s*:?\s*(\d+(?:[,.]\d+)?)\s*%",
        rf"{label}\s+(\d+(?:[,.]\d+)?)\s*%",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.I)
        if match:
            return number_value(match.group(1))
    return ""


def mgkg_value(text: str, label: str) -> str:
    match = re.search(rf"{label}[^,\.;:]*[:\s]\s*(\d+(?:[,.]\d+)?)\s*mg", text, flags=re.I)
    return number_value(match.group(1)) if match else ""


def kcal_kg_value(text: str) -> str:
    match = re.search(r"Metabolisable Energy(?:\s*\([^)]*\))?\s*:?\s*(\d[\d,.]*)\s*kcal\s*/?\s*kg", text, flags=re.I)
    if not match:
        return ""
    return str(int(round(float(match.group(1).replace(",", "")))))


def float_or_none(value: str) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(str(value).replace(",", "."))
    except ValueError:
        return None


def format_number(value: float) -> str:
    return str(round(value, 1)).rstrip("0").rstrip(".")


def estimate_kcal_modified_atwater(row: dict[str, str]) -> tuple[str, str, list[str]]:
    if row.get("kcal_per_100g") or row.get("kcal_per_kg"):
        return row.get("kcal_per_100g", ""), row.get("kcal_per_kg", ""), []

    if row.get("format") != "dry":
        return "", "", ["kcal_estimate_skipped=non_dry_or_missing_moisture"]

    protein = float_or_none(row.get("protein_percent", ""))
    fat = float_or_none(row.get("fat_percent", ""))
    fiber = float_or_none(row.get("fiber_percent", ""))
    ash = float_or_none(row.get("ash_percent", ""))
    moisture = float_or_none(row.get("moisture_percent", ""))
    notes = []

    if protein is None or fat is None or fiber is None:
        return "", "", ["kcal_estimate_skipped=missing_protein_fat_or_fiber"]

    if ash is None:
        ash = DRY_FOOD_DEFAULTS["ash_percent"]
        notes.append(f"default_ash_percent={format_number(ash)}")
    if moisture is None:
        moisture = DRY_FOOD_DEFAULTS["moisture_percent"]
        notes.append(f"default_moisture_percent={format_number(moisture)}")

    carbohydrate = round(100 - protein - fat - fiber - ash - moisture, 1)
    if carbohydrate < 0 or carbohydrate > 100:
        return "", "", [f"kcal_estimate_skipped=impossible_carbohydrate_percent_{format_number(carbohydrate)}"]

    kcal_per_100g = (
        protein * MODIFIED_ATWATER["protein"]
        + fat * MODIFIED_ATWATER["fat"]
        + carbohydrate * MODIFIED_ATWATER["carbohydrate"]
    )
    kcal_per_100g = round(kcal_per_100g, 1)
    confidence = "medium" if notes else "high"
    return (
        format_number(kcal_per_100g),
        format_number(kcal_per_100g * 10),
        [
            "kcal_estimated=true",
            "kcal_estimation_method=modified_atwater",
            f"estimated_carbohydrate_percent={format_number(carbohydrate)}",
            *notes,
            f"kcal_estimation_confidence={confidence}",
        ],
    )


def infer_brand(path: Path, text: str) -> str:
    name = path.name.lower()
    upper_text = text[:700].upper()
    if name.startswith(("antu-", "artu-")) or "ARTÙ" in upper_text or "ARTU" in upper_text:
        return "Artu"
    if name.startswith("gran-bonta"):
        return "Gran Bonta"
    if name.startswith("simba"):
        return "Simba"
    if name.startswith(("special-dog", "special_dog")):
        return "Special Dog"
    if name.startswith("gemon"):
        return "Gemon"
    if "vetsolution" in name:
        return "Monge VetSolution"
    if name.startswith(("bwild", "monge_dog_dry_bwild")):
        return "Monge BWild"
    if name.startswith("monge"):
        return "Monge"
    return "Monge"


def infer_formula_name(path: Path, brand: str, text: str) -> str:
    stem = re.sub(r"-(EN|ENG|GB)(-\d+)?$", "", path.stem, flags=re.I)
    stem = stem.replace("_", "-").replace("An·Hydro", "An-Hydro")
    stem = stem.replace("Ancho-vies", "Anchovies").replace("Sal-mon", "Salmon")
    stem = re.sub(r"-\d+$", "", stem)
    replacements = [
        "monge-dog-dry-",
        "special-dog-dog-dry-dry-food-croquettes-",
        "special-dog-dog-dry-speciality-croquettes-",
        "Monge-natural-superpremium-",
        "Monge-vetsolution-",
        "BWild-",
        "Gemon-",
        "Special-Dog-",
        "Simba-",
        "Antu-",
        "Artu-",
        "Gran-Bonta-",
    ]
    for prefix in replacements:
        if stem.lower().startswith(prefix.lower()):
            stem = stem[len(prefix) :]
            break
    stem = re.sub(r"\b(dog|canine)\b", "", stem, flags=re.I)
    stem = re.sub(r"\b(kibbles|croquettes|formula|food)\b", "", stem, flags=re.I)
    stem = clean_text(stem.replace("-", " "))
    if brand == "Monge VetSolution":
        return f"VetSolution {stem.title()}".replace(" And ", " and ")
    if brand == "Monge BWild" and not stem.lower().startswith("bwild"):
        return f"BWild {stem.title()}".replace(" And ", " and ")
    return stem.title().replace(" And ", " and ").replace(" With ", " with ")


def infer_format(path: Path, text: str) -> str:
    name = path.name.lower()
    if "soup" in name or "soup" in text[:600].lower():
        return "wet"
    return "dry"


def infer_life_stage(name: str, text: str) -> str:
    source = f"{name} {text[:900]}".lower()
    if "puppy" in source or "junior" in source:
        return "puppy"
    if "senior" in source:
        return "senior"
    if "adult" in source:
        return "adult"
    return "adult"


def infer_dog_size(text: str) -> str:
    source = text[:1000].lower()
    if "all breeds" in source or "all sizes" in source or "every size" in source:
        return "all"
    if "small" in source or "mini" in source:
        return "small"
    if "medium" in source:
        return "medium"
    if "large" in source or "giant" in source:
        return "large"
    return "all"


def tags_for(path: Path, brand: str, formula: str, text: str, ingredients: list[str]) -> tuple[str, str]:
    source = f"{path.name} {brand} {formula} {text[:1200]} {' '.join(ingredients)}".lower()
    identity_source = f"{path.name} {brand} {formula}".lower()
    commercial = ["dog", infer_format(path, text)]
    medical = []
    mappings = [
        ("puppy", "puppy"),
        ("junior", "puppy"),
        ("adult", "adult"),
        ("senior", "senior"),
        ("light", "weight_control"),
        ("grain free", "grain_free"),
        ("monoprotein", "monoprotein"),
        ("hypo", "sensitive_digestion"),
        ("salmon", "salmon"),
        ("tuna", "tuna"),
        ("chicken", "chicken"),
        ("beef", "beef"),
        ("duck", "duck"),
        ("lamb", "lamb"),
        ("pork", "pork"),
        ("rice", "rice"),
        ("potato", "potato"),
        ("potatoes", "potato"),
        ("pea", "pea"),
    ]
    for needle, tag in mappings:
        if needle in source:
            commercial.append(tag)
    for needle, tag in [
        ("urinary", "urinary"),
        ("struvite", "urinary"),
        ("renal", "renal"),
        ("oxalate", "renal"),
        ("obesity", "obesity"),
        ("diabetic", "diabetes"),
        ("gastrointestinal", "gi_support"),
        ("dermatosis", "allergy"),
        ("an-hydro", "allergy"),
        ("hydro", "allergy"),
        ("hepatic", "hepatic"),
        ("cardiac", "cardiac"),
        ("joint", "joint_support"),
    ]:
        if needle in identity_source:
            medical.append(tag)
    return ";".join(dict.fromkeys(medical)), ";".join(dict.fromkeys(commercial))


def matching_terms(ingredients: list[str], terms: list[str]) -> str:
    matches = []
    joined = " | ".join(ingredients).lower()
    for term in terms:
        if term in joined:
            matches.append(term)
    return ";".join(dict.fromkeys(matches))


def extracted_fields(row: dict[str, str]) -> str:
    return "|".join(
        key
        for key, value in row.items()
        if str(value or "").strip() and key not in {"ingredients", "source_notes"}
    )


def missing_fields(row: dict[str, str]) -> list[str]:
    required = [
        "brand",
        "formula_name",
        "species",
        "format",
        "ingredient_text",
        "protein_percent",
        "fat_percent",
        "fiber_percent",
        "kcal_per_100g",
        "data_source_url",
    ]
    return [field for field in required if not str(row.get(field, "")).strip()]


def row_for_pdf(path: Path, headers: list[str]) -> dict[str, str]:
    text = text_for_pdf(path)
    brand = infer_brand(path, text)
    formula = infer_formula_name(path, brand, text)
    format_value = infer_format(path, text)
    life_stage = infer_life_stage(path.name, text)
    dog_size = infer_dog_size(text)
    ingredient_text = extract_between(
        text,
        r"COMPOSITION\s*:",
        [r"ANALYTICAL CONSTITUENTS", r"ADDITIVES", r"ADDITIVE/KG", r"INSTRUCTIONS FOR USE", r"$"],
    )
    analysis_text = extract_between(
        text,
        r"ANALYTICAL CONSTITUENTS\s*:",
        [r"ADDITIVES", r"ADDITIVE/KG", r"INSTRUCTIONS FOR USE", r"STORAGE CONDITIONS", r"$"],
    )
    additives_text = extract_between(
        text,
        r"(?:ADDITIVES|ADDITIVE/KG)\s*:?",
        [r"INSTRUCTIONS FOR USE", r"RECOMMENDED DAILY", r"STORAGE CONDITIONS", r"$"],
    )
    feeding_text = extract_between(
        text,
        r"INSTRUCTIONS FOR USE\s*:?",
        [r"STORAGE CONDITIONS", r"Best before", r"$"],
    )
    ingredients = split_ingredients(ingredient_text)
    kcal_per_kg = kcal_kg_value(text)
    medical_tags, commercial_tags = tags_for(path, brand, formula, text, ingredients)

    row = dict.fromkeys(headers, "")
    row.update(
        {
            "brand": brand,
            "formula_name": formula,
            "display_name": f"{brand} {formula}",
            "species": "dog",
            "format": format_value,
            "life_stage": life_stage,
            "dog_size": dog_size,
            "breed_target": "",
            "medical_tags": medical_tags,
            "commercial_tags": commercial_tags,
            "ingredient_text": ingredient_text,
            "ingredients": json.dumps(ingredients, ensure_ascii=False) if ingredients else "",
            "primary_animal_proteins": matching_terms(ingredients, ANIMAL_TERMS),
            "carbohydrate_sources": matching_terms(ingredients, CARB_TERMS),
            "fat_sources": matching_terms(ingredients, FAT_TERMS),
            "fiber_sources": matching_terms(ingredients, FIBER_TERMS),
            "additives_text": additives_text,
            "feeding_guide_text": feeding_text,
            "kcal_per_kg": kcal_per_kg,
            "kcal_per_100g": number_value(str(float(kcal_per_kg) / 10)) if kcal_per_kg else "",
            "protein_percent": percent_value(analysis_text, "Crude Protein"),
            "fat_percent": percent_value(analysis_text, "Crude Fat"),
            "fiber_percent": percent_value(analysis_text, r"Crude (?:Fibre|Fiber)"),
            "ash_percent": percent_value(analysis_text, "Crude Ash"),
            "calcium_percent": percent_value(analysis_text, "Calcium"),
            "phosphorus_percent": percent_value(analysis_text, "Phosphorus"),
            "sodium_percent": percent_value(analysis_text, "Sodium"),
            "magnesium_percent": percent_value(analysis_text, "Magnesium"),
            "potassium_percent": percent_value(analysis_text, "Potassium"),
            "omega3_percent": percent_value(analysis_text, r"(?:n-3|Omega-3) Fatty Acids"),
            "omega6_percent": percent_value(analysis_text, r"(?:n-6|Omega-6) Fatty Acids"),
            "taurine_mgkg": mgkg_value(additives_text, "Taurine"),
            "l_carnitine_mgkg": mgkg_value(additives_text, "L-?Carnitine"),
            "glucosamine_mgkg": mgkg_value(ingredient_text, "glucosamine"),
            "chondroitin_mgkg": mgkg_value(ingredient_text, "chondroitin"),
            "vitamin_a_iukg": number_value(re.search(r"Vitamin A[^,\.;:]*[:\s]\s*(\d[\d,.]*)\s*IU", additives_text, flags=re.I).group(1))
            if re.search(r"Vitamin A[^,\.;:]*[:\s]\s*(\d[\d,.]*)\s*IU", additives_text, flags=re.I)
            else "",
            "vitamin_d3_iukg": number_value(re.search(r"Vitamin D3[^,\.;:]*[:\s]\s*(\d[\d,.]*)\s*IU", additives_text, flags=re.I).group(1))
            if re.search(r"Vitamin D3[^,\.;:]*[:\s]\s*(\d[\d,.]*)\s*IU", additives_text, flags=re.I)
            else "",
            "vitamin_e_mgkg": mgkg_value(additives_text, "Vitamin E"),
            "iron_mgkg": mgkg_value(additives_text, "Iron"),
            "zinc_mgkg": mgkg_value(additives_text, "Zinc"),
            "copper_mgkg": mgkg_value(additives_text, "Copper"),
            "manganese_mgkg": mgkg_value(additives_text, "Manganese"),
            "iodine_mgkg": mgkg_value(additives_text, "Iodine"),
            "selenium_mgkg": mgkg_value(additives_text, "Selenium"),
            "data_quality_status": "needs_review",
            "data_source_url": file_uri(path),
            "source_priority": "official",
            "source_notes": "; ".join(
                [
                    "market=EU",
                    "basis=as-fed",
                    "source_tier=official_pdf",
                    "source_group=monge_family_pdf",
                    "label_energy_used=true" if kcal_per_kg else "label_energy_missing=true",
                    f"source_document={path.as_posix()}",
                    "human_qa_required_before_recommendation=true",
                ]
            ),
            "formula_key": f"{slugify(brand)}-{slugify(formula)}-dog-{format_value}-eu-pdf",
            "ean": "",
            "is_recommendable": "false",
        }
    )
    estimated_kcal_per_100g, estimated_kcal_per_kg, energy_notes = estimate_kcal_modified_atwater(row)
    if estimated_kcal_per_100g and estimated_kcal_per_kg:
        row["kcal_per_100g"] = estimated_kcal_per_100g
        row["kcal_per_kg"] = estimated_kcal_per_kg
    if energy_notes:
        row["source_notes"] = "; ".join([row["source_notes"], *energy_notes])
    return row


def find_sources() -> list[Path]:
    return sorted(
        path
        for path in SOURCE_DIR.glob("*.pdf")
        if path.name.startswith(INCLUDE_PREFIXES)
    )


def main() -> None:
    headers = next(csv.reader([TEMPLATE.read_text(encoding="utf-8").splitlines()[0]]))
    sources = find_sources()
    rows = []
    review_rows = []
    errors = []

    for source in sources:
        try:
            row = row_for_pdf(source, headers)
            rows.append(row)
            missing = missing_fields(row)
            review_rows.append(
                {
                    "formula_key": row["formula_key"],
                    "brand": row["brand"],
                    "formula_name": row["formula_name"],
                    "species": row["species"],
                    "format": row["format"],
                    "status": "needs_backfill" if missing else "importable_after_qa",
                    "source_file": source.as_posix(),
                    "extracted_fields": extracted_fields(row),
                    "missing_fields": "|".join(missing),
                    "recommended_action": "Preview in Food V2, run Check Existing, then commit only reviewed rows.",
                    "notes": row["source_notes"],
                }
            )
        except Exception as error:
            errors.append((source, str(error)))
            review_rows.append(
                {
                    "formula_key": "",
                    "brand": "",
                    "formula_name": "",
                    "species": "dog",
                    "format": "",
                    "status": "extract_failed",
                    "source_file": source.as_posix(),
                    "extracted_fields": "",
                    "missing_fields": "",
                    "recommended_action": "Inspect PDF manually or add OCR/parser exception.",
                    "notes": str(error),
                }
            )

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
        writer.writerows(review_rows)

    complete = [row for row in review_rows if row["status"] == "importable_after_qa"]
    official_energy_rows = [
        row for row in rows if "label_energy_used=true" in row.get("source_notes", "")
    ]
    estimated_energy_rows = [
        row for row in rows if "kcal_estimated=true" in row.get("source_notes", "")
    ]
    skipped_energy_rows = [
        row
        for row in rows
        if "kcal_estimate_skipped=" in row.get("source_notes", "")
    ]
    report = [
        "# Monge Family PDF Extract",
        "",
        f"Generated: {datetime.now(timezone.utc).isoformat()}",
        "",
        "## Summary",
        "",
        f"- PDF files scanned: {len(sources)}",
        f"- Food V2 rows extracted: {len(rows)}",
        f"- Importable after QA: {len(complete)}",
        f"- Needs backfill/errors: {len(review_rows) - len(complete)}",
        f"- Official kcal rows: {len(official_energy_rows)}",
        f"- Estimated kcal rows: {len(estimated_energy_rows)}",
        f"- Kcal still unavailable: {len(skipped_energy_rows)}",
        f"- Output CSV: {OUTPUT}",
        f"- Review CSV: {REVIEW}",
        "",
        "Rows are marked `needs_review`, `source_priority=official`, and `is_recommendable=false` by default. Use Food V2 Preview and Check Existing before committing.",
    ]
    if errors:
        report.extend(["", "## Extraction Errors", ""])
        report.extend(f"- {source.name}: {message}" for source, message in errors)
    REPORT.write_text("\n".join(report) + "\n", encoding="utf-8")

    print(f"Monge family PDF rows: {len(rows)}")
    print(f"Importable after QA: {len(complete)}")
    print(f"Needs backfill/errors: {len(review_rows) - len(complete)}")
    print(f"Wrote {OUTPUT}")
    print(f"Wrote {REVIEW}")
    print(f"Wrote {REPORT}")


if __name__ == "__main__":
    main()
