# DevOps Toolbox

A full-stack portfolio project for managing personal DevOps notes.

## Stack

- Frontend: React, Vite, TypeScript
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL
- Auth: email/password, JWT, bcrypt

## Local Development

1. Copy environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Start PostgreSQL:

```bash
docker compose up db
```

3. Run the apps:

```bash
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:4000

The frontend calls the API through the same-origin `/api` path. In local Vite development,
`/api` is proxied to the backend on port `4000`; set `DEV_API_PROXY_TARGET` to override that
target. In Docker, nginx proxies `/api` to the backend container.

## Docker

```bash
docker compose up --build
```
