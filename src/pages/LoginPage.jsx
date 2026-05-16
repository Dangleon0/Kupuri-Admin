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
      const { token, role, displayName } = r.data
      if (role !== 'ADMIN') {
        setError('Solo administradores pueden acceder a este panel')
        return
      }
      login(token, { email, role, displayName })
      navigate('/', { replace: true })
    } catch {
      setError('Credenciales inválidas')
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
