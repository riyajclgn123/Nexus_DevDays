/**
 * PolicyDashboard.jsx — Policymaker Dashboard
 * Top navbar layout · Dark/light mode · Live DB data
 */

import { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import TopNavbar from '../../components/TopNavbar'
import ChatBot from '../../components/ChatBot'
import {
  LayoutDashboard, Map, TrendingUp, AlertTriangle,
  BookOpen, Users, Settings, Search, ChevronUp, ChevronDown, Minus
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  getStateSummary, getParishes, getSPSHistory, getProficiency, getAlerts
} from '../../services/api'

const ROLE_CONFIG = {
  label:      'Policymaker',
  badgeBg:    'bg-teal/15',
  badgeText:  'text-teal-2',
  activeBg:   'bg-teal/15',
  activeText: 'text-teal-2',
  avatarRing: 'ring-teal-2',
}

const NAV_ITEMS = [
  { key: 'overview',    label: 'State Overview',     icon: LayoutDashboard },
  { key: 'parishes',    label: 'Parish Performance', icon: Map             },
  { key: 'trends',      label: 'SPS Trends',         icon: TrendingUp      },
  { key: 'alerts',      label: 'Alerts',             icon: AlertTriangle   },
  { key: 'performance', label: 'Academic Data',      icon: BookOpen        },
  { key: 'settings',    label: 'Settings',           icon: Settings        },
]

// ─── Shared helpers ───────────────────────────────────────────────
function Spinner({ isDark }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-teal/30 border-t-teal-2 rounded-full animate-spin-slow" />
        <span className={`text-xs font-mono ${isDark ? 'text-slate-brand' : 'text-navy/40'}`}>
          Fetching from PostgreSQL...
        </span>
      </div>
    </div>
  )
}

function Card({ isDark, children, className = '' }) {
  return (
    <div className={`rounded-xl border p-4 ${isDark ? 'bg-navy-2 border-white/8' : 'bg-white border-navy/8 shadow-card'} ${className}`}>
      {children}
    </div>
  )
}

