/**
 * FunderDashboard.jsx — Philanthropic Funder Dashboard
 */

import { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import TopNavbar from '../../components/TopNavbar'
import ChatBot from '../../components/ChatBot'
import ExportButton from '../../components/ExportButton'
import SettingsPage from '../../components/SettingsPage'
import {
  LayoutDashboard, Target, BarChart2, Briefcase,
  Star, TrendingUp, Settings, ChevronDown, ChevronUp, X
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, Radar, Legend
} from 'recharts'
import {
  getStateSummary, getOpportunities, getWorkforceGaps,
  getOpportunitiesSummary, getParishes
} from '../../services/api'

const ROLE_CONFIG = {
  label:      'Philanthropic Funder',
  badgeBg:    'bg-gold/15',
  badgeText:  'text-[#8B6914]',
  activeBg:   'bg-gold/15',
  activeText: 'text-[#8B6914]',
  avatarRing: 'ring-gold',
}

const NAV_ITEMS = [
  { key: 'impact',        label: 'Impact Overview', icon: LayoutDashboard },
  { key: 'opportunities', label: 'Opportunities',   icon: Target          },
  { key: 'workforce',     label: 'Workforce Gaps',  icon: BarChart2       },
  { key: 'portfolio',     label: 'Portfolio Builder', icon: Briefcase     },
  { key: 'roi',           label: 'ROI Panel',       icon: TrendingUp      },
  { key: 'settings',      label: 'Settings',        icon: Settings        },
]

function Spinner({ isDark }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin-slow" />
        <span className={`text-xs font-mono ${isDark ? 'text-slate-brand' : 'text-navy/40'}`}>Fetching from PostgreSQL...</span>
      </div>
    </div>
  )
}

function Card({ isDark, children, className = '' }) {
  return (
    <div className={`rounded-xl border p-5 ${isDark ? 'bg-navy-2 border-white/8' : 'bg-white border-navy/8 shadow-card'} ${className}`}>
      {children}
    </div>
  )
}

function ImpactBadge({ score }) {
  const cls = score >= 80
    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : score >= 60
    ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-red-100 text-red-600 border-red-200'
  const label = score >= 80 ? 'High' : score >= 60 ? 'Medium' : 'Low'
  return <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${cls}`}>{label} Impact</span>
}

function ScoreBadge({ score }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <span className={`inline-flex items-center justify-center w-10 h-6 rounded-full text-white text-xs font-bold ${color}`}>
      {score}
    </span>
  )
}

function ScoreRing({ score }) {
  const color = score >= 90 ? '#1E7B46' : score >= 80 ? '#C9A84C' : '#C0392B'
  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
        <circle cx="28" cy="28" r="22" fill="none" stroke="#E8DFC8" strokeWidth="5" />
        <circle cx="28" cy="28" r="22" fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${(score / 100) * 138.2} 138.2`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-navy">{score}</span>
    </div>
  )
}

function ChartTip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null
  return (
    <div className={`border rounded-lg px-3 py-2 text-xs ${isDark ? 'bg-navy-2 border-white/10' : 'bg-white border-navy/10 shadow-md'}`}>
      <p className="text-slate-brand mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color ?? '#0B1628' }}>{p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong></p>
      ))}
    </div>
  )
}

