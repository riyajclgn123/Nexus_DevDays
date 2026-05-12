/**
 * mockData.js
 *
 * Shared demo data for all three dashboards.
 * Replace these with real API calls to your FastAPI backend.
 *
 * Data shape mirrors what your backend will return from:
 *   GET /api/parishes        → parishData
 *   GET /api/metrics         → stateMetrics
 *   GET /api/opportunities   → opportunities
 *   GET /api/enrollment      → enrollmentTrend
 *   GET /api/workforce       → workforceData
 */

// ─── Louisiana parishes with education metrics ────────────────────
export const parishData = [
  { name: 'Orleans',        score: 42, enrollment: 41200, growth: -2.1, gap: 'Critical',  workforce: 78, proficiency: 31, graduation: 72, fundingNeed: 4.2 },
  { name: 'East Baton Rouge',score: 61, enrollment: 38900, growth:  1.4, gap: 'Moderate',  workforce: 65, proficiency: 48, graduation: 81, fundingNeed: 2.8 },
  { name: 'Jefferson',      score: 55, enrollment: 47100, growth: -0.8, gap: 'Moderate',  workforce: 70, proficiency: 44, graduation: 79, fundingNeed: 3.1 },
  { name: 'Caddo',          score: 38, enrollment: 22800, growth: -3.4, gap: 'Critical',  workforce: 55, proficiency: 28, graduation: 68, fundingNeed: 5.1 },
  { name: 'Calcasieu',      score: 67, enrollment: 19400, growth:  2.1, gap: 'Low',       workforce: 82, proficiency: 54, graduation: 87, fundingNeed: 1.4 },
  { name: 'St. Tammany',    score: 79, enrollment: 24600, growth:  3.2, gap: 'Low',       workforce: 88, proficiency: 67, graduation: 92, fundingNeed: 0.8 },
  { name: 'Lafourche',      score: 58, enrollment: 12300, growth: -1.1, gap: 'Moderate',  workforce: 61, proficiency: 45, graduation: 80, fundingNeed: 2.4 },
  { name: 'Rapides',        score: 49, enrollment: 18700, growth: -1.8, gap: 'High',      workforce: 58, proficiency: 37, graduation: 74, fundingNeed: 3.7 },
  { name: 'Tangipahoa',     score: 44, enrollment: 21100, growth:  0.3, gap: 'High',      workforce: 52, proficiency: 33, graduation: 71, fundingNeed: 4.0 },
  { name: 'Ouachita',       score: 53, enrollment: 17200, growth: -0.5, gap: 'Moderate',  workforce: 60, proficiency: 41, graduation: 78, fundingNeed: 2.9 },
  { name: 'Livingston',     score: 71, enrollment: 16800, growth:  4.1, gap: 'Low',       workforce: 79, proficiency: 59, graduation: 89, fundingNeed: 1.1 },
  { name: 'Iberia',         score: 41, enrollment: 11900, growth: -2.3, gap: 'High',      workforce: 49, proficiency: 30, graduation: 69, fundingNeed: 4.4 },
]

// ─── State-level summary metrics ─────────────────────────────────
export const stateMetrics = {
  avgProficiency:  41,
  graduationRate:  79,
  enrollmentTotal: 680000,
  criticalParishes: 4,
  fundingGap:      '$312M',
  workforceAlign:  63,
}

// ─── Enrollment trend (12 months) ────────────────────────────────
export const enrollmentTrend = [
  { month: 'Jun', value: 682000 },
  { month: 'Jul', value: 679000 },
  { month: 'Aug', value: 685000 },
  { month: 'Sep', value: 681000 },
  { month: 'Oct', value: 678000 },
  { month: 'Nov', value: 675000 },
  { month: 'Dec', value: 671000 },
  { month: 'Jan', value: 669000 },
  { month: 'Feb', value: 672000 },
  { month: 'Mar', value: 674000 },
  { month: 'Apr', value: 677000 },
  { month: 'May', value: 680000 },
]

// ─── Proficiency by grade band ────────────────────────────────────
export const proficiencyByGrade = [
  { grade: 'K-2',  ela: 58, math: 61 },
  { grade: '3-5',  ela: 47, math: 44 },
  { grade: '6-8',  ela: 38, math: 35 },
  { grade: '9-12', ela: 31, math: 28 },
]

