import csv
import math
from functools import lru_cache
from pathlib import Path


LMS_DIR = Path(__file__).resolve().parents[2] / "data" / "who_lms_tables"


def calculate_zscore_from_lms(value: float, l: float, m: float, s: float) -> float:
    if m <= 0 or s <= 0:
        raise ValueError("Invalid LMS parameters")
    if l == 0:
        return math.log(value / m) / s
    return ((value / m) ** l - 1) / (l * s)


@lru_cache(maxsize=32)
def load_lms_table(filename: str, key_field: str) -> list[dict]:
    path = LMS_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Missing LMS table: {path}")

    with path.open("r", newline="") as handle:
        reader = csv.DictReader(handle)
        rows = []
        for row in reader:
            rows.append(
                {
                    key_field: float(row[key_field]),
                    "L": float(row["L"]),
                    "M": float(row["M"]),
                    "S": float(row["S"]),
                }
            )
    if not rows:
        raise ValueError(f"LMS table is empty: {path}")
    return rows


def _nearest_row(rows: list[dict], key_field: str, key_value: float) -> dict:
    return min(rows, key=lambda r: abs(r[key_field] - key_value))


def calculate_z_scores(age_months: int, weight_kg: float, height_cm: float, gender: str) -> dict:
    gender_key = "female" if gender.lower().startswith("f") else "male"

    wfa_rows = load_lms_table(f"wfa_{gender_key}.csv", "age_months")
    hfa_rows = load_lms_table(f"hfa_{gender_key}.csv", "age_months")
    wfh_rows = load_lms_table(f"wfh_{gender_key}.csv", "length_cm")

    wfa = _nearest_row(wfa_rows, "age_months", float(age_months))
    hfa = _nearest_row(hfa_rows, "age_months", float(age_months))
    wfh = _nearest_row(wfh_rows, "length_cm", float(height_cm))

    return {
        "waz": calculate_zscore_from_lms(weight_kg, wfa["L"], wfa["M"], wfa["S"]),
        "haz": calculate_zscore_from_lms(height_cm, hfa["L"], hfa["M"], hfa["S"]),
        "whz": calculate_zscore_from_lms(weight_kg, wfh["L"], wfh["M"], wfh["S"]),
    }
