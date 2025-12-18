import { useMemo, useState } from 'react'
import { Chessboard } from 'react-chessboard'
import { useAuth } from '../auth'
import { useEffect } from 'react'

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
  opponentName?: string
}

type BoardOrientation = 'white' | 'black'
const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

function Chess() {
  const { auth } = useAuth()
  const [game, setGame] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<CreatePayload>({ opponentType: 'computer', playerColor: 'white' })
  const [users, setUsers] = useState<Array<{ id: string; email: string }>>([])
  const [games, setGames] = useState<GameState[]>([])
  const orientation = useMemo<BoardOrientation>(() => {
    if (!game || !auth?.userId) return 'white'
    return game.players.white === auth.userId ? 'white' : 'black'
  }, [auth?.userId, game])
  const boardOptions = useMemo(
    () => ({
      id: 'play-board',
      position: game?.fen ?? START_FEN,
      boardOrientation: orientation,
      allowDragging: false,
      boardStyle: { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    }),
    [game?.fen, orientation],
  )

  const loadGame = async (id: string) => {
    if (!auth?.token) return
    try {
      const res = await fetch(`/api/chess/game/${id}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (!res.ok) throw new Error(`Fehler ${res.status}`)
      const data = (await res.json()) as GameState
      setGame(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    }
  }

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/usernames')
        if (!res.ok) throw new Error(`Fehler ${res.status}`)
        const data = (await res.json()) as Array<{ id: string; email: string }>
        setUsers(data)
      } catch (err) {
        // still allow play vs computer even if this fails
        console.error('Konnte Benutzerliste nicht laden', err)
      }
    }
    fetchUsers()
  }, [])

  useEffect(() => {
    const fetchGames = async () => {
      if (!auth?.token) return
      try {
        const res = await fetch('/api/chessgames', {
          headers: { Authorization: `Bearer ${auth.token}` },
        })
        if (!res.ok) throw new Error(`Fehler ${res.status}`)
        const data = (await res.json()) as GameState[]
        setGames(data)
      } catch (err) {
        console.error('Konnte Spiele nicht laden', err)
      }
    }
    fetchGames()
  }, [auth?.token])

  const createGame = async () => {
    if (!auth?.token) {
      setError('Bitte zuerst einloggen.')
      return
    }
    if (form.opponentType === 'human' && !form.opponentName) {
      setError('Bitte einen Gegenspieler auswählen.')
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

        {form.opponentType === 'human' && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Gegner wählen</label>
            <select
              value={form.opponentName ?? ''}
              onChange={(e) => handleChange('opponentName', e.target.value || undefined)}
            >
              <option value="">-- bitte auswählen --</option>
              {users.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.email}
                </option>
              ))}
            </select>
          </div>
        )}

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

      {games.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem' }}>Bestehende Spiele</label>
          <select value={game?.id ?? ''} onChange={(e) => loadGame(e.target.value)}>
            <option value="">-- Spiel auswählen --</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.id} ({g.players.white} vs {g.players.black}) Status: {g.status}
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ width: '400px', maxWidth: '90vw', marginBottom: '1rem' }}>
        <Chessboard options={boardOptions} />
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
