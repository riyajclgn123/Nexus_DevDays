/**
 * RegisterForm.jsx — Creates a Firebase Auth account + Firestore user doc.
 */

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import SocialButtons from './SocialButtons'

function getPasswordStrength(pw) {
  if (!pw) return null
  if (pw.length < 6)  return { level: 'weak',   label: 'Weak',   color: 'bg-red-400',   width: 'w-1/3', text: 'text-red-500'   }
  if (pw.length < 10) return { level: 'medium',  label: 'Medium', color: 'bg-gold',      width: 'w-2/3', text: 'text-yellow-600'}
  return               { level: 'strong', label: 'Strong', color: 'bg-green-500', width: 'w-full', text: 'text-green-600' }
}

export default function RegisterForm({ role, activeRoleKey, onSuccess, onSwitch }) {
  const { registerWithEmail } = useAuth()
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', org: '',
    role: activeRoleKey, password: '',
  })
  const [terms, setTerms]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})

  const strength = getPasswordStrength(form.password)
  function update(field, val) { setForm(f => ({ ...f, [field]: val })) }

  function validate() {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim())  e.lastName  = 'Required'
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Please enter a valid email.'
    if (!form.org.trim())       e.org      = 'Please enter your organization.'
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters.'
    if (!terms) e.terms = 'You must accept the terms to continue.'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      const profile = await registerWithEmail({
        email:    form.email,
        password: form.password,
        name:     `${form.firstName} ${form.lastName}`,
        org:      form.org,
        role:     form.role,
      })
      onSuccess(profile)
    } catch (err) {
      const msg =
        err.code === 'auth/email-already-in-use' ? 'This email is already registered. Please sign in instead.' :
        err.code === 'auth/weak-password'         ? 'Password is too weak. Use at least 8 characters.' :
        err.code === 'auth/invalid-email'         ? 'Invalid email address.' :
        err.message ?? 'Registration failed. Please try again.'
      setErrors({ form: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-up">
      <h2 className="font-display text-2xl text-navy font-semibold mb-1">Create your account</h2>
      <p className="text-slate-brand text-sm mb-5">
        Join as <strong className="text-navy font-medium">{role.label}</strong> — free to get started
      </p>

      <SocialButtons role={role} onSuccess={onSuccess} />

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-slate-2" />
        <span className="text-xs text-slate-brand">or register with email</span>
        <div className="flex-1 h-px bg-slate-2" />
      </div>

      {errors.form && (
        <div className="mb-3 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-navy mb-1.5">First name</label>
            <input type="text" value={form.firstName} onChange={e => update('firstName', e.target.value)}
              placeholder="Maya" className={`auth-input ${errors.firstName ? 'border-red-400' : ''}`} />
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-navy mb-1.5">Last name</label>
            <input type="text" value={form.lastName} onChange={e => update('lastName', e.target.value)}
              placeholder="Johnson" className={`auth-input ${errors.lastName ? 'border-red-400' : ''}`} />
            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-navy mb-1.5">Work email</label>
          <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
            placeholder="you@organization.gov"
            className={`auth-input ${errors.email ? 'border-red-400' : ''}`} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-navy mb-1.5">Organization</label>
          <input type="text" value={form.org} onChange={e => update('org', e.target.value)}
            placeholder="Louisiana Dept. of Education"
            className={`auth-input ${errors.org ? 'border-red-400' : ''}`} />
          {errors.org && <p className="text-red-500 text-xs mt-1">{errors.org}</p>}
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-navy mb-1.5">Your role</label>
          <select value={form.role} onChange={e => update('role', e.target.value)} className="auth-select">
            <option value="policymaker">Policymaker / LDOE</option>
            <option value="funder">Philanthropic Funder</option>
            <option value="operator">School Operator</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-navy mb-1.5">Password</label>
          <input type="password" value={form.password} onChange={e => update('password', e.target.value)}
            placeholder="Min. 8 characters"
            className={`auth-input ${errors.password ? 'border-red-400' : ''}`} />
          {form.password && strength && (
            <div className="mt-1.5">
              <div className="h-1 bg-slate-2 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
              </div>
              <p className={`text-xs mt-1 ${strength.text}`}>{strength.label}</p>
            </div>
          )}
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        <label className="flex items-start gap-2 mb-4 cursor-pointer">
          <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)}
            className="w-3.5 h-3.5 accent-teal-2 mt-0.5 cursor-pointer flex-shrink-0" />
          <span className="text-xs text-slate-brand leading-relaxed">
            I agree to the <a href="#" className="text-teal-2 hover:underline" onClick={e => e.preventDefault()}>Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-teal-2 hover:underline" onClick={e => e.preventDefault()}>Privacy Policy</a>
          </span>
        </label>
        {errors.terms && <p className="text-red-500 text-xs -mt-3 mb-3">{errors.terms}</p>}

        <button type="submit" disabled={loading}
          className={`${role.btnClass} flex items-center justify-center gap-2`}>
          {loading && <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin-slow" />}
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-xs text-slate-brand mt-4">
        Already have an account?{' '}
        <button onClick={onSwitch} className="text-teal-2 font-medium hover:underline cursor-pointer">Sign in</button>
      </p>
    </div>
  )
}
