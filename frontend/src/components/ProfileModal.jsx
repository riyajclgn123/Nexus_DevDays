/**
 * ProfileModal.jsx
 *
 * Slide-in profile panel from the right side.
 * Features:
 *   - Avatar with initials
 *   - Edit name and organization
 *   - View role + provider (Google/Microsoft/local)
 *   - Dark/light mode toggle
 *   - Sign out button
 *   - Account stats (member since, last login)
 */

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { updateUser } from '../context/userService'
import {
  X, Sun, Moon, LogOut, User, Building2,
  Shield, CheckCircle, Edit3, Save, Mail
} from 'lucide-react'

const ROLE_LABELS = {
  policymaker: { label: 'Policymaker',         color: 'bg-teal/15 text-teal border-teal/20'   },
  funder:      { label: 'Philanthropic Funder', color: 'bg-gold/15 text-[#8B6914] border-gold/20' },
  operator:    { label: 'School Operator',      color: 'bg-navy/10 text-navy border-navy/15'   },
}

const PROVIDER_LABELS = {
  google:    { label: 'Google',    icon: '🔵' },
  microsoft: { label: 'Microsoft', icon: '🟦' },
  local:     { label: 'Email',     icon: '✉️'  },
}

export default function ProfileModal({ open, onClose }) {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [editing, setEditing]   = useState(false)
  const [saving,  setSaving]    = useState(false)
  const [saved,   setSaved]     = useState(false)
  const [form,    setForm]      = useState({ name: '', org: '' })
  const modalRef = useRef(null)

  useEffect(() => {
    if (user) setForm({ name: user.name ?? '', org: user.org ?? '' })
  }, [user])

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose()
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  // Close on Escape
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  async function handleSave() {
    if (!user?.uid) return
    setSaving(true)
    try {
      await updateUser(user.uid, { name: form.name, org: form.org })
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Failed to update profile:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/auth')
  }

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'
  const role     = ROLE_LABELS[user?.role]
  const provider = PROVIDER_LABELS[user?.provider ?? 'local']

  const bg     = isDark ? 'bg-navy-2 border-white/10'  : 'bg-white border-navy/10'
  const text   = isDark ? 'text-white'                  : 'text-navy'
  const muted  = isDark ? 'text-slate-brand'            : 'text-navy/50'
  const card   = isDark ? 'bg-navy/60 border-white/8'   : 'bg-slate-3/60 border-navy/8'
  const input  = isDark
    ? 'bg-navy border border-white/10 text-white placeholder-slate-brand focus:border-teal-2'
    : 'bg-white border border-navy/15 text-navy placeholder-navy/30 focus:border-teal-2'

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        ref={modalRef}
        className={`relative w-80 h-full border-l shadow-2xl flex flex-col animate-fade-in ${bg}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-white/8' : 'border-navy/8'}`}>
          <span className={`font-semibold text-sm ${text}`}>My Profile</span>
          <button onClick={onClose} className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer ${muted}`}>
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Avatar + name */}
          <div className="flex flex-col items-center text-center gap-3 py-2">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #0D7377, #14A6AC)' }}>
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-teal-2 border-2 flex items-center justify-center"
                style={{ borderColor: isDark ? '#132040' : '#fff' }}>
                <CheckCircle size={12} className="text-white" />
              </div>
            </div>
            <div>
              <p className={`font-display font-semibold text-lg ${text}`}>{user?.name}</p>
              <p className={`text-xs ${muted}`}>{user?.email}</p>
            </div>
            {role && (
              <span className={`px-3 py-1 rounded-full text-xs border font-medium ${role.color}`}>
                {role.label}
              </span>
            )}
          </div>

          {/* Edit form */}
          <div className={`rounded-xl border p-4 ${card}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-mono uppercase tracking-wider ${muted}`}>Account Details</span>
              {!editing ? (
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1 text-teal-2 text-xs hover:underline cursor-pointer">
                  <Edit3 size={11} /> Edit
                </button>
              ) : (
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1 text-teal-2 text-xs hover:underline cursor-pointer">
                  <Save size={11} /> {saving ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {/* Name */}
              <div>
                <label className={`flex items-center gap-1.5 text-xs mb-1.5 ${muted}`}>
                  <User size={11} /> Full Name
                </label>
                {editing ? (
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg text-sm outline-none transition-all ${input}`}
                    placeholder="Your full name" />
                ) : (
                  <p className={`text-sm font-medium ${text}`}>{user?.name ?? '—'}</p>
                )}
              </div>

              {/* Email (read only) */}
              <div>
                <label className={`flex items-center gap-1.5 text-xs mb-1.5 ${muted}`}>
                  <Mail size={11} /> Email
                </label>
                <p className={`text-sm ${muted}`}>{user?.email ?? '—'}</p>
              </div>

              {/* Organization */}
              <div>
                <label className={`flex items-center gap-1.5 text-xs mb-1.5 ${muted}`}>
                  <Building2 size={11} /> Organization
                </label>
                {editing ? (
                  <input value={form.org} onChange={e => setForm(f => ({ ...f, org: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg text-sm outline-none transition-all ${input}`}
                    placeholder="Your organization" />
                ) : (
                  <p className={`text-sm ${text}`}>{user?.org || <span className={muted}>Not set</span>}</p>
                )}
              </div>

              {/* Provider */}
              <div>
                <label className={`flex items-center gap-1.5 text-xs mb-1.5 ${muted}`}>
                  <Shield size={11} /> Sign-in Method
                </label>
                <p className={`text-sm flex items-center gap-1.5 ${text}`}>
                  <span>{provider?.icon}</span> {provider?.label}
                </p>
              </div>
            </div>

            {saved && (
              <div className="mt-3 flex items-center gap-2 text-teal-2 text-xs">
                <CheckCircle size={12} /> Profile updated successfully
              </div>
            )}
          </div>

          {/* Dark/Light mode toggle */}
          <div className={`rounded-xl border p-4 ${card}`}>
            <span className={`text-xs font-mono uppercase tracking-wider ${muted}`}>Appearance</span>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                {isDark ? <Moon size={16} className="text-teal-2" /> : <Sun size={16} className="text-gold" />}
                <span className={`text-sm font-medium ${text}`}>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
              {/* Toggle switch */}
              <button
                onClick={toggleTheme}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer ${isDark ? 'bg-teal-2' : 'bg-navy/20'}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${isDark ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {/* Role info */}
          <div className={`rounded-xl border p-4 ${card}`}>
            <span className={`text-xs font-mono uppercase tracking-wider ${muted}`}>Dashboard Access</span>
            <div className="mt-3 space-y-2">
              {[
                { r: 'policymaker', label: 'Policymaker',   desc: 'State overview, parish data, alerts' },
                { r: 'funder',      label: 'Funder',         desc: 'Opportunities, workforce gaps'       },
                { r: 'operator',    label: 'School Operator',desc: 'Expansion sites, forecasts'          },
              ].map(item => (
                <div key={item.r} className={`flex items-start gap-2.5 p-2 rounded-lg ${user?.role === item.r ? (isDark ? 'bg-teal/10 border border-teal/20' : 'bg-teal-4 border border-teal/20') : ''}`}>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${user?.role === item.r ? 'bg-teal-2' : (isDark ? 'bg-white/20' : 'bg-navy/20')}`} />
                  <div>
                    <p className={`text-xs font-medium ${user?.role === item.r ? 'text-teal-2' : muted}`}>{item.label}</p>
                    <p className={`text-[10px] ${muted}`}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div className={`px-5 py-4 border-t ${isDark ? 'border-white/8' : 'border-navy/8'}`}>
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all cursor-pointer">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
