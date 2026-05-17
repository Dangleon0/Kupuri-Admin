import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getOrders } from '../api'
import Layout from '../components/Layout'

export default function OrdersPage() {
  const { token } = useAuth()
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('PAID')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getOrders(token, filter)
      .then(r => setOrders(r.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <Layout title="Órdenes">
      <div className="page-header">
        <h1>Órdenes</h1>
        <select value={filter} onChange={e => setFilter(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e4e4e7' }}>
          <option value="">Todas</option>
          <option value="PAID">Pagadas</option>
          <option value="PENDING">Pendientes</option>
          <option value="CANCELLED">Canceladas</option>
        </select>
      </div>

      {loading ? (
        <p className="muted">Cargando…</p>
      ) : orders.length === 0 ? (
        <p className="muted">No hay órdenes.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Total</th>
              <th>Boletos</th>
              <th>Fuente</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td>{o.buyerName}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{o.buyerEmail}</td>
                <td>{formatMoney(o.totalCents, o.currency)}</td>
                <td>{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                <td>{o.source === 'COMPLIMENTARY' ? 'Cortesía' : 'Público'}</td>
                <td><span className={`badge badge-${o.status.toLowerCase()}`}>{o.status}</span></td>
                <td style={{ fontSize: 13, color: '#71717a' }}>{formatDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  )
}

function formatMoney(cents, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency })
    .format((cents || 0) / 100)
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
