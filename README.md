# VAGR Hub

VAGR Hub is a React and TypeScript application for compliance intelligence, entity screening, ownership graph analysis, alert monitoring, and investigation reporting.

## Stack

- Vite
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase

## Local development

```sh
npm install
npm run dev
```

The development server runs on `http://localhost:8080`.

## Environment

Frontend environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Supabase Edge Function secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AI_GATEWAY_API_KEY`
- `AI_GATEWAY_URL`

`AI_GATEWAY_API_KEY` and `AI_GATEWAY_URL` are optional. When they are not configured, the application falls back to non-AI responses where supported.

## Quality checks

```sh
npx tsc --noEmit
npm run lint
npm run build
```