// ─── Impact Overview ─────────────────────────────────────────────
function ImpactSection({ isDark }) {
  const [summary, setSummary]             = useState(null)
  const [oppSummary, setOppSummary]       = useState(null)
  const [opportunities, setOpportunities] = useState([])
  const [workforce, setWorkforce]         = useState([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    Promise.all([getStateSummary(), getOpportunitiesSummary(), getOpportunities(), getWorkforceGaps()])
      .then(([s, os, o, w]) => {
        setSummary(s); setOppSummary(os)
        setOpportunities(Array.isArray(o) ? o.slice(0, 3) : [])
        setWorkforce(Array.isArray(w) ? w : [])
        setLoading(false)
      })
  }, [])

  if (loading) return <Spinner isDark={isDark} />

  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'

  const kpis = [
    { label: 'Investable Opportunities', value: oppSummary?.total ?? '—',          color: text,           sub: 'Ranked by impact score' },
    { label: 'High-Impact Parishes',     value: oppSummary?.high ?? '—',           color: 'text-teal-2',  sub: 'Score ≥ 80/100' },
    { label: 'Students Reachable',       value: oppSummary?.total_students?.toLocaleString() ?? '—', color: text, sub: 'Across all opportunities' },
    { label: 'Avg Investment Score',     value: oppSummary?.avg_score ?? '—',      color: 'text-gold',    sub: 'Out of 100' },
  ]

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h2 className={`font-display text-xl font-semibold mb-1 ${text}`}>Impact Overview</h2>
        <p className={`text-sm ${muted}`}>Where Louisiana's funding gaps are largest — live from PostgreSQL</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(c => (
          <Card key={c.label} isDark={isDark} className="p-4">
            <p className={`text-xs mb-1 ${muted}`}>{c.label}</p>
            <p className={`font-display text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className={`text-[10px] mt-1 ${muted} opacity-70`}>{c.sub}</p>
          </Card>
        ))}
      </div>

      <div>
        <h3 className={`font-display text-base font-semibold mb-3 ${text}`}>Top Ranked Opportunities</h3>
        <div className="space-y-3">
          {opportunities.map((o, i) => (
            <Card key={o.id} isDark={isDark} className="flex items-start gap-4 p-4">
              <div className="w-7 h-7 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center text-xs font-bold text-[#8B6914] flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className={`font-semibold text-sm ${text}`}>{o.type}</span>
                  <ImpactBadge score={o.score} />
                </div>
                <p className={`text-xs mb-2 ${muted}`}>{o.parish} Parish · {o.workforce}</p>
                <p className={`text-xs leading-relaxed ${muted}`}>{o.rationale}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`text-xs ${muted}`}>Cost: <strong className={text}>{o.cost}</strong></span>
                  <span className={`text-xs ${muted}`}>Students: <strong className={text}>{o.students?.toLocaleString()}</strong></span>
                </div>
              </div>
              <ScoreRing score={o.score} />
            </Card>
          ))}
        </div>
      </div>

      <Card isDark={isDark}>
        <p className={`text-sm font-medium mb-0.5 ${text}`}>Employment by Sector</p>
        <p className={`text-xs mb-4 ${muted}`}>Actual jobs (2024) — BLS Louisiana CES · graduate pipeline data pending</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={workforce} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
            <XAxis dataKey="sector" tick={{ fill: '#8B9DB5', fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8B9DB5', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<ChartTip isDark={isDark} />} />
            <Bar dataKey="demand" name="Employed (2024)" fill="#C9A84C" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

// ─── Opportunities Table ──────────────────────────────────────────
function OpportunitiesSection({ isDark }) {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading]             = useState(true)
  const [selected, setSelected]           = useState(null)
  const [filter, setFilter]               = useState('All')
  const [sortKey, setSortKey]             = useState('score')
  const [sortDir, setSortDir]             = useState('desc')

  useEffect(() => {
    getOpportunities().then(d => { setOpportunities(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const visible = (filter === 'All' ? opportunities : opportunities.filter(o => o.impact === filter))
    .slice().sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      const av  = sortKey === 'cost' ? parseFloat(String(a[sortKey]).replace(/[^0-9.]/g, '')) || 0 : (a[sortKey] ?? 0)
      const bv  = sortKey === 'cost' ? parseFloat(String(b[sortKey]).replace(/[^0-9.]/g, '')) || 0 : (b[sortKey] ?? 0)
      return typeof av === 'number' ? (av - bv) * mul : String(av).localeCompare(String(bv)) * mul
    })

  const text   = isDark ? 'text-white'       : 'text-navy'
  const muted  = isDark ? 'text-slate-brand' : 'text-navy/50'
  const tblBg  = isDark ? 'bg-navy-2 border-white/8' : 'bg-white border-navy/8 shadow-card'
  const rowHov = isDark ? 'hover:bg-white/4' : 'hover:bg-gold/5'
  const altRow = isDark ? 'bg-white/2'       : 'bg-gold/5'

  const cols = [
    { key: 'parish',    label: 'Parish'        },
    { key: 'type',      label: 'Opportunity'   },
    { key: 'score',     label: 'Impact Score'  },
    { key: 'students',  label: 'Students'      },
    { key: 'cost',      label: 'Est. Cost'     },
    { key: 'workforce', label: 'WF Alignment'  },
  ]

  const exportData = visible.map(o => ({
    Parish: o.parish, Type: o.type, Score: o.score, Impact: o.impact,
    Students: o.students, Cost: o.cost, Workforce: o.workforce, Rationale: o.rationale,
  }))

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className={`font-display text-xl font-semibold mb-1 ${text}`}>Investment Opportunities</h2>
          <p className={`text-sm ${muted}`}>Ranked by composite impact score — live from PostgreSQL</p>
        </div>
        <ExportButton data={exportData} filename="funder-opportunities" dashboardName="Funder" isDark={isDark} />
      </div>

      {loading ? <Spinner isDark={isDark} /> : (
        <>
          <div className="flex gap-2 flex-wrap">
            {['All', 'High', 'Medium', 'Low'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                  ${filter === f ? 'bg-gold text-navy' : isDark ? 'bg-navy-2 border border-white/10 text-slate-brand hover:text-white' : 'bg-white border border-navy/10 text-navy/60 hover:text-navy'}`}>
                {f} {f !== 'All' ? 'Impact' : ''}
              </button>
            ))}
          </div>

          <div className={`rounded-xl border overflow-x-auto ${tblBg}`}>
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className={`border-b ${isDark ? 'border-white/8 bg-navy-3/40' : 'border-navy/8 bg-gold/5'}`}>
                  {cols.map(c => (
                    <th key={c.key} onClick={() => toggleSort(c.key)}
                      className={`text-left px-4 py-3 text-xs font-mono uppercase tracking-wider cursor-pointer select-none ${muted} hover:${text}`}>
                      <span className="flex items-center gap-1">{c.label}
                        {sortKey === c.key && (sortDir === 'asc' ? <ChevronUp size={10}/> : <ChevronDown size={10}/>)}
                      </span>
                    </th>
                  ))}
                  <th className={`text-left px-4 py-3 text-xs font-mono uppercase tracking-wider ${muted}`}>Rationale</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((o, i) => (
                  <>
                    <tr key={o.id} onClick={() => setSelected(selected === o.id ? null : o.id)}
                      className={`border-b transition-colors cursor-pointer ${isDark ? 'border-white/5' : 'border-navy/5'} ${rowHov} ${i%2!==0 ? altRow : ''}`}>
                      <td className={`px-4 py-3 font-medium ${text}`}>{o.parish}</td>
                      <td className={`px-4 py-3 text-xs ${muted} max-w-xs`}>{o.type}</td>
                      <td className="px-4 py-3"><ScoreBadge score={o.score} /></td>
                      <td className={`px-4 py-3 ${muted}`}>{o.students?.toLocaleString()}</td>
                      <td className={`px-4 py-3 font-mono text-xs ${text}`}>{o.cost}</td>
                      <td className={`px-4 py-3 text-xs ${muted}`}>{o.workforce}</td>
                      <td className="px-4 py-3">
                        <button className={`text-xs underline ${muted}`}>
                          {selected === o.id ? 'Hide' : 'Show'}
                        </button>
                      </td>
                    </tr>
                    {selected === o.id && (
                      <tr key={`${o.id}-detail`} className={isDark ? 'bg-gold/5' : 'bg-gold/5'}>
                        <td colSpan={7} className={`px-4 py-3 text-xs leading-relaxed ${muted}`}>
                          <strong className={text}>Rationale:</strong> {o.rationale}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          <p className={`text-xs text-right ${muted}`}>{visible.length} opportunities · Source: LDOE 2024 + EduPulse scoring model</p>
        </>
      )}
    </div>
  )
}

