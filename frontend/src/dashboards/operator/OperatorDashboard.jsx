/**
 * OperatorDashboard.jsx — School Operator Dashboard
 */

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../../context/ThemeContext'
import TopNavbar from '../../components/TopNavbar'
import ChatBot from '../../components/ChatBot'
import ExportButton from '../../components/ExportButton'
import ParishMap from '../../components/ParishMap'
import SettingsPage from '../../components/SettingsPage'
import {
  LayoutDashboard, MapPin, TrendingDown, BarChart2,
  Settings, Target, Users, ChevronRight, CheckCircle,
  Clock, Search as SearchIcon, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, ReferenceLine
} from 'recharts'
import {
  getExpansionSites, getExpansionSitesFiltered, getWorkforceGaps,
  getParishes, getSPSHistory, getChoroplethData, getSitesSummary,
  getSiteRegions, getEnrollmentForecast, getParishMetrics, sendChatMessage
} from '../../services/api'

const ROLE_CONFIG = {
  label:      'School Operator',
  badgeBg:    'bg-teal-4',
  badgeText:  'text-teal',
  activeBg:   'bg-teal/12',
  activeText: 'text-teal',
  avatarRing: 'ring-teal-2',
}

const NAV_ITEMS = [
  { key: 'sites',    label: 'Expansion Sites', icon: MapPin       },
  { key: 'map',      label: 'Demand Map',      icon: LayoutDashboard },
  { key: 'forecast', label: 'Enrollment Forecast', icon: TrendingDown },
  { key: 'market',   label: 'Market Analysis', icon: BarChart2    },
  { key: 'scoring',  label: 'Site Scoring',    icon: Target       },
  { key: 'settings', label: 'Settings',        icon: Settings     },
]

function Spinner({ isDark }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-teal/30 border-t-teal rounded-full animate-spin-slow" />
        <span className={`text-xs font-mono ${isDark ? 'text-slate-brand' : 'text-navy/40'}`}>Fetching from PostgreSQL...</span>
      </div>
    </div>
  )
}

