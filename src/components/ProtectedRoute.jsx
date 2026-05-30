import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { token, user, logout } = useAuth()
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const exp = user?.expiresAt
    if (!exp) {
      setExpired(false)
      return undefined
    }
    if (Date.now() >= exp) {
      setExpired(true)
      logout()
      return undefined
    }
    const id = window.setTimeout(() => {
      setExpired(true)
      logout()
    }, exp - Date.now())
    return () => window.clearTimeout(id)
  }, [user?.expiresAt, logout])

  if (!token || expired) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to={user?.role === 'STAFF_SCANNER' ? '/scan' : '/login'} replace />
  }
  return children
}
