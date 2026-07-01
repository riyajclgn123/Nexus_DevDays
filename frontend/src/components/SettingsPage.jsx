/**
 * SettingsPage.jsx — Shared settings component for all three dashboards.
 * Handles profile editing, theme preferences, notifications, data info, and about.
 */

import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useAuth }  from '../context/AuthContext'
import { updateUser } from '../context/userService'
import {
  User, Palette, Database, Info, Save, CheckCircle,
  Moon, Sun, Trash2, Bell, BellOff, ExternalLink, RefreshCw, Shield
} from 'lucide-react'

const TABS = [
  { key: 'profile',  label: 'Profile',       icon: User     },
  { key: 'prefs',    label: 'Preferences',   icon: Palette  },
  { key: 'notifs',   label: 'Notifications', icon: Bell     },
  { key: 'data',     label: 'Data Sources',  icon: Database },
  { key: 'about',    label: 'About',         icon: Info     },
]

// Real source metadata (matches data_sources table, retrieved_at from ETL runs on 2026-06-30)
const DATA_SOURCES = [
  {
    name: 'LDOE District Performance Scores',
    org: 'Louisiana Department of Education',
    vintage: 'FY 2024–25',
    retrieved: '2026-06-30',
    covers: 'SPS scores, letter grades, graduation rates — all 64 parishes + city districts',
    url: 'https://doe.louisiana.gov/data-and-reports/performance-scores',
  },
  {
    name: 'US Census ACS5 2024',
    org: 'US Census Bureau',
    vintage: '2020–2024 5-year estimates',
    retrieved: '2026-06-30',
    covers: 'Poverty rates, median income, population — all 64 Louisiana parishes',
    url: 'https://data.census.gov',
  },
  {
    name: 'BLS CES Louisiana',
    org: 'Bureau of Labor Statistics',
    vintage: '2018–2024 annual',
    retrieved: '2026-06-30',
    covers: 'Sector employment, YoY growth — 5 Louisiana supersectors',
    url: 'https://www.bls.gov/eag/eag.la.htm',
  },
  {
    name: 'LDOE LEAP 2025 Mastery Summary',
    org: 'Louisiana Department of Education',
    vintage: 'FY 2023–24',
    retrieved: '2026-06-30',
    covers: 'LEAP mastery % by grade band — Grades 3-8 and High School',
    url: 'https://doe.louisiana.gov/data-and-reports',
  },
  {
    name: 'RSD Eligible Schools (Historical)',
    org: 'LDOE / Recovery School District',
    vintage: '2014–15 (dissolved ~2019)',
    retrieved: '2026-06-30',
    covers: '53 RSD-eligible schools archived as historical reference only',
    url: 'https://doe.louisiana.gov',
  },
]

