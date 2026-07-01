/**
 * api.js
 *
 * All frontend API calls to the FastAPI backend.
 *
 * Instead of importing from mockData.js, all three dashboards
 * import from this file. If the backend is offline, it falls
 * back to the local mock data automatically so the demo never breaks.
 *
 * Usage in any component:
 *   import { getParishes, getStateSummary } from '../services/api'
 *   const parishes = await getParishes()
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

// ─── Generic fetch helper ─────────────────────────────────────────
async function apiFetch(endpoint, fallback = null) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    return await response.json()
  } catch (err) {
    console.warn(`API call failed for ${endpoint}:`, err.message)
    // Return fallback data so dashboard still works during demo
    return fallback
  }
}

// ─── Metrics ─────────────────────────────────────────────────────
export async function getStateSummary() {
  return apiFetch('/metrics/summary', {
    sps_score: 80.2, sps_grade: 'B', sps_trend: '+1.7',
    graduation_rate: 83.2, enrollment_total: 686000,
    poverty_rate: 18.7, child_poverty: 25.2,
    median_income: 60986, bachelors_rate: 27.8,
    employment_rate: 56.4, chronic_absence: 25.0,
    schools_a: 21, schools_b: 31, schools_c: 32, schools_d: 12, schools_f: 4,
    source: 'LDOE 2024 / Census ACS 2024 (cached)',
  })
}

export async function getSPSHistory() {
  return apiFetch('/metrics/sps-history', [
    { year: '2019', sps: 77.1, label: 'Pre-pandemic' },
    { year: '2021', sps: 72.0, label: 'COVID impact'  },
    { year: '2022', sps: 77.1, label: 'Recovery'      },
    { year: '2023', sps: 78.5, label: null             },
    { year: '2024', sps: 80.2, label: 'Current'       },
    { year: '2025', sps: 80.9, label: 'Latest'        },
  ])
}

export async function getProficiency() {
  return apiFetch('/metrics/proficiency', [
    { grade_band: 'K-2',  ela: 54, math: 57 },
    { grade_band: '3-5',  ela: 44, math: 41 },
    { grade_band: '6-8',  ela: 35, math: 32 },
    { grade_band: '9-12', ela: 30, math: 27 },
  ])
}

// ─── Parishes ────────────────────────────────────────────────────
export async function getParishes({ gap, grade, sortBy } = {}) {
  const params = new URLSearchParams()
  if (gap)    params.append('gap', gap)
  if (grade)  params.append('grade', grade)
  if (sortBy) params.append('sort_by', sortBy)
  const qs = params.toString() ? `?${params.toString()}` : ''
  const data = await apiFetch(`/parishes/${qs}`)
  return data?.parishes ?? data ?? []
}

export async function getParishSummary() {
  return apiFetch('/parishes/summary/stats', {
    average_sps: 80.2, average_graduation: 83.2,
    critical_parishes: 2, total_enrollment: 686000, total_parishes: 12,
  })
}

// ─── Workforce ───────────────────────────────────────────────────
export async function getWorkforceGaps() {
  return apiFetch('/workforce/', [
    { sector: 'Trade, Transport & Utilities', demand: 372800, supply: null, gap: null, growth_pct: '-0.2%' },
    { sector: 'Education & Health',           demand: 345800, supply: null, gap: null, growth_pct: '+2.9%' },
    { sector: 'Government',                   demand: 322500, supply: null, gap: null, growth_pct: '+1.4%' },
    { sector: 'Construction & Trades',        demand: 222300, supply: null, gap: null, growth_pct: '+0.9%' },
    { sector: 'Manufacturing',                demand: 140500, supply: null, gap: null, growth_pct: '+0.8%' },
  ])
}

// ─── Opportunities ────────────────────────────────────────────────
export async function getOpportunities({ impact } = {}) {
  const qs = impact ? `?impact=${impact}` : ''
  return apiFetch(`/opportunities/${qs}`, [])
}

// ─── Expansion sites ──────────────────────────────────────────────
export async function getExpansionSites({ status } = {}) {
  const qs = status ? `?status=${status}` : ''
  return apiFetch(`/sites/${qs}`, [])
}

// ─── Alerts ───────────────────────────────────────────────────────
export async function getAlerts({ type } = {}) {
  const qs = type ? `?type=${type}` : ''
  return apiFetch(`/alerts/${qs}`, [
    { id: 1, type: 'critical', parish: 'Caddo',            message: 'SPS of 68.0 — lowest in NW Louisiana. Enrollment declining 2.8% annually.' },
    { id: 2, type: 'critical', parish: 'Orleans',          message: 'Only 30% mastery rate on LEAP. Child poverty at 26.2%.' },
    { id: 3, type: 'warning',  parish: 'East Baton Rouge', message: 'SPS 71.0 — C grade despite being state capital.' },
    { id: 4, type: 'warning',  parish: 'Webster',          message: 'Teacher vacancy rate elevated. 23.1% poverty rate.' },
    { id: 5, type: 'info',     parish: 'Tangipahoa',       message: 'Graduation rate surged +9.2pts to 78.1% in 2024.' },
    { id: 6, type: 'info',     parish: 'Vernon',           message: 'Top 10 district statewide with SPS of 92.1 (A grade).' },
  ])
}

// ─── Chatbot ──────────────────────────────────────────────────────
export async function sendChatMessage({ message, userRole, conversationHistory = [] }) {
  try {
    const response = await fetch(`${BASE_URL}/chat/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        user_role: userRole,
        conversation_history: conversationHistory,
      }),
    })
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.detail || 'Chat request failed')
    }
    return await response.json()
  } catch (err) {
    console.error('Chat API error:', err)
    return {
      reply: "I'm having trouble connecting to the database right now. Please check that the backend server is running and try again.",
      sources: [],
    }
  }
}

export async function getChatSuggestions(role) {
  return apiFetch(`/chat/suggestions/${role}`, {
    suggestions: [
      "What are the lowest performing parishes in Louisiana?",
      "Show me the statewide SPS score trends.",
      "Which areas have the highest workforce gaps?",
    ]
  })
}

// ─── Opportunities summary ────────────────────────────────────────
export async function getOpportunitiesSummary() {
  return apiFetch('/opportunities/summary', {
    total: 0, high: 0, medium: 0, low: 0, total_students: 0, avg_score: 0
  })
}

export async function getOpportunitiesByParish(parishName) {
  return apiFetch(`/opportunities/by-parish/${encodeURIComponent(parishName)}`, [])
}

// ─── Sites summary & regions ──────────────────────────────────────
export async function getSitesSummary() {
  return apiFetch('/sites/summary', {
    ready: 0, planning: 0, exploring: 0, total_unserved: 0, max_demand_score: 0
  })
}

export async function getSiteRegions() {
  return apiFetch('/sites/regions', { regions: [] })
}

export async function getExpansionSitesFiltered({ status, region } = {}) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  if (region) params.append('region', region)
  const qs = params.toString() ? `?${params.toString()}` : ''
  return apiFetch(`/sites/${qs}`, [])
}

// ─── Choropleth / map data ────────────────────────────────────────
export async function getChoroplethData() {
  return apiFetch('/parishes/map/choropleth', [])
}

// ─── Parish metrics (single parish) ──────────────────────────────
export async function getParishMetrics(parishName) {
  return apiFetch(`/metrics/parish/${encodeURIComponent(parishName)}`, null)
}

// ─── Single parish detail ─────────────────────────────────────────
export async function getParishDetail(parishName) {
  return apiFetch(`/parishes/${encodeURIComponent(parishName)}`, null)
}

// ─── ML endpoints ─────────────────────────────────────────────────
export async function getEnrollmentForecast(parishName, years = 6) {
  return apiFetch(`/ml/forecast/${encodeURIComponent(parishName)}?years=${years}`, {
    parish: parishName,
    forecasts: [
      { year: 2025, predicted: 5000 },
      { year: 2026, predicted: 5050 },
      { year: 2027, predicted: 5100 },
      { year: 2028, predicted: 5150 },
      { year: 2029, predicted: 5200 },
      { year: 2030, predicted: 5250 },
    ],
    fallback: true,
  })
}

export async function getInvestmentScore(parishName) {
  return apiFetch(`/ml/investment/${encodeURIComponent(parishName)}`, {
    parish: parishName, score: 65, confidence: 0.7, rationale: 'Estimated', fallback: true
  })
}

export async function getRiskScore(parishName) {
  return apiFetch(`/ml/risk/${encodeURIComponent(parishName)}`, {
    parish: parishName, risk_level: 'Moderate', score: 0.45, factors: [], fallback: true
  })
}