import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { clearSession, getToken, getUser, setSession, subscribe } from '../lib/authStore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(() => ({ token: getToken(), user: getUser() }))

  useEffect(() => subscribe((next) => setSessionState({ ...next })), [])

  const login = useCallback((tokenValue, userInfo) => {
    setSession(tokenValue, userInfo)
  }, [])

  const logout = useCallback(() => {
    clearSession()
  }, [])

  useEffect(() => {
    if (!session.user?.expiresAt) return undefined

    const msUntilExpiry = session.user.expiresAt - Date.now()
    if (msUntilExpiry <= 0) {
      logout()
      return undefined
    }

    const timeoutId = window.setTimeout(logout, msUntilExpiry)
    return () => window.clearTimeout(timeoutId)
  }, [logout, session.user?.expiresAt])

  return (
    <AuthContext.Provider value={{ token: session.token, user: session.user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
