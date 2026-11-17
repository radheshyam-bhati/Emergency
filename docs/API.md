# API Reference

Base URL: `http://localhost:3001/api` in development.

Protected endpoints require:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

## Authentication

### `POST /auth/signup`

Creates a **dispatcher** account. The server ignores any client-supplied role;
admin accounts must be created by an existing admin or a bootstrap process.

```json
{
  "email": "operator@example.com",
  "password": "at-least-12-characters",
  "fullName": "Duty Operator"
}
```

Response:

```json
{
  "token": "<jwt>",
  "user": {
    "id": 3,
    "email": "operator@example.com",
    "fullName": "Duty Operator",
    "role": "dispatcher"
  }
}
```

### `POST /auth/login`

```json
{
  "email": "operator@example.com",
  "password": "your-password"
}
```

Returns the same session shape as signup. Invalid credentials return `401`.

### `GET /auth/me`

Returns the current user. Requires a bearer token.

## Hospitals

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/hospitals` | Bearer | List hospitals and capacity |
| `GET` | `/hospitals/:id` | Bearer | Hospital detail |

## Ambulances

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/ambulances` | Bearer | List ambulances |
| `PATCH` | `/ambulances/:id/status` | Admin/dispatcher | Update status |

Example status body:

```json
{ "status": "available" }
```

## Emergencies

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/emergencies` | Bearer | List emergencies |
| `POST` | `/emergencies` | Admin/dispatcher | Create an emergency |
| `POST` | `/emergencies/create-and-assign` | Admin/dispatcher | Create and dispatch |

Example emergency body:

```json
{
  "patientName": "Synthetic Patient",
  "patientPhone": "+91 0000000000",
  "condition": "Chest pain",
  "severity": "critical",
  "pickupAddress": "Synthetic pickup address",
  "pickupLatitude": 28.6129,
  "pickupLongitude": 77.2295
}
```

Do not use real patient data.

## Dispatch

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/dispatch/preview` | Admin/dispatcher | Preview ranking for an emergency |
| `GET` | `/dispatch/:emergencyId` | Bearer | Dispatch detail and decision replay |
| `POST` | `/dispatch/:emergencyId/assign` | Admin/dispatcher | Assign a dispatch |

## Activity and metrics

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/activity?limit=20` | Bearer | Recent activity, `limit` is clamped to `1..100` |
| `GET` | `/metrics` | Bearer | Dashboard metrics |

## Health

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Liveness probe |
| `GET` | `/ready` | Public | Readiness probe; checks the database |

## Error format

Errors return a JSON object:

```json
{ "message": "Invalid credentials" }
```

The API returns generic messages for unexpected server errors and logs the
details server-side. Do not rely on internal error text.

## Versioning

The API is currently unversioned. A future release should introduce `/api/v1`
or an OpenAPI contract before external consumers depend on it.
