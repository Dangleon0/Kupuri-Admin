import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)
const TOKEN_KEY = 'admin_token'
const USER_KEY = 'admin_user'

function readStoredSession() {
  const storedToken = localStorage.getItem(TOKEN_KEY)
  const storedUser = localStorage.getItem(USER_KEY)
  if (!storedToken || !storedUser) return { token: null, user: null }

  try {
    const parsedUser = JSON.parse(storedUser)
    if (parsedUser.expiresAt && Date.now() >= parsedUser.expiresAt) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      return { token: null, user: null }
    }
    return { token: storedToken, user: parsedUser }
  } catch {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    return { token: null, user: null }
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession)

  const login = useCallback((tokenValue, userInfo) => {
    localStorage.setItem(TOKEN_KEY, tokenValue)
    localStorage.setItem(USER_KEY, JSON.stringify(userInfo))
    setSession({ token: tokenValue, user: userInfo })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setSession({ token: null, user: null })
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

export const useAuth = () => useContext(AuthContext)
