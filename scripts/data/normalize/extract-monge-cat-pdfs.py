import csv
import importlib.util
import json
import re
from datetime import datetime, timezone
from pathlib import Path


BASE = Path(__file__).resolve().parent
DOG_MODULE_PATH = BASE / "extract-monge-family-pdfs.py"
SPEC = importlib.util.spec_from_file_location("monge_family_pdf", DOG_MODULE_PATH)
monge_pdf = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(monge_pdf)


SOURCE_DIR = Path("C:/Users/NIOstb/Desktop/photo_foods_nutritail/monge cat pdf")
TEMPLATE = Path("data/templates/nutritail-food-v2-template.csv")
OUTPUT = Path("data/imports/monge_cat_pdf_extract_v2.csv")
REVIEW = Path("data/review/monge_cat_pdf_extract_review.csv")
REPORT = Path("reports/monge_cat_pdf_extract.md")

INCLUDE_PREFIXES = (
    "BWild-",
    "Gemon-",
    "Gran-bonta-",
    "LeChat-",
    "Monge-",
    "Moustache-",
    "SCHEDE-LECHAT-",
    "Simba-",
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
    "turkey",
    "beef",
    "pork",
    "salmon",
    "tuna",
    "fish",
    "codfish",
    "cod",
    "buffalo",
    "hare",
    "goose",
    "rabbit",
    "duck",
    "trout",
    "anchovies",
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
    "lentil",
    "lentils",
    "cereals",
    "tapioca",
]

FAT_TERMS = ["fat", "oil", "linseed"]
FIBER_TERMS = ["beet pulp", "apple pulp", "pea fibre", "fos", "mos", "xos", "yucca"]


def infer_brand(path: Path, text: str) -> str:
    name = path.name.lower()
    if name.startswith("gemon"):
        return "Gemon"
    if name.startswith("gran-bonta"):
        return "Gran Bonta"
    if name.startswith("lechat") or name.startswith("schede-lechat"):
        return "LeChat"
    if name.startswith("moustache"):
        return "Moustache"
    if name.startswith("simba"):
        return "Simba"
    if "vetsolution" in name:
        return "Monge VetSolution"
    if name.startswith("bwild"):
        return "Monge BWild"
    if name.startswith("monge"):
        return "Monge"
    return "Monge"


def infer_formula_name(path: Path, brand: str, text: str) -> str:
    stem = re.sub(r"\s*\(\d+\)$", "", path.stem)
    stem = re.sub(r"-(EN|ENG|GB)(-\d+)?$", "", stem, flags=re.I)
    stem = stem.replace("_", "-")
    stem = stem.replace("po-tatoes", "potatoes").replace("Sta-ge", "Stage")
    stem = re.sub(r"-\d+$", "", stem)
    replacements = [
        "BWild-",
        "Gemon-",
        "Gran-bonta-",
        "LeChat-Excellence-",
        "LeChat-",
        "Monge-natural-superpremium-",
        "Monge-vetsolution-",
        "Moustache-cat-",
        "SCHEDE-LECHAT-",
        "Simba-",
    ]
    for prefix in replacements:
        if stem.lower().startswith(prefix.lower()):
            stem = stem[len(prefix) :]
            break
    stem = re.sub(r"\b(cat|feline)\b", "", stem, flags=re.I)
    stem = re.sub(r"\b(kibbles|croquettes|formula|food)\b", "", stem, flags=re.I)
    stem = monge_pdf.clean_text(stem.replace("-", " "))
    if brand == "Monge VetSolution":
        return f"VetSolution {stem.title()}".replace(" And ", " and ")
    if brand == "Monge BWild" and not stem.lower().startswith("bwild"):
        return f"BWild {stem.title()}".replace(" And ", " and ")
    if brand == "LeChat" and not stem.lower().startswith("lechat"):
        return stem.title().replace(" And ", " and ").replace(" With ", " with ")
    return stem.title().replace(" And ", " and ").replace(" With ", " with ")


def infer_format(path: Path, text: str) -> str:
    name = path.name.lower()
    if "soup" in name or "wet" in name or "soup" in text[:800].lower():
        return "wet"
    return "dry"


def infer_life_stage(path: Path, text: str) -> str:
    source = f"{path.name} {text[:1200]}".lower()
    if "all life stage" in source or "all life stages" in source:
        return "all_life_stages"
    if "kitten" in source:
        return "kitten"
    if "senior" in source or "7 years" in source or "7-years" in source:
        return "senior"
    return "adult"


