"""
etl/backfill_census.py

Joins census_acs data into the parishes table, filling in poverty, enrollment
(population), and derived fields (gap classification, funding_need).

City school districts that don't have their own Census county use the parent
parish's demographics — this is documented in the data_source field on each row.

Derivation formulas (transparent, per brief's "no fabrication" requirement):
  funding_need ($M) = poverty_rate * population_under18 * $4500 / 1_000_000
                    ≈ estimated gap-to-adequacy per at-risk student × count
    Since population_under18 is unavailable yet (census_acs schema reserves it),
    we approximate: under18 ≈ population * 0.22 (national avg school-age fraction).
    This is labeled as a derivation, not presented as a precise figure.

  gap classification:
    poverty_rate >=25 → Critical
    poverty_rate >=20 → High
    poverty_rate >=15 → Moderate
    else             → Low

Run:
    cd backend && python -m etl.backfill_census
"""

import os
import sys

from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

from database import SessionLocal  # noqa: E402
from models import CensusACS, MetricProvenance, DataSource, Parish  # noqa: E402

# City school districts that share a county with their parent parish
CITY_DISTRICT_PARISH_MAP = {
    "City of Monroe":        "Ouachita",
    "City of Bogalusa":      "Washington",
    "Zachary Community":     "East Baton Rouge",
    "City of Baker":         "East Baton Rouge",
    "Central Community":     "East Baton Rouge",
}

# Census name diverges from LDOE name for one parish
CENSUS_NAME_REMAP = {
    "DeSoto": "De Soto",
}

UNDER18_FRACTION = 0.22   # national avg fraction of population aged 5-17
ADEQUACY_GAP_PER_STUDENT = 4500   # dollars; simplified stand-in for gap-to-adequacy


def _gap_class(poverty_rate: float) -> str:
    if poverty_rate >= 25:
        return "Critical"
    if poverty_rate >= 20:
        return "High"
    if poverty_rate >= 15:
        return "Moderate"
    return "Low"


def _funding_need(poverty_rate: float, population: int) -> float:
    """Estimated funding gap in $M. Labeled as a derived estimate."""
    if not poverty_rate or not population:
        return None
    under18 = population * UNDER18_FRACTION
    at_risk = under18 * (poverty_rate / 100)
    return round(at_risk * ADEQUACY_GAP_PER_STUDENT / 1_000_000, 1)


def backfill(db):
    census_by_name = {c.parish_name: c for c in db.query(CensusACS).all()}
    parishes = db.query(Parish).all()

    census_source = db.query(DataSource).filter_by(name="Census ACS5 2020-2024").first()
    source_label = "Census ACS5 2020-2024" if census_source else "Census ACS5 (estimate)"

    updated = 0
    skipped = []

    for parish in parishes:
        # Resolve the Census row to use
        lookup_name = CENSUS_NAME_REMAP.get(parish.name, parish.name)
        if lookup_name not in census_by_name:
            lookup_name = CITY_DISTRICT_PARISH_MAP.get(parish.name)
        if not lookup_name or lookup_name not in census_by_name:
            skipped.append(parish.name)
            continue

        c = census_by_name[lookup_name]
        uses_parent = (parish.name in CITY_DISTRICT_PARISH_MAP)

        parish.poverty = c.poverty_rate
        parish.gap = _gap_class(c.poverty_rate) if c.poverty_rate else None

        # City school districts share a county with their parent parish, so the
        # parent's total population is not meaningful as their enrollment.
        # Leave enrollment/funding_need null — they need their own school-level
        # enrollment data (LDOE enrollment xlsx) to compute accurately.
        if not uses_parent:
            parish.enrollment = round(c.population * UNDER18_FRACTION) if c.population else None
            parish.funding_need = _funding_need(c.poverty_rate, c.population)
        else:
            parish.enrollment = None
            parish.funding_need = None

        src_note = source_label
        if uses_parent:
            src_note += f" (via {lookup_name} Parish)"
        # Preserve existing LDOE data_source note, append census attribution
        if parish.data_source and "Census" not in parish.data_source:
            parish.data_source = parish.data_source + f"; {src_note}"
        elif not parish.data_source:
            parish.data_source = src_note

        # Record provenance for poverty and enrollment
        if census_source:
            for col, deriv in [
                ("poverty", "poverty_below / poverty_universe * 100 (B17001_002E / B17001_001E)"),
                ("enrollment", f"population * {UNDER18_FRACTION} (estimated school-age fraction of Census B01003_001E)"),
                ("funding_need", f"poverty_rate * population * {UNDER18_FRACTION} * {ADEQUACY_GAP_PER_STUDENT} / 1e6"),
            ]:
                prov = db.query(MetricProvenance).filter_by(
                    table_name="parishes", row_identifier=parish.name, column_name=col
                ).first()
                if not prov:
                    db.add(MetricProvenance(
                        source_id=census_source.id,
                        table_name="parishes",
                        row_identifier=parish.name,
                        column_name=col,
                        derivation=deriv,
                        is_projected=False,
                    ))

        updated += 1

    db.commit()
    return updated, skipped


def main():
    db = SessionLocal()
    try:
        updated, skipped = backfill(db)
        print(f"Updated {updated} parishes with real Census demographics.")
        if skipped:
            print(f"Skipped (no Census match): {skipped}")

        # Quick verification
        from models import Parish
        nulls = db.query(Parish).filter(Parish.poverty == None).count()
        print(f"Parishes still missing poverty data: {nulls}")
        prov_count = db.query(MetricProvenance).count()
        print(f"metric_provenance rows: {prov_count}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
