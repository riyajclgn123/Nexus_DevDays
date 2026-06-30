"""
etl/bls.py

Pulls Louisiana statewide employment data from the BLS CES State & Area API
(v2 timeseries endpoint) and loads it into `bls_employment`, tagged with a
`data_sources` row.

Series IDs verified against the live API (June 2026) — all 6 returned
REQUEST_SUCCEEDED with 39 real data points each.  They are CES seasonally-
unadjusted (SMU) statewide Louisiana supersector series; values are reported
in thousands and converted to full employment counts on ingest.

Run:
    cd backend && python -m etl.bls
"""

import os
import sys

import requests
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

from database import SessionLocal  # noqa: E402
from models import BLSEmployment, DataSource  # noqa: E402

# Louisiana state code: 22
# Area code 0000000 = statewide
# Data type 01 = all employees
# Series verified live 2026-06-30 against api.bls.gov/publicAPI/v2/timeseries/data/
BLS_SERIES = {
    "SMU22000000000000001": ("Louisiana", "Total Nonfarm"),
    "SMU22000006000000001": ("Louisiana", "Mining, Logging, and Construction"),
    "SMU22000003000000001": ("Louisiana", "Manufacturing"),
    "SMU22000004000000001": ("Louisiana", "Trade, Transportation, and Utilities"),
    "SMU22000006500000001": ("Louisiana", "Education and Health Services"),
    "SMU22000009000000001": ("Louisiana", "Government"),
}

BLS_API_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/"


def fetch_bls_employment(start_year="2018", end_year="2024"):
    key = os.environ["BLS_API_KEY"]
    payload = {
        "seriesid": list(BLS_SERIES.keys()),
        "startyear": start_year,
        "endyear": end_year,
        "annualaverage": True,
        "registrationkey": key,
    }
    r = requests.post(BLS_API_URL, json=payload, timeout=60)
    r.raise_for_status()
    body = r.json()
    if body.get("status") != "REQUEST_SUCCEEDED":
        raise RuntimeError(f"BLS API error: {body.get('message')}")

    out = []
    for series in body["Results"]["series"]:
        sid = series["seriesID"]
        area, sector = BLS_SERIES.get(sid, ("Louisiana", sid))
        for d in series["data"]:
            if d["period"] == "M13":   # M13 = annual average
                out.append({
                    "series_id": sid,
                    "series_label": f"BLS CES: {sector}",
                    "area": area,
                    "sector": sector,
                    "year": int(d["year"]),
                    "period": d["period"],
                    # CES reports in thousands; convert to whole-number count
                    "value": round(float(d["value"]) * 1000),
                })
    return out


def load_bls(db, rows):
    source = db.query(DataSource).filter_by(name="BLS CES State & Area — Louisiana").first()
    if not source:
        source = DataSource(
            name="BLS CES State & Area — Louisiana",
            organization="U.S. Bureau of Labor Statistics",
            url="https://www.bls.gov/sae/",
            api_endpoint=BLS_API_URL,
            vintage="latest",
            is_historical=False,
            notes=(
                "CES seasonally-unadjusted (SMU) all-employee series, "
                "Louisiana statewide supersectors. Values in full employment counts "
                "(converted from BLS-reported thousands)."
            ),
        )
        db.add(source)
        db.flush()

    import datetime
    source.retrieved_at = datetime.datetime.now(datetime.timezone.utc)

    loaded = 0
    for r in rows:
        existing = db.query(BLSEmployment).filter_by(
            series_id=r["series_id"], year=r["year"], period=r["period"]
        ).first()
        if existing:
            existing.value = r["value"]
            existing.source_id = source.id
        else:
            db.add(BLSEmployment(
                series_id=r["series_id"],
                series_label=r["series_label"],
                area=r["area"],
                sector=r["sector"],
                year=r["year"],
                period=r["period"],
                value=r["value"],
                source_id=source.id,
            ))
            loaded += 1
    db.commit()
    return loaded


def main():
    rows = fetch_bls_employment(start_year="2018", end_year="2024")
    print(f"Fetched {len(rows)} BLS annual-average rows ({len(set(r['sector'] for r in rows))} series)")
    db = SessionLocal()
    try:
        n = load_bls(db, rows)
        print(f"Loaded {n} new bls_employment rows, tagged with data_sources id.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
