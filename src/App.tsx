import { Routes, Route, Link } from 'react-router-dom'
import HomePage from './games/HomePage'
import Chess from './games/Chess'

function App() {
  return (
    <div>
      {/* Navigation */}
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ddd' }}>
        <Link to="/" style={{ marginRight: '1rem' }}>Startseite</Link>
        <Link to="/chess" style={{ marginRight: '1rem' }}>Schach</Link>
      </nav>

      {/* Seiten-Inhalt */}
      <main style={{ padding: '1rem' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chess" element={<Chess />} />
          {/* Fallback für nicht gefundene Seiten */}
          <Route path="*" element={<h2>404 – Seite nicht gefunden</h2>} />
        </Routes>
      </main>
    </div>
  )
}


export default App
