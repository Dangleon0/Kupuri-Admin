import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getEvents, getTicketTypes, addTicketType, updateEventStatus, getReport } from '../api'
import Layout from '../components/Layout'

export default function EventDetailPage() {
  const { id } = useParams()
  const { token } = useAuth()
  const [event, setEvent] = useState(null)
  const [ticketTypes, setTicketTypes] = useState([])
  const [report, setReport] = useState(null)
  const [showTypeForm, setShowTypeForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', price: '', quota: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadAll = async () => {
    const [eventsR, ttR, reportR] = await Promise.all([
      getEvents(token),
      getTicketTypes(id),
      getReport(token, id),
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
      await addTicketType(token, id, { ...form, price: Number(form.price), quota: Number(form.quota) })
      setShowTypeForm(false)
      setForm({ name: '', description: '', price: '', quota: '' })
      loadAll()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const changeStatus = async (status) => {
    await updateEventStatus(token, id, status)
    loadAll()
  }

  if (!event) return <Layout title="Evento"><p className="muted">Cargando…</p></Layout>

  return (
    <Layout title={event.name}>
      <div className="page-header">
        <div>
          <h1>{event.name}</h1>
          <p className="muted">{event.venue} · {new Date(event.eventDate).toLocaleDateString('es-MX')}</p>
        </div>
        <div className="status-actions">
          <span className={`badge badge-${event.status.toLowerCase()}`}>{event.status}</span>
          {event.status === 'DRAFT' && (
            <button className="btn" onClick={() => changeStatus('PUBLISHED')}>Publicar</button>
          )}
          {event.status === 'PUBLISHED' && (
            <button className="btn-ghost" onClick={() => changeStatus('FINISHED')}>Finalizar</button>
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
              <td>{t.name}</td>
              <td>${Number(t.price).toLocaleString('es-MX')} MXN</td>
              <td>{t.available + (t.quota - t.available)}</td>
              <td>{t.quota - t.available}</td>
              <td>{t.available}</td>
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
                <label>Nombre *</label>
                <input required value={form.name}
                       onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
              </div>
              <div className="field">
                <label>Descripción</label>
                <input value={form.description}
                       onChange={e => setForm(f => ({ ...f, description: e.target.value }))}/>
              </div>
              <div className="field">
                <label>Precio (MXN) *</label>
                <input type="number" min="0" step="0.01" required value={form.price}
                       onChange={e => setForm(f => ({ ...f, price: e.target.value }))}/>
              </div>
              <div className="field">
                <label>Cupo total *</label>
                <input type="number" min="1" required value={form.quota}
                       onChange={e => setForm(f => ({ ...f, quota: e.target.value }))}/>
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
