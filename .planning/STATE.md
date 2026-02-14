# STATE

## Referencia Do Projeto

- Produto: WhatsApp Cloud Inbox (white-label / para clientes)
- Objetivo: remover Kapso e integrar direto com a Meta (WhatsApp Cloud API), evoluindo para multi-tenant + auth + inbox com historico (via webhooks + DB).
- Stack: Next.js (App Router) + React + TypeScript + Tailwind + shadcn/ui

## Posicao Atual

- Status: **Fase 0 concluida**
- Proxima fase: **Fase 1 (01-persistencia-inbox)** (planos em `.planning/phases/01-persistencia-inbox/`)
- Pesquisa/base pronta:
  - Mapa do codebase: `.planning/codebase/*`
  - Referencias da Meta: `.planning/research/meta-whatsapp.md`
- Notas de execucao:
  - Aqui no ambiente do Codex nao foi possivel rodar `npm install`/`npm run build` por falta de acesso ao registry NPM.
  - Validacao final deve ser feita localmente/CI.

## Decisoes

| Data (UTC-3) | Decisao | Por que |
|---|---|---|
| 2026-02-14 | Integracao direta com Meta sera **webhook-first** (sem Kapso) | A Cloud API nao oferece “inbox/historico” pronto; precisamos persistir webhooks para listar conversas e mensagens. |
| 2026-02-14 | Fase 0 usa modo **single-tenant por env** (token/ids fixos) | Desacopla Kapso rapido e valida chamadas Graph API antes do onboarding multi-tenant. |
| 2026-02-14 | Env vars principais: `META_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WABA_ID` | Padroniza integracao direta na Meta; mantemos fallback temporario para `PHONE_NUMBER_ID`/`WABA_ID`. |
| 2026-02-14 | Inbox em Fase 0 roda em **send-only mode** (UI inicia chat por numero) | Sem DB/webhooks, nao existe historico; mantemos UX para validar envio e midia. |

## Questoes Em Aberto

- Multi-tenant: queremos suportar Embedded Signup (Meta) desde o dia 1, ou comecar por single-tenant e evoluir?
- Banco: Postgres (Supabase/Neon/RDS?) + Prisma (sugerido) esta ok?
- Auth: Auth.js (sugerido) vs custom?
- Marca: qual nome/logotipo devemos usar no lugar do Kapso (ou manter “WhatsApp Cloud Inbox” como generico)?

## Riscos / Pontos Criticos

- “Conversations/messages list” depende de persistencia propria. Sem DB + webhooks, a UI vira apenas “send-only”.
- Rate limits e confiabilidade: webhooks exigem idempotencia e processamento robusto.
- Seguranca: tokens e segredos (Meta) precisam de armazenamento seguro para multi-tenant.

## Proximas Acoes

1. Rodar localmente: `npm install` e `npm run dev` para validar envs Meta e fluxos (send/media/templates/interactive).
2. Executar Fase 1:
   - `01-01-PLAN.md` (Postgres + Prisma + schema)
   - `01-02-PLAN.md` (webhook verify + assinatura + ingestao idempotente)
   - `01-03-PLAN.md` (read-side: conversations/messages do DB)
   - `01-04-PLAN.md` (write-side persistido + statuses + regra 24h no server)
