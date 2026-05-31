import csv
import json
from datetime import datetime, timezone
from pathlib import Path


SOURCE_DIR = Path("C:/Users/NIOstb/Desktop/photo_foods_nutritail")
DOG_SOURCE = SOURCE_DIR / "SOPRAL_Prestige_Brochure_Chien_BAT.pdf"
CAT_SOURCE = SOURCE_DIR / "SOPRAL_Prestige_Brochure_Chat_BAT.pdf"
TEMPLATE = Path("data/templates/nutritail-food-v2-template.csv")
OUTPUT = Path("data/imports/prestige_pdf_analytic_extract_v2.csv")
REVIEW = Path("data/review/prestige_pdf_analytic_extract_review.csv")
REPORT = Path("reports/prestige_pdf_analytic_extract.md")

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

DOG_ROWS = [
    ("Puppy Mini", "puppy", "mini", 29, 18, 2, 7, 3980, 1.35, 0.9, 0.30, 0.11, 2.4, 1.2, None, None, 17000, 1100, 220, 19, 193, 61, 2.7, 0.44),
    ("Adult Mini", "adult", "mini", 26, 14, 3.5, 7, 3674, 1.2, 0.8, 0.35, 0.13, 2.2, 1.1, None, None, 14000, 900, 180, 19, 200, 70, 2.7, 0.48),
    ("Adult 8+ Mini", "senior", "mini", 27, 12, 5, 6, 3514, 1.1, 0.6, 0.15, 0.13, 2.0, 1.4, 440, None, 16300, 1200, 200, 20, 200, 70, 2.7, 0.42),
    ("Adult Mini Light Sterilised", "adult", "mini", 27, 10, 8, 6.5, 3200, 1.1, 0.8, 0.22, 0.14, 1.6, 1.2, None, 50, 13600, 900, 175, 21, 200, 71, 2.7, 0.49),
    ("Puppy Medium", "puppy", "medium", 30, 19, 2, 7, 4030, 1.35, 0.9, 0.30, 0.11, 2.5, 1.2, None, None, 17000, 1100, 220, 19, 193, 61, 2.7, 0.45),
    ("Adult Medium", "adult", "medium", 25, 13, 3, 7, 3660, 1.3, 0.9, 0.35, 0.14, 2.0, 1.3, None, None, 12000, 780, 155, 18, 186, 66, 2.5, 0.50),
    ("Adult Medium Maxi Light Sterilised", "adult", "large", 27, 9, 7, 7, 3210, 1.1, 0.8, 0.35, 0.13, 1.5, 0.8, None, 50, 13600, 900, 175, 20, 199, 69, 2.6, 0.48),
    ("Puppy Maxi", "puppy", "large", 30, 16, 2, 7, 3890, 1.35, 0.9, 0.30, 0.12, 2.2, 1.2, None, None, 17000, 1100, 220, 19, 194, 61, 2.7, 0.45),
    ("Adult Maxi", "adult", "large", 26, 15, 3, 7, 3756, 1.2, 0.8, 0.35, 0.13, 2.2, 1.3, None, None, 14000, 900, 180, 19, 200, 69, 2.6, 0.49),
    ("Adult 6+ Maxi", "senior", "large", 27, 14, 4, 6, 3675, 1.1, 0.6, 0.15, 0.12, 2.2, 1.2, 440, None, 16300, 1200, 200, 20, 199, 68, 2.6, 0.48),
    ("Adult All Sizes Appetit Difficile", "adult", "all", 26, 17, 3.5, 7, 3810, 1.3, 0.9, 0.30, 0.13, 2.3, 1.1, None, None, 13600, 900, 175, 19, 191, 67, 2.6, 0.47),
    ("Adult All Sizes Peau Saine", "adult", "all", 28, 18, 4, 7, 3824, 1.3, 0.9, 0.30, 0.11, 2.2, 1.7, 440, None, 14600, 1100, 175, 19, 193, 61, 2.7, 0.44),
]

