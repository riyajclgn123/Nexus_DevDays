"""
etl/workforce.py

Derives workforce_gaps rows from real BLS CES Louisiana data already loaded
into bls_employment.

Design choices (no-fabrication requirement):
  - demand  = actual 2024 annual employment (BLS CES annual average, period M13)
              This is current sector size, NOT a 2028 projection.
              Column label in UI should read "Current Employment (2024)".
  - supply  = NULL — graduate pipeline data not yet sourced; requires LDOE
              CTE/workforce credential data (separate ingest pass).
  - gap     = NULL — can't compute without supply.
  - growth_pct = real YoY % change 2023→2024, rounded to 1 decimal.

BLS series mapped to sectors (6 supersectors in bls_employment):
  Total Nonfarm         → overall (not inserted as a row — it's the sum)
  Ed & Health Services  → "Education & Health"
  Government            → "Government"
  Manufacturing         → "Manufacturing"
  Mining/Logging/Const. → "Construction & Trades"
  Trade/Trans/Utilities → "Trade, Transportation & Utilities"

Run:
    cd backend && python -m etl.workforce
"""

import os
import sys

from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from database import SessionLocal  # noqa: E402
from models import BLSEmployment, DataSource, WorkforceGap  # noqa: E402

# Maps BLS series_label (partial match) → display sector name for workforce_gaps
SECTOR_MAP = [
    ("Education and Health Services",       "Education & Health"),
    ("Government",                          "Government"),
    ("Manufacturing",                       "Manufacturing"),
    ("Mining, Logging, and Construction",   "Construction & Trades"),
    ("Trade, Transportation, and Utilities","Trade, Transport & Utilities"),
]


def _get_annual(db, label_fragment: str, year: int):
    row = (
        db.query(BLSEmployment)
        .filter(
            BLSEmployment.series_label.ilike(f"%{label_fragment}%"),
            BLSEmployment.year == year,
            BLSEmployment.period == "M13",
        )
        .first()
    )
    return row.value if row else None


def build_workforce_gaps(db):
    source = db.query(DataSource).filter_by(name="BLS CES Louisiana 2018-2024").first()
    if not source:
        source = db.query(DataSource).filter(
            DataSource.name.ilike("%BLS%Louisiana%")
        ).first()

    db.query(WorkforceGap).delete()
    db.flush()

    inserted = 0
    for bls_fragment, sector_name in SECTOR_MAP:
        emp_2024 = _get_annual(db, bls_fragment, 2024)
        emp_2023 = _get_annual(db, bls_fragment, 2023)

        if emp_2024 is None:
            print(f"  SKIP (no 2024 data): {sector_name}")
            continue

        if emp_2024 and emp_2023:
            pct = (emp_2024 - emp_2023) / emp_2023 * 100
            growth_str = f"+{pct:.1f}%" if pct >= 0 else f"{pct:.1f}%"
        else:
            growth_str = "N/A"

        db.add(WorkforceGap(
            sector=sector_name,
            demand=int(emp_2024),
            supply=None,
            gap=None,
            growth_pct=growth_str,
        ))
        print(f"  {sector_name}: {int(emp_2024):,} jobs  ({growth_str} YoY)")
        inserted += 1

    db.commit()
    return inserted


def main():
    db = SessionLocal()
    try:
        n = build_workforce_gaps(db)
        print(f"\nInserted {n} workforce_gap rows from real BLS CES 2024 data.")
        print("Note: demand = actual 2024 employment; supply/gap = null (pipeline data pending)")
    finally:
        db.close()


if __name__ == "__main__":
    main()
