import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'))
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('admin_user')
    return u ? JSON.parse(u) : null
  })

  const login = (tokenValue, userInfo) => {
    localStorage.setItem('admin_token', tokenValue)
    localStorage.setItem('admin_user', JSON.stringify(userInfo))
    setToken(tokenValue)
    setUser(userInfo)
  }

  const logout = () => {
    localStorage.clear()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
