/**
 * userService.js
 *
 * All Firestore database operations for user accounts.
 *
 * Firestore structure:
 *   users/
 *     {uid}/
 *       name:      "Maya Johnson"
 *       email:     "maya@ldoe.gov"
 *       org:       "Louisiana Dept. of Education"
 *       role:      "policymaker" | "funder" | "operator"
 *       provider:  "google" | "microsoft" | "local"
 *       createdAt: Timestamp
 *       lastLogin: Timestamp
 *
 * Functions:
 *   createUser(uid, data)   → creates new user doc
 *   getUser(uid)            → fetches user doc
 *   updateLastLogin(uid)    → updates lastLogin timestamp
 *   userExists(uid)         → returns true/false
 */

import {
  doc, setDoc, getDoc, updateDoc,
  serverTimestamp, collection, query, where, getDocs
} from 'firebase/firestore'
import { db } from '../firebase'

const USERS = 'users'   // Firestore collection name

// ─── Create a new user document ───────────────────────────────────
// Called after first-time registration (email OR OAuth)
export async function createUser(uid, { name, email, org, role, provider }) {
  const ref = doc(db, USERS, uid)
  await setDoc(ref, {
    name,
    email,
    org:       org ?? '',
    role,
    provider,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
  })
}

// ─── Fetch a user document by UID ─────────────────────────────────
// Returns the user data object, or null if not found
export async function getUser(uid) {
  const ref  = doc(db, USERS, uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { uid, ...snap.data() }
}

// ─── Check if a user document already exists ──────────────────────
export async function userExists(uid) {
  const ref  = doc(db, USERS, uid)
  const snap = await getDoc(ref)
  return snap.exists()
}

// ─── Update last login timestamp ──────────────────────────────────
export async function updateLastLogin(uid) {
  const ref = doc(db, USERS, uid)
  await updateDoc(ref, { lastLogin: serverTimestamp() })
}

// ─── Update user profile ──────────────────────────────────────────
export async function updateUser(uid, updates) {
  const ref = doc(db, USERS, uid)
  await updateDoc(ref, updates)
}

// ─── Get all users (admin use only) ───────────────────────────────
export async function getUsersByRole(role) {
  const q    = query(collection(db, USERS), where('role', '==', role))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }))
}