function Toast({ msg, type = 'success' }) {
  if (!msg) return null
  const bg = type === 'success'
    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
    : 'bg-red-50 border-red-200 text-red-700'
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm ${bg}`}>
      <CheckCircle size={14} />
      {msg}
    </div>
  )
}

function InputField({ label, value, onChange, placeholder, disabled, isDark, muted, inputCls }) {
  return (
    <div>
      <label className={`text-xs font-medium mb-1.5 block ${muted}`}>{label}</label>
      {disabled
        ? <p className={`text-sm ${isDark ? 'text-white' : 'text-navy'}`}>{value || '—'}</p>
        : <input value={value} onChange={onChange}
            className={`w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all ${inputCls}`}
            placeholder={placeholder} />
      }
    </div>
  )
}

// ── Profile Tab ──────────────────────────────────────────────────
function ProfileTab({ isDark }) {
  const { user } = useAuth()
  const [name, setName]   = useState(user?.name || '')
  const [org, setOrg]     = useState(user?.org || '')
  const [toast, setToast] = useState('')
  const [busy, setBusy]   = useState(false)

  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'
  const card  = isDark ? 'bg-navy-2 border border-white/8' : 'bg-white border border-navy/8 shadow-sm'
  const inputCls = isDark
    ? 'bg-navy border border-white/10 text-white placeholder-slate-brand focus:border-teal-2'
    : 'bg-white border border-navy/10 text-navy placeholder-navy/30 focus:border-teal-2'

  const roleBadge = {
    policymaker: 'bg-teal/15 text-teal border-teal/20',
    funder:      'bg-gold/15 text-[#8B6914] border-gold/20',
    operator:    'bg-navy/10 text-navy border-navy/15',
  }[user?.role] || 'bg-slate-100 text-slate-600 border-slate-200'

  async function handleSave() {
    if (!user?.uid) return
    setBusy(true)
    try {
      await updateUser(user.uid, { name, org })
      setToast('Profile saved successfully.')
    } catch {
      setToast('Failed to save — check connection.')
    }
    setBusy(false)
    setTimeout(() => setToast(''), 3000)
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="space-y-4 max-w-lg">
      {toast && <Toast msg={toast} />}

      {/* Account info banner */}
      <div className={`rounded-xl p-4 flex items-center gap-4 ${card}`}>
        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0D7377, #14A6AC)' }}>
          {user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0">
          <p className={`font-semibold text-sm truncate ${text}`}>{user?.name || 'No name set'}</p>
          <p className={`text-xs truncate ${muted}`}>{user?.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`px-2 py-0.5 rounded-full text-[10px] border font-medium capitalize ${roleBadge}`}>
              {user?.role || 'N/A'}
            </span>
            {memberSince && <span className={`text-[10px] ${muted}`}>Member since {memberSince}</span>}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <InputField label="Display Name" value={name} onChange={e => setName(e.target.value)}
          placeholder="Your name" isDark={isDark} muted={muted} inputCls={inputCls} />
        <InputField label="Organization" value={org} onChange={e => setOrg(e.target.value)}
          placeholder="Your organization" isDark={isDark} muted={muted} inputCls={inputCls} />
        <div>
          <label className={`text-xs font-medium mb-1.5 block ${muted}`}>Email</label>
          <p className={`text-sm ${isDark ? 'text-white' : 'text-navy'}`}>{user?.email || '—'}</p>
        </div>
        <div>
          <label className={`text-xs font-medium mb-1.5 block ${muted}`}>Role</label>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-lg text-xs border font-medium capitalize ${roleBadge}`}>
              {user?.role || 'N/A'}
            </span>
            <span className={`text-xs ${muted}`}>(set at registration)</span>
          </div>
        </div>
        <div>
          <label className={`text-xs font-medium mb-1.5 block ${muted}`}>Sign-in Method</label>
          <div className={`flex items-center gap-1.5 text-sm ${isDark ? 'text-white' : 'text-navy'}`}>
            <Shield size={12} className="opacity-50" />
            {user?.provider === 'google' ? 'Google' : user?.provider === 'microsoft' ? 'Microsoft' : 'Email / Password'}
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={busy}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal text-white text-sm font-medium hover:bg-teal-dark transition-colors cursor-pointer disabled:opacity-60">
        <Save size={14} />
        {busy ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}

// ── Preferences Tab ──────────────────────────────────────────────
function PrefsTab({ isDark }) {
  const { toggleTheme } = useTheme()
  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'
  const card  = isDark ? 'bg-navy-2 border border-white/8' : 'bg-white border border-navy/8 shadow-sm'

  // Persist compact mode to localStorage
  const [compact, setCompact] = useState(() => localStorage.getItem('ep_compact') === 'true')
  function toggleCompact() {
    const next = !compact
    setCompact(next)
    localStorage.setItem('ep_compact', String(next))
  }

  // Persist default map view
  const [mapLayer, setMapLayer] = useState(() => localStorage.getItem('ep_map_layer') || 'sps')
  function changeMapLayer(v) {
    setMapLayer(v)
    localStorage.setItem('ep_map_layer', v)
  }

  function Toggle({ value, onToggle }) {
    return (
      <button onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${value ? 'bg-teal' : isDark ? 'bg-white/20' : 'bg-navy/15'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    )
  }

  return (
    <div className="space-y-3 max-w-lg">
      {/* Theme */}
      <div className={`rounded-xl p-4 ${card}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${text}`}>Theme</p>
            <p className={`text-xs mt-0.5 ${muted}`}>Currently: {isDark ? 'Dark' : 'Light'} mode</p>
          </div>
          <button onClick={toggleTheme}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer
              ${isDark ? 'bg-white/8 hover:bg-white/12 text-white' : 'bg-navy/8 hover:bg-navy/12 text-navy'}`}>
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
            Switch to {isDark ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      {/* Compact mode */}
      <div className={`rounded-xl p-4 ${card}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${text}`}>Compact View</p>
            <p className={`text-xs mt-0.5 ${muted}`}>Reduce card padding and chart heights</p>
          </div>
          <Toggle value={compact} onToggle={toggleCompact} />
        </div>
      </div>

      {/* Default map layer */}
      <div className={`rounded-xl p-4 ${card}`}>
        <p className={`text-sm font-medium mb-2 ${text}`}>Default Map Layer</p>
        <p className={`text-xs mb-3 ${muted}`}>Which metric the Parish Map colors by default</p>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'sps',     label: 'SPS Score'   },
            { value: 'poverty', label: 'Poverty Rate' },
            { value: 'gap',     label: 'Funding Gap'  },
          ].map(o => (
            <button key={o.value} onClick={() => changeMapLayer(o.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                ${mapLayer === o.value
                  ? 'bg-teal text-white'
                  : isDark ? 'bg-white/8 text-slate-brand border border-white/8 hover:text-white' : 'bg-white text-navy/60 border border-navy/10 hover:text-navy'
                }`}>
              {o.label}
            </button>
          ))}
        </div>
        <p className={`text-[10px] mt-2 ${muted}`}>Preference saved — takes effect on next Parish Map load</p>
      </div>
    </div>
  )
}

