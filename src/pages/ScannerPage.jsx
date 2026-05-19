import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode'
import { useAuth } from '../context/AuthContext'
import { getEvents, validateTicket } from '../api'
import Layout from '../components/Layout'

export default function ScannerPage() {
  const { token } = useAuth()
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [presentedName, setPresentedName] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [fileScanning, setFileScanning] = useState(false)
  const [result, setResult] = useState(null)
  const scannerRef = useRef(null)
  const fileInputRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    getEvents(token).then(r => setEvents(r.data)).catch(() => {})
  }, [token])

  const validateDecodedTicket = useCallback(async (decodedText) => {
    setScanError('')

    if (!presentedName.trim()) {
      setResult({ accepted: false, result: 'ERROR', message: 'Captura el nombre presentado antes de validar' })
      return
    }

    try {
      const res = await validateTicket(token, {
        token: decodedText,
        eventId: selectedEventId,
        presentedName: presentedName.trim(),
      })
      setResult(res.data)
    } catch (err) {
      setResult({
        accepted: false,
        result: 'ERROR',
        message: err.response?.data?.message || err.response?.data?.error || 'Error de red al validar',
      })
    }
  }, [presentedName, selectedEventId, token])

  useEffect(() => {
    if (!scanning || !selectedEventId) return

    const scanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,
      qrbox: { width: 260, height: 260 },
      rememberLastUsedCamera: true,
    }, false)

    scanner.render(
      async (decodedText) => {
        try {
          scanner.pause()
        } catch {
          // Image/file scans can decode without an active camera stream.
        }
        await validateDecodedTicket(decodedText)
      },
      () => {}
    )

    scannerRef.current = scanner

    return () => {
      scanner.clear().catch(() => {})
    }
  }, [scanning, selectedEventId, validateDecodedTicket])

  const handleImageScan = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setScanError('')
    setResult(null)
    setFileScanning(true)

    const reader = new Html5Qrcode('qr-file-reader', false)
    try {
      const decodedText = await reader.scanFile(file, true)
      await validateDecodedTicket(decodedText)
    } catch {
      setScanError('No se pudo leer un QR en esa imagen')
    } finally {
      await reader.clear().catch(() => {})
      setFileScanning(false)
      event.target.value = ''
    }
  }

  const handleStop = () => {
    scannerRef.current?.clear().catch(() => {})
    setScanning(false)
    setResult(null)
  }

  const handleNext = () => {
    setResult(null)
    setScanError('')
    try {
      scannerRef.current?.resume()
    } catch {
      setScanning(false)
    }
  }

  const accepted = result?.accepted

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
          <label className="form-label" style={{ marginTop: '1rem' }}>Nombre presentado</label>
          <input
            className="form-input"
            value={presentedName}
            onChange={e => setPresentedName(e.target.value)}
            placeholder="Como aparece en el boleto"
          />
          <button
            className="btn-primary"
            style={{ marginTop: '1rem', width: '100%' }}
            disabled={!selectedEventId || !presentedName.trim()}
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
              <div id="qr-file-reader" style={{ marginTop: '1rem' }} />
              {scanError && <p className="error">{scanError}</p>}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageScan}
              />
              <button
                className="btn-ghost"
                style={{ marginTop: '1rem', marginRight: '0.75rem' }}
                disabled={fileScanning}
                onClick={() => fileInputRef.current?.click()}
              >
                {fileScanning ? 'Leyendo imagen...' : 'Escanear imagen'}
              </button>
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
              borderLeft: `6px solid ${accepted ? '#22c55e' : '#ef4444'}`,
              padding: '1.5rem',
            }}>
              <p style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: accepted ? '#22c55e' : '#ef4444',
                margin: 0,
              }}>
                {accepted ? '✓ VÁLIDO' : '✗ RECHAZADO'}
              </p>
              <p style={{ margin: '0.5rem 0 0', color: '#a1a1aa' }}>{result.message}</p>
              {result.ticket?.attendeeName && (
                <p style={{ margin: '0.5rem 0 0', fontWeight: 600 }}>{result.ticket.attendeeName}</p>
              )}
              {result.ticket?.ticketTypeCode && (
                <p style={{ margin: '0.25rem 0 0', color: '#a1a1aa' }}>{result.ticket.ticketTypeCode}</p>
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
