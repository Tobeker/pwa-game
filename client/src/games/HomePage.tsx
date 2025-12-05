import { FormEvent, useEffect, useState } from 'react'
import { useAuth, type AuthData } from '../auth'

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
  const [tokens, setTokens] = useState<{ token: string; refreshToken: string } | null>(null)
  const [createStatus, setCreateStatus] = useState<CreateStatus>('idle')
  const [createMessage, setCreateMessage] = useState<string>('')
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

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setAuthStatus('loading')
    setAuthMessage('')
    setTokens(null)

    try {
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
      setTokens(tokenPair)
      const authData: AuthData = { ...tokenPair, name: data.email, userId: data.id, createdAt: data.createdAt }
      setAuth(authData)
    } catch (err) {
      setAuthStatus('error')
      setAuthMessage(err instanceof Error ? err.message : 'Unbekannter Fehler')
    }
  }

  async function handleCreateUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCreateStatus('loading')
    setCreateMessage('')
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: name, password }),
      })
      const data = (await res.json()) as { email?: string; id?: string; error?: string }
      if (res.status === 200 && data.email) {
        setCreateStatus('error')
        setCreateMessage(`Nutzername bereits vergeben: ${data.email}`)
        return
      }
      if (!res.ok || !data.id) {
        throw new Error(data.error || 'Registrierung fehlgeschlagen')
      }
      setCreateStatus('success')
      setCreateMessage(`Benutzer angelegt: ${data.email}`)
    } catch (err) {
      setCreateStatus('error')
      setCreateMessage(err instanceof Error ? err.message : 'Unbekannter Fehler')
    }
  }

  return (
    <div>
      <h1>Willkommen auf der Startseite</h1>
      <p>Das ist deine erste Seite mit React + Vite + TypeScript.</p>

      <section style={{ marginTop: '1.5rem', display: 'grid', gap: '1.5rem' }}>
        {(auth?.name || auth?.email) && (
          <div style={{ padding: '0.75rem', border: '1px solid #ccc', borderRadius: 4, background: '#f8f8f8' }}>
            <strong>Eingeloggt als {auth.name ?? auth.email}</strong>
            <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: '#555' }}>
              Du kannst jetzt zur Seite Schach wechseln.
            </div>
          </div>
        )}

        <div>
          <h3>Neuen User erstellen</h3>
          <form onSubmit={handleCreateUser} style={{ display: 'grid', gap: '0.5rem', maxWidth: 360 }}>
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
                autoComplete="new-password"
                placeholder="••••••••"
              />
            </label>
            <button type="submit" disabled={createStatus === 'loading'}>
              {createStatus === 'loading' ? 'Wird erstellt...' : 'User anlegen'}
            </button>
          </form>
          {createStatus === 'success' && (
            <p style={{ marginTop: '0.5rem', color: 'green' }}>✅ {createMessage || 'User erstellt'}</p>
          )}
          {createStatus === 'error' && (
            <p style={{ marginTop: '0.5rem', color: 'red' }}>❌ {createMessage || 'Registrierung fehlgeschlagen'}</p>
          )}
        </div>

          <h3>Login</h3>
          <form onSubmit={handleLogin} style={{ display: 'grid', gap: '0.5rem', maxWidth: 360 }}>
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
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </label>
          <button type="submit" disabled={authStatus === 'loading'}>
            {authStatus === 'loading' ? 'Wird geprüft...' : 'Einloggen'}
          </button>
        </form>

        {authStatus === 'success' && tokens && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', border: '1px solid #0a7e07', borderRadius: 4 }}>
            <strong style={{ color: '#0a7e07' }}>✅ {authMessage}</strong>
            <div style={{ marginTop: '0.5rem', wordBreak: 'break-all' }}>
              <div>
                <span style={{ fontWeight: 600 }}>Access Token:</span> {tokens.token}
              </div>
              <div>
                <span style={{ fontWeight: 600 }}>Refresh Token:</span> {tokens.refreshToken}
              </div>
            </div>
          </div>
        )}

        {authStatus === 'error' && (
          <p style={{ marginTop: '0.5rem', color: 'red' }}>❌ {authMessage || 'Login fehlgeschlagen'}</p>
        )}
      </section>

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
