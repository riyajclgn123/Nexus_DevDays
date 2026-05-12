/**
 * SocialButtons.jsx
 *
 * Google and Microsoft OAuth buttons using real Firebase Auth.
 * Calls loginWithGoogle() / loginWithMicrosoft() from AuthContext.
 * Passes the currently selected role so new users get the right role.
 */

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#F25022" d="M1 1h10v10H1z"/>
      <path fill="#00A4EF" d="M13 1h10v10H13z"/>
      <path fill="#7FBA00" d="M1 13h10v10H1z"/>
      <path fill="#FFB900" d="M13 13h10v10H13z"/>
    </svg>
  )
}

function Spinner() {
  return <span className="inline-block w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin-slow" />
}

export default function SocialButtons({ onSuccess, role }) {
  const { loginWithGoogle, loginWithMicrosoft } = useAuth()
  const [loading, setLoading] = useState(null)
  const [error, setError]     = useState('')

  async function handleGoogle() {
    setLoading('google')
    setError('')
    try {
      const profile = await loginWithGoogle(role.key)
      onSuccess(profile)
    } catch (err) {
      // User closed popup — not a real error
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError('Google sign-in failed. Please try again.')
        console.error(err)
      }
    } finally {
      setLoading(null)
    }
  }

  async function handleMicrosoft() {
    setLoading('microsoft')
    setError('')
    try {
      const profile = await loginWithMicrosoft(role.key)
      onSuccess(profile)
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError('Microsoft sign-in failed. Please try again.')
        console.error(err)
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mb-5">
      <div className="flex gap-2.5 mb-2">
        {/* Google */}
        <button
          type="button"
          disabled={!!loading}
          onClick={handleGoogle}
          className="social-btn"
          aria-label="Sign in with Google"
        >
          {loading === 'google' ? <Spinner /> : <GoogleIcon />}
          <span>{loading === 'google' ? 'Connecting...' : 'Google'}</span>
        </button>

        {/* Microsoft */}
        <button
          type="button"
          disabled={!!loading}
          onClick={handleMicrosoft}
          className="social-btn"
          aria-label="Sign in with Microsoft"
        >
          {loading === 'microsoft' ? <Spinner /> : <MicrosoftIcon />}
          <span>{loading === 'microsoft' ? 'Connecting...' : 'Microsoft'}</span>
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-xs text-center">{error}</p>
      )}
    </div>
  )
}
