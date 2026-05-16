import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getEvents, getTicketTypes, issueComplimentary } from '../api'
import Layout from '../components/Layout'

export default function ComplimentaryPage() {
  const { token } = useAuth()
  const [events, setEvents] = useState([])
  const [ticketTypes, setTicketTypes] = useState([])
  const [form, setForm] = useState({
    eventId: '', ticketTypeId: '', quantity: 1,
    holderName: '', holderEmail: '', reason: ''
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getEvents(token).then(r => setEvents(r.data.filter(e => e.status === 'PUBLISHED')))
  }, [])

  useEffect(() => {
    if (!form.eventId) return
    getTicketTypes(form.eventId).then(r => {
      setTicketTypes(r.data)
      if (r.data.length > 0) setForm(f => ({ ...f, ticketTypeId: r.data[0].id }))
    })
  }, [form.eventId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const issued = await issueComplimentary(token, {
        ticketTypeId: form.ticketTypeId,
        quantity: Number(form.quantity),
        holderName: form.holderName,
        holderEmail: form.holderEmail,
        reason: form.reason,
      })
      setSuccess(`${issued.data.length} cortesía(s) emitida(s) y enviada(s) por email`)
      setForm(f => ({ ...f, holderName: '', holderEmail: '', reason: '', quantity: 1 }))
    } catch (err) {
      setError(err.response?.data?.error || 'Error al emitir cortesía')
    } finally { setSaving(false) }
  }

  return (
    <Layout title="Cortesías">
      <h1>Emitir cortesías</h1>
      <div style={{ maxWidth: 480 }}>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Evento *</label>
            <select required value={form.eventId}
                    onChange={e => setForm(f => ({ ...f, eventId: e.target.value, ticketTypeId: '' }))}>
              <option value="">Selecciona un evento</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Tipo de boleto *</label>
            <select required value={form.ticketTypeId}
                    onChange={e => setForm(f => ({ ...f, ticketTypeId: e.target.value }))}>
              {ticketTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.available} disponibles)</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Cantidad</label>
            <input type="number" min="1" max="20" value={form.quantity}
                   onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}/>
          </div>
          <div className="field">
            <label>Nombre del titular *</label>
            <input required value={form.holderName}
                   onChange={e => setForm(f => ({ ...f, holderName: e.target.value }))}/>
          </div>
          <div className="field">
            <label>Email del titular *</label>
            <input type="email" required value={form.holderEmail}
                   onChange={e => setForm(f => ({ ...f, holderEmail: e.target.value }))}/>
          </div>
          <div className="field">
            <label>Motivo (interno)</label>
            <input value={form.reason}
                   onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}/>
          </div>
          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Emitiendo…' : 'Emitir cortesía'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