function GapBadge({ gap }) {
  const map = {
    Critical: 'bg-red-500/15 text-red-400 border-red-500/20',
    High:     'bg-orange-500/15 text-orange-400 border-orange-500/20',
    Moderate: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    Low:      'bg-teal/15 text-teal-2 border-teal/20',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${map[gap] ?? ''}`}>{gap}</span>
}

function ScoreBar({ score, isDark }) {
  const pct   = Math.round((score / 150) * 100)
  const color = score >= 85 ? 'bg-teal-2' : score >= 70 ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-navy/8'}`}>
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs w-8 text-right font-mono ${isDark ? 'text-slate-brand' : 'text-navy/50'}`}>{score}</span>
    </div>
  )
}

function Growth({ val }) {
  if (val > 0) return <span className="flex items-center gap-0.5 text-teal-2 text-xs"><ChevronUp size={12}/>{val}%</span>
  if (val < 0) return <span className="flex items-center gap-0.5 text-red-400 text-xs"><ChevronDown size={12}/>{Math.abs(val)}%</span>
  return <span className="flex items-center gap-0.5 text-slate-brand text-xs"><Minus size={12}/>0%</span>
}

function ChartTip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null
  return (
    <div className={`border rounded-lg px-3 py-2 text-xs ${isDark ? 'bg-navy-2 border-white/10' : 'bg-white border-navy/10 shadow-md'}`}>
      <p className="text-slate-brand mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong></p>
      ))}
    </div>
  )
}

// ─── Overview ─────────────────────────────────────────────────────
function OverviewSection({ isDark }) {
  const [summary, setSummary]       = useState(null)
  const [proficiency, setProficiency] = useState([])
  const [alerts, setAlerts]         = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([getStateSummary(), getProficiency(), getAlerts({ type: 'critical' })])
      .then(([s, p, a]) => { setSummary(s); setProficiency(p); setAlerts(a); setLoading(false) })
  }, [])

  if (loading) return <Spinner isDark={isDark} />

  const text  = isDark ? 'text-white'        : 'text-navy'
  const muted = isDark ? 'text-slate-brand'  : 'text-navy/50'

  const metrics = [
    { label: 'SPS Score',          value: `${summary?.sps_score}/150`,    sub: `Grade ${summary?.sps_grade} · ${summary?.sps_trend} pts`,  color: 'text-teal-2'     },
    { label: 'Graduation Rate',    value: `${summary?.graduation_rate}%`, sub: '4-year cohort 2022-23',                                    color: 'text-teal-2'     },
    { label: 'Enrollment',         value: `${((summary?.enrollment_total??0)/1000).toFixed(0)}K`, sub: 'K-12 public 2024-25',              color: text              },
    { label: 'Poverty Rate',       value: `${summary?.poverty_rate}%`,    sub: 'vs 12.1% national',                                        color: 'text-red-400'    },
    { label: 'Chronic Absence',    value: `${summary?.chronic_absence}%`, sub: 'Up from 18% pre-pandemic',                                 color: 'text-orange-400' },
    { label: 'A/B Schools',        value: `${(summary?.schools_a??0)+(summary?.schools_b??0)}%`, sub: `A:${summary?.schools_a}% B:${summary?.schools_b}% C:${summary?.schools_c}%`, color: 'text-teal-3' },
  ]

  const profData = proficiency.map(p => ({ grade: p.grade_band, ela: p.ela, math: p.math }))

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h2 className={`font-display text-xl font-semibold mb-1 ${text}`}>State Overview</h2>
        <p className={`text-sm ${muted}`}>Louisiana K-12 — live data from PostgreSQL · LDOE 2024 + Census ACS 2024</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics.map(m => (
          <Card key={m.label} isDark={isDark}>
            <p className={`text-xs mb-1 ${muted}`}>{m.label}</p>
            <p className={`font-display text-xl font-bold ${m.color}`}>{m.value}</p>
            <p className={`text-[10px] mt-1 ${muted} opacity-70`}>{m.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card isDark={isDark}>
          <p className={`text-sm font-medium mb-0.5 ${text}`}>Proficiency by Grade Band</p>
          <p className={`text-xs mb-4 ${muted}`}>LEAP mastery rates — ELA vs Math %</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={profData} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
              <XAxis dataKey="grade" tick={{ fill: '#8B9DB5', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8B9DB5', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip isDark={isDark} />} />
              <Bar dataKey="ela"  name="ELA"  fill="#14A6AC" radius={[4,4,0,0]} />
              <Bar dataKey="math" name="Math" fill="#C9A84C" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card isDark={isDark}>
          <p className={`text-sm font-medium mb-4 ${text}`}>School Grade Distribution · LDOE 2025</p>
          <div className="space-y-3">
            {[
              { grade: 'A', pct: summary?.schools_a, color: 'bg-teal-2'     },
              { grade: 'B', pct: summary?.schools_b, color: 'bg-teal'       },
              { grade: 'C', pct: summary?.schools_c, color: 'bg-yellow-400' },
              { grade: 'D', pct: summary?.schools_d, color: 'bg-orange-400' },
              { grade: 'F', pct: summary?.schools_f, color: 'bg-red-400'    },
            ].map(r => (
              <div key={r.grade} className="flex items-center gap-3">
                <span className={`text-xs font-mono font-bold w-4 ${text}`}>{r.grade}</span>
                <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/8' : 'bg-navy/8'}`}>
                  <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} />
                </div>
                <span className={`text-xs font-mono w-8 text-right ${muted}`}>{r.pct}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {alerts.length > 0 && (
        <div className={`rounded-xl border p-4 ${isDark ? 'bg-red-500/8 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
          <p className="text-red-400 text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle size={14} /> Priority Alerts — Live from Database
          </p>
          <div className="space-y-2">
            {alerts.map(a => (
              <div key={a.id} className="flex items-start gap-2 text-xs">
                <span className="text-red-400 font-mono font-bold flex-shrink-0">{a.parish}</span>
                <span className={muted}>{a.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Parish Section ───────────────────────────────────────────────
function ParishSection({ isDark }) {
  const [parishes, setParishes] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [sortKey, setSortKey]   = useState('sps')
  const [sortDir, setSortDir]   = useState('desc')

  useEffect(() => {
    getParishes().then(d => { setParishes(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = parishes
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      return typeof a[sortKey] === 'number'
        ? (a[sortKey] - b[sortKey]) * mul
        : String(a[sortKey]).localeCompare(String(b[sortKey])) * mul
    })

  const text    = isDark ? 'text-white'       : 'text-navy'
  const muted   = isDark ? 'text-slate-brand' : 'text-navy/50'
  const tableBg = isDark ? 'bg-navy-2 border-white/8' : 'bg-white border-navy/8 shadow-card'
  const rowHover= isDark ? 'hover:bg-white/4' : 'hover:bg-teal-4/40'
  const altRow  = isDark ? 'bg-white/2'       : 'bg-slate-3/30'
  const inputBg = isDark ? 'bg-navy-2 border-white/10 text-white placeholder-slate-brand' : 'bg-white border-navy/10 text-navy placeholder-navy/30'

  const cols = [
    { key: 'name',        label: 'Parish'      },
    { key: 'sps',         label: 'SPS Score'   },
    { key: 'proficiency', label: 'Mastery %'   },
    { key: 'graduation',  label: 'Grad Rate %' },
    { key: 'growth',      label: 'Enroll. Δ'   },
    { key: 'gap',         label: 'Gap Level'   },
  ]

  return (
    <div className="animate-fade-up space-y-4">
      <div>
        <h2 className={`font-display text-xl font-semibold mb-1 ${text}`}>Parish Performance</h2>
        <p className={`text-sm ${muted}`}>Live from PostgreSQL · LDOE 2024 School Performance Scores</p>
      </div>

      {loading ? <Spinner isDark={isDark} /> : (
        <>
          <div className="relative w-72">
            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
            <input type="text" placeholder="Search parish..." value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full pl-8 pr-3 py-2.5 border rounded-xl text-sm outline-none focus:border-teal-2 transition-all ${inputBg}`} />
          </div>

          <div className={`rounded-xl border overflow-hidden ${tableBg}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-white/8 bg-navy-3/40' : 'border-navy/8 bg-slate-3/60'}`}>
                  {cols.map(c => (
                    <th key={c.key} onClick={() => toggleSort(c.key)}
                      className={`text-left px-4 py-3 text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors select-none ${muted} hover:${text}`}>
                      <span className="flex items-center gap-1">{c.label}
                        {sortKey === c.key && (sortDir === 'asc' ? <ChevronUp size={10}/> : <ChevronDown size={10}/>)}
                      </span>
                    </th>
                  ))}
                  <th className={`text-left px-4 py-3 text-xs font-mono uppercase tracking-wider ${muted}`}>Score Bar</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} className={`border-b transition-colors ${isDark ? 'border-white/5' : 'border-navy/5'} ${rowHover} ${i % 2 !== 0 ? altRow : ''}`}>
                    <td className={`px-4 py-3 font-medium ${text}`}>{p.name}</td>
                    <td className="px-4 py-3 font-mono text-teal-2 font-bold">{p.sps}</td>
                    <td className={`px-4 py-3 ${muted}`}>{p.proficiency}%</td>
                    <td className={`px-4 py-3 ${muted}`}>{p.graduation}%</td>
                    <td className="px-4 py-3"><Growth val={p.growth} /></td>
                    <td className="px-4 py-3"><GapBadge gap={p.gap} /></td>
                    <td className="px-4 py-3 w-32"><ScoreBar score={p.sps} isDark={isDark} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={`text-xs text-right ${muted}`}>{filtered.length} parishes · Source: LDOE 2024</p>
        </>
      )}
    </div>
  )
}