function Card({ isDark, children, className = '' }) {
  return (
    <div className={`rounded-xl border ${isDark ? 'bg-navy-2 border-white/8' : 'bg-white border-teal/12 shadow-card'} ${className}`}>
      {children}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    Ready:     'bg-emerald-50 text-emerald-700 border-emerald-200',
    Planning:  'bg-teal-4 text-teal border-teal/20',
    Exploring: 'bg-slate-3 text-slate-brand border-slate-2',
  }
  const icons = { Ready: <CheckCircle size={11}/>, Planning: <Clock size={11}/>, Exploring: <SearchIcon size={11}/> }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-medium ${map[status] ?? ''}`}>
      {icons[status]}{status}
    </span>
  )
}

function DemandBar({ score, isDark }) {
  const color = score >= 88 ? 'bg-teal-2' : score >= 80 ? 'bg-teal' : 'bg-teal/50'
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-teal/10'}`}>
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-mono w-6 ${isDark ? 'text-slate-brand' : 'text-navy/50'}`}>{score}</span>
    </div>
  )
}

function ChartTip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null
  return (
    <div className={`border rounded-lg px-3 py-2 text-xs ${isDark ? 'bg-navy-2 border-white/10' : 'bg-white border-teal/15 shadow-md'}`}>
      <p className="text-slate-brand mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color ?? '#0D7377' }}>{p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong></p>
      ))}
    </div>
  )
}

// ─── Sites Section ────────────────────────────────────────────────
function SitesSection({ isDark }) {
  const [sites, setSites]         = useState([])
  const [summary, setSummary]     = useState(null)
  const [regions, setRegions]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)
  const [statusFilter, setStatusFilter] = useState('All')
  const [regionFilter, setRegionFilter] = useState('All')

  useEffect(() => {
    Promise.all([getExpansionSites(), getSitesSummary(), getSiteRegions()])
      .then(([s, sum, r]) => {
        setSites(Array.isArray(s) ? s : [])
        setSummary(sum)
        setRegions(r?.regions || [])
        setLoading(false)
      })
  }, [])

  const filtered = sites.filter(s => {
    if (statusFilter !== 'All' && s.status !== statusFilter) return false
    if (regionFilter !== 'All' && s.region !== regionFilter) return false
    return true
  })

  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'

  const kpis = [
    { label: 'Expansion-Ready',  value: summary?.ready ?? sites.filter(s => s.status === 'Ready').length,    color: 'text-teal-2' },
    { label: 'Total Unserved',   value: (summary?.total_unserved ?? sites.reduce((a, s) => a + (s.unserved ?? 0), 0)).toLocaleString(), color: text },
    { label: 'Highest Demand',   value: summary?.max_demand_score ?? Math.max(...sites.map(s => s.demand_score || 0), 0), color: 'text-teal-2' },
    { label: 'Sites Tracked',    value: sites.length,                                                          color: text },
  ]

  const exportData = filtered.map(s => ({
    Parish: s.parish, Region: s.region, Demand: s.demand_score, Competition: s.competition,
    Unserved: s.unserved, Type: s.school_type, Timeline: s.timeline, Status: s.status,
  }))

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className={`font-display text-xl font-semibold mb-1 ${text}`}>Expansion Sites</h2>
          <p className={`text-sm ${muted}`}>Ranked by demand score — live from PostgreSQL · LDOE 2024</p>
        </div>
        <ExportButton data={exportData} filename="operator-sites" dashboardName="Operator" isDark={isDark} />
      </div>

      {loading ? <Spinner isDark={isDark} /> : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {kpis.map(c => (
              <Card key={c.label} isDark={isDark} className="p-4">
                <p className={`text-xs mb-1 ${muted}`}>{c.label}</p>
                <p className={`font-display text-2xl font-bold ${c.color}`}>{c.value}</p>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className={`text-xs ${muted}`}>Status:</span>
            {['All', 'Ready', 'Planning', 'Exploring'].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all
                  ${statusFilter === f ? 'bg-teal text-white' : isDark ? 'bg-white/8 border border-white/10 text-slate-brand hover:text-white' : 'bg-white border border-teal/15 text-navy/60 hover:text-navy'}`}>
                {f}
              </button>
            ))}
            {regions.length > 0 && (
              <>
                <span className={`text-xs ${muted} ml-2`}>Region:</span>
                <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer outline-none border transition-all
                    ${isDark ? 'bg-navy-2 border-white/10 text-white' : 'bg-white border-teal/15 text-navy'}`}>
                  <option value="All">All Regions</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </>
            )}
          </div>

          <div className="space-y-3">
            {filtered.map((site, i) => (
              <div key={site.id}
                onClick={() => setSelected(selected === site.id ? null : site.id)}
                className={`border rounded-xl p-5 cursor-pointer transition-all
                  ${selected === site.id
                    ? (isDark ? 'border-teal-2 ring-2 ring-teal/20 bg-navy-2' : 'border-teal ring-2 ring-teal/15 bg-teal-4/20')
                    : (isDark ? 'bg-navy-2 border-white/8 hover:border-teal/30' : 'bg-white border-teal/12 shadow-card hover:border-teal/30')
                  }`}>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-center text-xs font-bold text-teal flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                      <div>
                        <span className={`font-semibold ${text}`}>{site.school_type}</span>
                        <span className={`text-xs ml-2 ${muted}`}>· {site.parish} Parish, {site.region}</span>
                      </div>
                      <StatusBadge status={site.status} />
                    </div>
                    <DemandBar score={site.demand_score} isDark={isDark} />
                    <div className="flex flex-wrap items-center gap-3 mt-2.5">
                      <span className={`text-xs ${muted}`}>Unserved: <strong className={text}>{site.unserved?.toLocaleString()}</strong></span>
                      <span className={`text-xs ${muted}`}>Competition: <strong className={site.competition === 'Low' ? 'text-teal-2' : 'text-amber-500'}>{site.competition}</strong></span>
                      <span className={`text-xs ${muted}`}>Open: <strong className={text}>{site.timeline}</strong></span>
                    </div>
                    {selected === site.id && (
                      <div className="mt-4 pt-4 border-t border-teal/10 grid grid-cols-2 gap-3 animate-fade-up">
                        <div className={`rounded-lg p-3 ${isDark ? 'bg-teal/10' : 'bg-teal-4/50'}`}>
                          <p className="text-teal text-xs font-mono uppercase tracking-wider mb-1">Key Insight</p>
                          <p className={`text-xs leading-relaxed ${muted}`}>{site.key_fact}</p>
                        </div>
                        <div className={`rounded-lg p-3 ${isDark ? 'bg-navy/60' : 'bg-slate-3/60'}`}>
                          <p className={`text-xs font-mono uppercase tracking-wider mb-1 ${muted}`}>District SPS</p>
                          <p className="text-2xl font-bold text-teal font-mono">{site.sps}</p>
                          <p className={`text-[10px] ${muted}`}>out of 150</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className={`text-center py-8 text-sm ${muted}`}>No sites match the current filters.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Demand Map Section ───────────────────────────────────────────
function DemandMapSection({ isDark }) {
  const [mapData, setMapData]     = useState([])
  const [sites, setSites]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [highlighted, setHighlighted] = useState(null)

  useEffect(() => {
    Promise.all([getChoroplethData(), getExpansionSites()])
      .then(([choropleth, s]) => {
        const choroArr = Array.isArray(choropleth) ? choropleth : []
        // Build map data from expansion sites (demand_score) joined with choropleth coords
        const siteMap = {}
        if (Array.isArray(s)) s.forEach(site => { siteMap[site.parish] = site })
        const data = choroArr.map(p => {
          const site = siteMap[p.name]
          return {
            parish: p.name,
            value:  site?.demand_score ?? Math.round(p.sps ?? 50),
            label:  `Demand: ${site?.demand_score ?? 'N/A'} · Unserved: ${site?.unserved?.toLocaleString() ?? 'N/A'}`,
          }
        })
        setMapData(data)
        setSites(Array.isArray(s) ? s : [])
        setLoading(false)
      })
  }, [])

  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'

  const highlightedSite = highlighted ? sites.find(s => s.parish === highlighted || s.parish?.includes(highlighted)) : null

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h2 className={`font-display text-xl font-semibold mb-1 ${text}`}>Demand Heat Map</h2>
        <p className={`text-sm ${muted}`}>Expansion demand by parish — click to filter sites</p>
      </div>
      {loading ? <Spinner isDark={isDark} /> : (
        <>
          <ParishMap
            data={mapData}
            colorMetric="demand"
            title="School Expansion Demand by Parish"
            onParishClick={setHighlighted}
            isDark={isDark}
          />
          {highlightedSite && (
            <Card isDark={isDark} className="p-4 animate-fade-up">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`font-semibold ${text}`}>{highlightedSite.parish} Parish</p>
                  <p className={`text-xs ${muted} mt-0.5`}>{highlightedSite.region} · {highlightedSite.school_type}</p>
                </div>
                <StatusBadge status={highlightedSite.status} />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                {[
                  ['Demand Score', highlightedSite.demand_score],
                  ['Unserved',     highlightedSite.unserved?.toLocaleString()],
                  ['Competition',  highlightedSite.competition],
                ].map(([k, v]) => (
                  <div key={k} className={`rounded-lg p-3 ${isDark ? 'bg-teal/10' : 'bg-teal-4/40'}`}>
                    <p className={`text-[10px] uppercase tracking-wider ${muted}`}>{k}</p>
                    <p className={`font-bold text-sm mt-0.5 ${text}`}>{v}</p>
                  </div>
                ))}
              </div>
              <p className={`text-xs mt-3 leading-relaxed ${muted}`}>{highlightedSite.key_fact}</p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

// ─── Enrollment Forecast ──────────────────────────────────────────
function ForecastSection({ isDark }) {
  const [parishes, setParishes]     = useState([])
  const [spsHistory, setSpsHistory] = useState([])
  const [selectedParish, setSelectedParish] = useState('')
  const [forecast, setForecast]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [fcLoading, setFcLoading]   = useState(false)

  useEffect(() => {
    Promise.all([getParishes(), getSPSHistory()])
      .then(([p, s]) => {
        const arr = Array.isArray(p) ? p : []
        setParishes(arr)
        setSpsHistory(Array.isArray(s) ? s : [])
        if (arr.length) setSelectedParish(arr[0].name)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!selectedParish) return
    setFcLoading(true)
    getEnrollmentForecast(selectedParish, 6).then(d => {
      setForecast(d)
      setFcLoading(false)
    })
  }, [selectedParish])

  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'

  const selectedParishData = parishes.find(p => p.name === selectedParish)

  // Build combined chart: historical SPS + forecast enrollment trend
  const fcProjected = forecast?.forecasts || []
  const fcChartData = fcProjected.map(f => ({
    year:      String(f.year),
    forecast:  f.predicted,
    projected: null,
  }))
  // Add current as the starting point
  if (selectedParishData?.enrollment && fcChartData.length > 0) {
    fcChartData.unshift({ year: '2024', forecast: null, historical: selectedParishData.enrollment })
  }

  const spsData = spsHistory.map(s => ({ ...s, projected: null }))
  const spsProjected = [{ year: '2026', sps: null, projected: 81.8 }, { year: '2027', sps: null, projected: 82.5 }]
  const combined = [...spsData, ...spsProjected]

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h2 className={`font-display text-xl font-semibold mb-1 ${text}`}>Enrollment Forecast</h2>
        <p className={`text-sm ${muted}`}>ML-powered enrollment projections per parish</p>
      </div>
      {loading ? <Spinner isDark={isDark} /> : (
        <>
          {/* Parish selector */}
          <div className="flex items-center gap-3">
            <label className={`text-xs font-medium ${muted}`}>Parish:</label>
            <select value={selectedParish} onChange={e => setSelectedParish(e.target.value)}
              className={`px-3 py-2 rounded-xl text-sm outline-none border cursor-pointer transition-all
                ${isDark ? 'bg-navy-2 border-white/10 text-white' : 'bg-white border-teal/15 text-navy shadow-sm'}`}>
              {parishes.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
            {forecast?.fallback && (
              <span className={`text-[10px] px-2 py-1 rounded border ${isDark ? 'bg-white/5 border-white/8 text-slate-brand' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                Trend extrapolation (ML model training needed)
              </span>
            )}
          </div>

          {fcLoading ? (
            <div className="flex items-center gap-2 py-8 justify-center">
              <div className="w-5 h-5 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
              <span className={`text-xs ${muted}`}>Running ML forecast…</span>
            </div>
          ) : (
            <Card isDark={isDark} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className={`text-sm font-medium ${text}`}>{selectedParish} — Enrollment Forecast 2024–2030</p>
                  <p className={`text-xs ${muted}`}>Solid = current · Dashed = ML projected</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className={`flex items-center gap-1.5 ${muted}`}><span className="w-5 h-0.5 bg-teal-2 inline-block"/>Actual</span>
                  <span className={`flex items-center gap-1.5 ${muted}`}><span className="w-5 h-0.5 bg-gold inline-block" style={{borderTop:'2px dashed #F5A623'}}/>Forecast</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={fcChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(13,115,119,0.08)'} />
                  <XAxis dataKey="year" tick={{ fill: '#8B9DB5', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8B9DB5', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip isDark={isDark} />} />
                  <Line type="monotone" dataKey="historical" name="Actual" stroke="#2EC4B6" strokeWidth={2.5} dot={{ fill: '#2EC4B6', r: 4 }} connectNulls={false} />
                  <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#F5A623" strokeWidth={2} strokeDasharray="5 4" dot={{ fill: '#F5A623', r: 4 }} connectNulls={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* KPIs for selected parish */}
          {selectedParishData && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Current Enrollment', value: selectedParishData.enrollment?.toLocaleString() ?? '—', sub: '2024-25 school year' },
                { label: 'Annual Growth',       value: `${selectedParishData.growth ?? 0}%`,                   sub: 'Year-over-year' },
                { label: '2030 Projected',      value: fcProjected.at(-1)?.predicted?.toLocaleString() ?? '—', sub: 'ML forecast' },
              ].map(c => (
                <Card key={c.label} isDark={isDark} className="p-4">
                  <p className={`text-xs mb-1 ${muted}`}>{c.label}</p>
                  <p className="font-display text-xl font-bold text-teal-2">{c.value}</p>
                  <p className={`text-[10px] mt-1 ${muted}`}>{c.sub}</p>
                </Card>
              ))}
            </div>
          )}

          {/* Statewide SPS trend */}
          <Card isDark={isDark} className="p-5">
            <p className={`text-sm font-medium mb-4 ${text}`}>Statewide SPS Trend 2019–2027</p>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={combined}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(13,115,119,0.08)'} />
                <XAxis dataKey="year" tick={{ fill: '#8B9DB5', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8B9DB5', fontSize: 11 }} axisLine={false} tickLine={false} domain={[68, 86]} />
                <Tooltip content={<ChartTip isDark={isDark} />} />
                <ReferenceLine x="2025" stroke="rgba(13,115,119,0.3)" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="sps"       name="Actual"    stroke="#0D7377" strokeWidth={2.5} dot={{ fill: '#0D7377', r: 4 }} connectNulls={false} />
                <Line type="monotone" dataKey="projected" name="Projected" stroke="#7DDFE3" strokeWidth={2} strokeDasharray="5 4" dot={{ fill: '#7DDFE3', r: 4 }} connectNulls={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </div>
  )
}

// ─── Market Analysis ──────────────────────────────────────────────
function MarketSection({ isDark }) {
  const [workforce, setWorkforce]   = useState([])
  const [parishes, setParishes]     = useState([])
  const [selectedParish, setSelectedParish] = useState('')
  const [metrics, setMetrics]       = useState(null)
  const [aiSummary, setAiSummary]   = useState('')
  const [loading, setLoading]       = useState(true)
  const [aiLoading, setAiLoading]   = useState(false)

  useEffect(() => {
    Promise.all([getWorkforceGaps(), getParishes()])
      .then(([w, p]) => {
        setWorkforce(Array.isArray(w) ? w : [])
        const arr = Array.isArray(p) ? p : []
        setParishes(arr)
        if (arr.length) setSelectedParish(arr[0].name)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!selectedParish) return
    getParishMetrics(selectedParish).then(m => setMetrics(m))
    // AI summary
    setAiLoading(true)
    setAiSummary('')
    sendChatMessage({
      message: `Summarize the expansion opportunity in ${selectedParish} Parish for a charter school operator in 3 concise sentences.`,
      userRole: 'operator',
      conversationHistory: [],
    }).then(r => {
      setAiSummary(r?.reply || '')
      setAiLoading(false)
    })
  }, [selectedParish])

  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h2 className={`font-display text-xl font-semibold mb-1 ${text}`}>Market Analysis</h2>
        <p className={`text-sm ${muted}`}>Parish-level intelligence for expansion decisions</p>
      </div>
      {loading ? <Spinner isDark={isDark} /> : (
        <>
          {/* Parish selector */}
          <div className="flex items-center gap-3">
            <label className={`text-xs font-medium ${muted}`}>Parish:</label>
            <select value={selectedParish} onChange={e => setSelectedParish(e.target.value)}
              className={`px-3 py-2 rounded-xl text-sm outline-none border cursor-pointer
                ${isDark ? 'bg-navy-2 border-white/10 text-white' : 'bg-white border-teal/15 text-navy shadow-sm'}`}>
              {parishes.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Demographics */}
            {metrics && (
              <Card isDark={isDark} className="p-5">
                <p className={`text-sm font-medium mb-3 ${text}`}>{selectedParish} — Demographics</p>
                <div className="space-y-2.5">
                  {[
                    ['SPS Score',     `${metrics.sps}/150 (${metrics.grade})`,    'text-teal-2'],
                    ['Poverty Rate',  `${metrics.poverty}%`,                       metrics.poverty > 25 ? 'text-red-400' : text],
                    ['Enrollment',    metrics.enrollment?.toLocaleString() + ' students', text],
                    ['Graduation',    `${metrics.graduation}%`,                    'text-teal-2'],
                    ['Proficiency',   `${metrics.proficiency}%`,                   text],
                    ['Gap Level',     metrics.gap,                                 metrics.gap === 'Critical' ? 'text-red-400' : 'text-amber-500'],
                    ['Trend',         metrics.trend,                               metrics.trend === 'Improving' ? 'text-teal-2' : 'text-amber-500'],
                  ].map(([label, val, cls]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className={`text-xs ${muted}`}>{label}</span>
                      <span className={`text-xs font-semibold ${cls}`}>{val}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Workforce gap chart */}
            <Card isDark={isDark} className="p-5">
              <p className={`text-sm font-medium mb-4 ${text}`}>Workforce Gap by Sector</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={workforce} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(13,115,119,0.08)'} />
                  <XAxis dataKey="sector" tick={{ fill: '#8B9DB5', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8B9DB5', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip isDark={isDark} />} />
                  <Bar dataKey="gap" name="Unfilled Jobs" fill="#2EC4B6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* AI Summary */}
          <Card isDark={isDark} className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-teal to-teal-2 flex items-center justify-center flex-shrink-0">
                <Sparkles size={12} className="text-white" />
              </div>
              <p className={`text-sm font-medium ${text}`}>AI Expansion Summary — {selectedParish}</p>
            </div>
            {aiLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border border-teal/30 border-t-teal rounded-full animate-spin" />
                <span className={`text-xs ${muted}`}>Generating AI summary…</span>
              </div>
            ) : aiSummary ? (
              <p className={`text-xs leading-relaxed ${muted}`}>{aiSummary}</p>
            ) : (
              <p className={`text-xs ${muted}`}>Select a parish to generate an AI expansion summary.</p>
            )}
          </Card>

          {/* Top expansion signals */}
          <div className={`rounded-xl border p-4 ${isDark ? 'bg-teal/8 border-teal/15' : 'bg-teal-4/30 border-teal/15'}`}>
            <p className="text-teal font-semibold text-sm mb-3 flex items-center gap-2">
              <Target size={14} /> Top Expansion Signals — from Database
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { parish: 'Caddo',      signal: 'Lowest SPS (68.0) in NW Louisiana. Highest tech job growth. No STEM school within 25 miles.' },
                { parish: 'Tangipahoa', signal: 'Grad rate surged +9.2pts to 78.1%. Healthcare sector gap. Community momentum is real.' },
                { parish: 'Rapides',    signal: 'B-grade district but largest skilled trades gap in Central LA. LNG boom through 2028.' },
              ].map(s => (
                <div key={s.parish} className={`rounded-lg p-3 border ${isDark ? 'bg-navy/60 border-teal/10' : 'bg-white border-teal/12'}`}>
                  <p className="font-semibold text-teal text-xs mb-1">{s.parish} Parish</p>
                  <p className={`text-xs leading-relaxed ${muted}`}>{s.signal}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Scoring Methodology ──────────────────────────────────────────
function ScoringSection({ isDark }) {
  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'
  const criteria = [
    { label: 'Student Demand',      weight: 30, desc: 'Unserved students in target catchment area (5-mile radius)' },
    { label: 'Competition Level',   weight: 25, desc: 'Number of existing quality schools in the area' },
    { label: 'Workforce Alignment', weight: 20, desc: 'Match between planned school type and local job projections' },
    { label: 'Demographics',        weight: 15, desc: 'Concentration of underserved and high-need populations' },
    { label: 'Growth Trajectory',   weight: 10, desc: 'Population and SPS growth rate in the parish' },
  ]
  return (
    <div className="animate-fade-up space-y-4">
      <div>
        <h2 className={`font-display text-xl font-semibold mb-1 ${text}`}>Site Scoring Methodology</h2>
        <p className={`text-sm ${muted}`}>How the demand score (0–100) is calculated</p>
      </div>
      <div className="space-y-3">
        {criteria.map(c => (
          <Card key={c.label} isDark={isDark} className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center text-teal font-bold font-mono text-sm flex-shrink-0">
              {c.weight}%
            </div>
            <div>
              <p className={`font-semibold text-sm ${text}`}>{c.label}</p>
              <p className={`text-xs mt-0.5 ${muted}`}>{c.desc}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function OperatorDashboard() {
  const { isDark } = useTheme()
  const [active, setActive] = useState('sites')
  const bg = isDark ? 'bg-navy' : 'bg-slate-3/30'

  const sections = {
    sites:    <SitesSection isDark={isDark} />,
    map:      <DemandMapSection isDark={isDark} />,
    forecast: <ForecastSection isDark={isDark} />,
    market:   <MarketSection isDark={isDark} />,
    scoring:  <ScoringSection isDark={isDark} />,
    settings: <SettingsPage isDark={isDark} />,
  }

  return (
    <div className={`min-h-screen ${bg}`} style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <TopNavbar navItems={NAV_ITEMS} active={active} setActive={setActive} roleConfig={ROLE_CONFIG} />
      <main className="max-w-7xl mx-auto px-6 py-7">
        {sections[active] ?? sections.sites}
      </main>
      <ChatBot />
    </div>
  )
}
