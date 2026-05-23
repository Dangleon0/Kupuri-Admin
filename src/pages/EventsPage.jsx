import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getEvents, createEvent } from '../api'
import Layout from '../components/Layout'

export default function EventsPage() {
  const { token } = useAuth()
  const [events, setEvents] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', venueName: '', startsAt: '', coverUrl: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')

  const load = () => {
    setLoadError('')
    getEvents(token)
      .then(r => setEvents(r.data))
      .catch(err => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          setLoadError('Sesión expirada. Cierra sesión y vuelve a entrar.')
        } else {
          setLoadError('Error al cargar eventos.')
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createEvent(token, {
        slug: slugify(form.name),
        name: form.name,
        description: form.description,
        venueName: form.venueName,
        startsAt: new Date(form.startsAt).toISOString(),
        coverUrl: form.coverUrl,
      })
      setShowForm(false)
      setForm({ name: '', description: '', venueName: '', startsAt: '', coverUrl: '' })
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
      {loadError && <p className="error">{loadError}</p>}

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
              <td>{ev.venueName || '—'}</td>
              <td>{formatDate(ev.startsAt)}</td>
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
                <input value={form.venueName}
                       onChange={e => setForm(f => ({ ...f, venueName: e.target.value }))}/>
              </div>
              <div className="field">
                <label>Fecha y hora *</label>
                <input type="datetime-local" required value={form.startsAt}
                       onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))}/>
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

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
