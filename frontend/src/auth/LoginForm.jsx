/**
 * LoginForm.jsx — Email + password login using Firebase Auth.
 */

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import SocialButtons from './SocialButtons'

export default function LoginForm({ role, onSuccess, onSwitch }) {
  const { loginWithEmail } = useAuth()
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]  = useState(false)
  const [errors, setErrors]    = useState({})

  function validate() {
    const e = {}
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email address.'
    if (!password || password.length < 8) e.password = 'Password must be at least 8 characters.'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      const profile = await loginWithEmail(email, password)
      onSuccess(profile)
    } catch (err) {
      // Map Firebase error codes to friendly messages
      const msg =
        err.code === 'auth/user-not-found'    ? 'No account found with this email.' :
        err.code === 'auth/wrong-password'    ? 'Incorrect password. Please try again.' :
        err.code === 'auth/invalid-credential'? 'Incorrect email or password.' :
        err.code === 'auth/too-many-requests' ? 'Too many attempts. Please wait a moment.' :
        err.message ?? 'Login failed. Please try again.'
      setErrors({ form: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-up">
      <h2 className="font-display text-2xl text-navy font-semibold mb-1">Welcome back</h2>
      <p className="text-slate-brand text-sm mb-6">
        Signing in as <strong className="text-navy font-medium">{role.label}</strong>
      </p>

      <SocialButtons role={role} onSuccess={onSuccess} />

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-slate-2" />
        <span className="text-xs text-slate-brand">or continue with email</span>
        <div className="flex-1 h-px bg-slate-2" />
      </div>

      {errors.form && (
        <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label className="block text-xs font-medium text-navy mb-1.5">Email address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@organization.gov"
            className={`auth-input ${errors.email ? 'border-red-400' : ''}`} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div className="mb-2">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-navy">Password</label>
            <button type="button" className="text-xs text-teal-2 hover:underline cursor-pointer"
              onClick={() => alert('Password reset: implement sendPasswordResetEmail() from Firebase Auth.')}>
              Forgot password?
            </button>
          </div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className={`auth-input ${errors.password ? 'border-red-400' : ''}`} />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        <div className="mb-5 mt-3">
          <p className="text-xs text-slate-brand/70 bg-slate-3/60 rounded-lg px-3 py-2">
            Firebase Auth keeps you signed in automatically across page refreshes.
          </p>
        </div>

        <button type="submit" disabled={loading}
          className={`${role.btnClass} flex items-center justify-center gap-2`}>
          {loading && <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin-slow" />}
          {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
        </button>
      </form>

      <p className="text-center text-xs text-slate-brand mt-4">
        No account yet?{' '}
        <button onClick={onSwitch} className="text-teal-2 font-medium hover:underline cursor-pointer">
          Create one free
        </button>
      </p>
    </div>
  )
}
