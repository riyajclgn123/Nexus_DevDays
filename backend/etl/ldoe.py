"""
etl/ldoe.py

Downloads and parses official Louisiana Department of Education district
performance score xlsx files, then upserts real data into the `parishes`
table for all 64 Louisiana parishes plus independent city school districts.

Sources (direct download links confirmed 2026-06-30 against doe.louisiana.gov):
  FY2024-25 district SPS: 2025-district-performance-scores.xlsx
  FY2023-24 district SPS: 2024-district-performance-scores.xlsx

Column positions confirmed by reading the xlsx header rows:
  0  = School System Code
  1  = School System Name
  2  = 2025 Letter Grade   (FY2024-25)
  3  = 2025 DPS            (District Performance Score, 0-150)
  4  = 2024 Letter Grade   (FY2023-24)
  5  = 2024 DPS
  11 = 2025 K8 & HS Assessment Index (LEAP / ELPT proxy, 0-150)
  23 = Cohort Graduation Actual Rate (2023-24 + 2024-25 cohort, %)
  36 = Cohort Graduation Actual Rate (2022-23 cohort, prior year %)

Orleans Parish (system code 036) is NOT in the published district SPS
file — it is handled separately by LDOE because Orleans operates entirely
through independent charter operators. Those schools appear individually
in the school-level SPS file, not as a single district. Rows for Orleans
are left as-is (existing seed data) until school-level parsing is added.

Run:
    cd backend && python -m etl.ldoe
"""

import io
import os
import sys

import pandas as pd
import requests
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

from database import SessionLocal  # noqa: E402
from models import DataSource, Parish  # noqa: E402

LDOE_URLS = {
    "2025": "https://doe.louisiana.gov/docs/default-source/data-management/2025-district-performance-scores.xlsx",
    "2024": "https://doe.louisiana.gov/docs/default-source/data-management/2024-district-performance-scores.xlsx",
}

# Column positions (0-indexed) in the downloaded xlsx, confirmed by inspection.
# Header is in row index 3 of the raw file; we read with header=3.
COL_SYS_CODE = "School System Code"
COL_SYS_NAME = "School System Name"
COL_GRADE_25 = "2025 Letter Grade "
COL_DPS_25   = "2025 DPS "
COL_GRADE_24 = "2024 Letter Grade "
COL_DPS_24   = "2024 DPS "
# Multiline column names as pandas reads them after stripping
COL_ASSESS_25 = 11   # 2025 K8 & HS Assessment Index (position index, easier than multiline str)
COL_GRAD_25   = 23   # Cohort Graduation Actual Rate (2023-24 + 2024-25 cohort)
COL_GRAD_24   = 36   # Cohort Graduation Actual Rate (2022-23 cohort)


def _fetch_xlsx(url: str) -> pd.DataFrame:
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    df = pd.read_excel(io.BytesIO(r.content), header=3)
    # Filter to rows with a numeric system code (removes total/blank rows)
    df = df[pd.to_numeric(df.iloc[:, 0], errors="coerce").notna()].copy()
    df.iloc[:, 0] = df.iloc[:, 0].astype(str).str.zfill(3)
    return df


def _clean_name(raw: str) -> str:
    """Strip ' Parish' and ' School District' suffixes to match Parish.name convention."""
    name = str(raw).strip()
    for suffix in [" Parish", " School District", " Community School District"]:
        if name.endswith(suffix):
            name = name[: -len(suffix)]
    return name


