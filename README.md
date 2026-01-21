# PWA Game

## Description

Full‑stack chess web app with a React/Vite client and a Node/Express server. You can play Chess with your Friends or versus the Computer, without Advertisements. Other Games will be added over Time. Users can register/login, create Chessgames, play turns via drag & drop, and continue existing games.

## Motivation

Provide a simple, hackable baseline for a browser chess experience with user auth and server‑side game state.

## Quick Start

1) Install deps
- `cd server && npm install`
- `cd ../client && npm install`

2) Run backend
- read for Details: Server -> README.md
- `cd server && npm run dev` (default http://localhost:8080)

3) Run frontend
- `cd client && npm run dev` (default http://localhost:5173)

## Usage

- Open `http://localhost:5173`
- Register or log in
- Start a new game or load an existing one
- Moves are validated server‑side; the computer opponent replies with a random legal move

## Contributing

- Keep changes focused and well‑scoped
- Prefer small, reviewable commits
- Update READMEs if you add or change behavior
