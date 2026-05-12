/**
 * AuthPage.jsx
 *
 * The full login / register page.
 * Three role types (Policymaker, Funder, Operator) each change
 * the color scheme and copy on the right panel.
 * Auth methods: Google (OAuth), Microsoft (OAuth), local email+password.
 *
 * For now, OAuth buttons simulate the redirect flow.
 * In production you would replace socialLogin() with:
 *   - Firebase: signInWithPopup(auth, new GoogleAuthProvider())
 *   - NextAuth / Auth.js: signIn('google') / signIn('azure-ad')
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginForm    from './LoginForm'
import RegisterForm from './RegisterForm'

// ─── Role configuration ───────────────────────────────────────────
// Each role has its own colors, copy, and dashboard route.
export const ROLES = {
  policymaker: {
    key:       'policymaker',
    label:     'Policymaker',
    desc:      'LDOE & district leaders',
    dotColor:  'bg-teal-2',
    activeBg:  'bg-teal/10 border-teal-2/50',
    btnClass:  'btn-teal',
    route:     '/dashboard/policymaker',
    tagline:   'Identify gaps. Direct resources. Drive outcomes.',
  },
  funder: {
    key:       'funder',
    label:     'Philanthropic Funder',
    desc:      'Foundations & grant makers',
    dotColor:  'bg-gold',
    activeBg:  'bg-gold/10 border-gold/50',
    btnClass:  'btn-gold',
    route:     '/dashboard/funder',
    tagline:   'Find the highest-impact opportunities for every dollar.',
  },
  operator: {
    key:       'operator',
    label:     'School Operator',
    desc:      'Charter networks & CMOs',
    dotColor:  'bg-teal-3',
    activeBg:  'bg-teal-3/10 border-teal-3/40',
    btnClass:  'btn-navy',
    route:     '/dashboard/operator',
    tagline:   'See where students need you before you expand.',
  },
}

// ─── Main AuthPage ─────────────────────────────────────────────────
export default function AuthPage() {
  const [activeRole, setActiveRole] = useState('policymaker')
  const [tab, setTab]               = useState('login')   // 'login' | 'register'
  const [done, setDone]             = useState(false)
  const navigate = useNavigate()
  const role     = ROLES[activeRole]

  // Called by LoginForm / RegisterForm after successful auth
  // userData already has role set from AuthContext / Firestore
  function handleSuccess(userData) {
    setDone(true)
    const destination = userData?.role ? `/dashboard/${userData.role}` : role.route
    setTimeout(() => navigate(destination), 1200)
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background decorative circles */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-teal/5 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-gold/5 translate-x-1/3 translate-y-1/3 pointer-events-none" />
      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,0.02) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,0.02) 40px)' }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-4xl flex rounded-2xl overflow-hidden shadow-modal animate-fade-up">

        {/* ── LEFT PANEL ────────────────────────────────────────── */}
        <LeftPanel activeRole={activeRole} setActiveRole={setActiveRole} />

        {/* ── RIGHT PANEL ───────────────────────────────────────── */}
        <div className="flex-1 bg-white flex flex-col justify-center px-10 py-10">
          {done ? (
            <SuccessScreen role={role} />
          ) : (
            <>
              {/* Tab switcher */}
              <div className="flex gap-1 bg-slate-3 rounded-xl p-1 mb-7">
                {['login', 'register'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-150 cursor-pointer
                      ${tab === t ? 'bg-white text-navy shadow-card' : 'text-slate-brand hover:text-navy'}`}
                  >
                    {t === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                ))}
              </div>

              {/* Form */}
              {tab === 'login' ? (
                <LoginForm
                  role={role}
                  onSuccess={handleSuccess}
                  onSwitch={() => setTab('register')}
                />
              ) : (
                <RegisterForm
                  role={role}
                  activeRoleKey={activeRole}
                  onSuccess={handleSuccess}
                  onSwitch={() => setTab('login')}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Left panel ───────────────────────────────────────────────────
function LeftPanel({ activeRole, setActiveRole }) {
  return (
    <div className="w-[42%] flex-shrink-0 bg-navy-2 flex flex-col justify-between px-8 py-10 relative overflow-hidden">
      {/* Decorative rings */}
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full border border-gold/10 pointer-events-none" />
      <div className="absolute -bottom-20 -left-12 w-64 h-64 rounded-full border border-teal/15 pointer-events-none" />

      <div>
        {/* Brand */}
        <div className="mb-8">
          <span className="inline-flex items-center px-3 py-1.5 bg-gold/10 border border-gold/25 rounded-md mb-3">
            <span className="font-mono text-[10px] text-gold-2 tracking-[2px] uppercase">Louisiana</span>
          </span>
          <h1 className="font-display text-[2rem] text-white leading-tight font-bold">
            Edu<span className="text-gold-2">Pulse</span>
          </h1>
          <p className="text-slate-brand text-sm leading-relaxed mt-2">
            A unified intelligence platform connecting need, demand, and opportunity across Louisiana's K-12 system.
          </p>
        </div>

        {/* Role pills */}
        <div className="flex flex-col gap-2.5">
          <p className="font-mono text-[10px] text-slate-brand/60 tracking-widest uppercase mb-1">
            Sign in as
          </p>
          {Object.values(ROLES).map(r => (
            <button
              key={r.key}
              onClick={() => setActiveRole(r.key)}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all duration-150 cursor-pointer text-left
                ${activeRole === r.key
                  ? r.activeBg
                  : 'border-white/5 bg-white/3 hover:bg-white/8 hover:border-white/12'
                }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.dotColor}`} />
              <span className="flex flex-col">
                <span className="text-white text-sm font-medium">{r.label}</span>
                <span className="text-slate-brand text-xs mt-0.5">{r.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <span className="font-mono text-[10px] text-slate-brand/40 tracking-widest">
        EDUPULSE v1.0 &nbsp;·&nbsp; NEW SCHOOLS FOR LOUISIANA
      </span>
    </div>
  )
}

// ─── Success screen ───────────────────────────────────────────────
function SuccessScreen({ role }) {
  const icons = { policymaker: '✓', funder: '◆', operator: '▲' }
  const bgMap  = { policymaker: 'bg-teal/10 text-teal', funder: 'bg-gold/15 text-gold', operator: 'bg-navy/8 text-navy' }

  return (
    <div className="flex flex-col items-center text-center gap-4 py-8 animate-fade-up">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${bgMap[role.key]}`}>
        {icons[role.key]}
      </div>
      <h2 className="font-display text-2xl text-navy font-semibold">
        {role.key === 'policymaker' ? 'Welcome, Leader.' : role.key === 'funder' ? 'Ready to invest.' : "Let's grow."}
      </h2>
      <p className="text-slate-brand text-sm leading-relaxed max-w-xs">
        {role.tagline} Redirecting to your dashboard...
      </p>
      <div className="w-6 h-6 border-2 border-slate-2 border-t-teal-2 rounded-full animate-spin-slow mt-2" />
    </div>
  )
}
