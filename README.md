# Rapid Rescue Grid

Rapid Rescue Grid is a full-stack emergency response platform for managing incidents, ambulance allocation, hospital selection, and operator visibility in real time. It combines a React frontend with an Express and SQLite backend to deliver a practical command-center workflow with explainable dispatch decisions.

## Overview

The platform is designed to simulate a regional emergency coordination system instead of a frontend-only prototype. Operators can authenticate, create emergencies, review dispatch decisions, monitor ambulances, inspect hospital capacity, and track operational activity through a set of connected dashboards backed by persistent data and server-side decision logic.

## Tech Stack & Tools

### Frontend

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Leaflet
- Recharts

### Backend

- Node.js
- Express
- TypeScript
- SQLite
- better-sqlite3
- JWT
- bcryptjs
- Zod

### Tooling

- ESLint
- Vitest
- tsx
- TypeScript compiler
- npm

## Installation & Setup

### 1. Install dependencies

```sh
npm install
```

### 2. Configure environment variables

Create a `.env` file from `.env.example`.

```env
API_PORT=3001
JWT_SECRET=replace-with-a-long-random-secret
```

### 3. Seed the database

```sh
npm run db:seed
```

### 4. Start the frontend and backend

```sh
npm run dev
```

### 5. Open the application

Frontend:

```txt
http://localhost:5173
```

API:

```txt
http://localhost:3001
```

Health check:

```txt
http://localhost:3001/api/health
```

### Useful scripts

```sh
npm run dev
npm run dev:client
npm run dev:server
npm run build
npm run build:client
npm run build:server
npm run db:seed
npm run lint
npm run test
npm run typecheck
```

### Demo credentials

```txt
Admin
Email: admin@gmail.com
Password: admin@123

Dispatcher
Email: dispatcher@gmail.com
Password: dispatch@123
```

## Features

- Role-based authentication for `admin` and `dispatcher` users
- Emergency intake workflow from the command center dashboard
- Smart Emergency Allocation Engine for hospital ranking
- Real ambulance assignment using backend availability rules
- Queue fallback handling when no ambulance or capable hospital is available
- Persistent SQLite storage for emergencies, dispatches, users, hospitals, ambulances, and activity logs
- Hospital, ambulance, admin, patient, and command-center dashboards
- Explainable dispatch snapshots showing ranking context and alternatives
- Metrics and activity visibility for operational monitoring
- Map-based ambulance and hospital visualization

## Technical Workflow

### High-Level Flow

`UI -> frontend service layer -> Express API -> SQLite -> API response -> dashboard refresh`

### Request Lifecycle

1. A user interacts with the frontend dashboard.
2. The frontend sends requests through the service layer in `src/api`.
3. Express routes receive the request and pass control to controllers.
4. Controllers validate input and delegate business logic to services.
5. Services read and update SQLite-backed models and operational state.
6. The API returns structured JSON to the frontend.
7. TanStack Query refreshes affected views and updates the UI.

### Dispatch Workflow

1. An operator creates an emergency.
2. The backend stores the emergency record.
3. The Smart Emergency Allocation Engine ranks eligible hospitals using severity, distance, specialization, and capacity data.
4. The backend searches for the nearest available ambulance.
5. The selected hospital and ambulance are reserved and linked to the emergency.
6. Dispatch details, score breakdowns, and ranking snapshots are persisted.
7. The frontend reflects the selected assignment and fallback status.

### Queue & Fallback Workflow

- If no ambulance is available, the emergency is marked `queued` with reason `NO_AMBULANCE`.
- If no hospital meets the capability threshold, the emergency is marked `queued` with reason `NO_CAPABLE_HOSPITAL`.
- The operations lifecycle loop retries eligible queued work during backend sync cycles.

### Status Workflow

- `pending`
- `queued`
- `assigned`
- `in-transit`
- `arrived`
- `completed`

## Project Structure

```txt
rapid-rescue-grid-main/
├── public/
├── server/
│   ├── data/
│   └── src/
│       ├── controllers/
│       ├── db/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       ├── app.ts
│       └── server.ts
├── src/
│   ├── api/
│   ├── components/
│   ├── contexts/
│   ├── data/
│   ├── hooks/
│   ├── integrations/
│   ├── lib/
│   ├── pages/
│   ├── services/
│   ├── test/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```
