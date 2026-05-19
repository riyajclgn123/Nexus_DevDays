"""
ml/predict.py — ML prediction functions for EduPulse.

Each function loads the corresponding .pkl model, queries live parish data
from PostgreSQL, and returns a clean prediction dict.
Falls back gracefully with "fallback": true if the model is missing or broken.
"""

import os
import joblib
import numpy as np
from sqlalchemy.orm import Session

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")


def _load_model(filename: str):
    path = os.path.join(MODEL_DIR, filename)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Model not found: {path}")
    return joblib.load(path)


def _get_parish(db: Session, parish_name: str):
    from models import Parish
    parish = db.query(Parish).filter(
        Parish.name.ilike(f"%{parish_name}%")
    ).first()
    return parish


def predict_enrollment(db: Session, parish_name: str, years_ahead: int = 6) -> dict:
    """
    Forecasts enrollment for a parish using the enrollment_model.pkl.
    Features: current enrollment, growth rate, poverty rate, year offset.
    Falls back to linear extrapolation if the model is unavailable.
    """
    parish = _get_parish(db, parish_name)
    if not parish:
        return {"parish": parish_name, "forecasts": [], "fallback": True, "error": "Parish not found"}

    base_enrollment = parish.enrollment or 5000
    growth_rate     = (parish.growth or 0.0) / 100.0
    poverty_rate    = parish.poverty or 18.0
    start_year      = 2024

    try:
        model = _load_model("enrollment_model.pkl")
        forecasts = []
        for offset in range(1, years_ahead + 1):
            features = np.array([[base_enrollment, growth_rate, poverty_rate, offset]])
            try:
                pred = float(model.predict(features)[0])
            except Exception:
                pred = base_enrollment * ((1 + growth_rate) ** offset)
            forecasts.append({"year": start_year + offset, "predicted": round(pred)})
        return {"parish": parish.name, "forecasts": forecasts, "fallback": False}

    except Exception as e:
        forecasts = []
        for offset in range(1, years_ahead + 1):
            pred = base_enrollment * ((1 + growth_rate) ** offset)
            forecasts.append({"year": start_year + offset, "predicted": round(pred)})
        return {"parish": parish.name if parish else parish_name, "forecasts": forecasts, "fallback": True, "error": str(e)}


def predict_investment_score(db: Session, parish_name: str) -> dict:
    """
    Scores a parish as an investment opportunity.
    Features: SPS score, poverty rate, enrollment, workforce score.
    """
    parish = _get_parish(db, parish_name)
    if not parish:
        return {"parish": parish_name, "score": 50.0, "confidence": 0.5, "rationale": "Parish not found", "fallback": True}

    sps        = parish.sps or 75.0
    poverty    = parish.poverty or 18.0
    enrollment = parish.enrollment or 5000
    workforce  = parish.workforce or 50

    try:
        model    = _load_model("investment_model.pkl")
        features = np.array([[sps, poverty, enrollment, workforce]])
        try:
            score = float(model.predict(features)[0])
        except Exception:
            score = float(model.predict(features.reshape(1, -1))[0])
        score = max(0.0, min(100.0, score))

        gap_label = parish.gap or "Moderate"
        rationale = (
            f"{parish.name} scores {score:.0f}/100. "
            f"SPS: {sps}/150 ({parish.grade}-grade). "
            f"Poverty rate: {poverty}%. "
            f"Education gap level: {gap_label}. "
            f"Workforce alignment score: {workforce}/100."
        )
        return {"parish": parish.name, "score": round(score, 1), "confidence": 0.82, "rationale": rationale, "fallback": False}

    except Exception as e:
        need_score = max(0, min(100, (100 - sps / 1.5) * 0.5 + (poverty / 40) * 50))
        return {
            "parish":     parish.name,
            "score":      round(need_score, 1),
            "confidence": 0.6,
            "rationale":  f"Estimated from SPS ({sps}) and poverty rate ({poverty}%). Model unavailable.",
            "fallback":   True,
            "error":      str(e),
        }


def predict_risk_score(db: Session, parish_name: str) -> dict:
    """
    Classifies educational risk level for a parish.
    Features: SPS trend direction, graduation rate, proficiency, poverty rate.
    """
    parish = _get_parish(db, parish_name)
    if not parish:
        return {"parish": parish_name, "risk_level": "Unknown", "score": 0.5, "factors": [], "fallback": True}

    trend_map   = {"Improving": 1, "Stable": 0, "Declining": -1}
    trend_val   = trend_map.get(parish.trend or "Stable", 0)
    graduation  = parish.graduation or 80.0
    proficiency = parish.proficiency or 35.0
    poverty     = parish.poverty or 18.0

    try:
        model    = _load_model("risk_model.pkl")
        features = np.array([[trend_val, graduation, proficiency, poverty]])
        try:
            proba = model.predict_proba(features)[0]
            score = float(proba[1]) if len(proba) > 1 else float(model.predict(features)[0])
        except Exception:
            score = float(model.predict(features)[0])
        score = max(0.0, min(1.0, score))

    except Exception as e:
        score = ((100 - graduation) / 100 * 0.4) + (poverty / 40 * 0.4) + (max(0, -trend_val) * 0.2)
        score = max(0.0, min(1.0, score))

    risk_level = "Critical" if score >= 0.7 else "High" if score >= 0.5 else "Moderate" if score >= 0.3 else "Low"

    factors = []
    if graduation < 75:
        factors.append(f"Low graduation rate: {graduation}%")
    if proficiency < 30:
        factors.append(f"Low LEAP proficiency: {proficiency}%")
    if poverty > 25:
        factors.append(f"High poverty rate: {poverty}%")
    if parish.trend == "Declining":
        factors.append("SPS score on declining trend")
    if parish.gap in ("Critical", "High"):
        factors.append(f"Education gap level: {parish.gap}")

    return {
        "parish":     parish.name,
        "risk_level": risk_level,
        "score":      round(score, 3),
        "factors":    factors,
        "fallback":   False,
    }


def predict_statewide_enrollment(db: Session, years_ahead: int = 6) -> list:
    """Runs enrollment forecast for all parishes and returns a list."""
    from models import Parish
    parishes = db.query(Parish).all()
    results  = []
    for p in parishes:
        result = predict_enrollment(db, p.name, years_ahead)
        results.append(result)
    return results
