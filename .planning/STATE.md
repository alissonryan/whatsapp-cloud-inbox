# STATE

## Referencia Do Projeto

- Produto: WhatsApp Cloud Inbox (white-label / para clientes)
- Objetivo: remover Kapso e integrar direto com a Meta (WhatsApp Cloud API), evoluindo para multi-tenant + auth + inbox com historico (via webhooks + DB).
- Stack: Next.js (App Router) + React + TypeScript + Tailwind + shadcn/ui

## Posicao Atual

- Status: **Fase 1 implementada (pendente setup/validacao)**
- Fase atual: **Fase 1 (01-persistencia-inbox)**
- Proxima fase: **Fase 2 (multi-tenant + auth)** (a planejar/ajustar)
- Pesquisa/base pronta:
  - Mapa do codebase: `.planning/codebase/*`
  - Referencias da Meta: `.planning/research/meta-whatsapp.md`
- Notas de execucao:
  - Dependencias foram instaladas e `npm run build` passa.
  - Validacao ponta-a-ponta depende de Postgres (`DATABASE_URL`) + webhook configurado na Meta.

## Decisoes

| Data (UTC-3) | Decisao | Por que |
|---|---|---|
| 2026-02-14 | Integracao direta com Meta sera **webhook-first** (sem Kapso) | A Cloud API nao oferece “inbox/historico” pronto; precisamos persistir webhooks para listar conversas e mensagens. |
| 2026-02-14 | Fase 0 usa modo **single-tenant por env** (token/ids fixos) | Desacopla Kapso rapido e valida chamadas Graph API antes do onboarding multi-tenant. |
| 2026-02-14 | Env vars principais: `META_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WABA_ID` | Padroniza integracao direta na Meta; mantemos fallback temporario para `PHONE_NUMBER_ID`/`WABA_ID`. |
| 2026-02-14 | Inbox em Fase 0 roda em **send-only mode** (UI inicia chat por numero) | Sem DB/webhooks, nao existe historico; mantemos UX para validar envio e midia. |
| 2026-02-14 | Persistencia via **Postgres + Prisma** | Base para inbox real, idempotencia e multi-tenant (tenant_id em tudo). |

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

1. Configurar `DATABASE_URL` e aplicar schema:
   - `npx prisma migrate dev` (ou `npm run db:push` para dev)
2. Configurar webhook na Meta:
   - `META_APP_SECRET`
   - `META_WEBHOOK_VERIFY_TOKEN`
   - Callback: `/api/webhooks/meta` (GET verify + POST assinatura)
3. Validar ponta-a-ponta:
   - inbound -> aparece em `/api/conversations` e `/api/messages/:conversationId`
   - outbound -> persiste no DB e recebe status via webhook
4. Planejar/executar Fase 2 (multi-tenant + auth + armazenamento seguro de tokens)
