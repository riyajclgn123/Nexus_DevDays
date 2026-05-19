/**
 * SettingsPage.jsx — Shared settings component for all three dashboards.
 * Handles profile editing, theme preferences, data export, and about info.
 */

import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useAuth }  from '../context/AuthContext'
import { updateUser } from '../context/userService'
import { User, Palette, Database, Info, Save, CheckCircle, Moon, Sun, Trash2 } from 'lucide-react'

const TABS = [
  { key: 'profile',  label: 'Profile',   icon: User    },
  { key: 'prefs',    label: 'Preferences', icon: Palette },
  { key: 'data',     label: 'Data & Export', icon: Database },
  { key: 'about',    label: 'About',     icon: Info    },
]

function Toast({ msg, type = 'success' }) {
  if (!msg) return null
  const bg = type === 'success'
    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
    : 'bg-red-50 border-red-200 text-red-700'
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm animate-fade-up ${bg}`}>
      <CheckCircle size={14} />
      {msg}
    </div>
  )
}

function ProfileTab({ isDark }) {
  const { user } = useAuth()
  const [name, setName]   = useState(user?.name || '')
  const [org, setOrg]     = useState(user?.org || '')
  const [toast, setToast] = useState('')
  const [busy, setBusy]   = useState(false)

  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'
  const inputCls = isDark
    ? 'bg-navy border border-white/10 text-white placeholder-slate-brand focus:border-teal-2'
    : 'bg-white border border-navy/10 text-navy placeholder-navy/30 focus:border-teal-2'

  const roleBadge = {
    policymaker: 'bg-teal/15 text-teal border-teal/20',
    funder:      'bg-gold/15 text-[#8B6914] border-gold/20',
    operator:    'bg-teal/12 text-teal border-teal/15',
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

  return (
    <div className="space-y-5 max-w-lg">
      {toast && <Toast msg={toast} />}
      <div className="space-y-4">
        <div>
          <label className={`text-xs font-medium mb-1.5 block ${muted}`}>Display Name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all ${inputCls}`}
            placeholder="Your name" />
        </div>
        <div>
          <label className={`text-xs font-medium mb-1.5 block ${muted}`}>Organization</label>
          <input value={org} onChange={e => setOrg(e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all ${inputCls}`}
            placeholder="Your organization" />
        </div>
        <div>
          <label className={`text-xs font-medium mb-1.5 block ${muted}`}>Role</label>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-lg text-xs border font-medium capitalize ${roleBadge}`}>
              {user?.role || 'N/A'}
            </span>
            <span className={`text-xs ${muted}`}>(role is set at registration)</span>
          </div>
        </div>
        <div>
          <label className={`text-xs font-medium mb-1.5 block ${muted}`}>Email</label>
          <p className={`text-sm ${text}`}>{user?.email || '—'}</p>
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

function PrefsTab({ isDark }) {
  const { toggleTheme } = useTheme()
  const [emailNotifs, setEmailNotifs] = useState(false)
  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'
  const cardCls = isDark
    ? 'bg-navy-2 border border-white/8'
    : 'bg-white border border-navy/8 shadow-sm'

  return (
    <div className="space-y-4 max-w-lg">
      <div className={`rounded-xl p-4 ${cardCls}`}>
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

      <div className={`rounded-xl p-4 ${cardCls}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${text}`}>Email Notifications</p>
            <p className={`text-xs mt-0.5 ${muted}`}>Weekly data digest and alerts</p>
          </div>
          <button onClick={() => setEmailNotifs(v => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer
              ${emailNotifs ? 'bg-teal' : isDark ? 'bg-white/20' : 'bg-navy/15'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform
              ${emailNotifs ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>
    </div>
  )
}

function DataTab({ isDark }) {
  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'
  const cardCls = isDark
    ? 'bg-navy-2 border border-white/8'
    : 'bg-white border border-navy/8 shadow-sm'

  function clearFilters() {
    Object.keys(localStorage).filter(k => k.startsWith('edupulse_filter_')).forEach(k => localStorage.removeItem(k))
    alert('Saved filters cleared.')
  }

  return (
    <div className="space-y-4 max-w-lg">
      <div className={`rounded-xl p-4 ${cardCls}`}>
        <p className={`text-sm font-medium mb-1 ${text}`}>Saved Filters</p>
        <p className={`text-xs mb-3 ${muted}`}>Clear any saved filter state in your browser.</p>
        <button onClick={clearFilters}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors cursor-pointer">
          <Trash2 size={12} />
          Clear Saved Filters
        </button>
      </div>
      <div className={`rounded-xl p-4 ${cardCls}`}>
        <p className={`text-sm font-medium mb-1 ${text}`}>Data Refresh</p>
        <p className={`text-xs ${muted}`}>Last refreshed: May 2025 (LDOE 2024–25 release cycle)</p>
      </div>
    </div>
  )
}

function AboutTab({ isDark }) {
  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'
  const cardCls = isDark
    ? 'bg-navy-2 border border-white/8'
    : 'bg-white border border-navy/8 shadow-sm'

  const sources = [
    { name: 'Louisiana DOE (LDOE)', desc: 'School Performance Scores, graduation rates, proficiency', url: 'https://doe.louisiana.gov/data-and-reports' },
    { name: 'US Census Bureau ACS 2024', desc: 'Poverty rates, income, educational attainment', url: 'https://data.census.gov' },
    { name: 'BLS Louisiana 2025', desc: 'Workforce demand, job sector projections', url: 'https://www.bls.gov/eag/eag.la.htm' },
    { name: 'Better LA Research', desc: 'Context for ROI framing and investment modeling', url: 'https://betterla.org/research/' },
  ]

  return (
    <div className="space-y-4 max-w-lg">
      <div className={`rounded-xl p-4 ${cardCls}`}>
        <p className={`text-sm font-semibold mb-0.5 ${text}`}>Louisiana EduPulse</p>
        <p className={`text-xs ${muted}`}>Version 1.0.0 · Nexus Louisiana Dev Days 2025</p>
        <p className={`text-xs mt-2 leading-relaxed ${muted}`}>
          An AI-powered intelligence platform unifying Louisiana K-12 education data for policymakers, funders, and school operators.
        </p>
      </div>
      <div className={`rounded-xl p-4 ${cardCls}`}>
        <p className={`text-sm font-medium mb-3 ${text}`}>Data Sources</p>
        <div className="space-y-2.5">
          {sources.map(s => (
            <div key={s.name}>
              <p className={`text-xs font-medium ${text}`}>{s.name}</p>
              <p className={`text-[11px] ${muted}`}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage({ isDark }) {
  const [tab, setTab] = useState('profile')

  const text  = isDark ? 'text-white'       : 'text-navy'
  const muted = isDark ? 'text-slate-brand' : 'text-navy/50'

  const tabContent = {
    profile: <ProfileTab isDark={isDark} />,
    prefs:   <PrefsTab isDark={isDark} />,
    data:    <DataTab isDark={isDark} />,
    about:   <AboutTab isDark={isDark} />,
  }

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h2 className={`font-display text-xl font-semibold mb-1 ${text}`}>Settings</h2>
        <p className={`text-sm ${muted}`}>Manage your account, preferences, and data</p>
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
