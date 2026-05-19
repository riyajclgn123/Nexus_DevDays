"""
ml/train.py — Training scripts for EduPulse ML models.

Pulls data from PostgreSQL, trains scikit-learn models, and saves .pkl files.
Run: python3 train.py  (from the backend directory with venv active)
"""

import os
import sys
import joblib
import numpy as np

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


def train_enrollment_model(db_session) -> None:
    """Trains a RandomForestRegressor on parish enrollment data."""
    from sklearn.ensemble import RandomForestRegressor
    from models import Parish

    parishes = db_session.query(Parish).all()
    if len(parishes) < 5:
        print("Not enough parish data to train enrollment model.")
        return

    X, y = [], []
    for p in parishes:
        if p.enrollment and p.growth is not None and p.poverty is not None:
            for offset in range(1, 4):
                X.append([p.enrollment, (p.growth or 0) / 100, p.poverty or 18, offset])
                y.append(p.enrollment * ((1 + (p.growth or 0) / 100) ** offset))

    if not X:
        print("No usable training samples for enrollment model.")
        return

    X, y = np.array(X), np.array(y)
    model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=8)
    model.fit(X, y)

    path = os.path.join(MODEL_DIR, "enrollment_model.pkl")
    joblib.dump(model, path)
    print(f"✅ Enrollment model saved: {path} (trained on {len(X)} samples)")


def train_investment_model(db_session) -> None:
    """Trains a GradientBoostingRegressor on parish + opportunity data."""
    from sklearn.ensemble import GradientBoostingRegressor
    from models import Parish, Opportunity

    parishes = {p.name: p for p in db_session.query(Parish).all()}
    opps     = db_session.query(Opportunity).all()

    X, y = [], []
    for o in opps:
        p = parishes.get(o.parish)
        if p and o.score is not None:
            X.append([p.sps or 75, p.poverty or 18, p.enrollment or 5000, p.workforce or 50])
            y.append(float(o.score))

    if len(X) < 3:
        print("Not enough opportunity data to train investment model — generating synthetic samples.")
        for p in parishes.values():
            if p.sps and p.poverty and p.enrollment:
                need = max(0, min(100, (100 - p.sps / 1.5) * 0.5 + (p.poverty / 40) * 50))
                X.append([p.sps, p.poverty, p.enrollment, p.workforce or 50])
                y.append(need)

    if not X:
        print("Skipping investment model — no data.")
        return

    X, y = np.array(X), np.array(y)
    model = GradientBoostingRegressor(n_estimators=100, random_state=42, max_depth=4)
    model.fit(X, y)

    path = os.path.join(MODEL_DIR, "investment_model.pkl")
    joblib.dump(model, path)
    print(f"✅ Investment model saved: {path} (trained on {len(X)} samples)")


def train_risk_model(db_session) -> None:
    """Trains a RandomForestClassifier on parish + alerts data."""
    from sklearn.ensemble import RandomForestClassifier
    from models import Parish, Alert

    parishes = db_session.query(Parish).all()
    alerts   = {a.parish for a in db_session.query(Alert).filter(Alert.type == "critical").all()}

    trend_map = {"Improving": 1, "Stable": 0, "Declining": -1}
    X, y = [], []

    for p in parishes:
        if p.graduation is not None and p.proficiency is not None and p.poverty is not None:
            trend_val = trend_map.get(p.trend or "Stable", 0)
            X.append([trend_val, p.graduation or 80, p.proficiency or 35, p.poverty or 18])
            label = 1 if (p.name in alerts or p.gap in ("Critical", "High")) else 0
            y.append(label)

    if not X:
        print("Skipping risk model — no data.")
        return

    X, y = np.array(X), np.array(y)
    model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=6)
    model.fit(X, y)

    path = os.path.join(MODEL_DIR, "risk_model.pkl")
    joblib.dump(model, path)
    print(f"✅ Risk model saved: {path} (trained on {len(X)} samples)")


if __name__ == "__main__":
    from database import SessionLocal
    db = SessionLocal()
    try:
        print("Training enrollment model...")
        train_enrollment_model(db)
        print("Training investment model...")
        train_investment_model(db)
        print("Training risk model...")
        train_risk_model(db)
        print("\nAll models trained successfully.")
    finally:
        db.close()
