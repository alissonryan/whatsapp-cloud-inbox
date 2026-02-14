# Stack

## Runtime / Framework

- Next.js `15.5.x` (App Router) + Turbopack (`next dev --turbopack`)
- React `19.1`
- TypeScript `5.9` (strict)
- Node.js (implícito; gerenciado via `npm`)

## UI

- Tailwind CSS `v4` (`@import "tailwindcss";`) + `tailwind-merge`
- shadcn/ui (config em `components.json`) + Radix UI primitives
- `lucide-react` (ícones)
- `date-fns` (datas)

## Lint / Qualidade

- ESLint `v9` (flat config) com `next/core-web-vitals` e `next/typescript`
- Sem testes automatizados no repo (ver `.planning/codebase/TESTING.md`)

## Dependências WhatsApp (atual)

- `@kapso/whatsapp-cloud-api` (wrapper do WhatsApp Cloud API via Kapso)