def parse_districts():
    df25 = _fetch_xlsx(LDOE_URLS["2025"])

    out = []
    for _, row in df25.iterrows():
        sys_code = row.iloc[0]
        raw_name = row.iloc[1]
        if not isinstance(raw_name, str):
            continue

        # Orleans (036) is absent from district SPS — skip gracefully
        if sys_code == "036":
            continue

        def safe_float(v):
            try:
                f = float(v)
                return None if f != f else round(f, 1)   # NaN check
            except (TypeError, ValueError):
                return None

        name = _clean_name(raw_name)
        sps_2025 = safe_float(row.iloc[3])
        grade_2025 = str(row.iloc[2]).strip() if pd.notna(row.iloc[2]) else None
        sps_2024 = safe_float(row.iloc[5])
        grade_2024 = str(row.iloc[4]).strip() if pd.notna(row.iloc[4]) else None
        assessment_idx = safe_float(row.iloc[COL_ASSESS_25])
        graduation = safe_float(row.iloc[COL_GRAD_25])

        # Proficiency: normalize assessment index from 0-150 scale to 0-100 %
        proficiency_pct = round(assessment_idx / 1.5, 1) if assessment_idx else None

        # SPS trend relative to prior year
        if sps_2025 and sps_2024:
            delta = sps_2025 - sps_2024
            if delta > 1.0:
                trend = "Improving"
            elif delta < -1.0:
                trend = "Declining"
            else:
                trend = "Stable"
        else:
            trend = None

        out.append({
            "sys_code": sys_code,
            "name": name,
            "sps": sps_2025,
            "grade": grade_2025,
            "sps_prior": sps_2024,
            "grade_prior": grade_2024,
            "graduation": graduation,
            "proficiency": proficiency_pct,
            "assessment_index": assessment_idx,
            "trend": trend,
        })
    return out


def load_ldoe(db, rows):
    source = db.query(DataSource).filter_by(name="LDOE District Performance Scores 2025").first()
    if not source:
        source = DataSource(
            name="LDOE District Performance Scores 2025",
            organization="Louisiana Department of Education",
            url="https://doe.louisiana.gov/data-and-reports/performance-scores",
            api_endpoint=LDOE_URLS["2025"],
            vintage="2024-25",
            is_historical=False,
            notes=(
                "Official FY2024-25 district performance scores released 2025-11-20. "
                "Proficiency column derived as assessment_index / 1.5 (normalized to 100-pt scale). "
                "Orleans Parish (sys 036) absent from district file; uses school-level data separately."
            ),
        )
        db.add(source)
        db.flush()

    import datetime
    source.retrieved_at = datetime.datetime.now(datetime.timezone.utc)

    inserted, updated = 0, 0
    skipped = []

    for r in rows:
        if r["sps"] is None:
            skipped.append(r["name"])
            continue

        existing = db.query(Parish).filter(Parish.name == r["name"]).first()
        if existing:
            existing.sps = r["sps"]
            existing.grade = r["grade"]
            existing.graduation = r["graduation"]
            existing.proficiency = r["proficiency"]
            existing.trend = r["trend"]
            existing.data_source = f"LDOE FY2024-25 official (released 2025-11-20)"
            updated += 1
        else:
            # New parish row — insert with LDOE data; Census fields (poverty etc.)
            # will be backfilled in a later pass that joins census_acs by parish_name.
            db.add(Parish(
                name=r["name"],
                sps=r["sps"],
                grade=r["grade"],
                graduation=r["graduation"],
                proficiency=r["proficiency"],
                trend=r["trend"],
                data_source="LDOE FY2024-25 official (released 2025-11-20)",
                # Placeholders — Census backfill run fills these
                enrollment=None,
                growth=None,
                gap=None,
                poverty=None,
                funding_need=None,
                workforce=None,
            ))
            inserted += 1

    db.commit()
    return inserted, updated, skipped


def main():
    print("Fetching LDOE district SPS xlsx…")
    rows = parse_districts()
    print(f"Parsed {len(rows)} districts")

    db = SessionLocal()
    try:
        ins, upd, skipped = load_ldoe(db, rows)
        print(f"Inserted {ins} new parish rows, updated {upd} existing rows.")
        if skipped:
            print(f"Skipped (no SPS score): {skipped}")
        print(f"Total parishes now: {db.query(Parish).count()}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
