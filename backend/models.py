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

from sqlalchemy import Column, Integer, Float, String, Boolean, Text, DateTime, BigInteger, ForeignKey, UniqueConstraint
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
    grade_band = Column(String(20), nullable=False)  # e.g. "K-2", "Grades 3-8", "High School"
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


# ─── Data Sources Table ───────────────────────────────────────────
class DataSource(Base):
    """
    Registry of every external data source EduPulse ingests from.
    Every fact in metric_provenance points back to a row here, so any
    number on a dashboard can be traced to where it actually came from.
    """
    __tablename__ = "data_sources"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(200), nullable=False, unique=True)   # e.g. "US Census ACS5 2024"
    organization  = Column(String(200))                                # e.g. "US Census Bureau"
    url           = Column(String(500))                                # canonical source URL
    api_endpoint  = Column(String(500))                                # actual API URL hit, if any
    vintage       = Column(String(20))                                 # e.g. "2024", "2014-15"
    retrieved_at  = Column(DateTime(timezone=True))                    # when we last pulled it
    is_historical = Column(Boolean, default=False)                     # flags stale/dissolved-program data
    notes         = Column(Text)                                       # e.g. "RSD dissolved 2019; data shown for historical context only"
    created_at    = Column(DateTime(timezone=True), server_default=func.now())


# ─── Metric Provenance Table ──────────────────────────────────────
class MetricProvenance(Base):
    """
    Links a specific (table, row, column) fact to the data_sources row
    it came from, plus an optional derivation formula if the value was
    computed rather than ingested directly.
    """
    __tablename__ = "metric_provenance"

    id              = Column(Integer, primary_key=True, index=True)
    source_id       = Column(Integer, ForeignKey("data_sources.id"), nullable=False)
    table_name      = Column(String(100), nullable=False)   # e.g. "parishes"
    row_identifier  = Column(String(200), nullable=False)   # e.g. parish name or fips
    column_name     = Column(String(100), nullable=False)   # e.g. "poverty"
    derivation      = Column(Text)                          # formula/notes if computed, else null
    is_projected    = Column(Boolean, default=False)        # true if extrapolated, not officially released
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("table_name", "row_identifier", "column_name", name="uq_provenance_fact"),
    )


# ─── Census ACS5 Demographics Table ───────────────────────────────
class CensusACS(Base):
    """
    Raw-ish demographic pulls from the Census ACS5 API, one row per
    parish per vintage year. Kept separate from `parishes` so re-pulls
    never clobber the curated/displayed parish table directly.
    """
    __tablename__ = "census_acs"

    id               = Column(Integer, primary_key=True, index=True)
    parish_name      = Column(String(100), nullable=False, index=True)
    fips             = Column(String(5))
    year             = Column(Integer, nullable=False)       # ACS5 vintage year
    median_income    = Column(Integer)
    poverty_rate     = Column(Float)
    poverty_under18  = Column(Float)
    population       = Column(Integer)
    population_under18 = Column(Integer)
    source_id        = Column(Integer, ForeignKey("data_sources.id"))
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("parish_name", "year", name="uq_census_acs_parish_year"),
    )


# ─── BLS Employment Table ─────────────────────────────────────────
class BLSEmployment(Base):
    """
    BLS CES/LAUS timeseries pulls, statewide or by area.
    One row per series per period.
    """
    __tablename__ = "bls_employment"

    id          = Column(Integer, primary_key=True, index=True)
    series_id   = Column(String(50), nullable=False, index=True)
    series_label = Column(String(200))
    area        = Column(String(100))    # e.g. "Louisiana" or a parish/MSA name
    sector      = Column(String(100))    # e.g. "Healthcare", "Manufacturing"
    year        = Column(Integer, nullable=False)
    period      = Column(String(10))     # e.g. "M01".."M13" per BLS convention
    value       = Column(Float)
    source_id   = Column(Integer, ForeignKey("data_sources.id"))
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("series_id", "year", "period", name="uq_bls_series_period"),
    )


# ─── RSD Eligible Schools Table (historical) ──────────────────────
class RSDEligibleSchool(Base):
    """
    2014-15 Recovery School District eligibility list. The RSD program
    was dissolved in 2019, so this is ingested strictly as historical
    reference data, never displayed as current. is_historical on the
    linked data_sources row is the authoritative flag; vintage='2014-15'
    here is redundant-but-explicit for query convenience.
    """
    __tablename__ = "rsd_eligible_schools"

    id           = Column(Integer, primary_key=True, index=True)
    school_name  = Column(String(200), nullable=False)
    parish_name  = Column(String(100), index=True)
    district     = Column(String(200))
    vintage      = Column(String(20), default="2014-15")
    is_historical = Column(Boolean, default=True, nullable=False)
    source_id    = Column(Integer, ForeignKey("data_sources.id"))
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