// ─── Trends Section ───────────────────────────────────────────────
function TrendsSection({ isDark }) {
  const [spsHistory, setSpsHistory]   = useState([])
  const [proficiency, setProficiency] = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    Promise.all([getSPSHistory(), getProficiency()])
      .then(([s, p]) => { setSpsHistory(s); setProficiency(p); setLoading(false) })
  }, [])

  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'
  const profData = proficiency.map(p => ({ grade: p.grade_band, ela: p.ela, math: p.math }))

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h2 className={`font-display text-xl font-semibold mb-1 ${text}`}>SPS Trends</h2>
        <p className={`text-sm ${muted}`}>Statewide School Performance Score history — live from PostgreSQL</p>
      </div>
      {loading ? <Spinner isDark={isDark} /> : (
        <>
          <Card isDark={isDark}>
            <p className={`text-sm font-medium mb-1 ${text}`}>Statewide SPS Score 2019–2025</p>
            <p className={`text-xs mb-4 ${muted}`}>Source: LDOE · 150-point scale · COVID dip in 2021 recovered by 2022</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={spsHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                <XAxis dataKey="year" tick={{ fill: '#8B9DB5', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8B9DB5', fontSize: 11 }} axisLine={false} tickLine={false} domain={[68, 85]} />
                <Tooltip content={<ChartTip isDark={isDark} />} />
                <Line type="monotone" dataKey="sps" name="SPS Score" stroke="#14A6AC" strokeWidth={2.5} dot={{ fill: '#14A6AC', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card isDark={isDark}>
            <p className={`text-sm font-medium mb-4 ${text}`}>LEAP Proficiency by Grade Band</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={profData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                <XAxis dataKey="grade" tick={{ fill: '#8B9DB5', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8B9DB5', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip isDark={isDark} />} />
                <Bar dataKey="ela"  name="ELA"  fill="#14A6AC" radius={[4,4,0,0]} />
                <Bar dataKey="math" name="Math" fill="#C9A84C" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </div>
  )
}

// ─── Alerts Section ───────────────────────────────────────────────
function AlertsSection({ isDark }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAlerts().then(d => { setAlerts(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'

  const styles = {
    critical: { bg: isDark ? 'bg-red-500/10 border-red-500/25'    : 'bg-red-50 border-red-200',    icon: '🔴', label: 'Critical', tc: 'text-red-400'    },
    warning:  { bg: isDark ? 'bg-yellow-500/10 border-yellow-500/25':'bg-amber-50 border-amber-200', icon: '🟡', label: 'Warning',  tc: 'text-yellow-500' },
    info:     { bg: isDark ? 'bg-teal/10 border-teal/25'           : 'bg-teal-4 border-teal/20',    icon: '🔵', label: 'Info',     tc: 'text-teal-2'     },
  }

  return (
    <div className="animate-fade-up space-y-4">
      <div>
        <h2 className={`font-display text-xl font-semibold mb-1 ${text}`}>Alerts & Flags</h2>
        <p className={`text-sm ${muted}`}>System-generated flags from database — sourced from LDOE 2024</p>
      </div>
      {loading ? <Spinner isDark={isDark} /> : (
        <div className="space-y-3">
          {alerts.map(a => {
            const s = styles[a.type] ?? styles.info
            return (
              <div key={a.id} className={`border rounded-xl px-5 py-4 ${s.bg}`}>
                <div className="flex items-start gap-3">
                  <span className="text-base flex-shrink-0 mt-0.5">{s.icon}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-mono text-xs font-bold ${s.tc}`}>{s.label}</span>
                      <span className={`text-sm font-semibold ${text}`}>{a.parish} Parish</span>
                    </div>
                    <p className={`text-sm ${muted}`}>{a.message}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────
export default function PolicyDashboard() {
  const { isDark } = useTheme()
  const [active, setActive] = useState('overview')

  const bg   = isDark ? 'bg-navy'       : 'bg-slate-3/30'
  const text = isDark ? 'text-white'    : 'text-navy'

  const sections = {
    overview:    <OverviewSection isDark={isDark} />,
    parishes:    <ParishSection isDark={isDark} />,
    trends:      <TrendsSection isDark={isDark} />,
    alerts:      <AlertsSection isDark={isDark} />,
    performance: <OverviewSection isDark={isDark} />,
    settings:    <p className={`text-sm ${isDark ? 'text-slate-brand' : 'text-navy/40'}`}>Settings coming soon.</p>,
  }

  return (
    <div className={`min-h-screen ${bg}`} style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <TopNavbar
        navItems={NAV_ITEMS}
        active={active}
        setActive={setActive}
        roleConfig={ROLE_CONFIG}
      />
      <main className="max-w-7xl mx-auto px-6 py-7">
        {sections[active] ?? sections.overview}
      </main>
      <ChatBot />
    </div>
  )
}
