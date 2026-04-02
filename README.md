# Rapid Rescue Grid

Rapid Rescue Grid is a React and TypeScript application for coordinating emergency dispatch, ambulance availability, and hospital capacity across a connected care network.

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Supabase

## Getting Started

1. Install dependencies:

```sh
npm install
```

2. Start the development server:

```sh
npm run dev
```

3. Build the production bundle:

```sh
npm run build
```

## Environment Variables

Create a local `.env` file with the following values:

```sh
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=
```

## Available Scripts

- `npm run dev` starts the local development server.
- `npm run build` creates the production bundle.
- `npm run lint` runs ESLint.
- `npm run test` runs the Vitest suite.

## Project Structure

- `src/` contains the React application.
- `supabase/functions/` contains edge functions used by the app.
- `supabase/migrations/` contains database migrations.
