import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getEvents, getTicketTypes, addTicketType, updateEventStatus, getReport } from '../api'
import Layout from '../components/Layout'

export default function EventDetailPage() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [ticketTypes, setTicketTypes] = useState([])
  const [report, setReport] = useState(null)
  const [showTypeForm, setShowTypeForm] = useState(false)
  const [form, setForm] = useState({ code: 'GENERAL', displayName: '', price: '', capacity: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadAll = async () => {
    const [eventsR, ttR, reportR] = await Promise.all([
      getEvents(),
      getTicketTypes(id),
      getReport(id),
    ])
    setEvent(eventsR.data.find(e => e.id === id))
    setTicketTypes(ttR.data)
    setReport(reportR.data)
  }

  useEffect(() => { loadAll() }, [id])

  const handleAddType = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await addTicketType(id, {
        code: form.code,
        displayName: form.displayName,
        priceCents: Math.round(Number(form.price) * 100),
        capacity: Number(form.capacity),
      })
      setShowTypeForm(false)
      setForm({ code: 'GENERAL', displayName: '', price: '', capacity: '' })
      loadAll()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const changeStatus = async (status) => {
    await updateEventStatus(id, status)
    loadAll()
  }

  if (!event) return <Layout title="Evento"><p className="muted">Cargando…</p></Layout>

  return (
    <Layout title={event.name}>
      <div className="page-header">
        <div>
          <h1>{event.name}</h1>
          <p className="muted">{event.venueName} · {formatDate(event.startsAt)}</p>
        </div>
        <div className="status-actions">
          <span className={`badge badge-${event.status.toLowerCase()}`}>{event.status}</span>
          {event.status === 'DRAFT' && (
            <button className="btn" onClick={() => changeStatus('PUBLISHED')}>Publicar</button>
          )}
          {event.status === 'PUBLISHED' && (
            <button className="btn-ghost" onClick={() => changeStatus('COMPLETED')}>Finalizar</button>
          )}
        </div>
      </div>

      {/* Reporte rápido */}
      {report && (
        <div className="stats-row">
          <Stat label="Órdenes pagadas" value={report.totalPaidOrders}/>
          <Stat label="Boletos emitidos" value={report.issuedTickets}/>
          <Stat label="Accesos usados" value={report.usedTickets}/>
          <Stat label="Tasa de entrada" value={report.entryRate}/>
        </div>
      )}

      {/* Tipos de boleto */}
      <div className="section-header">
        <h2>Tipos de boleto</h2>
        <button className="btn" onClick={() => setShowTypeForm(true)}>+ Agregar</button>
      </div>

      <table className="table">
        <thead>
          <tr><th>Nombre</th><th>Precio</th><th>Cupo</th><th>Vendidos</th><th>Disponibles</th></tr>
        </thead>
        <tbody>
          {ticketTypes.map(t => (
            <tr key={t.id}>
              <td>{t.displayName}</td>
              <td>{formatMoney(t.priceCents, t.currency)}</td>
              <td>{formatNumber(t.capacity)}</td>
              <td>{formatNumber(t.soldQuantity)}</td>
              <td>{formatNumber(t.availableQuantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showTypeForm && (
        <div className="modal-overlay" onClick={() => setShowTypeForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Nuevo tipo de boleto</h2>
            <form onSubmit={handleAddType}>
              <div className="field">
                <label>Código *</label>
                <select required value={form.code}
                        onChange={e => setForm(f => ({ ...f, code: e.target.value }))}>
                  <option value="GENERAL">General</option>
                  <option value="EARLY">Early Bird</option>
                  <option value="BACKSTAGE">Backstage</option>
                  <option value="CORTESIA">Cortesía</option>
                </select>
              </div>
              <div className="field">
                <label>Nombre *</label>
                <input required value={form.displayName}
                       onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}/>
              </div>
              <div className="field">
                <label>Precio (MXN) *</label>
                <input type="number" min="0" step="0.01" required value={form.price}
                       onChange={e => setForm(f => ({ ...f, price: e.target.value }))}/>
              </div>
              <div className="field">
                <label>Cupo total *</label>
                <input type="number" min="1" required value={form.capacity}
                       onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}/>
              </div>
              {error && <p className="error">{error}</p>}
              <div className="btn-row">
                <button type="button" className="btn-ghost" onClick={() => setShowTypeForm(false)}>Cancelar</button>
                <button type="submit" className="btn" disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

function Stat({ label, value }) {
  return (
    <div className="stat-card">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function formatMoney(cents, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
  }).format((cents || 0) / 100)
}

function formatNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : '—'
}
