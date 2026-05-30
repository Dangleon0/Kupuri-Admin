// Single source of truth for the session token + user.
//
// Token lives in a module-scoped variable (memory). A mirror in sessionStorage
// lets the session survive page reloads but NOT closing the tab. This is a
// pragmatic trade-off: localStorage exposes the token to any script in the
// page indefinitely; sessionStorage limits exposure to the current tab. The
// only fully-safe option is server-side HttpOnly cookies — track that as
// backend work, not a frontend fix.

import type { SessionUser } from '../types/api'

interface SessionSnapshot {
  token: string | null
  user: SessionUser | null
}

type Listener = (snapshot: SessionSnapshot) => void

const SESSION_KEY = 'admin_session_v2'

let memoryToken: string | null = null
let memoryUser: SessionUser | null = null
const listeners = new Set<Listener>()

function persist(): void {
  try {
    if (memoryToken && memoryUser) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: memoryToken, user: memoryUser }))
    } else {
      sessionStorage.removeItem(SESSION_KEY)
    }
  } catch {
    // sessionStorage may be unavailable (private mode, quota). In-memory state still works.
  }
}

function hydrate(): void {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as { token?: string; user?: SessionUser } | null
    if (parsed?.token && parsed.user) {
      if (parsed.user.expiresAt && Date.now() >= parsed.user.expiresAt) {
        sessionStorage.removeItem(SESSION_KEY)
        return
      }
      memoryToken = parsed.token
      memoryUser = parsed.user
    }
  } catch {
    try { sessionStorage.removeItem(SESSION_KEY) } catch { /* noop */ }
  }
}

hydrate()

function emit(): void {
  listeners.forEach((fn) => fn({ token: memoryToken, user: memoryUser }))
}

export function getToken(): string | null {
  return memoryToken
}

export function getUser(): SessionUser | null {
  return memoryUser
}

export function setSession(token: string, user: SessionUser): void {
  memoryToken = token
  memoryUser = user
  persist()
  emit()
}

export function clearSession(): void {
  memoryToken = null
  memoryUser = null
  persist()
  emit()
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

// Test-only escape hatch. Production code never imports this.
export function __resetForTests(): void {
  memoryToken = null
  memoryUser = null
  listeners.clear()
  try { sessionStorage.removeItem(SESSION_KEY) } catch { /* noop */ }
}
