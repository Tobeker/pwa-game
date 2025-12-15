import { useMemo, useState } from 'react'
import { Chessboard } from 'react-chessboard'
import { useAuth } from '../auth'

type GameState = {
  id: string
  fen: string
  status: string
  turn: 'w' | 'b'
  players: { white: string; black: string }
  moves: string[]
}

type CreatePayload = {
  opponentType: 'computer' | 'human'
  playerColor: 'white' | 'black' | 'random'
}

type BoardOrientation = "white" | "black" | undefined;

function Chess() {
  const { auth } = useAuth()
  const [game, setGame] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<CreatePayload>({ opponentType: 'computer', playerColor: 'white' })
  const orientation = useMemo<BoardOrientation>(() => {
    if (!game || !auth?.userId) return 'white'
    return game.players.white === auth.userId ? 'white' : 'black'
  }, [auth?.userId, game])

  const createGame = async () => {
    if (!auth?.token) {
      setError('Bitte zuerst einloggen.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/chess/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Fehler ${res.status}`)
      }
      const data = (await res.json()) as GameState
      setGame(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof CreatePayload, value: CreatePayload[keyof CreatePayload]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const chessboardOptions = {
      position: game?.fen ?? 'start',
      boardOrientation: orientation,
      id: 'play-vs-random'
    };

  return (
    <div>
      <h1>Schach</h1>
      <p>Starte ein neues Spiel und sehe es auf dem Board.</p>

      <div style={{ display: 'grid', gap: '1rem', maxWidth: 400, marginBottom: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem' }}>Gegner</label>
          <select
            value={form.opponentType}
            onChange={(e) => handleChange('opponentType', e.target.value as CreatePayload['opponentType'])}
          >
            <option value="computer">Computer</option>
            <option value="human">Mensch</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem' }}>Farbe</label>
          <select
            value={form.playerColor}
            onChange={(e) => handleChange('playerColor', e.target.value as CreatePayload['playerColor'])}
          >
            <option value="white">Weiß</option>
            <option value="black">Schwarz</option>
            <option value="random">Zufällig</option>
          </select>
        </div>

        <button onClick={createGame} disabled={loading}>
          {loading ? 'Erstelle Spiel...' : 'Neues Spiel starten'}
        </button>

        {error && <p style={{ color: 'red' }}>❌ {error}</p>}
      </div>

      <div
        style={{ width: '400px', maxWidth: '90vw', marginBottom: '1rem' }}
      >
        <Chessboard options={chessboardOptions} />
      </div>

      {game && (
        <div style={{ fontSize: '0.95rem', color: '#444' }}>
          <div>Spiel-ID: {game.id}</div>
          <div>Status: {game.status}</div>
          <div>Am Zug: {game.turn === 'w' ? 'Weiß' : 'Schwarz'}</div>
          <div>
            Spieler Weiß: <strong>{game.players.white}</strong>
          </div>
          <div>
            Spieler Schwarz: <strong>{game.players.black}</strong>
          </div>
        </div>
      )}
    </div>
  )
}

export default Chess
