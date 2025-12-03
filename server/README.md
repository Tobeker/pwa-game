Chirpy Server

A tiny Twitter-ish backend built with Express, TypeScript, Postgres + Drizzle ORM, and JWT auth. It lets you create users, log in, post/read/delete chirps, and manage sessions with access + refresh tokens. There’s also basic metrics, error handling, and a simple webhook to “upgrade” users to Chirpy Red.

What this project does

Users

Create account (POST /api/users) with bcrypt-hashed password

Log in (POST /api/login) → returns JWT access token (1h) + refresh token (60 days)

Update own email/password (PUT /api/users) — auth required

Optional admin/dev reset & simple metrics page

Chirps

Create (POST /api/chirps) — auth required, validates body (≤ 140 chars)

List (GET /api/chirps)

Get by id (GET /api/chirps/:chirpID)

Delete own chirp (DELETE /api/chirps/:chirpID) — owner-only

Auth/session

Access tokens: JWT (iss=chirpy, sub=userId, iat, exp)

Refresh tokens: stored in DB (refresh_tokens), revocable

Refresh access token: POST /api/refresh (via Authorization: Bearer <refreshToken>)

Revoke refresh token: POST /api/revoke

Billing/Webhooks (simulated)

POST /api/polka/webhooks — handles event: "user.upgraded" and sets is_chirpy_red=true

Quality of life

Middleware that logs non-OK responses

Metrics counter for /app static hits and /admin/metrics HTML

Centralized error handler with custom error classes

Vitest unit tests (e.g., for bearer token parsing)

Why someone should care

Realistic starter for token-based auth on Node/Express with clean TypeScript and no bundler magic.

Drizzle ORM: strongly-typed queries & schema, easy migrations.

Session model you’ll actually use: short-lived access tokens + long-lived refresh tokens stored server-side.

Secure defaults: hashed passwords, server-side token revocation, minimal error leakage.

Extensible: add scopes/roles, rate limits, pagination, or swap Postgres for another SQL DB supported by Drizzle.

Install & run
1) Prerequisites

Node 18+ (ESM compatible)
-> npm install

Postgres running locally or in the cloud
-> sudo apt install postgresql postgresql-contrib
-> sudo passwd [password] to update system-password
-> sudo service postgresql start, to start db-server
-> sudo -u postgres psql, to enter the db-client
-> CREATE DATABASE [name];, to create db
-> \c [name], to connect
-> ALTER USER postgres PASSWORD '[password]';, to set db-password

2) Clone & install

git clone <your-repo-url>
cd server
npm install

3) Configure environment

Create a .env file in the project root:

# App/platform
PLATFORM=dev

# JWT signing secret (generate a long random string)
# e.g. openssl rand -base64 64
JWT_SECRET=replace-with-a-long-random-string

# Database connection (adapt to your setup)
# Examples:
# DATABASE_URL=postgres://user:password@localhost:5432/chirpy
# or individual PG* vars if your db bootstrap expects them
DATABASE_URL=postgres://user:password@localhost:5432/chirpy

This project loads env via dotenv and reads values in src/config.ts.

4) Database schema & migrations

If you’re using drizzle-kit:

# Generate migrations from your schema (optional if already checked in)
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate

Key tables:

users (includes hashed_password and is_chirpy_red boolean default false)

chirps (FK → users, ON DELETE CASCADE)

refresh_tokens (token PK, expires_at, revoked_at, FK → users)

5) Build & run

This project compiles TypeScript to dist/ and starts Node from there.

npm run build
npm start

If your package.json has:

"scripts": {
  "build": "tsc",
  "start": "node dist/index.js"
}

you’re good. Otherwise adjust "start" to match your compiled entry (dist/server.js vs dist/index.js).

Dev tip: you can also run with a watcher (e.g., tsx, nodemon, or ts-node-dev) if you prefer.

6) Hit the endpoints

Create user

POST /api/users
Content-Type: application/json

{ "email": "lane@example.com", "password": "04234" }

Login (gets access + refresh)

POST /api/login
{ "email": "lane@example.com", "password": "04234" }

Post a chirp (auth)

POST /api/chirps
Authorization: Bearer <ACCESS_TOKEN>
{ "body": "Hello, world!" }

Refresh access token

POST /api/refresh
Authorization: Bearer <REFRESH_TOKEN>

Revoke refresh token

POST /api/revoke
Authorization: Bearer <REFRESH_TOKEN>

Upgrade via webhook (simulated)

POST /api/polka/webhooks
{ "event": "user.upgraded", "data": { "userId": "<uuid>" } }

7) Tests (Vitest)

# run all tests
npx vitest
# or if you have a script:
npm test

Troubleshooting

“Cannot find module 'src/…'”
Use relative imports with .js extensions in TypeScript (ESM, no bundler). Example: import { config } from "../config.js".

Server won’t start after build
Ensure npm run build emits dist/… and "start" points to the correct file.

401s on protected routes
Send Authorization: Bearer <accessToken> (for chirps & update user) or <refreshToken> (for refresh/revoke).