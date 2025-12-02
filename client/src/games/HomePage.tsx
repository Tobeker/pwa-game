import { useEffect, useState } from 'react'

type HealthStatus = 'loading' | 'ok' | 'error'

function HomePage() {
  const [health, setHealth] = useState<HealthStatus>('loading')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/healthz')
        const text = await res.text()
        if (res.ok && text.trim().toUpperCase() === 'OK') {
          setHealth('ok')
          setMessage('Server bereit')
        } else {
          setHealth('error')
          setMessage(`Unerwartete Antwort: ${text}`)
        }
      } catch (err) {
        setHealth('error')
        setMessage(err instanceof Error ? err.message : 'Unbekannter Fehler')
      }
    }

    fetchHealth()
  }, [])

  return (
    <div>
      <h1>Willkommen auf der Startseite</h1>
      <p>Das ist deine erste Seite mit React + Vite + TypeScript.</p>
      <div style={{ marginTop: '1rem' }}>
        <h3>Server-Status</h3>
        {health === 'loading' && <p>Prüfe Bereitschaft...</p>}
        {health === 'ok' && <p style={{ color: 'green' }}>✅ {message || 'OK'}</p>}
        {health === 'error' && (
          <p style={{ color: 'red' }}>
            ❌ {message || 'Keine Verbindung möglich'}
          </p>
        )}
      </div>
    </div>
  )
}

export default HomePage