def tags_for(path: Path, brand: str, formula: str, text: str, ingredients: list[str]) -> tuple[str, str]:
    source = f"{path.name} {brand} {formula} {text[:1200]} {' '.join(ingredients)}".lower()
    identity_source = f"{path.name} {brand} {formula}".lower()
    commercial = ["cat", infer_format(path, text)]
    medical = []
    for needle, tag in [
        ("kitten", "kitten"),
        ("adult", "adult"),
        ("senior", "senior"),
        ("sterilised", "sterilised"),
        ("sterilized", "sterilised"),
        ("indoor", "indoor"),
        ("hairball", "hairball"),
        ("fussy", "fussy_appetite"),
        ("sensitive", "sensitive_digestion"),
        ("light", "weight_control"),
        ("grain free", "grain_free"),
        ("monoprotein", "monoprotein"),
        ("chicken", "chicken"),
        ("turkey", "turkey"),
        ("beef", "beef"),
        ("pork", "pork"),
        ("salmon", "salmon"),
        ("tuna", "tuna"),
        ("duck", "duck"),
        ("trout", "trout"),
        ("rabbit", "rabbit"),
        ("codfish", "fish"),
        ("cod", "fish"),
        ("rice", "rice"),
        ("potato", "potato"),
        ("pea", "pea"),
        ("lentil", "lentil"),
    ]:
        if needle in source:
            commercial.append(tag)
    for needle, tag in [
        ("urinary", "urinary"),
        ("struvite", "urinary"),
        ("oxalate", "urinary"),
        ("renal", "renal"),
        ("obesity", "obesity"),
        ("diabetic", "diabetes"),
        ("gastrointestinal", "gi_support"),
        ("dermatosis", "allergy"),
        ("hepatic", "hepatic"),
    ]:
        if needle in identity_source:
            medical.append(tag)
    return ";".join(dict.fromkeys(medical)), ";".join(dict.fromkeys(commercial))


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
    text = monge_pdf.text_for_pdf(path)
    brand = infer_brand(path, text)
    formula = infer_formula_name(path, brand, text)
    format_value = infer_format(path, text)
    ingredient_text = monge_pdf.extract_between(
        text,
        r"COMPOSITION\s*:",
        [r"ANALYTICAL CONSTITUENTS", r"ADDITIVES", r"ADDITIVE/KG", r"INSTRUCTIONS FOR USE", r"$"],
    )
    analysis_text = monge_pdf.extract_between(
        text,
        r"ANALYTICAL CONSTITUENTS\s*:",
        [r"ADDITIVES", r"ADDITIVE/KG", r"INSTRUCTIONS FOR USE", r"STORAGE CONDITIONS", r"$"],
    )
    additives_text = monge_pdf.extract_between(
        text,
        r"(?:ADDITIVES|ADDITIVE/KG)\s*:?",
        [r"INSTRUCTIONS FOR USE", r"RECOMMENDED DAILY", r"STORAGE CONDITIONS", r"$"],
    )
    feeding_text = monge_pdf.extract_between(
        text,
        r"INSTRUCTIONS FOR USE\s*:?",
        [r"STORAGE CONDITIONS", r"Best before", r"$"],
    )
    ingredients = monge_pdf.split_ingredients(ingredient_text)
    kcal_per_kg = monge_pdf.kcal_kg_value(text)
    medical_tags, commercial_tags = tags_for(path, brand, formula, text, ingredients)

    row = dict.fromkeys(headers, "")
    row.update(
        {
            "brand": brand,
            "formula_name": formula,
            "display_name": f"{brand} {formula}",
            "species": "cat",
            "format": format_value,
            "life_stage": infer_life_stage(path, text),
            "dog_size": "",
            "breed_target": "large_breed" if "large breed" in f"{path.name} {text[:900]}".lower() else "",
            "medical_tags": medical_tags,
            "commercial_tags": commercial_tags,
            "ingredient_text": ingredient_text,
            "ingredients": json.dumps(ingredients, ensure_ascii=False) if ingredients else "",
            "primary_animal_proteins": monge_pdf.matching_terms(ingredients, ANIMAL_TERMS),
            "carbohydrate_sources": monge_pdf.matching_terms(ingredients, CARB_TERMS),
            "fat_sources": monge_pdf.matching_terms(ingredients, FAT_TERMS),
            "fiber_sources": monge_pdf.matching_terms(ingredients, FIBER_TERMS),
            "additives_text": additives_text,
            "feeding_guide_text": feeding_text,
            "kcal_per_kg": kcal_per_kg,
            "kcal_per_100g": monge_pdf.number_value(str(float(kcal_per_kg) / 10)) if kcal_per_kg else "",
            "protein_percent": monge_pdf.percent_value(analysis_text, "Crude Protein"),
            "fat_percent": monge_pdf.percent_value(analysis_text, "Crude Fat"),
            "fiber_percent": monge_pdf.percent_value(analysis_text, r"Crude (?:Fibre|Fiber)"),
            "ash_percent": monge_pdf.percent_value(analysis_text, "Crude Ash"),
            "calcium_percent": monge_pdf.percent_value(analysis_text, "Calcium"),
            "phosphorus_percent": monge_pdf.percent_value(analysis_text, "Phosphorus"),
            "sodium_percent": monge_pdf.percent_value(analysis_text, "Sodium"),
            "magnesium_percent": monge_pdf.percent_value(analysis_text, "Magnesium"),
            "potassium_percent": monge_pdf.percent_value(analysis_text, "Potassium"),
            "omega3_percent": monge_pdf.percent_value(analysis_text, r"(?:n-3|Omega-3) Fatty Acids"),
            "omega6_percent": monge_pdf.percent_value(analysis_text, r"(?:n-6|Omega-6) Fatty Acids"),
            "taurine_mgkg": monge_pdf.mgkg_value(additives_text, "Taurine"),
            "l_carnitine_mgkg": monge_pdf.mgkg_value(additives_text, "L-?Carnitine"),
            "glucosamine_mgkg": monge_pdf.mgkg_value(ingredient_text, "glucosamine"),
            "chondroitin_mgkg": monge_pdf.mgkg_value(ingredient_text, "chondroitin"),
            "vitamin_a_iukg": monge_pdf.number_value(re.search(r"Vitamin A[^,\.;:]*[:\s]\s*(\d[\d,.]*)\s*IU", additives_text, flags=re.I).group(1))
            if re.search(r"Vitamin A[^,\.;:]*[:\s]\s*(\d[\d,.]*)\s*IU", additives_text, flags=re.I)
            else "",
            "vitamin_d3_iukg": monge_pdf.number_value(re.search(r"Vitamin D3[^,\.;:]*[:\s]\s*(\d[\d,.]*)\s*IU", additives_text, flags=re.I).group(1))
            if re.search(r"Vitamin D3[^,\.;:]*[:\s]\s*(\d[\d,.]*)\s*IU", additives_text, flags=re.I)
            else "",
            "vitamin_e_mgkg": monge_pdf.mgkg_value(additives_text, "Vitamin E"),
            "iron_mgkg": monge_pdf.mgkg_value(additives_text, "Iron"),
            "zinc_mgkg": monge_pdf.mgkg_value(additives_text, "Zinc"),
            "copper_mgkg": monge_pdf.mgkg_value(additives_text, "Copper"),
            "manganese_mgkg": monge_pdf.mgkg_value(additives_text, "Manganese"),
            "iodine_mgkg": monge_pdf.mgkg_value(additives_text, "Iodine"),
            "selenium_mgkg": monge_pdf.mgkg_value(additives_text, "Selenium"),
            "data_quality_status": "needs_review",
            "data_source_url": monge_pdf.file_uri(path),
            "source_priority": "official",
            "source_notes": "; ".join(
                [
                    "market=EU",
                    "basis=as-fed",
                    "source_tier=official_pdf",
                    "source_group=monge_cat_pdf",
                    "label_energy_used=true" if kcal_per_kg else "label_energy_missing=true",
                    f"source_document={path.as_posix()}",
                    "human_qa_required_before_recommendation=true",
                ]
            ),
            "formula_key": f"{monge_pdf.slugify(brand)}-{monge_pdf.slugify(formula)}-cat-{format_value}-eu-pdf",
            "ean": "",
            "is_recommendable": "false",
        }
    )
    kcal_per_100g, kcal_per_kg_estimate, energy_notes = monge_pdf.estimate_kcal_modified_atwater(row)
    if kcal_per_100g and kcal_per_kg_estimate:
        row["kcal_per_100g"] = kcal_per_100g
        row["kcal_per_kg"] = kcal_per_kg_estimate
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
                    "extracted_fields": monge_pdf.extracted_fields(row),
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
                    "species": "cat",
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
        row for row in rows if "kcal_estimate_skipped=" in row.get("source_notes", "")
    ]
    report = [
        "# Monge Cat PDF Extract",
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

    print(f"Monge cat PDF rows: {len(rows)}")
    print(f"Importable after QA: {len(complete)}")
    print(f"Needs backfill/errors: {len(review_rows) - len(complete)}")
    print(f"Wrote {OUTPUT}")
    print(f"Wrote {REVIEW}")
    print(f"Wrote {REPORT}")


if __name__ == "__main__":
    main()
