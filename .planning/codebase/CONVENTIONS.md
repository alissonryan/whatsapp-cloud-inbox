# Conventions

## TypeScript

- `strict: true` em `tsconfig.json`
- Path alias `@/* -> src/*`

## Next.js

- App Router com Route Handlers em `src/app/api/**/route.ts`
- Client components marcados com `'use client'` (ex: `src/components/*`)

## UI / Styling

- Tailwind v4 via `src/app/globals.css`
- shadcn/ui (config em `components.json`, estilo `new-york`)
- Utilitário `cn()` em `src/lib/utils.ts`

## Env Vars (atual)

- `PHONE_NUMBER_ID`, `WABA_ID`, `KAPSO_API_KEY`, `WHATSAPP_API_URL` (ver `.env.example`)

