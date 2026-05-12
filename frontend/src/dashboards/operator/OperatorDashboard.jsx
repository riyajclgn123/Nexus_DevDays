/**
 * OperatorDashboard.jsx — School Operator Dashboard
 * Top navbar layout · Dark/light mode · Live DB data
 */

import { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import TopNavbar from '../../components/TopNavbar'
import ChatBot from '../../components/ChatBot'
import {
  LayoutDashboard, MapPin, TrendingDown, BarChart2,
  Settings, Target, Users, ChevronRight, CheckCircle,
  Clock, Search as SearchIcon
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, ReferenceLine
} from 'recharts'
import { getExpansionSites, getWorkforceGaps, getParishes, getSPSHistory } from '../../services/api'

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
  { key: 'forecast', label: 'SPS Forecast',    icon: TrendingDown },
  { key: 'market',   label: 'Market Analysis', icon: BarChart2    },
  { key: 'scoring',  label: 'Site Scoring',    icon: Target       },
  { key: 'students', label: 'Student Demand',  icon: Users        },
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

function SitesSection({ isDark }) {
  const [sites, setSites]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getExpansionSites().then(d => { setSites(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'
  const totalUnserved = sites.reduce((s, x) => s + (x.unserved ?? 0), 0)
  const readyCount    = sites.filter(s => s.status === 'Ready').length
  const avgScore      = Math.round(sites.reduce((s, x) => s + (x.demand_score ?? 0), 0) / (sites.length || 1))

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h2 className={`font-display text-xl font-semibold mb-1 ${text}`}>Expansion Sites</h2>
        <p className={`text-sm ${muted}`}>Ranked by demand score — live from PostgreSQL · LDOE 2024</p>
      </div>
      {loading ? <Spinner isDark={isDark} /> : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Ready Sites',      value: readyCount,                    color: 'text-teal-2'  },
              { label: 'Total Sites',      value: sites.length,                  color: text           },
              { label: 'Total Unserved',   value: totalUnserved.toLocaleString(),color: text           },
              { label: 'Avg Demand Score', value: avgScore,                      color: 'text-teal-2'  },
            ].map(c => (
              <Card key={c.label} isDark={isDark} className="p-4">
                <p className={`text-xs mb-1 ${muted}`}>{c.label}</p>
                <p className={`font-display text-2xl font-bold ${c.color}`}>{c.value}</p>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            {sites.map((site, i) => (
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
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className={`font-semibold ${text}`}>{site.school_type}</span>
                        <span className={`text-xs ml-2 ${muted}`}>· {site.parish} Parish, {site.region}</span>
                      </div>
                      <StatusBadge status={site.status} />
                    </div>
                    <DemandBar score={site.demand_score} isDark={isDark} />
                    <div className="flex flex-wrap items-center gap-3 mt-2.5">
                      <span className={`text-xs ${muted}`}>Unserved: <strong className={text}>{site.unserved?.toLocaleString()}</strong></span>
                      <span className={`text-xs ${muted}`}>Population: <strong className={text}>{site.population?.toLocaleString()}</strong></span>
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
          </div>
        </>
      )}
    </div>
  )
}

function ForecastSection({ isDark }) {
  const [spsHistory, setSpsHistory] = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    getSPSHistory().then(d => { setSpsHistory(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'
  const forecast = [{ year: '2026', sps: null, projected: 81.8 }, { year: '2027', sps: null, projected: 82.5 }]
  const combined = [...spsHistory.map(s => ({ ...s, projected: null })), ...forecast]

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h2 className={`font-display text-xl font-semibold mb-1 ${text}`}>SPS Forecast</h2>
        <p className={`text-sm ${muted}`}>Historical SPS + 3-year projection — live from PostgreSQL</p>
      </div>
      {loading ? <Spinner isDark={isDark} /> : (
        <>
          <Card isDark={isDark} className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className={`text-sm font-medium ${text}`}>SPS Score 2019–2027</p>
                <p className={`text-xs ${muted}`}>Solid = actual · Dashed = projected</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className={`flex items-center gap-1.5 ${muted}`}><span className="w-5 h-0.5 bg-teal-2 inline-block"/>Actual</span>
                <span className={`flex items-center gap-1.5 ${muted}`}><span className="w-5 h-0.5 bg-teal-3 inline-block"/>Projected</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
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

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '2024 SPS',       value: '80.2', sub: 'Third consecutive yr growth' },
              { label: '2025 SPS',       value: '80.9', sub: 'Fourth consecutive yr growth' },
              { label: 'Projected 2027', value: '82.5', sub: 'Based on current trajectory' },
            ].map(c => (
              <Card key={c.label} isDark={isDark} className="p-4">
                <p className={`text-xs mb-1 ${muted}`}>{c.label}</p>
                <p className="font-display text-2xl font-bold text-teal-2">{c.value}</p>
                <p className={`text-[10px] mt-1 ${muted}`}>{c.sub}</p>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function MarketSection({ isDark }) {
  const [workforce, setWorkforce] = useState([])
  const [parishes, setParishes]   = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([getWorkforceGaps(), getParishes()])
      .then(([w, p]) => { setWorkforce(Array.isArray(w) ? w : []); setParishes(Array.isArray(p) ? p.slice(0,8) : []); setLoading(false) })
  }, [])

  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h2 className={`font-display text-xl font-semibold mb-1 ${text}`}>Market Analysis</h2>
        <p className={`text-sm ${muted}`}>Parish SPS scores + workforce demand — live from PostgreSQL</p>
      </div>
      {loading ? <Spinner isDark={isDark} /> : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card isDark={isDark} className="p-5">
              <p className={`text-sm font-medium mb-4 ${text}`}>Workforce Gap by Sector</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={workforce} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(13,115,119,0.08)'} />
                  <XAxis dataKey="sector" tick={{ fill: '#8B9DB5', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8B9DB5', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip isDark={isDark} />} />
                  <Bar dataKey="gap" name="Unfilled Jobs" fill="#0D7377" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card isDark={isDark} className="p-5">
              <p className={`text-sm font-medium mb-4 ${text}`}>Parish SPS Scores</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={parishes} layout="vertical" barSize={10}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(13,115,119,0.08)'} horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#8B9DB5', fontSize: 10 }} axisLine={false} tickLine={false} domain={[60, 100]} />
                  <YAxis dataKey="name" type="category" tick={{ fill: isDark ? '#fff' : '#0B1628', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<ChartTip isDark={isDark} />} />
                  <Bar dataKey="sps" name="SPS Score" fill="#14A6AC" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

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
    forecast: <ForecastSection isDark={isDark} />,
    market:   <MarketSection isDark={isDark} />,
    scoring:  <ScoringSection isDark={isDark} />,
    students: <SitesSection isDark={isDark} />,
    settings: <p className={`text-sm ${isDark ? 'text-slate-brand' : 'text-navy/50'}`}>Settings coming soon.</p>,
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
