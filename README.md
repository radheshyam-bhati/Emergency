# Rapid Rescue Grid

Rapid Rescue Grid is a real-time emergency coordination dashboard built with React, TypeScript, and Vite. It simulates how a regional command center can track live emergencies, dispatch ambulances, rank hospitals by readiness, and monitor operational capacity across a connected hospital network.

## Overview

This project is currently implemented as a local demo environment. Instead of depending on a live backend, it uses in-memory simulation state, seeded hospital and ambulance datasets, and local authentication to model emergency response workflows end to end.

The application is designed around multiple operator views:

- A command center for dispatch and live incident tracking
- A hospital network dashboard for bed, ventilator, and doctor availability
- An ambulance fleet dashboard with status and location monitoring
- An AI hospital finder that ranks hospitals by suitability for a case
- An admin analytics panel for overall system visibility

## Tech Stack & Tools

### Core

- React 18
- TypeScript
- Vite
- React Router DOM
- TanStack Query

### UI and UX

- Tailwind CSS
- shadcn/ui
- Radix UI
- Framer Motion
- Lucide React

### Mapping and Visualization

- Leaflet
- CARTO dark basemap tiles
- OSRM public routing API for route comparison on the live map
- Recharts for operational analytics

### Quality and Tooling

- ESLint
- Vitest
- Testing Library
- PostCSS

## Installation and Setup

### Prerequisites

- Node.js 18+ recommended
- npm

### Install

```sh
npm install
```

### Run the app locally

```sh
npm run dev
```

Open the Vite development URL shown in your terminal, usually:

```txt
http://localhost:5173
```

### Build for production

```sh
npm run build
```

### Preview the production build

```sh
npm run preview
```

### Run checks

```sh
npm run lint
npm run test
```

### Environment setup

No environment variables are required for the current local demo mode.

If needed, you can keep a local `.env` file, but the app runs without external API keys or backend credentials in this version.

### Demo login

Use the built-in administrator credentials:

```txt
Email: admin@gmail.com
Password: admin@123
```

## Features

### Emergency command center

- Live overview of active emergencies, ambulance availability, ICU capacity, and response time
- One-click emergency intake through the `New Emergency` dispatch form
- Real-time activity feed for emergency creation, dispatch events, and bed reservations
- Interactive map showing hospitals, ambulances, and active emergency markers

### Local auto-dispatch workflow

- Validates incident details before dispatch
- Finds the nearest available ambulance
- Scores hospitals using capacity, specialization, doctor availability, and travel time
- Assigns the best-ranked hospital
- Reduces available emergency and ICU resources after reservation
- Returns a dispatch pipeline summary with timing and hospital ranking details

### Hospital operations dashboard

- Aggregated counts for ICU beds, emergency beds, ventilators, and doctors on duty
- Search across hospital names and specializations
- Card-based view of hospital readiness and specializations
- Live map visibility for all connected hospitals

### Ambulance fleet dashboard

- Tracks current vehicle status across available, dispatched, en-route, and at-hospital states
- Shows crew, vehicle type, and simulated live coordinates
- Highlights ambulances assigned to active emergencies

### AI hospital finder

- Ranks hospitals based on the selected patient condition
- Combines specialization match, bed availability, doctor availability, ventilator capacity, and estimated travel time
- Surfaces a best-match recommendation with explainable scoring reasons

### Admin analytics

- Fleet distribution and emergency severity breakdown
- Hospital bed availability comparisons
- Response-time trend charts
- System event stream and access-role summary

## Technical Workflow

### 1. Application bootstrap

- `src/main.tsx` mounts the React app
- `src/App.tsx` wires together:
  - `QueryClientProvider`
  - `TooltipProvider`
  - toast systems
  - `BrowserRouter`
  - `AuthProvider`
  - `SimulationProvider`

### 2. Authentication flow

- `src/contexts/AuthContext.tsx` manages local authentication
- Successful sign-in stores the session marker in `localStorage`
- `ProtectedRoute` restricts dashboard pages to authenticated users
- The `/admin` route is additionally guarded for the admin role

### 3. Simulation state flow

- `src/hooks/useSimulation.ts` is the runtime data engine for the app
- It initializes seeded data for:
  - hospitals
  - ambulances
  - emergencies
  - activity feed events
- Timers simulate:
  - ambulance movement
  - status changes
  - resource fluctuations
  - incoming emergency creation

### 4. Dispatch workflow

When an operator submits a case through `src/components/NewEmergencyForm.tsx`, the app runs this flow:

1. Validate condition and pickup coordinates
2. Find the nearest available ambulance
3. Score all hospitals using the dispatch ranking logic
4. Pick the best recommendation
5. Create a new emergency record
6. Mark the assigned ambulance as dispatched
7. Reserve hospital resources
8. Push activity feed updates
9. Return ranked hospital results and a dispatch timeline to the UI

### 5. Dashboard rendering

- Page-level views consume shared state from `useSimulation()`
- The command center, hospital dashboard, ambulance dashboard, AI finder, and admin panel all render from the same simulation source of truth
- Charts are rendered with Recharts
- UI state transitions and modals are animated with Framer Motion

### 6. Mapping workflow

- `src/components/LiveMap.tsx` renders Leaflet maps
- Hospitals, ambulances, and emergencies are converted into map markers
- Optional route comparison uses OSRM to estimate travel time and distance
- Dark basemap tiles are loaded from CARTO

## Project Structure

```txt
rapid-rescue-grid-main/
├── public/                  # Static assets
├── src/
│   ├── components/          # Shared UI and domain components
│   ├── contexts/            # Auth context
│   ├── data/                # Seeded mock hospitals, ambulances, emergencies
│   ├── hooks/               # Shared app state and utilities
│   ├── pages/               # Route-level screens
│   ├── test/                # Vitest setup and tests
│   ├── App.tsx              # Router and provider composition
│   └── main.tsx             # App entry point
├── .env.example             # Demo-mode environment note
├── package.json             # Scripts and dependencies
├── tailwind.config.ts       # Tailwind theme setup
├── vite.config.ts           # Vite configuration
└── vitest.config.ts         # Test configuration
```

## Notes

- This version is a front-end demo with local state, not a production backend-integrated deployment
- Emergency, fleet, and capacity updates are simulated in the browser for demonstration purposes
- Routing quality depends on availability of the public OSRM service used by the live map
