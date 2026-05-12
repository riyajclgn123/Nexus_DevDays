/**
 * FunderDashboard.jsx — Philanthropic Funder Dashboard
 * Top navbar layout · Dark/light mode · Live DB data
 */

import { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import TopNavbar from '../../components/TopNavbar'
import ChatBot from '../../components/ChatBot'
import {
  LayoutDashboard, Target, BarChart2, Briefcase,
  Star, TrendingUp, Settings, ChevronDown, ChevronUp
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, Radar
} from 'recharts'
import { getStateSummary, getOpportunities, getWorkforceGaps } from '../../services/api'

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
  { key: 'portfolio',     label: 'My Portfolio',    icon: Briefcase       },
  { key: 'scoring',       label: 'Scoring',         icon: Star            },
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

function ImpactBadge({ level }) {
  const map = {
    High:   'bg-emerald-100 text-emerald-700 border-emerald-200',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200',
    Low:    'bg-gray-100 text-gray-600 border-gray-200',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${map[level] ?? ''}`}>{level} Impact</span>
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

function ImpactSection({ isDark }) {
  const [summary, setSummary]             = useState(null)
  const [opportunities, setOpportunities] = useState([])
  const [workforce, setWorkforce]         = useState([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    Promise.all([getStateSummary(), getOpportunities(), getWorkforceGaps()])
      .then(([s, o, w]) => {
        setSummary(s)
        setOpportunities(Array.isArray(o) ? o.slice(0, 3) : [])
        setWorkforce(Array.isArray(w) ? w : [])
        setLoading(false)
      })
  }, [])

  if (loading) return <Spinner isDark={isDark} />

  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'

  const cards = [
    { label: 'Total K-12 Students',    value: `${((summary?.enrollment_total??0)/1000).toFixed(0)}K`, sub: 'Louisiana public 2024-25',         color: text            },
    { label: 'Child Poverty Rate',     value: `${summary?.child_poverty}%`,   sub: '2x national average · Census 2024',   color: 'text-red-500'  },
    { label: 'Median Household Income',value: `$${((summary?.median_income??0)/1000).toFixed(0)}K`, sub: 'vs $81.6K national',              color: 'text-amber-500'},
    { label: 'Bachelor\'s Degree Rate',value: `${summary?.bachelors_rate}%`,  sub: 'vs 36.8% national · Census 2024',    color: 'text-teal-2'   },
  ]

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h2 className={`font-display text-xl font-semibold mb-1 ${text}`}>Impact Overview</h2>
        <p className={`text-sm ${muted}`}>Where Louisiana's funding gaps are largest — live from PostgreSQL</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(c => (
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
                  <ImpactBadge level={o.impact} />
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
        <p className={`text-sm font-medium mb-0.5 ${text}`}>Workforce Gap by Sector</p>
        <p className={`text-xs mb-4 ${muted}`}>Projected demand vs. supply (2028) — BLS Louisiana</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={workforce} barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
            <XAxis dataKey="sector" tick={{ fill: '#8B9DB5', fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8B9DB5', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTip isDark={isDark} />} />
            <Bar dataKey="demand" name="Demand" fill="#C9A84C" radius={[3,3,0,0]} />
            <Bar dataKey="supply" name="Supply" fill="#0D7377" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

function OpportunitiesSection({ isDark }) {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading]             = useState(true)
  const [selected, setSelected]           = useState(null)
  const [filter, setFilter]               = useState('All')

  useEffect(() => {
    getOpportunities().then(d => { setOpportunities(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const visible = filter === 'All' ? opportunities : opportunities.filter(o => o.impact === filter)
  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'

  return (
    <div className="animate-fade-up space-y-4">
      <div>
        <h2 className={`font-display text-xl font-semibold mb-1 ${text}`}>Investment Opportunities</h2>
        <p className={`text-sm ${muted}`}>Ranked by composite impact score — live from PostgreSQL</p>
      </div>
      {loading ? <Spinner isDark={isDark} /> : (
        <>
          <div className="flex gap-2">
            {['All', 'High', 'Medium'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                  ${filter === f ? 'bg-gold text-navy' : isDark ? 'bg-navy-2 border border-white/10 text-slate-brand hover:text-white' : 'bg-white border border-navy/10 text-navy/60 hover:text-navy'}`}>
                {f} Impact
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {visible.map((o, i) => (
              <div key={o.id}
                onClick={() => setSelected(selected === o.id ? null : o.id)}
                className={`border rounded-xl p-5 cursor-pointer transition-all
                  ${selected === o.id ? 'border-gold/50 ring-2 ring-gold/20' : isDark ? 'bg-navy-2 border-white/8 hover:border-white/15' : 'bg-white border-navy/8 shadow-card hover:border-navy/20'}`}>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gold/15 border border-gold/25 flex items-center justify-center text-xs font-bold text-[#8B6914] flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`font-semibold ${text}`}>{o.type}</span>
                      <div className="flex items-center gap-2">
                        <ImpactBadge level={o.impact} />
                        <ScoreRing score={o.score} />
                      </div>
                    </div>
                    <p className={`text-xs mb-2 ${muted}`}>{o.parish} Parish · {o.workforce}</p>
                    <p className={`text-xs leading-relaxed ${muted}`}>{o.rationale}</p>
                    {selected === o.id && (
                      <div className="mt-3 pt-3 border-t border-gold/10 grid grid-cols-3 gap-3 animate-fade-up">
                        {[['Investment', o.cost], ['Students', o.students?.toLocaleString()], ['Source', 'LDOE 2024']].map(([k, v]) => (
                          <div key={k} className={`rounded-lg p-3 ${isDark ? 'bg-navy/60' : 'bg-gold-4'}`}>
                            <p className={`text-[10px] uppercase tracking-wider mb-1 ${muted}`}>{k}</p>
                            <p className={`font-semibold text-sm ${text}`}>{v}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={muted}>{selected === o.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function WorkforceSection({ isDark }) {
  const [workforce, setWorkforce] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    getWorkforceGaps().then(d => { setWorkforce(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'
  const radarData = workforce.map(w => ({ sector: w.sector.split('/')[0].trim(), gap: Math.round((w.gap/w.demand)*100) }))

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h2 className={`font-display text-xl font-semibold mb-1 ${text}`}>Workforce Gaps</h2>
        <p className={`text-sm ${muted}`}>Projected job demand vs. education pipeline — live from PostgreSQL</p>
      </div>
      {loading ? <Spinner isDark={isDark} /> : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card isDark={isDark}>
              <p className={`text-sm font-medium mb-4 ${text}`}>Supply vs. Demand by Sector</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={workforce} layout="vertical" barSize={10}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#8B9DB5', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="sector" type="category" tick={{ fill: isDark ? '#fff' : '#0B1628', fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip content={<ChartTip isDark={isDark} />} />
                  <Bar dataKey="demand" name="Demand" fill="#C9A84C" radius={[0,3,3,0]} />
                  <Bar dataKey="supply" name="Supply" fill="#0D7377" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card isDark={isDark}>
              <p className={`text-sm font-medium mb-4 ${text}`}>Gap % by Sector</p>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} />
                  <PolarAngleAxis dataKey="sector" tick={{ fill: isDark ? '#fff' : '#0B1628', fontSize: 10 }} />
                  <Radar name="Gap %" dataKey="gap" stroke="#C9A84C" fill="#C9A84C" fillOpacity={0.2} />
                  <Tooltip content={<ChartTip isDark={isDark} />} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-navy-2 border-white/8' : 'bg-white border-navy/8 shadow-card'}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-white/8 bg-navy-3/40' : 'border-navy/8 bg-gold-4/60'}`}>
                  {['Sector','Demand','Supply','Gap','Gap %','Growth'].map(h => (
                    <th key={h} className={`text-left px-4 py-3 text-xs font-mono uppercase tracking-wider ${muted}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workforce.map((w, i) => (
                  <tr key={w.id} className={`border-b ${isDark ? 'border-white/5' : 'border-navy/5'} ${i%2!==0 ? (isDark?'bg-white/2':'bg-gold-4/20') : ''}`}>
                    <td className={`px-4 py-3 font-medium ${text}`}>{w.sector}</td>
                    <td className={`px-4 py-3 ${muted}`}>{w.demand?.toLocaleString()}</td>
                    <td className={`px-4 py-3 ${muted}`}>{w.supply?.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-red-500">{w.gap?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark?'bg-white/8':'bg-navy/8'}`}>
                          <div className="h-full bg-gold rounded-full" style={{ width: `${Math.round(w.gap/w.demand*100)}%` }} />
                        </div>
                        <span className={`text-xs w-8 ${muted}`}>{Math.round(w.gap/w.demand*100)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-emerald-500 font-medium text-xs">{w.growth_pct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function PortfolioSection({ isDark }) {
  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'
  return (
    <div className="animate-fade-up space-y-4">
      <h2 className={`font-display text-xl font-semibold ${text}`}>My Portfolio</h2>
      <div className={`rounded-xl border border-dashed p-16 text-center ${isDark ? 'border-gold/20' : 'border-gold/40'}`}>
        <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
          <Briefcase size={20} className="text-gold" />
        </div>
        <p className={`font-semibold mb-1 ${text}`}>No investments tracked yet</p>
        <p className={`text-sm ${muted}`}>Browse Opportunities and click "Track" to add them here.</p>
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
    scoring:       <p className={`text-sm ${isDark ? 'text-slate-brand' : 'text-navy/50'}`}>Scoring methodology coming soon.</p>,
    settings:      <p className={`text-sm ${isDark ? 'text-slate-brand' : 'text-navy/50'}`}>Settings coming soon.</p>,
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
