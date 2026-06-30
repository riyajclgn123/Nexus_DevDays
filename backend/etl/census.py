"""
etl/census.py

Pulls real demographic data from the Census Bureau's ACS 5-year API for all
64 Louisiana parishes and loads it into the `census_acs` table, tagged with
a `data_sources` row so every value is traceable.

Variable codes are confirmed against the live ACS5 2020-2024 vintage
/variables.html for state:22 (Louisiana) county-level detail tables. Only
population, median household income, and poverty rate are pulled — these
are the only fields backed by `census_acs` columns right now. Race/education
breakdowns from the original reference script were dropped rather than
guessed in, since this project's schema doesn't carry them yet.

Run:
    cd backend && python -m etl.census
"""

import os
import sys

import requests
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

from database import SessionLocal  # noqa: E402
from models import CensusACS, DataSource  # noqa: E402

LA_STATE_FIPS = "22"
ACS_VINTAGE = "2024"           # 2020-2024 ACS 5-year, latest available vintage
ACS_VINTAGE_LABEL = "2020-2024"

ACS_VARS = {
    "B01003_001E": "population",
    "B19013_001E": "median_hh_income",
    "B17001_001E": "poverty_universe",
    "B17001_002E": "poverty_below",   # below poverty -> poverty_rate = below / universe
}


def fetch_census_acs():
    base = f"https://api.census.gov/data/{ACS_VINTAGE}/acs/acs5"
    get_cols = ",".join(["NAME", *ACS_VARS.keys()])
    key = os.environ["CENSUS_API_KEY"]
    url = f"{base}?get={get_cols}&for=county:*&in=state:{LA_STATE_FIPS}&key={key}"

    r = requests.get(url, timeout=60)
    r.raise_for_status()
    rows = r.json()
    header, *data = rows
    idx = {col: i for i, col in enumerate(header)}

    out = []
    for row in data:
        def num(code):
            v = row[idx[code]]
            return float(v) if v not in (None, "", "-666666666") else None

        pop = num("B01003_001E")
        pov_u = num("B17001_001E")
        pov_b = num("B17001_002E")
        median_income = num("B19013_001E")

        # "Acadia Parish, Louisiana" -> "Acadia" (matches existing Parish.name convention)
        raw_name = row[idx["NAME"]]
        parish_name = raw_name.replace(" Parish, Louisiana", "")

        out.append({
            "parish_name": parish_name,
            "fips": LA_STATE_FIPS + row[idx["county"]],
            "population": int(pop) if pop else None,
            "median_income": int(median_income) if median_income else None,
            "poverty_rate": round(100 * pov_b / pov_u, 1) if pov_u else None,
        })
    return out


def load_census(db, rows):
    source = db.query(DataSource).filter_by(name=f"Census ACS5 {ACS_VINTAGE_LABEL}").first()
    if not source:
        source = DataSource(
            name=f"Census ACS5 {ACS_VINTAGE_LABEL}",
            organization="U.S. Census Bureau",
            url="https://www.census.gov/programs-surveys/acs",
            api_endpoint=f"https://api.census.gov/data/{ACS_VINTAGE}/acs/acs5",
            vintage=ACS_VINTAGE_LABEL,
            is_historical=False,
            notes="ACS 5-year estimates, county-level (Louisiana parishes).",
        )
        db.add(source)
        db.flush()

    import datetime
    source.retrieved_at = datetime.datetime.now(datetime.timezone.utc)

    for r in rows:
        existing = db.query(CensusACS).filter_by(parish_name=r["parish_name"], year=int(ACS_VINTAGE)).first()
        if existing:
            existing.fips = r["fips"]
            existing.median_income = r["median_income"]
            existing.poverty_rate = r["poverty_rate"]
            existing.population = r["population"]
            existing.source_id = source.id
        else:
            db.add(CensusACS(
                parish_name=r["parish_name"],
                fips=r["fips"],
                year=int(ACS_VINTAGE),
                median_income=r["median_income"],
                poverty_rate=r["poverty_rate"],
                population=r["population"],
                source_id=source.id,
            ))
    db.commit()
    return len(rows)


def main():
    rows = fetch_census_acs()
    print(f"Fetched {len(rows)} parishes from Census ACS5 {ACS_VINTAGE_LABEL}")
    if len(rows) != 64:
        print(f"WARNING: expected 64 Louisiana parishes, got {len(rows)}")

    db = SessionLocal()
    try:
        n = load_census(db, rows)
        print(f"Loaded {n} census_acs rows, tagged with data_sources id.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
