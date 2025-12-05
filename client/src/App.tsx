import { Routes, Route, Link } from 'react-router-dom'
import HomePage from './games/HomePage'
import Chess from './games/Chess'
import { RequireAuth, useAuth } from './auth'

function App() {
  const { auth, setAuth } = useAuth()

  const handleLogout = () => {
    setAuth(null)
  }

  return (
    <div>
      {/* Navigation */}
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ddd' }}>
        <Link to="/" style={{ marginRight: '1rem' }}>Startseite</Link>
        <Link to="/chess" style={{ marginRight: '1rem' }}>Schach</Link>
        {auth?.name && (
          <span style={{ marginRight: '1rem', color: '#555' }}>Eingeloggt als {auth.name}</span>
        )}
        {auth && (
          <button onClick={handleLogout}>Abmelden</button>
        )}
      </nav>

      {/* Seiten-Inhalt */}
      <main style={{ padding: '1rem' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/chess"
            element={
              <RequireAuth>
                <Chess />
              </RequireAuth>
            }
          />
          {/* Fallback für nicht gefundene Seiten */}
          <Route path="*" element={<h2>404 – Seite nicht gefunden</h2>} />
        </Routes>
      </main>
    </div>
  )
}


export default App
