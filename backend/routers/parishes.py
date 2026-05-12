"""
routers/parishes.py

All API endpoints related to parishes.

Endpoints:
  GET /parishes/              → all parishes
  GET /parishes/{name}        → single parish by name
  GET /parishes/gap/{level}   → filter by gap level
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Parish
from schemas import ParishResponse, ParishListResponse

router = APIRouter(prefix="/parishes", tags=["parishes"])


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


@router.get("/{name}", response_model=ParishResponse)
def get_parish_by_name(name: str, db: Session = Depends(get_db)):
    """
    Returns a single parish by name.
    Example: GET /parishes/Orleans
    """
    parish = db.query(Parish).filter(
        Parish.name.ilike(f"%{name}%")
    ).first()

    if not parish:
        raise HTTPException(status_code=404, detail=f"Parish '{name}' not found")

    return parish
