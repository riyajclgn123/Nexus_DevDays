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
    { sector: 'Skilled Trades', demand: 6200, supply: 3400, gap: 2800, growth_pct: '+8%'  },
    { sector: 'Healthcare',     demand: 4800, supply: 1900, gap: 2900, growth_pct: '+12%' },
    { sector: 'Energy/LNG',     demand: 4100, supply: 2600, gap: 1500, growth_pct: '+22%' },
    { sector: 'Technology',     demand: 3400, supply: 980,  gap: 2420, growth_pct: '+18%' },
    { sector: 'Education',      demand: 3100, supply: 2200, gap: 900,  growth_pct: '+4%'  },
    { sector: 'Logistics',      demand: 2600, supply: 1800, gap: 800,  growth_pct: '+6%'  },
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