"""
etl/school_sps.py

Downloads LDOE school-level SPS xlsx and computes parish-level aggregates
for parishes absent from the district-level file.

Currently handles:
  - Orleans Parish: aggregates average SPS across all Orleans charter schools
    (Orleans has no single district-level SPS — all schools are independently chartered)

Source:
  2025 School Performance Scores
  https://doe.louisiana.gov/docs/default-source/data-management/2025-school-performance-scores.xlsx

Run:
    cd backend && python -m etl.school_sps
"""

import io
import os
import sys
from collections import Counter

import pandas as pd
import requests
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from database import SessionLocal  # noqa: E402
from models import DataSource, Parish  # noqa: E402
from datetime import datetime, timezone

SCHOOL_SPS_URL = "https://doe.louisiana.gov/docs/default-source/data-management/2025-school-performance-scores.xlsx"

# Column positions (0-indexed) confirmed from header row (header=3 in xlsx)
COL_SYSTEM     = 2   # School System
COL_GRADE_25   = 4   # 2025 Letter Grade
COL_SPS_25     = 5   # 2025 SPS
COL_SPS_24     = 7   # 2024 SPS

# Parishes absent from district-level SPS file → compute from school-level
SCHOOL_LEVEL_PARISHES = {
    "Orleans": "Orleans",  # LDOE name fragment → Parish.name in DB
}


def _safe_float(v):
    try:
        f = float(str(v).replace(">", "").strip())
        return None if str(f) == "nan" else round(f, 1)
    except (TypeError, ValueError):
        return None


def parse_school_sps() -> pd.DataFrame:
    r = requests.get(SCHOOL_SPS_URL, timeout=60, headers={"User-Agent": "Mozilla/5.0"})
    r.raise_for_status()
    df = pd.read_excel(io.BytesIO(r.content), header=3)
    return df


def aggregate_by_parish(df: pd.DataFrame, ldoe_name_fragment: str) -> dict:
    """Return avg SPS25, avg SPS24, mode grade for schools in a given system."""
    mask    = df.iloc[:, COL_SYSTEM].astype(str).str.contains(ldoe_name_fragment, na=False, case=False)
    schools = df[mask].copy()
    n = len(schools)

    sps25  = [x for x in [_safe_float(v) for v in schools.iloc[:, COL_SPS_25]] if x is not None]
    sps24  = [x for x in [_safe_float(v) for v in schools.iloc[:, COL_SPS_24]] if x is not None]
    grades = [str(v).strip() for v in schools.iloc[:, COL_GRADE_25]
              if str(v).strip() not in ("nan", "NaN", "")]

    avg25 = round(sum(sps25) / len(sps25), 1) if sps25 else None
    avg24 = round(sum(sps24) / len(sps24), 1) if sps24 else None
    mode_grade = Counter(grades).most_common(1)[0][0] if grades else None

    trend = None
    if avg25 and avg24:
        delta = avg25 - avg24
        trend = "Improving" if delta > 1 else "Declining" if delta < -1 else "Stable"

    return {
        "n_schools": n,
        "sps":       avg25,
        "sps_prior": avg24,
        "grade":     mode_grade,
        "trend":     trend,
    }


def load_school_sps(db):
    print("Downloading school-level SPS xlsx…")
    df = parse_school_sps()
    print(f"  {len(df)} school rows loaded")

    source = db.query(DataSource).filter_by(name="LDOE School Performance Scores 2025").first()
    if not source:
        source = DataSource(
            name="LDOE School Performance Scores 2025",
            organization="Louisiana Department of Education",
            url=SCHOOL_SPS_URL,
            vintage="2024-25",
            is_historical=False,
            notes="School-level SPS file. Used to derive district aggregates for parishes absent from district file (e.g. Orleans).",
            retrieved_at=datetime.now(timezone.utc),
        )
        db.add(source)
        db.flush()

    updated = []
    for ldoe_frag, parish_name in SCHOOL_LEVEL_PARISHES.items():
        agg = aggregate_by_parish(df, ldoe_frag)
        print(f"  {parish_name}: {agg}")

        p = db.query(Parish).filter(Parish.name == parish_name).first()
        if p and agg["sps"]:
            p.sps   = agg["sps"]
            p.grade = agg["grade"]
            p.trend = agg["trend"]
            # Graduation: don't derive from school-level (includes non-HS schools)
            p.data_source = (
                f"LDOE FY2024-25 school-level avg ({agg['n_schools']} {parish_name} charter schools)"
            )
            updated.append(parish_name)

    db.commit()
    return updated


def main():
    db = SessionLocal()
    try:
        updated = load_school_sps(db)
        print(f"Updated parishes from school-level SPS: {updated}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
