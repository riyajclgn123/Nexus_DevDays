"""
routers/metrics.py

State-level metrics endpoints.
These power the overview cards at the top of each dashboard.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import StateMetric, SPSHistory, ProficiencyByGrade, Parish
from schemas import StateSummaryResponse, SPSHistoryResponse, ProficiencyResponse
from typing import List

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/summary", response_model=StateSummaryResponse)
def get_state_summary(db: Session = Depends(get_db)):
    """
    Returns the main state summary object used by all three dashboards.
    Combines all key metrics into one response.
    """
    # Helper to get a metric value by key
    def get_val(key: str, default=0):
        m = db.query(StateMetric).filter(StateMetric.key == key).first()
        return m.value if m and m.value is not None else default

    def get_str(key: str, default=""):
        m = db.query(StateMetric).filter(StateMetric.key == key).first()
        return m.value_str if m and m.value_str else default

    return StateSummaryResponse(
        sps_score        = get_val("sps_score", 80.2),
        sps_grade        = get_str("sps_grade", "B"),
        sps_trend        = "+1.7",
        graduation_rate  = get_val("graduation_rate", 83.2),
        enrollment_total = int(get_val("enrollment_total", 686000)),
        poverty_rate     = get_val("poverty_rate", 18.7),
        child_poverty    = get_val("child_poverty", 25.2),
        median_income    = int(get_val("median_income", 60986)),
        bachelors_rate   = get_val("bachelors_rate", 27.8),
        employment_rate  = get_val("employment_rate", 56.4),
        chronic_absence  = get_val("chronic_absence", 25.0),
        schools_a        = int(get_val("schools_a", 21)),
        schools_b        = int(get_val("schools_b", 31)),
        schools_c        = int(get_val("schools_c", 32)),
        schools_d        = int(get_val("schools_d", 12)),
        schools_f        = int(get_val("schools_f", 4)),
        source           = "LDOE 2024 / 2025, US Census ACS 2024",
    )


@router.get("/sps-history", response_model=List[SPSHistoryResponse])
def get_sps_history(db: Session = Depends(get_db)):
    """
    Returns the statewide SPS score trend over years.
    Used for the trend line chart on the Policymaker dashboard.
    """
    return db.query(SPSHistory).order_by(SPSHistory.year.asc()).all()


@router.get("/proficiency", response_model=List[ProficiencyResponse])
def get_proficiency_by_grade(db: Session = Depends(get_db)):
    """Returns LEAP mastery rates by grade band."""
    return db.query(ProficiencyByGrade).order_by(ProficiencyByGrade.id.asc()).all()


@router.get("/parish/{parish_name}")
def get_parish_metrics(parish_name: str, db: Session = Depends(get_db)):
    """Returns all metrics for a single parish — used by the Operator market analysis panel."""
    parish = db.query(Parish).filter(Parish.name.ilike(f"%{parish_name}%")).first()
    if not parish:
        raise HTTPException(status_code=404, detail=f"Parish '{parish_name}' not found")
    return {
        "name":         parish.name,
        "sps":          parish.sps,
        "grade":        parish.grade,
        "enrollment":   parish.enrollment,
        "growth":       parish.growth,
        "gap":          parish.gap,
        "graduation":   parish.graduation,
        "proficiency":  parish.proficiency,
        "poverty":      parish.poverty,
        "funding_need": parish.funding_need,
        "workforce":    parish.workforce,
        "trend":        parish.trend,
        "data_source":  parish.data_source,
    }
