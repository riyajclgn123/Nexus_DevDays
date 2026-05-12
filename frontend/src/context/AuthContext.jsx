/**
 * AuthContext.jsx
 *
 * Global auth state powered by Firebase Auth + Firestore.
 *
 * What this does:
 *   - Listens to Firebase's onAuthStateChanged so login state
 *     persists across page refreshes automatically (no localStorage needed)
 *   - After any login, fetches the user's Firestore doc to get their role
 *   - Exposes: user, role, loading, loginWithGoogle,
 *     loginWithMicrosoft, loginWithEmail, registerWithEmail, logout
 *
 * Usage in any component:
 *   const { user, role, loginWithGoogle } = useAuth()
 */

import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth, googleProvider, microsoftProvider } from '../firebase'
import {
  createUser, getUser, userExists, updateLastLogin
} from './userService'

const AuthContext = createContext(null)

// ─── Provider ─────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)   // full user object with role
  const [loading, setLoading] = useState(true)   // true while Firebase initializes

  // Listen to Firebase auth state — fires on every page load
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in — fetch their Firestore profile
        try {
          const profile = await getUser(firebaseUser.uid)
          if (profile) {
            setUser(profile)
            await updateLastLogin(firebaseUser.uid)
          } else {
            // Firebase auth exists but no Firestore doc
            // This shouldn't happen in normal flow, but handle gracefully
            setUser(null)
          }
        } catch (err) {
          console.error('Error fetching user profile:', err)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsub   // cleanup listener on unmount
  }, [])

  // ─── Google OAuth ───────────────────────────────────────────────
  async function loginWithGoogle(role) {
    const result = await signInWithPopup(auth, googleProvider)
    const fu     = result.user
    const exists = await userExists(fu.uid)

    if (!exists) {
      // First time Google login — create Firestore doc
      await createUser(fu.uid, {
        name:     fu.displayName ?? 'Google User',
        email:    fu.email,
        org:      '',
        role:     role ?? 'policymaker',
        provider: 'google',
      })
    }

    const profile = await getUser(fu.uid)
    setUser(profile)
    return profile
  }

  // ─── Microsoft OAuth ────────────────────────────────────────────
  async function loginWithMicrosoft(role) {
    const result = await signInWithPopup(auth, microsoftProvider)
    const fu     = result.user
    const exists = await userExists(fu.uid)

    if (!exists) {
      await createUser(fu.uid, {
        name:     fu.displayName ?? 'Microsoft User',
        email:    fu.email,
        org:      '',
        role:     role ?? 'policymaker',
        provider: 'microsoft',
      })
    }

    const profile = await getUser(fu.uid)
    setUser(profile)
    return profile
  }

  // ─── Email + Password Login ─────────────────────────────────────
  async function loginWithEmail(email, password) {
    const result  = await signInWithEmailAndPassword(auth, email, password)
    const profile = await getUser(result.user.uid)
    if (!profile) throw new Error('Account not found. Please register first.')
    setUser(profile)
    return profile
  }

  // ─── Email + Password Register ──────────────────────────────────
  async function registerWithEmail({ email, password, name, org, role }) {
    // Create Firebase Auth account
    const result = await createUserWithEmailAndPassword(auth, email, password)
    const fu     = result.user

    // Set display name in Firebase Auth
    await updateProfile(fu, { displayName: name })

    // Create Firestore user document
    await createUser(fu.uid, { name, email, org, role, provider: 'local' })

    const profile = await getUser(fu.uid)
    setUser(profile)
    return profile
  }

  // ─── Logout ─────────────────────────────────────────────────────
  async function logout() {
    await signOut(auth)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      role:               user?.role ?? null,
      loading,
      loginWithGoogle,
      loginWithMicrosoft,
      loginWithEmail,
      registerWithEmail,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
