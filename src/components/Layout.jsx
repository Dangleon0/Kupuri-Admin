import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children, title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">Kupuri Admin</div>
        <nav className="sidebar-nav">
          {user?.role === 'ADMIN' && (
            <>
              <Link className="nav-item" to="/">Eventos</Link>
              <Link className="nav-item" to="/orders">Órdenes</Link>
              <Link className="nav-item" to="/complimentary">Cortesías</Link>
            </>
          )}
          <Link className="nav-item" to="/scan">Escáner</Link>
        </nav>
        <div className="sidebar-footer">
          <span className="sidebar-user">{user?.email}</span>
          <button className="btn-ghost" onClick={handleLogout}>Salir</button>
        </div>
      </aside>
      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}
