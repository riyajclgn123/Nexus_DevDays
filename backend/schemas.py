"""
schemas.py

Pydantic models define what the API sends back to the frontend.
They validate data and convert SQLAlchemy objects to JSON.

Think of schemas as the "shape" of your API responses.
Every API endpoint returns one of these schemas.
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ─── Parish schemas ───────────────────────────────────────────────
class ParishBase(BaseModel):
    name:         str
    sps:          float
    grade:        str
    enrollment:   Optional[int]   = None
    growth:       Optional[float] = None
    gap:          Optional[str]   = None
    graduation:   Optional[float] = None
    proficiency:  Optional[float] = None
    poverty:      Optional[float] = None
    funding_need: Optional[float] = None
    workforce:    Optional[int]   = None
    trend:        Optional[str]   = None
    data_source:  Optional[str]   = None

class ParishResponse(ParishBase):
    id: int
    class Config:
        from_attributes = True   # lets Pydantic read SQLAlchemy objects

class ParishListResponse(BaseModel):
    total:    int
    parishes: List[ParishResponse]


# ─── State metrics schemas ────────────────────────────────────────
class StateMetricResponse(BaseModel):
    id:        int
    key:       str
    value:     Optional[float] = None
    value_str: Optional[str]   = None
    label:     Optional[str]   = None
    sub_label: Optional[str]   = None
    source:    Optional[str]   = None
    year:      Optional[int]   = None
    class Config:
        from_attributes = True

# This is what the frontend actually uses — a flat summary object
class StateSummaryResponse(BaseModel):
    sps_score:         float
    sps_grade:         str
    sps_trend:         str
    graduation_rate:   float
    enrollment_total:  int
    poverty_rate:      float
    child_poverty:     float
    median_income:     int
    bachelors_rate:    float
    employment_rate:   float
    chronic_absence:   float
    schools_a:         int
    schools_b:         int
    schools_c:         int
    schools_d:         int
    schools_f:         int
    source:            str


# ─── SPS History schemas ─────────────────────────────────────────
class SPSHistoryResponse(BaseModel):
    id:    int
    year:  str
    sps:   float
    label: Optional[str] = None
    class Config:
        from_attributes = True


# ─── Proficiency schemas ─────────────────────────────────────────
class ProficiencyResponse(BaseModel):
    id:         int
    grade_band: str
    ela:        Optional[float] = None
    math:       Optional[float] = None
    year:       Optional[int]   = None
    class Config:
        from_attributes = True


# ─── Workforce schemas ────────────────────────────────────────────
class WorkforceGapResponse(BaseModel):
    id:         int
    sector:     str
    demand:     Optional[int] = None
    supply:     Optional[int] = None
    gap:        Optional[int] = None
    growth_pct: Optional[str] = None
    class Config:
        from_attributes = True


# ─── Opportunity schemas ──────────────────────────────────────────
class OpportunityResponse(BaseModel):
    id:          int
    parish:      str
    type:        str
    score:       Optional[int] = None
    impact:      Optional[str] = None
    students:    Optional[int] = None
    cost:        Optional[str] = None
    workforce:   Optional[str] = None
    rationale:   Optional[str] = None
    data_source: Optional[str] = None
    class Config:
        from_attributes = True


# ─── Expansion site schemas ───────────────────────────────────────
class ExpansionSiteResponse(BaseModel):
    id:           int
    parish:       str
    region:       Optional[str] = None
    demand_score: Optional[int] = None
    competition:  Optional[str] = None
    population:   Optional[int] = None
    unserved:     Optional[int] = None
    school_type:  Optional[str] = None
    timeline:     Optional[str] = None
    status:       Optional[str] = None
    sps:          Optional[float] = None
    key_fact:     Optional[str] = None
    class Config:
        from_attributes = True


# ─── Alert schemas ────────────────────────────────────────────────
class AlertResponse(BaseModel):
    id:        int
    type:      str
    parish:    Optional[str] = None
    message:   str
    is_active: bool
    class Config:
        from_attributes = True


# ─── Generic API response wrapper ────────────────────────────────
class APIResponse(BaseModel):
    success: bool
    message: str
    data:    Optional[dict] = None