CAT_ROWS = [
    ("Kitten Aux Poissons", "kitten", 34, 19, 1.5, 8, 4130, 1.3, 0.95, 0.48, 0.12, 3.7, 1.5, 2200, None, 22000, 2000, 220, 23, 164, 105, 2.3, 0.45),
    ("Adult A La Dinde", "adult", 31, 16, 3.5, 7, 3917, 1.2, 0.9, 0.37, 0.12, 3.2, 1.1, 1400, None, 13800, 1200, 125, 16, 116, 70, 1.6, 0.44),
    ("Adult Multi", "adult", 30, 12, 2.5, 7, 3776, 1.2, 0.85, 0.45, 0.11, 3.0, 0.6, 1400, None, 13800, 1200, 125, 17, 111, 70, 1.5, 0.47),
    ("Adult Sterilised Aux Poissons", "adult", 36, 10, 6, 7, 3568, 1.1, 0.85, 0.41, 0.12, 2.1, 0.6, 1700, 50, 17600, 1600, 160, 20, 141, 81, 1.9, 0.46),
    ("Adult Sterilised Aux Poissons Plus", "adult", 36, 10, 6, 7, 3568, 1.1, 0.85, 0.41, 0.13, 2.2, 0.8, 1700, 50, 17600, 1600, 160, 20, 140, 81, 1.9, 0.42),
    ("Adult 8+ Sterilised Au Poulet", "senior", 34, 13, 8, 6, 3631, 1.1, 0.6, 0.30, 0.11, 3.0, 1.0, 1700, 50, 17600, 1600, 160, 21, 144, 87, 1.9, 0.41),
]


def slugify(value: str) -> str:
    import re

    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", value.lower())).strip("-")


def file_uri(path: Path) -> str:
    return path.resolve().as_uri()


def csv_headers() -> list[str]:
    return next(csv.reader([TEMPLATE.read_text(encoding="utf-8").splitlines()[0]]))


def extracted_fields(row: dict[str, str]) -> str:
    return "|".join(
        key
        for key, value in row.items()
        if str(value or "").strip() and key not in {"source_notes"}
    )


def missing_fields(row: dict[str, str]) -> list[str]:
    return [
        field
        for field in [
            "ingredient_text",
            "ingredients",
            "data_source_url",
        ]
        if not str(row.get(field, "")).strip()
    ]


def tags_for(species: str, formula_name: str, life_stage: str, dog_size: str = "") -> tuple[str, str]:
    text = formula_name.lower()
    commercial = [species, "dry", life_stage]
    medical = []
    if dog_size:
        commercial.append(dog_size)
    if "sterilised" in text or "sterilized" in text:
        commercial.append("sterilised")
    if "light" in text:
        commercial.append("weight_control")
        medical.append("obesity")
    if "peau saine" in text:
        commercial.append("skin_coat")
    if "appetit difficile" in text:
        commercial.append("fussy_appetite")
    if "poissons" in text:
        commercial.append("fish")
    if "poulet" in text:
        commercial.append("chicken")
    if "dinde" in text:
        commercial.append("turkey")
    return ";".join(dict.fromkeys(medical)), ";".join(dict.fromkeys(commercial))


def base_row(headers: list[str], species: str, formula_name: str, source: Path) -> dict[str, str]:
    row = dict.fromkeys(headers, "")
    brand = "Prestige"
    row.update(
        {
            "brand": brand,
            "formula_name": formula_name,
            "display_name": f"{brand} {formula_name}",
            "species": species,
            "format": "dry",
            "data_quality_status": "needs_review",
            "data_source_url": file_uri(source),
            "source_priority": "official",
            "source_notes": "; ".join(
                [
                    "market=EU",
                    "basis=as-fed",
                    "source_tier=official_pdf",
                    "source_group=sopral_prestige_pdf_analytic_table",
                    "analytic_table_only=true",
                    "composition_missing_from_pdf_text=true",
                    "vitamin_e_source_unit=UI/kg",
                    "human_qa_required_before_recommendation=true",
                    f"source_document={source.as_posix()}",
                ]
            ),
            "formula_key": f"prestige-{slugify(formula_name)}-{species}-dry-eu-pdf",
            "is_recommendable": "false",
        }
    )
    return row