// ─── Workforce demand by sector ───────────────────────────────────
export const workforceData = [
  { sector: 'Healthcare',   demand: 4200, supply: 1800, gap: 2400 },
  { sector: 'Technology',   demand: 3100, supply: 900,  gap: 2200 },
  { sector: 'Skilled Trades',demand: 5800, supply: 3200, gap: 2600 },
  { sector: 'Education',    demand: 2800, supply: 2100, gap: 700  },
  { sector: 'Energy',       demand: 3600, supply: 2400, gap: 1200 },
  { sector: 'Logistics',    demand: 2200, supply: 1600, gap: 600  },
]

// ─── Investment opportunities (for Funder dashboard) ──────────────
export const opportunities = [
  {
    id: 1,
    parish:   'Caddo',
    type:     'STEM Pathway School',
    score:    94,
    impact:   'High',
    students:  1200,
    cost:     '$2.4M',
    workforce: 'Technology / Energy',
    rationale: 'Lowest STEM proficiency in NW Louisiana. 3,100 tech jobs projected by 2028 within 30 miles.',
  },
  {
    id: 2,
    parish:   'Orleans',
    type:     'Early Literacy Program',
    score:    91,
    impact:   'High',
    students:  3400,
    cost:     '$1.8M',
    workforce: 'All sectors',
    rationale: 'K-2 ELA proficiency at 34%, lowest in metro. Strong correlation with long-term outcomes.',
  },
  {
    id: 3,
    parish:   'Tangipahoa',
    type:     'Healthcare Career Pathway',
    score:    87,
    impact:   'High',
    students:   800,
    cost:     '$1.2M',
    workforce: 'Healthcare',
    rationale: 'North Oaks Health projecting 600 new hires by 2027. No allied health pathway school within 20 miles.',
  },
  {
    id: 4,
    parish:   'Rapides',
    type:     'Skilled Trades Program',
    score:    83,
    impact:   'Medium',
    students:   950,
    cost:     '$900K',
    workforce: 'Skilled Trades',
    rationale: 'Central LA has the widest skilled trades gap (2,600 unfilled). Current CTE programs at 40% capacity.',
  },
  {
    id: 5,
    parish:   'Iberia',
    type:     'School Turnaround Investment',
    score:    79,
    impact:   'Medium',
    students:  1100,
    cost:     '$3.1M',
    workforce: 'Energy / Logistics',
    rationale: 'Three D-rated schools serving energy corridor. Workforce need highest in 10 years post-LNG expansion.',
  },
]

// ─── Expansion sites (for Operator dashboard) ─────────────────────
export const expansionSites = [
  {
    id: 1,
    parish:       'Caddo',
    region:       'Northwest Louisiana',
    demandScore:  92,
    competition:  'Low',
    population:   18400,
    unserved:     2100,
    schoolType:   'STEM K-8',
    timeline:     'Aug 2026',
    status:       'Ready',
  },
  {
    id: 2,
    parish:       'Tangipahoa',
    region:       'Northshore',
    demandScore:  88,
    competition:  'Medium',
    population:   14200,
    unserved:     1800,
    schoolType:   'K-12 College Prep',
    timeline:     'Aug 2026',
    status:       'Ready',
  },
  {
    id: 3,
    parish:       'Rapides',
    region:       'Central Louisiana',
    demandScore:  81,
    competition:  'Low',
    population:   11600,
    unserved:     1400,
    schoolType:   'CTE High School',
    timeline:     'Jan 2027',
    status:       'Planning',
  },
  {
    id: 4,
    parish:       'Iberia',
    region:       'Acadiana',
    demandScore:  76,
    competition:  'Medium',
    population:   9800,
    unserved:     980,
    schoolType:   'K-8 Arts Integration',
    timeline:     'Aug 2027',
    status:       'Exploring',
  },
]

// ─── Enrollment forecast ──────────────────────────────────────────
export const enrollmentForecast = [
  { year: '2024', actual: 680, projected: null },
  { year: '2025', actual: 677, projected: null },
  { year: '2026', actual: null, projected: 674 },
  { year: '2027', actual: null, projected: 671 },
  { year: '2028', actual: null, projected: 668 },
]

// ─── Alerts / notifications ───────────────────────────────────────
export const alerts = [
  { id: 1, type: 'critical', parish: 'Caddo',      message: 'Graduation rate dropped 4pts year-over-year to 68%' },
  { id: 2, type: 'critical', parish: 'Orleans',    message: 'Enrollment declined 2.1% — 3rd consecutive year' },
  { id: 3, type: 'warning',  parish: 'Rapides',    message: 'Math proficiency below state floor for 2 years' },
  { id: 4, type: 'warning',  parish: 'Tangipahoa', message: 'Teacher vacancy rate at 18%, above state average' },
  { id: 5, type: 'info',     parish: 'Livingston', message: 'Fastest growing enrollment in Louisiana (+4.1%)' },
]
