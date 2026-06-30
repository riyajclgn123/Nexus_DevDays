"""
routers/opportunities.py

Investment opportunities and expansion sites endpoints.
Powers the Funder and Operator dashboards.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Opportunity, ExpansionSite, Alert, WorkforceGap
from schemas import (
    OpportunityResponse, ExpansionSiteResponse,
    AlertResponse, WorkforceGapResponse
)

# ─── Opportunities router ─────────────────────────────────────────
opps_router = APIRouter(prefix="/opportunities", tags=["opportunities"])

@opps_router.get("/summary")
def get_opportunities_summary(db: Session = Depends(get_db)):
    """Returns aggregate opportunity stats for the Funder dashboard KPI cards."""
    opps = db.query(Opportunity).all()
    if not opps:
        return {"total": 0, "high": 0, "medium": 0, "low": 0, "total_students": 0, "avg_score": 0}
    scores = [o.score for o in opps if o.score is not None]
    return {
        "total":          len(opps),
        "high":           sum(1 for o in opps if o.impact == "High"),
        "medium":         sum(1 for o in opps if o.impact == "Medium"),
        "low":            sum(1 for o in opps if o.impact == "Low"),
        "total_students": sum(o.students or 0 for o in opps),
        "avg_score":      round(sum(scores) / len(scores), 1) if scores else 0,
    }


@opps_router.get("/by-parish/{parish_name}", response_model=List[OpportunityResponse])
def get_opportunities_by_parish(parish_name: str, db: Session = Depends(get_db)):
    """Returns all opportunities for a specific parish."""
    return db.query(Opportunity).filter(
        Opportunity.parish.ilike(f"%{parish_name}%")
    ).order_by(Opportunity.score.desc()).all()


@opps_router.get("/", response_model=List[OpportunityResponse])
def get_opportunities(
    impact:  Optional[str] = Query(None, description="Filter: High/Medium/Low"),
    parish:  Optional[str] = Query(None, description="Filter by parish name"),
    db: Session = Depends(get_db)
):
    """Returns ranked investment opportunities sorted by composite score."""
    query = db.query(Opportunity)
    if impact:
        query = query.filter(Opportunity.impact == impact)
    if parish:
        query = query.filter(Opportunity.parish.ilike(f"%{parish}%"))
    return query.order_by(Opportunity.score.desc()).all()


# ─── Expansion sites router ───────────────────────────────────────
sites_router = APIRouter(prefix="/sites", tags=["expansion-sites"])

@sites_router.get("/summary")
def get_sites_summary(db: Session = Depends(get_db)):
    """Returns aggregate site stats for the Operator dashboard KPI cards."""
    sites = db.query(ExpansionSite).all()
    if not sites:
        return {"ready": 0, "planning": 0, "exploring": 0, "total_unserved": 0, "max_demand_score": 0}
    scores = [s.demand_score for s in sites if s.demand_score is not None]
    return {
        "ready":           sum(1 for s in sites if s.status == "Ready"),
        "planning":        sum(1 for s in sites if s.status == "Planning"),
        "exploring":       sum(1 for s in sites if s.status == "Exploring"),
        "total_unserved":  sum(s.unserved or 0 for s in sites),
        "max_demand_score": max(scores) if scores else 0,
    }


@sites_router.get("/regions")
def get_site_regions(db: Session = Depends(get_db)):
    """Returns unique regions for the Operator filter dropdown."""
    rows = db.query(ExpansionSite.region).distinct().all()
    return {"regions": sorted([r[0] for r in rows if r[0]])}


@sites_router.get("/", response_model=List[ExpansionSiteResponse])
def get_expansion_sites(
    status: Optional[str] = Query(None, description="Filter: Ready/Planning/Exploring"),
    region: Optional[str] = Query(None, description="Filter by region"),
    db: Session = Depends(get_db)
):
    """Returns school expansion site recommendations sorted by demand score."""
    query = db.query(ExpansionSite)
    if status:
        query = query.filter(ExpansionSite.status == status)
    if region:
        query = query.filter(ExpansionSite.region.ilike(f"%{region}%"))
    return query.order_by(ExpansionSite.demand_score.desc()).all()


# ─── Alerts router ────────────────────────────────────────────────
alerts_router = APIRouter(prefix="/alerts", tags=["alerts"])

@alerts_router.get("/", response_model=List[AlertResponse])
def get_alerts(
    type:   Optional[str] = Query(None, description="Filter: critical/warning/info"),
    db: Session = Depends(get_db)
):
    """
    Returns system-generated data alerts.
    """
    query = db.query(Alert).filter(Alert.is_active == True)
    if type:
        query = query.filter(Alert.type == type)
    return query.order_by(Alert.type.asc(), Alert.id.asc()).all()


# ─── Workforce router ─────────────────────────────────────────────
workforce_router = APIRouter(prefix="/workforce", tags=["workforce"])

@workforce_router.get("/", response_model=List[WorkforceGapResponse])
def get_workforce_gaps(db: Session = Depends(get_db)):
    """
    Returns workforce demand vs supply gap by sector.
    Sorted by gap size descending (biggest shortage first).
    """
    return db.query(WorkforceGap).order_by(WorkforceGap.demand.desc()).all()
