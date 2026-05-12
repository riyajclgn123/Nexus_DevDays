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

@opps_router.get("/", response_model=List[OpportunityResponse])
def get_opportunities(
    impact:  Optional[str] = Query(None, description="Filter: High/Medium/Low"),
    parish:  Optional[str] = Query(None, description="Filter by parish name"),
    db: Session = Depends(get_db)
):
    """
    Returns ranked investment opportunities.
    Sorted by composite score descending (highest impact first).
    """
    query = db.query(Opportunity)
    if impact:
        query = query.filter(Opportunity.impact == impact)
    if parish:
        query = query.filter(Opportunity.parish.ilike(f"%{parish}%"))
    return query.order_by(Opportunity.score.desc()).all()


# ─── Expansion sites router ───────────────────────────────────────
sites_router = APIRouter(prefix="/sites", tags=["expansion-sites"])

@sites_router.get("/", response_model=List[ExpansionSiteResponse])
def get_expansion_sites(
    status: Optional[str] = Query(None, description="Filter: Ready/Planning/Exploring"),
    db: Session = Depends(get_db)
):
    """
    Returns school expansion site recommendations.
    Sorted by demand score descending.
    """
    query = db.query(ExpansionSite)
    if status:
        query = query.filter(ExpansionSite.status == status)
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
    return db.query(WorkforceGap).order_by(WorkforceGap.gap.desc()).all()
