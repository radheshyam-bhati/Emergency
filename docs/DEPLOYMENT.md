# Deployment

## Important constraint

GitHub Pages can only serve static files. It cannot run the Express API. The
current Pages deployment must not be used as a full-stack demo.

Use one of these patterns:

1. **Split deployment (recommended for the demo):** static frontend on Vercel,
   Netlify, Cloudflare Pages, or GitHub Pages; API on Render, Railway, Fly.io,
   or a VPS with a persistent disk.
2. **Single Node host:** serve the built frontend from the API host behind a
   reverse proxy, with a persistent disk for SQLite.
3. **Production:** PostgreSQL (or another managed database) plus stateless API
   instances and a separate worker for simulation/background jobs.

## Build

```sh
npm ci
npm run build
```

Outputs:

- client: `dist/`
- server: `server/dist/`

## API environment

Set these in the hosting provider’s secret store, not in a committed file:

```env
NODE_ENV=production
API_PORT=3001
JWT_SECRET=<32+ random characters>
DATABASE_PATH=/var/data/rapid-rescue.db
CORS_ORIGINS=https://your-frontend.example.com
TRUST_PROXY=true
SEED_DEMO_DATA=false
```

Generate a secret:

```sh
openssl rand -base64 48
```

## Frontend environment

If the frontend and API are on different origins, set:

```env
VITE_API_URL=https://api.example.com
```

The client calls `${VITE_API_URL}/api`. If `VITE_API_URL` is empty, it calls
same-origin `/api`.

## SQLite deployment

SQLite is acceptable for a single-instance demo, not for horizontal scaling.

- Use a persistent disk, not an ephemeral filesystem.
- Keep the API at one instance.
- Enable WAL mode (the app does this by default).
- Schedule backups with `sqlite3 .backup` or a filesystem snapshot.
- Test a restore, not just a backup.
- Do not put the database in the web root or a static asset directory.

Example backup:

```sh
sqlite3 /var/data/rapid-rescue.db ".backup '/var/backups/rapid-rescue-$(date +%F).db'"
```

## PostgreSQL migration

Before multi-instance or real production use:

- add a migration tool with versioned migrations,
- move queries to a PostgreSQL client,
- add connection pooling,
- add indexes and query plans,
- add a job/outbox mechanism for dispatch side effects,
- move the simulation loop to a worker.

## Health checks

- Liveness: `GET /api/health`
- Readiness: `GET /api/ready`

Configure the platform health check to use `/api/ready` so a broken database
does not receive traffic.

## Reverse proxy

- Terminate TLS at the proxy.
- Forward `/api` to the API.
- Set `TRUST_PROXY=true` only when the proxy is trusted.
- Set security headers at the proxy as well as in the app.
- Do not expose the SQLite file or `server/data` through the web server.

## GitHub Pages

If you use Pages for the frontend only:

- build with Vite,
- publish `dist/`,
- add SPA fallback support,
- set `VITE_API_URL` to the API origin,
- never publish `server/data`,
- verify the API is reachable and CORS allows the Pages origin.

## Rollback

Keep the previous build artifact and database backup before deploying. A
rollback must restore both the application version and a compatible database
snapshot.

## Production checklist

- [ ] HTTPS enforced
- [ ] `JWT_SECRET` stored in a secret manager
- [ ] `SEED_DEMO_DATA=false`
- [ ] CORS allowlist configured
- [ ] Rate limits enabled
- [ ] Health/readiness checks configured
- [ ] Backups scheduled and restore tested
- [ ] Logs redact PII
- [ ] Dependencies audited
- [ ] Error tracking configured
- [ ] Incident contact documented
