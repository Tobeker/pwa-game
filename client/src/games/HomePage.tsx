import { FormEvent, useEffect, useState } from 'react'
import { useAuth, type AuthData } from '../auth'
import { Link } from 'react-router-dom'

type HealthStatus = 'loading' | 'ok' | 'error'
type AuthStatus = 'idle' | 'loading' | 'success' | 'error'
type CreateStatus = 'idle' | 'loading' | 'success' | 'error'

type LoginResponse = {
  id: string
  email: string // server expects/returns email, we treat it as username
  createdAt?: string
  token: string
  refreshToken: string
}

function HomePage() {
  const [health, setHealth] = useState<HealthStatus>('loading')
  const [healthMessage, setHealthMessage] = useState<string>('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle')
  const [authMessage, setAuthMessage] = useState<string>('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const { auth, setAuth } = useAuth()

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/healthz')
        const text = await res.text()
        if (res.ok && text.trim().toUpperCase() === 'OK') {
          setHealth('ok')
          setHealthMessage('Server bereit')
        } else {
          setHealth('error')
          setHealthMessage(`Unerwartete Antwort: ${text}`)
        }
      } catch (err) {
        setHealth('error')
        setHealthMessage(err instanceof Error ? err.message : 'Unbekannter Fehler')
      }
    }

    fetchHealth()
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setAuthStatus('loading')
    setAuthMessage('')

    try {
      if (mode === 'login') {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: name, password }),
        })

        const data = (await res.json()) as Partial<LoginResponse> & { error?: string }
        if (!res.ok || !data.token || !data.refreshToken) {
          throw new Error(data.error || 'Login fehlgeschlagen')
        }

        setAuthStatus('success')
        setAuthMessage('Erfolgreich eingeloggt')
        const tokenPair = { token: data.token, refreshToken: data.refreshToken }
        const authData: AuthData = { ...tokenPair, name: data.email, userId: data.id, createdAt: data.createdAt }
        setAuth(authData)
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: name, password }),
        })
        const data = (await res.json()) as { email?: string; id?: string; error?: string }
        if (res.status === 409) {
          throw new Error(data.error || 'Nutzername bereits vergeben')
        }
        if (!res.ok || !data.id) {
          throw new Error(data.error || 'Registrierung fehlgeschlagen')
        }
        setAuthStatus('success')
        setAuthMessage('Registrierung erfolgreich. Bitte einloggen.')
        setMode('login')
      }
    } catch (err) {
      setAuthStatus('error')
      setAuthMessage(err instanceof Error ? err.message : 'Unbekannter Fehler')
    }
  }

  return (
    <div>
      <h1>Hallöle</h1>
      <p>Melde dich an oder registriere dich vorher mit deinem Namen.</p>
      <p>Danach kannst du ein Spiel auswählen.</p>

      {!auth && (
        <section style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem', maxWidth: 380 }}>
          <h3>{mode === 'login' ? 'Anmeldung' : 'Registrierung'}</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={() => setMode('login')} disabled={mode === 'login'}>
              Einloggen
            </button>
            <button type="button" onClick={() => setMode('register')} disabled={mode === 'register'}>
              Registrieren
            </button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.5rem' }}>
            <label style={{ display: 'grid', gap: '0.25rem' }}>
              <span>Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="username"
                placeholder="Dein Name"
              />
            </label>
            <label style={{ display: 'grid', gap: '0.25rem' }}>
              <span>Passwort</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
              />
            </label>
            <button type="submit" disabled={authStatus === 'loading'}>
              {authStatus === 'loading'
                ? mode === 'login'
                  ? 'Wird geprüft...'
                  : 'Registriere...'
                : mode === 'login'
                  ? 'Einloggen'
                  : 'Registrieren'}
            </button>
          </form>
          {authStatus === 'error' && (
            <p style={{ marginTop: '0.5rem', color: 'red' }}>❌ {authMessage || 'Login fehlgeschlagen'}</p>
          )}
          {authStatus === 'success' && authMessage && (
            <p style={{ marginTop: '0.5rem', color: 'green' }}>✅ {authMessage}</p>
          )}
        </section>
      )}

      {auth && (
        <section style={{ marginTop: '1.5rem' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            Eingeloggt als <strong>{auth.name ?? auth.email}</strong>
          </div>
          <Link to="/chess">
            <button>Zum Schachspiel</button>
          </Link>
        </section>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <h3>Server-Status</h3>
        {health === 'loading' && <p>Prüfe Bereitschaft...</p>}
        {health === 'ok' && <p style={{ color: 'green' }}>✅ {healthMessage || 'OK'}</p>}
        {health === 'error' && (
          <p style={{ color: 'red' }}>
            ❌ {healthMessage || 'Keine Verbindung möglich'}
          </p>
        )}
      </div>
    </div>
  )
}

export default HomePage
