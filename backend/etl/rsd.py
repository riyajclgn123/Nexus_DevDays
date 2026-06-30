"""
etl/rsd.py

Parses the 2014-15 Recovery School District (RSD) eligible schools PDF
and loads the data into `rsd_eligible_schools`, tagged as historical.

Source:
  "Louisiana's Call to Action – Recovery School District Opportunities"
  Vintage: 2014-15 school year (based on 2012-13 AUS status data)
  The RSD program was dissolved ~2019; data is ingested strictly as historical
  reference, never displayed as current. The `is_historical=True` flag on both
  the DataSource and every RSD row enforces this contract.

PDF saved at: backend/data/rsd_eligible_schools_2014-15.pdf

The PDF has two sections:
  Page 2  — "RSD Eligible Schools" (already in program, year = 2014-15)
  Pages 3–8 — "Prospectively RSD Eligible Schools" (eligible in future years)

Both sections are ingested. The `vintage` column on each row records the
specific year (2014-15, 2015-16, 2016-17, 2017-18) so consumers can filter
by cohort if needed.

Run:
    cd backend && python -m etl.rsd
"""

import os
import re
import sys

import pdfplumber
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

from database import SessionLocal  # noqa: E402
from models import DataSource, RSDEligibleSchool  # noqa: E402

PDF_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "rsd_eligible_schools_2014-15.pdf"
)

# Soft-hyphen (U+00AD) appears throughout due to PDF typographic hyphens
_SOFTHYPHEN = "­"


def _clean(v) -> str | None:
    if v is None:
        return None
    return str(v).replace(_SOFTHYPHEN, "-").replace("\n", " ").strip() or None


def _year_norm(raw: str) -> str:
    """'2014-\xad‐-15' -> '2014-15' (normalise soft/unicode hyphens to ASCII)"""
    return re.sub(r"[­‐‑‒–-]+", "-", raw).strip()


def _is_year(v) -> bool:
    """Return True if the cell looks like a year range like '2014-15' (with any hyphen variant)."""
    if not v:
        return False
    norm = _year_norm(str(v))
    return bool(re.match(r"^\d{4}-\d{2}$", norm))


def _parse_page2(page) -> list[dict]:
    """
    Page 2: 'RSD Eligible Schools' — already in the RSD program.
    Column layout (22-col table):
      1=school_name, 3=district, 6=grade_config, 12=letter, 15=sps,
      16=enrollment, 17=frl_pct, 18=sped_pct, 19=eligible_year
    """
    rows = []
    for table in page.extract_tables():
        for row in table:
            if not row or len(row) < 20:
                continue
            year_raw = row[19]
            if not _is_year(year_raw):
                continue
            year_raw = _clean(year_raw)
            name = _clean(row[1])
            district = _clean(row[3])
            if not name:
                continue
            rows.append({
                "school_name": name,
                "parish_name": _normalize_parish(district or ""),
                "district": district,
                "vintage": _year_norm(year_raw),
            })
    return rows


def _parse_pages_3_8(pages) -> list[dict]:
    """
    Pages 3–8: 'Prospectively RSD Eligible Schools'.
    Column layout (18-col table):
      0=school_name, 1=district, 2=grade_config, 8=letter, 11=sps,
      12=enrollment, 13=frl_pct, 14=sped_pct, 15=eligible_year
    """
    rows = []
    for page in pages:
        for table in page.extract_tables():
            for row in table:
                if not row or len(row) < 16:
                    continue
                year_raw = row[15]
                if not _is_year(year_raw):
                    continue
                year_raw = _clean(year_raw)
                name = _clean(row[0])
                district = _clean(row[1])
                if not name:
                    continue
                rows.append({
                    "school_name": name,
                    "parish_name": _normalize_parish(district or ""),
                    "district": district,
                    "vintage": _year_norm(year_raw),
                })
    return rows


def _normalize_parish(raw: str) -> str | None:
    """
    'Jefferson Parish' -> 'Jefferson'
    'City of Baker' -> 'East Baton Rouge'  (Baker is within EBR geographically,
       but for school-district purposes we record it as-is)
    'Natchitoches\nParish' -> 'Natchitoches'
    'RSD Direct-Run (Orleans Parish)' -> 'Orleans'
    """
    if not raw:
        return None
    s = raw.replace("\n", " ").strip()
    # Handle "RSD Direct-Run (Some Parish)" pattern
    m = re.search(r"\(([^)]+)\)", s)
    if m:
        s = m.group(1)
    for suffix in [" Parish", " School District", " Community School District"]:
        if s.endswith(suffix):
            s = s[: -len(suffix)]
    # "City of X" — keep as-is since it's the operator name, not the parish
    return s.strip() or None


def parse_rsd_pdf() -> list[dict]:
    with pdfplumber.open(PDF_PATH) as pdf:
        rows = _parse_page2(pdf.pages[1])           # page 2 (0-indexed = 1)
        rows += _parse_pages_3_8(pdf.pages[2:])     # pages 3-8
    return rows


def load_rsd(db, rows):
    source = db.query(DataSource).filter_by(name="RSD Eligible Schools 2014-15").first()
    if not source:
        source = DataSource(
            name="RSD Eligible Schools 2014-15",
            organization="Louisiana Department of Education / Recovery School District",
            url="https://doe.louisiana.gov",
            api_endpoint=None,
            vintage="2014-15",
            is_historical=True,
            notes=(
                "Louisiana's Call to Action — Recovery School District Opportunities. "
                "Vintage 2014-15 (based on 2012-13 AUS accountability data). "
                "The RSD program was dissolved circa 2019. "
                "This data is ingested as historical reference only and must never "
                "be displayed as reflecting current school or district status."
            ),
        )
        db.add(source)
        db.flush()

    inserted = 0
    for r in rows:
        exists = db.query(RSDEligibleSchool).filter_by(
            school_name=r["school_name"], vintage=r["vintage"]
        ).first()
        if not exists:
            db.add(RSDEligibleSchool(
                school_name=r["school_name"],
                parish_name=r["parish_name"],
                district=r["district"],
                vintage=r["vintage"],
                is_historical=True,
                source_id=source.id,
            ))
            inserted += 1

    db.commit()
    return inserted


def main():
    print(f"Parsing {PDF_PATH}…")
    rows = parse_rsd_pdf()
    print(f"Extracted {len(rows)} school entries")

    db = SessionLocal()
    try:
        n = load_rsd(db, rows)
        print(f"Inserted {n} rsd_eligible_schools rows (is_historical=True).")
        print(f"Total: {db.query(RSDEligibleSchool).count()} rows in rsd_eligible_schools")
    finally:
        db.close()


if __name__ == "__main__":
    main()
