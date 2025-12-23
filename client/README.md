# PWA Game – Client

React/Vite frontend for the chess webapp. Users can register/login, start chess games, continue existing ones, and play via drag & drop with promotion support.

## Commands

- Install deps: `npm install`
- Dev server: `npm run dev` (default at http://localhost:5173)
- Build: `npm run build`
- Preview build: `npm run preview`

## Environment & API

- The dev server proxies `/api` to the backend (`server` runs on http://localhost:8080 by default). Make sure the backend is running.
- Auth uses the existing `/api/users` (register) and `/api/login` endpoints. Tokens are stored in localStorage.
- Chess routes used:
  - `POST /api/chess/games` (create)
  - `GET /api/chess/game/:id` (load state)
  - `POST /api/chess/games/:id/moves` (make move, includes promotions)
  - `GET /api/chessgames` (list user games)
  - `GET /api/usernames` (list players for human opponent selection)

## App Structure

- `src/main.tsx` – bootstraps React/Router/AuthProvider.
- `src/App.tsx` – routes and nav (status + logout).
- `src/games/HomePage.tsx` – landing: login/register toggle when logged out; “Zum Schachspiel” button when logged in.
- `src/games/Chess.tsx` – chess UI: start new game or load existing, drag pieces, handle promotions, show game info.
- `src/auth.tsx` – auth context/localStorage.

## Notes

- Promotion prompt appears when a pawn reaches the last rank; choose a piece to submit the move.
- If API requests fail (e.g., backend down), errors are shown inline; check browser console for details.