// ── Notifications Tab ────────────────────────────────────────────
function NotifsTab({ isDark }) {
  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'
  const card  = isDark ? 'bg-navy-2 border border-white/8' : 'bg-white border border-navy/8 shadow-sm'

  const PREFS_KEY = 'ep_notif_prefs'
  const defaults = { emailDigest: false, criticalAlerts: true, newData: false, weeklyReport: false }

  const [prefs, setPrefs] = useState(() => {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') } }
    catch { return defaults }
  })
  const [saved, setSaved] = useState(false)

  function toggle(key) {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    localStorage.setItem(PREFS_KEY, JSON.stringify(next))
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  function Toggle({ value, onToggle }) {
    return (
      <button onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${value ? 'bg-teal' : isDark ? 'bg-white/20' : 'bg-navy/15'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    )
  }

  const items = [
    { key: 'criticalAlerts', label: 'Critical Parish Alerts',   desc: 'Notify when a parish drops to Critical gap status or F grade', icon: Bell  },
    { key: 'emailDigest',    label: 'Weekly Email Digest',      desc: 'Summary of new parishes, SPS changes, and data updates',      icon: Bell  },
    { key: 'newData',        label: 'New Data Release',         desc: 'Alert when LDOE or Census publishes updated datasets',         icon: Bell  },
    { key: 'weeklyReport',   label: 'Weekly Dashboard Report',  desc: 'PDF summary of your role\'s key metrics emailed weekly',      icon: Bell  },
  ]

  return (
    <div className="space-y-3 max-w-lg">
      {saved && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm bg-emerald-50 border-emerald-200 text-emerald-700">
          <CheckCircle size={14} /> Preferences saved
        </div>
      )}
      {items.map(item => {
        const Icon = item.icon
        const on   = prefs[item.key]
        return (
          <div key={item.key} className={`rounded-xl p-4 ${card}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${on ? 'bg-teal/15' : isDark ? 'bg-white/5' : 'bg-navy/5'}`}>
                  {on ? <Bell size={14} className="text-teal-2" /> : <BellOff size={14} className={muted} />}
                </div>
                <div>
                  <p className={`text-sm font-medium ${text}`}>{item.label}</p>
                  <p className={`text-xs mt-0.5 ${muted}`}>{item.desc}</p>
                </div>
              </div>
              <Toggle value={on} onToggle={() => toggle(item.key)} />
            </div>
          </div>
        )
      })}
      <p className={`text-xs ${muted}`}>Notification delivery requires account email verification. Preferences are saved locally.</p>
    </div>
  )
}

// ── Data Sources Tab ─────────────────────────────────────────────
function DataTab({ isDark }) {
  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'
  const card  = isDark ? 'bg-navy-2 border border-white/8' : 'bg-white border border-navy/8 shadow-sm'

  function clearFilters() {
    Object.keys(localStorage).filter(k => k.startsWith('edupulse_filter_')).forEach(k => localStorage.removeItem(k))
    alert('Saved filters cleared.')
  }

  return (
    <div className="space-y-4 max-w-lg">
      {/* Freshness overview */}
      <div className={`rounded-xl p-4 ${card}`}>
        <div className="flex items-center justify-between mb-3">
          <p className={`text-sm font-semibold ${text}`}>Data Currency</p>
          <span className="flex items-center gap-1 text-[10px] font-mono text-teal-2">
            <RefreshCw size={10} /> ETL run 2026-06-30
          </span>
        </div>
        <div className="space-y-3">
          {DATA_SOURCES.map(s => (
            <div key={s.name} className={`border rounded-lg p-3 ${isDark ? 'border-white/6 bg-white/2' : 'border-navy/6 bg-slate-50'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${text}`}>{s.name}</p>
                  <p className={`text-[10px] ${muted}`}>{s.org} · {s.vintage}</p>
                  <p className={`text-[10px] mt-0.5 ${muted}`}>{s.covers}</p>
                </div>
                <a href={s.url} target="_blank" rel="noopener noreferrer"
                  className="flex-shrink-0 text-teal-2 hover:underline">
                  <ExternalLink size={12} />
                </a>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-2 flex-shrink-0" />
                <span className={`text-[10px] font-mono ${muted}`}>Retrieved {s.retrieved}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Browser state */}
      <div className={`rounded-xl p-4 ${card}`}>
        <p className={`text-sm font-medium mb-1 ${text}`}>Browser State</p>
        <p className={`text-xs mb-3 ${muted}`}>Clear any saved filter or preference state stored in your browser.</p>
        <button onClick={clearFilters}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors cursor-pointer">
          <Trash2 size={12} />
          Clear Saved Filters
        </button>
      </div>
    </div>
  )
}

// ── About Tab ────────────────────────────────────────────────────
function AboutTab({ isDark }) {
  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'
  const card  = isDark ? 'bg-navy-2 border border-white/8' : 'bg-white border border-navy/8 shadow-sm'

  return (
    <div className="space-y-4 max-w-lg">
      <div className={`rounded-xl p-4 ${card}`}>
        <p className={`text-sm font-semibold mb-0.5 ${text}`}>Louisiana EduPulse</p>
        <p className={`text-xs ${muted}`}>Version 1.0.0 · Nexus Louisiana Dev Days 2025</p>
        <p className={`text-xs mt-2 leading-relaxed ${muted}`}>
          An AI-powered intelligence platform unifying Louisiana K-12 education data for policymakers, funders, and school operators. Every metric is traceable to an official government source — no estimated or fabricated values.
        </p>
      </div>

      <div className={`rounded-xl p-4 ${card}`}>
        <p className={`text-sm font-medium mb-1 ${text}`}>Data Philosophy</p>
        <ul className={`text-xs space-y-1.5 leading-relaxed ${muted}`}>
          <li className="flex items-start gap-2"><span className="text-teal-2 flex-shrink-0 mt-0.5">✓</span>Every number cites an official source (LDOE, Census, BLS)</li>
          <li className="flex items-start gap-2"><span className="text-teal-2 flex-shrink-0 mt-0.5">✓</span>Derived values use transparent, documented formulas</li>
          <li className="flex items-start gap-2"><span className="text-teal-2 flex-shrink-0 mt-0.5">✓</span>Missing data is shown as "pending" — never fabricated</li>
          <li className="flex items-start gap-2"><span className="text-teal-2 flex-shrink-0 mt-0.5">✓</span>Full provenance tracked in <code className="font-mono">metric_provenance</code> table</li>
          <li className="flex items-start gap-2"><span className="text-teal-2 flex-shrink-0 mt-0.5">✓</span>Historical RSD data labeled as dissolved program</li>
        </ul>
      </div>

      <div className={`rounded-xl p-4 ${card}`}>
        <p className={`text-sm font-medium mb-3 ${text}`}>Stack</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {[
            ['Backend', 'FastAPI + SQLAlchemy 2.0'],
            ['Database', 'PostgreSQL 15 (Docker)'],
            ['Frontend', 'React 19 + Vite + Tailwind'],
            ['Charts', 'Recharts'],
            ['Auth', 'Firebase Auth'],
            ['AI', 'Claude claude-sonnet-4-6 via Anthropic API'],
            ['Migrations', 'Alembic'],
            ['ETL', 'Census, BLS, LDOE, pdfplumber'],
          ].map(([label, val]) => (
            <div key={label}>
              <p className={`text-[10px] font-mono ${muted}`}>{label}</p>
              <p className={`text-xs font-medium ${text}`}>{val}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={`rounded-xl p-4 ${card}`}>
        <p className={`text-sm font-medium mb-1 ${text}`}>Contact & Feedback</p>
        <p className={`text-xs ${muted}`}>Built for Nexus Louisiana Dev Days 2025 EdTech track. Report issues or suggest features via the Dev Days Slack.</p>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────
export default function SettingsPage({ isDark }) {
  const [tab, setTab] = useState('profile')

  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'

  const tabContent = {
    profile: <ProfileTab isDark={isDark} />,
    prefs:   <PrefsTab   isDark={isDark} />,
    notifs:  <NotifsTab  isDark={isDark} />,
    data:    <DataTab    isDark={isDark} />,
    about:   <AboutTab   isDark={isDark} />,
  }

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h2 className={`font-display text-xl font-semibold mb-1 ${text}`}>Settings</h2>
        <p className={`text-sm ${muted}`}>Manage your account, preferences, and data sources</p>
      </div>

      <div className="flex gap-1 flex-wrap">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer
                ${tab === t.key
                  ? 'bg-teal text-white'
                  : isDark ? 'bg-white/8 text-slate-brand hover:text-white border border-white/8' : 'bg-white text-navy/60 hover:text-navy border border-navy/10 shadow-sm'
                }`}>
              <Icon size={12} />
              {t.label}
            </button>
          )
        })}
      </div>

      {tabContent[tab]}
    </div>
  )
}