// ─── Workforce Gap Chart ──────────────────────────────────────────
function WorkforceSection({ isDark }) {
  const [workforce, setWorkforce] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    getWorkforceGaps().then(d => { setWorkforce(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'
  const sectorBlurbs = {
    'Education & Health':          'Nursing, allied health, and teaching pipeline directly tied to K-12 STEM and CTE programs.',
    'Trade, Transport & Utilities':'Logistics and utility roles require workforce math and CTE coursework at the high school level.',
    'Government':                  'Public sector talent pipeline depends on civic education and higher ed attainment.',
    'Construction & Trades':       'CTE vocational programs at the high school level are the primary pipeline for this sector.',
    'Manufacturing':               'Advanced manufacturing needs STEM and technical training starting in middle school.',
  }

  const sorted = [...workforce].sort((a, b) => (b.demand ?? 0) - (a.demand ?? 0))

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h2 className={`font-display text-xl font-semibold mb-1 ${text}`}>Workforce Analysis</h2>
        <p className={`text-sm ${muted}`}>Current sector employment (2024) — BLS Louisiana CES · graduate pipeline data pending</p>
      </div>
      {loading ? <Spinner isDark={isDark} /> : (
        <>
          <Card isDark={isDark}>
            <div className="flex items-center justify-between mb-4">
              <p className={`text-sm font-medium ${text}`}>Employment by Sector (2024)</p>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${isDark ? 'border-white/10 text-slate-brand' : 'border-navy/10 text-navy/40'}`}>
                BLS CES · Annual Average
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sorted} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                <XAxis dataKey="sector" tick={{ fill: '#8B9DB5', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8B9DB5', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTip isDark={isDark} />} />
                <Bar dataKey="demand" name="Employed (2024)" fill="#2EC4B6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className={`text-[10px] text-center mt-2 ${muted}`}>Graduate pipeline (supply) data pending — requires LDOE CTE credential data</p>
          </Card>

          <div className="space-y-2">
            <h3 className={`text-sm font-medium ${text}`}>Sectors — K-12 Education Relevance</h3>
            {sorted.map((w, i) => {
              const growthPos = w.growth_pct && !w.growth_pct.startsWith('-')
              return (
                <Card key={w.id} isDark={isDark} className="p-4 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gold/15 border border-gold/25 flex items-center justify-center text-xs font-bold text-[#8B6914] flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`font-semibold text-sm ${text}`}>{w.sector}</span>
                      <span className={`font-mono text-xs font-bold ${growthPos ? 'text-teal-2' : 'text-red-400'}`}>
                        {w.growth_pct} YoY
                      </span>
                    </div>
                    <p className={`text-xs ${muted}`}>{sectorBlurbs[w.sector] || 'Directly tied to K-12 education outcomes.'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-navy/8'}`}>
                        <div className="h-full rounded-full bg-teal-2" style={{ width: `${Math.min(100, Math.round((w.demand / 400000) * 100))}%` }} />
                      </div>
                      <span className={`text-[10px] font-mono ${muted}`}>{w.demand?.toLocaleString()} employed · pipeline pending</span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Portfolio Builder ────────────────────────────────────────────
function PortfolioSection({ isDark }) {
  const [parishes, setParishes]   = useState([])
  const [selected, setSelected]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [dropOpen, setDropOpen]   = useState(false)

  useEffect(() => {
    getParishes().then(d => { setParishes(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  function toggleParish(name) {
    setSelected(prev => {
      if (prev.includes(name)) return prev.filter(p => p !== name)
      if (prev.length >= 5)    return prev
      return [...prev, name]
    })
  }

  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'

  // Build radar chart data
  const radarData = ['SPS Score', 'Poverty Rate', 'Enrollment', 'Workforce Score', 'Proficiency'].map(metric => {
    const point = { metric }
    selected.forEach(name => {
      const p = parishes.find(x => x.name === name)
      if (!p) return
      const vals = {
        'SPS Score':      Math.round((p.sps / 150) * 100),
        'Poverty Rate':   Math.round(100 - p.poverty),  // invert so higher = better
        'Enrollment':     Math.round(Math.min(100, (p.enrollment / 30000) * 100)),
        'Workforce Score': p.workforce || 50,
        'Proficiency':    Math.round(p.proficiency || 35),
      }
      point[name] = vals[metric]
    })
    return point
  })

  const COLORS = ['#2EC4B6', '#F5A623', '#0A2342', '#EF4444', '#8B5CF6']

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h2 className={`font-display text-xl font-semibold mb-1 ${text}`}>Investment Portfolio Builder</h2>
        <p className={`text-sm ${muted}`}>Compare up to 5 parishes on key education investment metrics</p>
      </div>

      {loading ? <Spinner isDark={isDark} /> : (
        <>
          {/* Parish selector */}
          <div className="relative">
            <button onClick={() => setDropOpen(o => !o)}
              className={`w-full sm:w-80 flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm cursor-pointer transition-all
                ${isDark ? 'bg-navy-2 border-white/10 text-white hover:border-gold/30' : 'bg-white border-navy/10 text-navy hover:border-gold/40 shadow-sm'}`}>
              <span className={selected.length ? text : muted}>
                {selected.length ? `${selected.length} parish${selected.length > 1 ? 'es' : ''} selected` : 'Select parishes…'}
              </span>
              <ChevronDown size={14} className={`transition-transform ${dropOpen ? 'rotate-180' : ''} ${muted}`} />
            </button>

            {dropOpen && (
              <div className={`absolute z-20 top-full mt-1 w-full sm:w-80 rounded-xl border shadow-xl overflow-hidden
                ${isDark ? 'bg-navy-2 border-white/10' : 'bg-white border-navy/10'}`}>
                <div className="max-h-56 overflow-y-auto">
                  {parishes.map(p => (
                    <label key={p.id}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors
                        ${isDark ? 'hover:bg-white/5' : 'hover:bg-gold/5'}
                        ${selected.includes(p.name) ? (isDark ? 'bg-gold/8' : 'bg-gold/10') : ''}`}>
                      <input type="checkbox" checked={selected.includes(p.name)}
                        onChange={() => toggleParish(p.name)}
                        className="accent-gold" />
                      <span className={`text-sm ${text}`}>{p.name}</span>
                      <span className={`ml-auto text-xs font-mono ${muted}`}>{p.sps}</span>
                    </label>
                  ))}
                </div>
                <div className={`px-4 py-2 text-[10px] border-t ${isDark ? 'border-white/8 text-slate-brand' : 'border-navy/8 text-navy/40'}`}>
                  Select up to 5 parishes
                </div>
              </div>
            )}
          </div>

          {/* Selected pills */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map((name, i) => (
                <span key={name} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: COLORS[i] + '20', color: COLORS[i], border: `1px solid ${COLORS[i]}40` }}>
                  {name}
                  <button onClick={() => toggleParish(name)} className="hover:opacity-70 cursor-pointer">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Radar chart */}
          {selected.length >= 2 ? (
            <Card isDark={isDark}>
              <p className={`text-sm font-medium mb-4 ${text}`}>Parish Comparison Radar</p>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: isDark ? '#fff' : '#0A2342', fontSize: 11 }} />
                  {selected.map((name, i) => (
                    <Radar key={name} name={name} dataKey={name}
                      stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip content={<ChartTip isDark={isDark} />} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          ) : (
            <div className={`rounded-xl border border-dashed p-12 text-center ${isDark ? 'border-gold/20' : 'border-gold/30'}`}>
              <p className={`text-sm ${muted}`}>Select at least 2 parishes to compare</p>
            </div>
          )}

          {/* Summary table */}
          {selected.length > 0 && (
            <div className={`rounded-xl border overflow-x-auto ${isDark ? 'bg-navy-2 border-white/8' : 'bg-white border-navy/8 shadow-card'}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-white/8 bg-navy-3/40' : 'border-navy/8 bg-gold/5'}`}>
                    <th className={`text-left px-4 py-3 text-xs font-mono uppercase ${muted}`}>Metric</th>
                    {selected.map((name, i) => (
                      <th key={name} className="text-left px-4 py-3 text-xs font-mono uppercase"
                        style={{ color: COLORS[i] }}>{name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['SPS Score', 'Grade', 'Poverty %', 'Graduation %', 'Proficiency %', 'Gap Level', 'Trend'].map((metric, mi) => {
                    const keys = { 'SPS Score': 'sps', 'Grade': 'grade', 'Poverty %': 'poverty', 'Graduation %': 'graduation', 'Proficiency %': 'proficiency', 'Gap Level': 'gap', 'Trend': 'trend' }
                    return (
                      <tr key={metric} className={`border-b ${isDark ? 'border-white/5' : 'border-navy/5'} ${mi%2!==0 ? (isDark?'bg-white/2':'bg-gold/5') : ''}`}>
                        <td className={`px-4 py-3 text-xs font-medium ${muted}`}>{metric}</td>
                        {selected.map(name => {
                          const p = parishes.find(x => x.name === name)
                          const v = p?.[keys[metric]] ?? '—'
                          return <td key={name} className={`px-4 py-3 text-xs font-mono ${text}`}>{v}</td>
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── ROI Panel ────────────────────────────────────────────────────
function ROISection({ isDark }) {
  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'

  const roiPoints = [
    {
      headline: '$1M in high-gap parishes reaches 3.2× more students',
      body:     'Parishes with Critical or High gap designation have 2–4× more unserved students per dollar invested than Low-gap parishes due to larger population-to-school ratios.',
      source:   'EduPulse Opportunity Scoring Model + Census ACS 2024',
    },
    {
      headline: 'Healthcare + Tech investment yields fastest job pipeline return',
      body:     'BLS Louisiana projects 12–22% growth in Healthcare and Technology sectors through 2028. Schools aligned to these sectors produce workforce-ready graduates within 4–6 years.',
      source:   'BLS Louisiana 2025 Workforce Projections',
    },
    {
      headline: 'Every 1pt gain in SPS correlates to $240K annual economic value',
      body:     'LDOE analysis shows each SPS point improvement correlates with higher graduation rates, lower incarceration costs, and increased lifetime earnings for affected students.',
      source:   'LDOE Research Division + Better LA 2024',
    },
  ]

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h2 className={`font-display text-xl font-semibold mb-1 ${text}`}>ROI Framing</h2>
        <p className={`text-sm ${muted}`}>Why Louisiana education investment generates outsized returns</p>
      </div>

      <div className="space-y-4">
        {roiPoints.map((pt, i) => (
          <Card key={i} isDark={isDark}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/25 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={18} className="text-gold" />
              </div>
              <div>
                <p className={`font-semibold text-sm mb-2 ${text}`}>{pt.headline}</p>
                <p className={`text-xs leading-relaxed mb-3 ${muted}`}>{pt.body}</p>
                <p className={`text-[10px] font-mono px-2 py-1 rounded border ${isDark ? 'bg-white/5 border-white/8 text-slate-brand' : 'bg-navy/5 border-navy/8 text-navy/50'}`}>
                  Source: {pt.source}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className={`rounded-xl border p-5 ${isDark ? 'bg-gold/8 border-gold/20' : 'bg-gold/5 border-gold/20'}`}>
        <p className={`text-sm font-semibold mb-2 ${text}`}>"Louisiana has the talent — it needs the investment infrastructure."</p>
        <p className={`text-xs ${muted}`}>— Better LA Research, 2024 Annual Education Report</p>
      </div>
    </div>
  )
}

export default function FunderDashboard() {
  const { isDark } = useTheme()
  const [active, setActive] = useState('impact')
  const bg = isDark ? 'bg-navy' : 'bg-[#F8F4EC]'

  const sections = {
    impact:        <ImpactSection isDark={isDark} />,
    opportunities: <OpportunitiesSection isDark={isDark} />,
    workforce:     <WorkforceSection isDark={isDark} />,
    portfolio:     <PortfolioSection isDark={isDark} />,
    roi:           <ROISection isDark={isDark} />,
    settings:      <SettingsPage isDark={isDark} />,
  }

  return (
    <div className={`min-h-screen ${bg}`} style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <TopNavbar navItems={NAV_ITEMS} active={active} setActive={setActive} roleConfig={ROLE_CONFIG} />
      <main className="max-w-7xl mx-auto px-6 py-7">
        {sections[active] ?? sections.impact}
      </main>
      <ChatBot />
    </div>
  )
}
