import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useAuth } from '../context/AuthContext'
import { getEvents, validateTicket } from '../api'
import Layout from '../components/Layout'

export default function ScannerPage() {
  const { token } = useAuth()
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const scannerRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    getEvents(token).then(r => setEvents(r.data)).catch(() => {})
  }, [token])

  useEffect(() => {
    if (!scanning || !selectedEventId) return

    const scanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,
      qrbox: { width: 260, height: 260 },
      rememberLastUsedCamera: true,
    }, false)

    scanner.render(
      async (decodedText) => {
        scanner.pause()
        try {
          const res = await validateTicket(token, { accessToken: decodedText, eventId: selectedEventId })
          setResult(res.data)
        } catch {
          setResult({ valid: false, result: 'ERROR', message: 'Error de red al validar' })
        }
      },
      () => {}
    )

    scannerRef.current = scanner

    return () => {
      scanner.clear().catch(() => {})
    }
  }, [scanning, selectedEventId, token])

  const handleStop = () => {
    scannerRef.current?.clear().catch(() => {})
    setScanning(false)
    setResult(null)
  }

  const handleNext = () => {
    setResult(null)
    scannerRef.current?.resume()
  }

  const valid = result?.valid

  return (
    <Layout title="Escáner">
      <div className="page-header">
        <h1>Escáner de boletos</h1>
      </div>

      {!scanning ? (
        <div className="card" style={{ maxWidth: 420 }}>
          <label className="form-label">Selecciona el evento</label>
          <select
            className="form-input"
            value={selectedEventId}
            onChange={e => setSelectedEventId(e.target.value)}
          >
            <option value="">-- Elige un evento --</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
          <button
            className="btn-primary"
            style={{ marginTop: '1rem', width: '100%' }}
            disabled={!selectedEventId}
            onClick={() => setScanning(true)}
          >
            Iniciar escáner
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: 480 }}>
          {!result && (
            <>
              <div id="qr-reader" ref={containerRef} />
              <button
                className="btn-ghost"
                style={{ marginTop: '1rem' }}
                onClick={handleStop}
              >
                Detener escáner
              </button>
            </>
          )}

          {result && (
            <div className="card" style={{
              borderLeft: `6px solid ${valid ? '#22c55e' : '#ef4444'}`,
              padding: '1.5rem',
            }}>
              <p style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: valid ? '#22c55e' : '#ef4444',
                margin: 0,
              }}>
                {valid ? '✓ VÁLIDO' : '✗ RECHAZADO'}
              </p>
              <p style={{ margin: '0.5rem 0 0', color: '#a1a1aa' }}>{result.message}</p>
              {result.holderName && (
                <p style={{ margin: '0.5rem 0 0', fontWeight: 600 }}>{result.holderName}</p>
              )}
              {result.ticketTypeName && (
                <p style={{ margin: '0.25rem 0 0', color: '#a1a1aa' }}>{result.ticketTypeName}</p>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button className="btn-primary" onClick={handleNext}>
                  Siguiente boleto
                </button>
                <button className="btn-ghost" onClick={handleStop}>
                  Terminar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