def fill_nutrients(
    row: dict[str, str],
    protein: float,
    fat: float,
    fiber: float,
    ash: float,
    kcal_kg: int,
    calcium: float,
    phosphorus: float,
    sodium: float,
    magnesium: float,
    omega6: float,
    omega3: float,
    taurine: int | None,
    l_carnitine: int | None,
    vitamin_a: int,
    vitamin_d3: int,
    vitamin_e: int,
    copper: float,
    zinc: float,
    manganese: float,
    iodine: float,
    selenium: float,
) -> None:
    row.update(
        {
            "kcal_per_100g": str(round(kcal_kg / 10, 1)).rstrip("0").rstrip("."),
            "kcal_per_kg": str(kcal_kg),
            "protein_percent": str(protein),
            "fat_percent": str(fat),
            "fiber_percent": str(fiber),
            "ash_percent": str(ash),
            "calcium_percent": str(calcium),
            "phosphorus_percent": str(phosphorus),
            "sodium_percent": str(sodium),
            "magnesium_percent": str(magnesium),
            "omega3_percent": str(omega3),
            "omega6_percent": str(omega6),
            "taurine_mgkg": str(taurine or ""),
            "l_carnitine_mgkg": str(l_carnitine or ""),
            "vitamin_a_iukg": str(vitamin_a),
            "vitamin_d3_iukg": str(vitamin_d3),
            "vitamin_e_mgkg": "",
            "copper_mgkg": str(copper),
            "zinc_mgkg": str(zinc),
            "manganese_mgkg": str(manganese),
            "iodine_mgkg": str(iodine),
            "selenium_mgkg": str(selenium),
        }
    )


def build_rows(headers: list[str]) -> list[dict[str, str]]:
    rows = []
    for values in DOG_ROWS:
        formula_name, life_stage, dog_size, *nutrients = values
        row = base_row(headers, "dog", formula_name, DOG_SOURCE)
        row["life_stage"] = life_stage
        row["dog_size"] = dog_size
        medical_tags, commercial_tags = tags_for("dog", formula_name, life_stage, dog_size)
        row["medical_tags"] = medical_tags
        row["commercial_tags"] = commercial_tags
        fill_nutrients(row, *nutrients)
        rows.append(row)

    for values in CAT_ROWS:
        formula_name, life_stage, *nutrients = values
        row = base_row(headers, "cat", formula_name, CAT_SOURCE)
        row["life_stage"] = life_stage
        medical_tags, commercial_tags = tags_for("cat", formula_name, life_stage)
        row["medical_tags"] = medical_tags
        row["commercial_tags"] = commercial_tags
        fill_nutrients(row, *nutrients)
        rows.append(row)
    return rows


def main() -> None:
    headers = csv_headers()
    rows = build_rows(headers)
    review_rows = []
    for row in rows:
        missing = missing_fields(row)
        review_rows.append(
            {
                "formula_key": row["formula_key"],
                "brand": row["brand"],
                "formula_name": row["formula_name"],
                "species": row["species"],
                "format": row["format"],
                "status": "needs_backfill",
                "source_file": row["source_notes"].split("source_document=")[-1],
                "extracted_fields": extracted_fields(row),
                "missing_fields": "|".join(missing),
                "recommended_action": "Use this as nutrient backfill evidence only. Attach ingredient/composition source before Food V2 commit.",
                "notes": row["source_notes"],
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

    REPORT.write_text(
        "\n".join(
            [
                "# Prestige SOPRAL PDF Analytic Extract",
                "",
                f"Generated: {datetime.now(timezone.utc).isoformat()}",
                "",
                "## Summary",
                "",
                "- Source PDFs scanned: 2",
                f"- Analytic nutrient rows extracted: {len(rows)}",
                f"- Dog rows: {sum(1 for row in rows if row['species'] == 'dog')}",
                f"- Cat rows: {sum(1 for row in rows if row['species'] == 'cat')}",
                "- Importable after QA: 0",
                f"- Needs ingredient/composition backfill: {len(rows)}",
                f"- Output CSV: {OUTPUT}",
                f"- Review CSV: {REVIEW}",
                "",
                "The PDF product pages use broken font encoding in text extraction, but the average analytic tables are readable. Rows are therefore kept as nutrient backfill evidence only until ingredient/composition data is attached.",
            ]
        )
        + "\n",
        encoding="utf-8",
    )

    print(f"Prestige analytic rows: {len(rows)}")
    print(f"Wrote {OUTPUT}")
    print(f"Wrote {REVIEW}")
    print(f"Wrote {REPORT}")


if __name__ == "__main__":
    main()
