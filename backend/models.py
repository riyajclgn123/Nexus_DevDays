"""
models.py

Defines all database tables as Python classes.
Each class = one table in PostgreSQL.
Each class attribute = one column in that table.

SQLAlchemy maps these classes to real SQL CREATE TABLE statements.
When you run seed.py, it creates these tables automatically.

Tables:
  - parishes         → parish performance data (LDOE)
  - state_metrics    → statewide summary numbers
  - workforce_gaps   → sector job demand vs supply
  - opportunities    → investment opportunity scoring
  - expansion_sites  → operator expansion candidates
  - alerts           → system-generated data flags
  - sps_history      → statewide SPS score over years
"""

from sqlalchemy import Column, Integer, Float, String, Boolean, Text, DateTime
from sqlalchemy.sql import func
from database import Base


# ─── Parish Performance Table ─────────────────────────────────────
class Parish(Base):
    """
    One row per Louisiana parish.
    Stores LDOE 2024 school performance scores + Census demographics.
    """
    __tablename__ = "parishes"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(100), unique=True, nullable=False, index=True)
    sps           = Column(Float, nullable=False)    # School Performance Score (out of 150)
    grade         = Column(String(1), nullable=False) # A, B, C, D, or F
    enrollment    = Column(Integer)                  # Total K-12 enrollment
    growth        = Column(Float)                    # Year-over-year enrollment % change
    gap           = Column(String(20))               # Critical / High / Moderate / Low
    graduation    = Column(Float)                    # Cohort graduation rate %
    proficiency   = Column(Float)                    # LEAP mastery rate %
    poverty       = Column(Float)                    # Census poverty rate %
    funding_need  = Column(Float)                    # Estimated funding gap ($M)
    workforce     = Column(Integer)                  # Workforce alignment score (0-100)
    trend         = Column(String(20))               # Improving / Stable / Declining
    data_source   = Column(String(200))              # Where data came from
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())


# ─── State Metrics Table ──────────────────────────────────────────
class StateMetric(Base):
    """
    One row = one metric for the whole state.
    Uses key/value storage so we can add metrics without schema changes.
    
    Example rows:
      key="graduation_rate",   value=83.2, label="Graduation Rate",  source="LDOE 2024"
      key="poverty_rate",      value=18.7, label="Poverty Rate",     source="Census ACS 2024"
    """
    __tablename__ = "state_metrics"

    id         = Column(Integer, primary_key=True, index=True)
    key        = Column(String(100), unique=True, nullable=False, index=True)
    value      = Column(Float)
    value_str  = Column(String(50))   # for non-numeric values like "B" or "$312M"
    label      = Column(String(200))
    sub_label  = Column(String(200))
    source     = Column(String(200))
    year       = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ─── SPS History Table ────────────────────────────────────────────
class SPSHistory(Base):
    """
    Statewide School Performance Score by year.
    Used for the trend line chart on the Policymaker dashboard.
    """
    __tablename__ = "sps_history"

    id         = Column(Integer, primary_key=True, index=True)
    year       = Column(String(4), nullable=False, unique=True)
    sps        = Column(Float, nullable=False)
    label      = Column(String(50))    # e.g. "Pre-pandemic", "COVID impact"
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ─── Proficiency By Grade Table ───────────────────────────────────
class ProficiencyByGrade(Base):
    """
    LEAP assessment mastery rates by grade band.
    Used for the bar chart on Policymaker dashboard.
    """
    __tablename__ = "proficiency_by_grade"

    id         = Column(Integer, primary_key=True, index=True)
    grade_band = Column(String(10), nullable=False)  # e.g. "K-2", "3-5"
    ela        = Column(Float)   # ELA mastery %
    math       = Column(Float)   # Math mastery %
    year       = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ─── Workforce Gaps Table ─────────────────────────────────────────
class WorkforceGap(Base):
    """
    Job sector demand vs education pipeline supply.
    Used on Funder and Operator dashboards.
    Source: BLS Louisiana / Better LA 2025
    """
    __tablename__ = "workforce_gaps"

    id         = Column(Integer, primary_key=True, index=True)
    sector     = Column(String(100), nullable=False)
    demand     = Column(Integer)    # projected jobs needed by 2028
    supply     = Column(Integer)    # current graduate pipeline
    gap        = Column(Integer)    # demand - supply
    growth_pct = Column(String(10)) # e.g. "+18%"
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ─── Investment Opportunities Table ───────────────────────────────
class Opportunity(Base):
    """
    Ranked investment opportunities for funders.
    Scored by: academic need × student population × workforce alignment.
    """
    __tablename__ = "opportunities"

    id          = Column(Integer, primary_key=True, index=True)
    parish      = Column(String(100), nullable=False)
    type        = Column(String(200), nullable=False)
    score       = Column(Integer)         # 0-100 composite score
    impact      = Column(String(20))      # High / Medium / Low
    students    = Column(Integer)
    cost        = Column(String(20))      # e.g. "$2.4M"
    workforce   = Column(String(100))     # target sector
    rationale   = Column(Text)
    data_source = Column(String(200))
    created_at  = Column(DateTime(timezone=True), server_default=func.now())


# ─── Expansion Sites Table ────────────────────────────────────────
class ExpansionSite(Base):
    """
    Potential school expansion sites for operators.
    Scored by demand, competition, and workforce alignment.
    """
    __tablename__ = "expansion_sites"

    id           = Column(Integer, primary_key=True, index=True)
    parish       = Column(String(100), nullable=False)
    region       = Column(String(200))
    demand_score = Column(Integer)    # 0-100 composite demand score
    competition  = Column(String(20)) # Low / Medium / High
    population   = Column(Integer)    # school-age population in catchment
    unserved     = Column(Integer)    # estimated unserved students
    school_type  = Column(String(100))
    timeline     = Column(String(20)) # e.g. "Aug 2026"
    status       = Column(String(20)) # Ready / Planning / Exploring
    sps          = Column(Float)      # district SPS score
    key_fact     = Column(Text)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())


# ─── Alerts Table ─────────────────────────────────────────────────
class Alert(Base):
    """
    System-generated data flags for dashboard notifications.
    """
    __tablename__ = "alerts"

    id         = Column(Integer, primary_key=True, index=True)
    type       = Column(String(20), nullable=False)  # critical / warning / info
    parish     = Column(String(100))
    message    = Column(Text, nullable=False)
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
