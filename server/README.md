# Chess Server

A tiny Chess backend built with Express, TypeScript, Postgres + Drizzle ORM, and JWT auth. It lets you create users, log in, manage sessions with access + refresh tokens and handles Games. There’s also basic metrics and error handling.

## What this project does

- Users
    - Create account (POST /api/users) with bcrypt-hashed password
    - Log in (POST /api/login) → returns JWT access token (1h) + refresh token (60 days)
    - Get all Usernames (GET /api/usernames) — auth required
    - Optional admin/dev reset & simple metrics page

- Chess
    - Start new Chessgame (POST /api/chess/games) with chess.js and db
    - Get the Gamestate (GET /api/chess/game/:id)
    - Do a Chess-move (POST /api/chess/games/:id/moves)
    - Get all Games of a specific User (GET /api/chessgames)

- Auth/session
    - Access tokens: JWT (iss=chirpy, sub=userId, iat, exp)
    - Refresh tokens: stored in DB (refresh_tokens), revocable
    - Refresh access token: POST /api/refresh (via Authorization: Bearer <refreshToken>)
    - Revoke refresh token: POST /api/revoke

## Why someone should care

- Realistic starter for token-based auth on Node/Express with clean TypeScript and no bundler magic.
- Drizzle ORM: strongly-typed queries & schema, easy migrations.
- Session model you’ll actually use: short-lived access tokens + long-lived refresh tokens stored server-side.
- Secure defaults: hashed passwords, server-side token revocation, minimal error leakage.


## Install & run
1) Prerequisites

Node 18+ (ESM compatible)
- npm install

Postgres running locally or in the cloud
- sudo apt install postgresql postgresql-contrib
- sudo passwd [password] to update system-password
- sudo service postgresql start, to start db-server
- sudo -u postgres psql, to enter the db-client
- CREATE DATABASE [name];, to create db
- \c [name], to connect
- ALTER USER postgres PASSWORD '[password]';, to set db-password

2) Clone & install

- git clone <https://github.com/Tobeker/pwa-game>
- cd server
- npm install

3) Configure environment

Create a .env file in the project root:

- PLATFORM="dev"
- JWT_SECRET="replace-with-a-long-random-string"
- DATABASE_URL=postgres://[user]:[password]@localhost:5432/[db-name]?sslmode=disable

This project loads env via dotenv and reads values in src/config.ts.

4) Database schema & migrations

Using drizzle-kit:

// Generate migrations from your schema (optional if already checked in)
- npx drizzle-kit generate

// Apply migrations
- npx drizzle-kit migrate

Key tables:

- users (includes hashed_password)
- chess (FK → users, ON DELETE CASCADE)
- refresh_tokens (token PK, expires_at, revoked_at, FK → users)

5) Build & run

This project compiles TypeScript to dist/ and starts Node from there.

- npm run dev
