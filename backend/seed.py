"""
seed.py

Loads all real Louisiana education data into PostgreSQL.

Run this ONCE after setting up the database:
    python seed.py

It will:
  1. Create all tables (if they don't exist)
  2. Clear any existing data
  3. Insert all real data from LDOE, Census, BLS sources

Data sources:
  - LDOE 2024 School Performance Scores (released Nov 20, 2024)
  - US Census Bureau ACS 2024 1-Year Estimates
  - Leaders for a Better Louisiana / BLS Louisiana 2025
  - Education Recovery Scorecard (Harvard/Stanford) 2024
"""

from database import engine, SessionLocal, Base
from models import (
    Parish, StateMetric, SPSHistory, ProficiencyByGrade,
    WorkforceGap, Opportunity, ExpansionSite, Alert
)

def seed():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # ── Clear existing data (safe for re-seeding) ──────────────
        print("Clearing existing data...")
        db.query(Alert).delete()
        db.query(ExpansionSite).delete()
        db.query(Opportunity).delete()
        db.query(WorkforceGap).delete()
        db.query(ProficiencyByGrade).delete()
        db.query(SPSHistory).delete()
        db.query(StateMetric).delete()
        db.query(Parish).delete()
        db.commit()

        # ── 1. STATE METRICS ───────────────────────────────────────
        print("Seeding state metrics...")
        state_metrics = [
            StateMetric(key="sps_score",        value=80.2,   label="Statewide SPS Score",      sub_label="Grade B · +1.7 pts from 2023",           source="LDOE 2024", year=2024),
            StateMetric(key="sps_grade",         value_str="B",label="Letter Grade",             sub_label="150-point scale",                        source="LDOE 2024", year=2024),
            StateMetric(key="graduation_rate",   value=83.2,   label="Graduation Rate",          sub_label="4-year cohort 2022-23",                   source="LDOE 2024", year=2023),
            StateMetric(key="enrollment_total",  value=686000, label="Total Enrollment",         sub_label="K-12 public students 2024-25",            source="LDOE 2024", year=2024),
            StateMetric(key="poverty_rate",      value=18.7,   label="Poverty Rate",             sub_label="vs 12.1% national average",              source="Census ACS 2024", year=2024),
            StateMetric(key="child_poverty",     value=25.2,   label="Child Poverty Rate",       sub_label="Under-18, 2x national average",          source="Census ACS 2024", year=2024),
            StateMetric(key="median_income",     value=60986,  label="Median Household Income",  sub_label="vs $81,604 national average",            source="Census ACS 2024", year=2024),
            StateMetric(key="bachelors_rate",    value=27.8,   label="Bachelor's Degree Rate",   sub_label="vs 36.8% national average",              source="Census ACS 2024", year=2024),
            StateMetric(key="employment_rate",   value=56.4,   label="Employment Rate",          sub_label="vs 60.6% national average",              source="Census ACS 2024", year=2024),
            StateMetric(key="chronic_absence",   value=25.0,   label="Chronic Absenteeism",      sub_label="Up from 18% pre-pandemic",               source="LDOE / Harvard ERS 2024", year=2024),
            StateMetric(key="schools_a",         value=21,     label="Schools Graded A",         sub_label="% of all Louisiana public schools",      source="LDOE 2025", year=2025),
            StateMetric(key="schools_b",         value=31,     label="Schools Graded B",         sub_label="% of all Louisiana public schools",      source="LDOE 2025", year=2025),
            StateMetric(key="schools_c",         value=32,     label="Schools Graded C",         sub_label="% of all Louisiana public schools",      source="LDOE 2025", year=2025),
            StateMetric(key="schools_d",         value=12,     label="Schools Graded D",         sub_label="% of all Louisiana public schools",      source="LDOE 2025", year=2025),
            StateMetric(key="schools_f",         value=4,      label="Schools Graded F",         sub_label="% of all Louisiana public schools",      source="LDOE 2025", year=2025),
        ]
        db.add_all(state_metrics)

        # ── 2. SPS HISTORY ─────────────────────────────────────────
        print("Seeding SPS history...")
        sps_history = [
            SPSHistory(year="2019", sps=77.1, label="Pre-pandemic"),
            SPSHistory(year="2021", sps=72.0, label="COVID impact"),
            SPSHistory(year="2022", sps=77.1, label="Recovery"),
            SPSHistory(year="2023", sps=78.5, label=None),
            SPSHistory(year="2024", sps=80.2, label="Current"),
            SPSHistory(year="2025", sps=80.9, label="Latest"),
        ]
        db.add_all(sps_history)

        # ── 3. PROFICIENCY BY GRADE ────────────────────────────────
        print("Seeding proficiency data...")
        proficiency = [
            ProficiencyByGrade(grade_band="K-2",  ela=54, math=57, year=2024),
            ProficiencyByGrade(grade_band="3-5",  ela=44, math=41, year=2024),
            ProficiencyByGrade(grade_band="6-8",  ela=35, math=32, year=2024),
            ProficiencyByGrade(grade_band="9-12", ela=30, math=27, year=2024),
        ]
        db.add_all(proficiency)

        # ── 4. PARISHES ────────────────────────────────────────────
        print("Seeding parish data...")
        parishes = [
            Parish(name="Orleans",          sps=74.0,  grade="C", enrollment=41200,  growth=-1.2, gap="High",     graduation=78.6, proficiency=30, poverty=26.2, funding_need=3.8, workforce=72, trend="Improving",  data_source="LDOE 2024, Census ACS 2024"),
            Parish(name="East Baton Rouge", sps=71.0,  grade="C", enrollment=39800,  growth=0.4,  gap="High",     graduation=80.1, proficiency=38, poverty=22.1, funding_need=2.9, workforce=68, trend="Stable",     data_source="LDOE 2024, Census ACS 2024"),
            Parish(name="Jefferson",        sps=79.0,  grade="B", enrollment=46800,  growth=-0.6, gap="Moderate", graduation=82.4, proficiency=44, poverty=18.3, funding_need=2.1, workforce=74, trend="Improving",  data_source="LDOE 2024, Census ACS 2024"),
            Parish(name="Caddo",            sps=68.0,  grade="C", enrollment=22400,  growth=-2.8, gap="Critical", graduation=76.2, proficiency=29, poverty=27.4, funding_need=4.8, workforce=58, trend="Declining",  data_source="LDOE 2024, Census ACS 2024"),
            Parish(name="Calcasieu",        sps=87.5,  grade="B", enrollment=19600,  growth=1.8,  gap="Low",      graduation=86.9, proficiency=54, poverty=15.2, funding_need=0.9, workforce=84, trend="Improving",  data_source="LDOE 2024 — no F schools"),
            Parish(name="St. Tammany",      sps=91.0,  grade="A", enrollment=25100,  growth=2.9,  gap="Low",      graduation=91.2, proficiency=66, poverty=10.1, funding_need=0.5, workforce=89, trend="Stable",     data_source="LDOE 2024, Census ACS 2024"),
            Parish(name="Tangipahoa",       sps=75.0,  grade="C", enrollment=21400,  growth=0.2,  gap="High",     graduation=78.1, proficiency=34, poverty=24.6, funding_need=3.5, workforce=55, trend="Improving",  data_source="LDOE 2024 — grad rate +9.2pts"),
            Parish(name="Rapides",          sps=83.0,  grade="B", enrollment=18900,  growth=-0.9, gap="Moderate", graduation=82.7, proficiency=42, poverty=19.8, funding_need=2.3, workforce=62, trend="Improving",  data_source="LDOE 2024"),
            Parish(name="Ouachita",         sps=83.8,  grade="B", enrollment=17400,  growth=-0.3, gap="Moderate", graduation=83.1, proficiency=43, poverty=20.4, funding_need=2.1, workforce=63, trend="Improving",  data_source="LDOE 2024"),
            Parish(name="Livingston",       sps=88.0,  grade="B", enrollment=17100,  growth=3.8,  gap="Low",      graduation=88.4, proficiency=58, poverty=11.9, funding_need=0.7, workforce=80, trend="Improving",  data_source="LDOE 2024, Census ACS 2024"),
            Parish(name="Vernon",           sps=92.1,  grade="A", enrollment=9400,   growth=0.8,  gap="Low",      graduation=89.1, proficiency=61, poverty=14.2, funding_need=0.4, workforce=75, trend="Stable",     data_source="LDOE 2024 — top 10 district"),
            Parish(name="Webster",          sps=75.7,  grade="C", enrollment=8900,   growth=-1.4, gap="Moderate", graduation=79.3, proficiency=37, poverty=23.1, funding_need=2.8, workforce=54, trend="Improving",  data_source="LDOE 2024 — C to B trajectory"),
        ]
        db.add_all(parishes)

        # ── 5. WORKFORCE GAPS ──────────────────────────────────────
        print("Seeding workforce data...")
        workforce = [
            WorkforceGap(sector="Healthcare",     demand=4800, supply=1900, gap=2900, growth_pct="+12%"),
            WorkforceGap(sector="Technology",     demand=3400, supply=980,  gap=2420, growth_pct="+18%"),
            WorkforceGap(sector="Skilled Trades", demand=6200, supply=3400, gap=2800, growth_pct="+8%"),
            WorkforceGap(sector="Education",      demand=3100, supply=2200, gap=900,  growth_pct="+4%"),
            WorkforceGap(sector="Energy/LNG",     demand=4100, supply=2600, gap=1500, growth_pct="+22%"),
            WorkforceGap(sector="Logistics",      demand=2600, supply=1800, gap=800,  growth_pct="+6%"),
        ]
        db.add_all(workforce)

        # ── 6. INVESTMENT OPPORTUNITIES ───────────────────────────
        print("Seeding opportunities...")
        opps = [
            Opportunity(parish="Caddo",           type="STEM Pathway School",        score=94, impact="High",   students=1100, cost="$2.4M", workforce="Technology / Energy",  rationale="Lowest SPS in NW Louisiana (68.0). Tech job growth +18% projected. No dedicated STEM pathway school within 25 miles of Shreveport.", data_source="LDOE 2024 SPS, BLS Louisiana 2025"),
            Opportunity(parish="Orleans",          type="Early Literacy Program",     score=91, impact="High",   students=3200, cost="$1.8M", workforce="All sectors",           rationale="Only 30% mastery rate on state assessments. Child poverty at 26.2%. Chronic absenteeism above state average of 25%.",                data_source="LDOE 2024 SPS, Census ACS 2024"),
            Opportunity(parish="Tangipahoa",       type="Healthcare Career Pathway",  score=88, impact="High",   students=820,  cost="$1.2M", workforce="Healthcare",            rationale="Graduation rate jumped +9.2pts to 78.1% — community momentum. North Oaks Health projecting 600+ hires by 2027.",                    data_source="LDOE 2024 Grad Rates, BLS Louisiana"),
            Opportunity(parish="East Baton Rouge", type="School Turnaround",         score=83, impact="Medium", students=2800, cost="$3.2M", workforce="Technology / Govt",     rationale="SPS 71.0 (C) despite being state capital. 46% of students below 2019 math levels per Harvard ERS 2024.",                          data_source="LDOE 2024 SPS, Harvard ERS 2024"),
            Opportunity(parish="Webster",          type="CTE Expansion Program",      score=79, impact="Medium", students=650,  cost="$900K", workforce="Skilled Trades / Energy",rationale="SPS improved 71.4 → 75.7 — district shows reform commitment. LNG megaproject construction peaks 2026-2028 within 60 miles.",       data_source="LDOE 2024 SPS, Better LA 2026"),
        ]
        db.add_all(opps)

        # ── 7. EXPANSION SITES ─────────────────────────────────────
        print("Seeding expansion sites...")
        sites = [
            ExpansionSite(parish="Caddo",        region="Northwest Louisiana (Shreveport)", demand_score=93, competition="Low",    population=21400, unserved=2300, school_type="STEM K-8",           timeline="Aug 2026", status="Ready",     sps=68.0, key_fact="C-grade district, highest tech job growth in NW LA"),
            ExpansionSite(parish="Tangipahoa",   region="Northshore / Hammond",             demand_score=88, competition="Medium", population=15800, unserved=1900, school_type="K-12 College Prep",  timeline="Aug 2026", status="Ready",     sps=75.0, key_fact="Grad rate surged +9.2pts — community momentum building"),
            ExpansionSite(parish="Rapides",      region="Central Louisiana (Alexandria)",   demand_score=82, competition="Low",    population=12100, unserved=1500, school_type="CTE High School",    timeline="Jan 2027", status="Planning",  sps=83.0, key_fact="B-grade district but largest skilled trades gap in Central LA"),
            ExpansionSite(parish="Webster",      region="North Louisiana (Minden)",         demand_score=77, competition="Low",    population=8700,  unserved=940,  school_type="K-8 Innovation School",timeline="Aug 2027",status="Exploring", sps=75.7, key_fact="C→B trajectory, LNG construction boom nearby through 2028"),
        ]
        db.add_all(sites)

        # ── 8. ALERTS ──────────────────────────────────────────────
        print("Seeding alerts...")
        alerts_data = [
            Alert(type="critical", parish="Caddo",            message="SPS of 68.0 — lowest in NW Louisiana. Enrollment declining 2.8% annually. Chronic absenteeism above state average."),
            Alert(type="critical", parish="Orleans",          message="Only 30% mastery rate on LEAP assessments. Child poverty at 26.2%. Enrollment declined for 3rd consecutive year."),
            Alert(type="warning",  parish="East Baton Rouge", message="SPS 71.0 — C grade despite being state capital. 46% of students below 2019 math achievement levels (Harvard ERS 2024)."),
            Alert(type="warning",  parish="Webster",          message="Teacher vacancy rate elevated. 23.1% poverty rate. Three schools moved from D to C — monitoring required."),
            Alert(type="info",     parish="Tangipahoa",       message="Graduation rate surged +9.2pts to 78.1% in 2024 — highest single-year improvement in state. 23 of 32 schools improved."),
            Alert(type="info",     parish="Vernon",           message="Top 10 school district statewide with SPS of 92.1 (A grade). Nine schools received top gains recognition from LDOE."),
        ]
        db.add_all(alerts_data)

        db.commit()
        print("\n✅ Database seeded successfully!")
        print("   Tables created: parishes, state_metrics, sps_history,")
        print("   proficiency_by_grade, workforce_gaps, opportunities,")
        print("   expansion_sites, alerts")
        print("\n   Run: uvicorn main:app --reload")
        print("   API docs: http://localhost:8000/docs")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
