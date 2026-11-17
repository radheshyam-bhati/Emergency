# Development Guide

## Prerequisites

- Node.js 22 LTS (see `.nvmrc`)
- npm 10+
- A C++ toolchain if `better-sqlite3` needs to compile

## First-time setup

```sh
git clone https://github.com/radheshyam-bhati/VAGRHUB.git
cd Emergency
npm ci
cp .env.example .env
```

Set `JWT_SECRET` to a 32+ character random value:

```sh
openssl rand -base64 48
```

For local demo data, set `SEED_DEMO_DATA=true` and choose your own
`DEMO_ADMIN_*` and `DEMO_DISPATCHER_*` values. Then:

```sh
npm run db:seed
npm run dev
```

## Ports

| Service | Port |
|---|---:|
| Vite frontend | 8080 |
| Express API | 3001 |

## Database

The default development database is `server/data/rapid-rescue.db`. It is
ignored by Git and must never be committed.

Override the path:

```sh
DATABASE_PATH=/tmp/rapid-rescue-dev.db npm run dev
```

Tests use a temporary database from `vitest.config.ts` and clean it up after the
suite.

Reset local data:

```sh
npm run db:seed
```

`db:seed` resets the database only when `--reset` is passed by the script. It
requires `DEMO_ADMIN_PASSWORD` and `DEMO_DISPATCHER_PASSWORD` to be set; there
are no built-in demo passwords.

## Common tasks

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run check
```

## Adding a route

1. Add a controller in `server/src/controllers`.
2. Add validation with Zod.
3. Add a model query in `server/src/models` if needed.
4. Add the route in `server/src/routes`.
5. Mount it in `server/src/app.ts` behind `authenticate` unless it is public.
6. Add an integration test.
7. Update `docs/API.md`.

## Adding a migration

The project currently uses `schema.sql` plus additive startup migrations. For a
new column:

1. Add it to `schema.sql` for fresh databases.
2. Add an `ensureColumn` call in `server/src/db/client.ts` for existing databases.
3. Add a test that starts from an old schema if the migration is non-trivial.
4. Plan to move to a versioned migration tool before production.

## Troubleshooting

### `JWT_SECRET must be configured`

Set `JWT_SECRET` in `.env` to at least 32 characters.

### `better-sqlite3` fails to install

Install a C++ build toolchain for your OS, then reinstall:

```sh
npm rebuild better-sqlite3
```

### Frontend cannot reach the API

- Confirm the API is on port 3001.
- Confirm Vite proxies `/api` to `http://127.0.0.1:3001`.
- If using `VITE_API_URL`, confirm CORS allows the frontend origin.

### Tests fail with a database error

Tests should use `DATABASE_PATH` from `vitest.config.ts`. Do not point tests at
`server/data`.

### Port already in use

Stop the process using port 8080 or 3001, or set `API_PORT` and the Vite proxy
consistently.
