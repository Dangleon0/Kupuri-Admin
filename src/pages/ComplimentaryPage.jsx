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
    getEvents(token).then(async r => {
      const published = r.data.filter(e => e.status === 'PUBLISHED')
      setEvents(published)

      for (const event of published) {
        const types = await getTicketTypes(event.id)
        if (types.data.length > 0) {
          setForm(f => ({ ...f, eventId: event.id, ticketTypeId: types.data[0].id }))
          setTicketTypes(types.data)
          break
        }
      }
    })
  }, [])

  useEffect(() => {
    if (!form.eventId) {
      setTicketTypes([])
      return
    }
    getTicketTypes(form.eventId).then(r => {
      setTicketTypes(r.data)
      setForm(f => ({ ...f, ticketTypeId: r.data.length > 0 ? r.data[0].id : '' }))
    })
  }, [form.eventId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const issued = await issueComplimentary(token, {
        buyerName: form.holderName,
        buyerEmail: form.holderEmail,
        note: form.reason,
        items: [{ ticketTypeId: form.ticketTypeId, quantity: Number(form.quantity) }],
      })
      const count = issued.data?.tickets?.length ?? 0
      setSuccess(`${count} cortesía(s) emitida(s) y enviada(s) por email`)
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
                    disabled={ticketTypes.length === 0}
                    onChange={e => setForm(f => ({ ...f, ticketTypeId: e.target.value }))}>
              {ticketTypes.length === 0 && <option value="">Este evento no tiene tipos de boleto</option>}
              {ticketTypes.map(t => (
                <option key={t.id} value={t.id}>{t.displayName} ({formatAvailable(t.availableQuantity)} disponibles)</option>
              ))}
            </select>
          </div>
          {form.eventId && ticketTypes.length === 0 && (
            <p className="error">Este evento no tiene tipos de boleto. Agrega uno en Eventos antes de emitir cortesías.</p>
          )}
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
          <button type="submit" className="btn" disabled={saving || !form.ticketTypeId}>
            {saving ? 'Emitiendo…' : 'Emitir cortesía'}
          </button>
        </form>
      </div>
    </Layout>
  )
}

function formatAvailable(value) {
  return Number.isFinite(Number(value)) ? Number(value) : '—'
}
