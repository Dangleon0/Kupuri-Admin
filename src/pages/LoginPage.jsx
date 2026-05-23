import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login as apiLogin } from '../api'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const r = await apiLogin(email, password)
      const { token, accessToken, expiresInSeconds, role, displayName } = r.data
      const authToken = token || accessToken
      if (!['ADMIN', 'STAFF_SCANNER'].includes(role)) {
        setError('Tu usuario no tiene acceso a este panel')
        return
      }
      if (!authToken) {
        setError('La respuesta de login no incluyó token de acceso')
        return
      }
      const ttlSeconds = Number(expiresInSeconds) || 3600
      login(authToken, {
        email,
        role,
        displayName,
        expiresAt: Date.now() + ttlSeconds * 1000,
      })
      navigate(role === 'STAFF_SCANNER' ? '/scan' : '/', { replace: true })
    } catch (err) {
      setError(err.response?.status === 401 ? 'Credenciales inválidas' : 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Kupuri Admin</h1>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" required value={email}
                   onChange={e => setEmail(e.target.value)}/>
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input type="password" required value={password}
                   onChange={e => setPassword(e.target.value)}/>
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
