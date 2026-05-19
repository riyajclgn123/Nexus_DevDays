"""
routers/parishes.py

All API endpoints related to parishes.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Parish
from schemas import ParishResponse, ParishListResponse

router = APIRouter(prefix="/parishes", tags=["parishes"])

# Parish centroid coordinates (lat/lon) for choropleth map
PARISH_CENTROIDS = {
    "Acadia": (30.29, -92.41), "Allen": (30.64, -92.83), "Ascension": (30.20, -90.91),
    "Assumption": (29.93, -91.08), "Avoyelles": (31.08, -92.00), "Beauregard": (30.66, -93.36),
    "Bienville": (32.36, -93.04), "Bossier": (32.69, -93.65), "Caddo": (32.58, -93.89),
    "Calcasieu": (30.24, -93.35), "Caldwell": (32.07, -92.12), "Cameron": (29.80, -93.00),
    "Catahoula": (31.67, -91.87), "Claiborne": (32.83, -92.99), "Concordia": (31.47, -91.65),
    "De Soto": (31.98, -93.73), "East Baton Rouge": (30.53, -91.09), "East Carroll": (32.76, -91.24),
    "East Feliciana": (30.86, -90.93), "Evangeline": (30.73, -92.41), "Franklin": (32.13, -91.69),
    "Grant": (31.61, -92.55), "Iberia": (29.89, -91.81), "Iberville": (30.27, -91.41),
    "Jackson": (32.31, -92.56), "Jefferson": (29.69, -90.11), "Jefferson Davis": (30.28, -92.83),
    "Lafayette": (30.22, -92.02), "Lafourche": (29.37, -90.41), "La Salle": (31.68, -92.15),
    "Lincoln": (32.60, -92.67), "Livingston": (30.49, -90.63), "Madison": (32.39, -91.26),
    "Morehouse": (32.80, -91.80), "Natchitoches": (31.73, -93.09), "Orleans": (29.95, -90.07),
    "Ouachita": (32.55, -92.12), "Plaquemines": (29.33, -89.82), "Pointe Coupee": (30.70, -91.62),
    "Rapides": (31.26, -92.44), "Red River": (32.07, -93.38), "Richland": (32.42, -91.75),
    "Sabine": (31.57, -93.37), "St. Bernard": (29.85, -89.83), "St. Charles": (29.93, -90.34),
    "St. Helena": (30.78, -90.62), "St. James": (29.99, -90.72), "St. John the Baptist": (30.12, -90.48),
    "St. Landry": (30.59, -92.00), "St. Martin": (30.13, -91.60), "St. Mary": (29.68, -91.42),
    "St. Tammany": (30.42, -89.95), "Tangipahoa": (30.59, -90.41), "Tensas": (32.07, -91.36),
    "Terrebonne": (29.35, -90.84), "Union": (32.90, -92.38), "Vermilion": (29.79, -92.29),
    "Vernon": (31.11, -93.19), "Washington": (30.85, -89.92), "Webster": (32.74, -93.33),
    "West Baton Rouge": (30.47, -91.30), "West Carroll": (32.84, -91.46),
    "West Feliciana": (30.95, -91.40), "Winn": (31.95, -92.64),
}


@router.get("/", response_model=ParishListResponse)
def get_all_parishes(
    skip:    int = Query(0,   description="Records to skip (pagination)"),
    limit:   int = Query(100, description="Max records to return"),
    gap:     Optional[str] = Query(None, description="Filter by gap level: Critical/High/Moderate/Low"),
    grade:   Optional[str] = Query(None, description="Filter by letter grade: A/B/C/D/F"),
    sort_by: str = Query("sps", description="Sort by field: sps/graduation/proficiency/name"),
    db: Session = Depends(get_db)
):
    """
    Returns all parishes with optional filtering and sorting.
    
    Example calls:
      GET /parishes/                          → all parishes
      GET /parishes/?gap=Critical             → only critical parishes
      GET /parishes/?grade=B&sort_by=name     → B-grade parishes sorted by name
      GET /parishes/?sort_by=graduation       → sorted by graduation rate
    """
    query = db.query(Parish)

    # Apply filters
    if gap:
        query = query.filter(Parish.gap == gap)
    if grade:
        query = query.filter(Parish.grade == grade)

    # Apply sorting
    sort_map = {
        "sps":         Parish.sps.desc(),
        "graduation":  Parish.graduation.desc(),
        "proficiency": Parish.proficiency.desc(),
        "name":        Parish.name.asc(),
        "poverty":     Parish.poverty.desc(),
    }
    order = sort_map.get(sort_by, Parish.sps.desc())
    query = query.order_by(order)

    total = query.count()
    parishes = query.offset(skip).limit(limit).all()

    return ParishListResponse(total=total, parishes=parishes)


@router.get("/summary/stats")
def get_parish_summary(db: Session = Depends(get_db)):
    """
    Returns quick summary statistics across all parishes.
    Used for the overview cards on the Policymaker dashboard.
    """
    parishes = db.query(Parish).all()
    if not parishes:
        raise HTTPException(status_code=404, detail="No parish data found")

    avg_sps        = sum(p.sps for p in parishes) / len(parishes)
    avg_grad       = sum(p.graduation for p in parishes if p.graduation) / len(parishes)
    critical_count = sum(1 for p in parishes if p.gap == "Critical")
    total_students = sum(p.enrollment for p in parishes if p.enrollment)

    return {
        "average_sps":         round(avg_sps, 1),
        "average_graduation":  round(avg_grad, 1),
        "critical_parishes":   critical_count,
        "total_enrollment":    total_students,
        "total_parishes":      len(parishes),
    }


@router.get("/map/choropleth")
def get_choropleth_data(db: Session = Depends(get_db)):
    """Returns all parishes with lat/lon centroids for the choropleth map."""
    parishes = db.query(Parish).all()
    result = []
    for p in parishes:
        lat, lon = PARISH_CENTROIDS.get(p.name, (31.0, -92.0))
        result.append({
            "name":       p.name,
            "sps":        p.sps,
            "grade":      p.grade,
            "gap":        p.gap,
            "latitude":   lat,
            "longitude":  lon,
            "poverty":    p.poverty,
            "enrollment": p.enrollment,
            "trend":      p.trend,
        })
    return result


@router.get("/{name}", response_model=ParishResponse)
def get_parish_by_name(name: str, db: Session = Depends(get_db)):
    """Returns a single parish by name."""
    parish = db.query(Parish).filter(
        Parish.name.ilike(f"%{name}%")
    ).first()
    if not parish:
        raise HTTPException(status_code=404, detail=f"Parish '{name}' not found")
    return parish
