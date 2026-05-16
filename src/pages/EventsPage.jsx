import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getEvents, createEvent } from '../api'
import Layout from '../components/Layout'

export default function EventsPage() {
  const { token } = useAuth()
  const [events, setEvents] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', venue: '', eventDate: '', coverUrl: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    getEvents(token).then(r => setEvents(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createEvent(token, { ...form, eventDate: new Date(form.eventDate).toISOString() })
      setShowForm(false)
      setForm({ name: '', description: '', venue: '', eventDate: '', coverUrl: '' })
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear evento')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout title="Eventos">
      <div className="page-header">
        <h1>Eventos</h1>
        <button className="btn" onClick={() => setShowForm(true)}>+ Nuevo evento</button>
      </div>

      {loading && <p className="muted">Cargando…</p>}

      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Lugar</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {events.map(ev => (
            <tr key={ev.id}>
              <td><strong>{ev.name}</strong></td>
              <td>{ev.venue || '—'}</td>
              <td>{new Date(ev.eventDate).toLocaleDateString('es-MX')}</td>
              <td><span className={`badge badge-${ev.status.toLowerCase()}`}>{ev.status}</span></td>
              <td><Link className="link" to={`/events/${ev.id}`}>Ver →</Link></td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Nuevo evento</h2>
            <form onSubmit={handleCreate}>
              <div className="field">
                <label>Nombre *</label>
                <input required value={form.name}
                       onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
              </div>
              <div className="field">
                <label>Descripción</label>
                <textarea rows={3} value={form.description}
                          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}/>
              </div>
              <div className="field">
                <label>Lugar</label>
                <input value={form.venue}
                       onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}/>
              </div>
              <div className="field">
                <label>Fecha y hora *</label>
                <input type="datetime-local" required value={form.eventDate}
                       onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))}/>
              </div>
              <div className="field">
                <label>URL imagen de portada</label>
                <input placeholder="https://..." value={form.coverUrl}
                       onChange={e => setForm(f => ({ ...f, coverUrl: e.target.value }))}/>
                <small className="hint">URL de la imagen que el cliente quiera mostrar en el sitio</small>
              </div>
              {error && <p className="error">{error}</p>}
              <div className="btn-row">
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn" disabled={saving}>
                  {saving ? 'Guardando…' : 'Crear evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
