"""
routers/ml.py — ML prediction endpoints for EduPulse.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from ml.predict import (
    predict_enrollment,
    predict_investment_score,
    predict_risk_score,
    predict_statewide_enrollment,
)

ml_router = APIRouter(prefix="/ml", tags=["ml-predictions"])


@ml_router.get("/forecast/statewide")
def get_statewide_forecast(
    years: int = Query(6, ge=1, le=10),
    db: Session = Depends(get_db)
):
    """Runs enrollment forecast for all parishes."""
    return predict_statewide_enrollment(db, years_ahead=years)


@ml_router.get("/forecast/{parish_name}")
def get_enrollment_forecast(
    parish_name: str,
    years: int = Query(6, ge=1, le=10),
    db: Session = Depends(get_db)
):
    """Returns enrollment forecast for a specific parish (2025–2030+)."""
    return predict_enrollment(db, parish_name, years_ahead=years)


@ml_router.get("/investment/{parish_name}")
def get_investment_score(parish_name: str, db: Session = Depends(get_db)):
    """Returns ML investment opportunity score for a parish."""
    return predict_investment_score(db, parish_name)


@ml_router.get("/risk/{parish_name}")
def get_risk_score(parish_name: str, db: Session = Depends(get_db)):
    """Returns ML risk classification for a parish."""
    return predict_risk_score(db, parish_name)
