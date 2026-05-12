/**
 * firebase.js
 *
 * Initializes Firebase app, Auth, and Firestore.
 * Import { auth, db, googleProvider, microsoftProvider }
 * anywhere you need Firebase services.
 *
 * HOW TO FILL THIS IN:
 * 1. Go to https://console.firebase.google.com
 * 2. Your project → Project Settings → Your Apps → Web app
 * 3. Copy the firebaseConfig object and paste the values
 *    into your .env file (see .env.example)
 */

import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// ─── Firebase config (values come from .env) ──────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

// ─── Initialize ───────────────────────────────────────────────────
const app = initializeApp(firebaseConfig)

// ─── Auth ─────────────────────────────────────────────────────────
export const auth = getAuth(app)

// Google provider — opens Google's sign-in popup
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

// Microsoft provider — opens Microsoft's sign-in popup
export const microsoftProvider = new OAuthProvider('microsoft.com')
microsoftProvider.setCustomParameters({
  prompt: 'select_account',
  tenant: 'common',           // allows personal + work Microsoft accounts
})

// ─── Firestore database ───────────────────────────────────────────
// This is where user accounts are stored
export const db = getFirestore(app)

export default app
