# Roadmap

## Fase 0 — Remover Kapso (base técnica)

Objetivo: parar de depender de `@kapso/whatsapp-cloud-api` e `api.kapso.ai`.

- Introduzir client próprio da Meta Graph API (WhatsApp Cloud API)
- Trocar env vars e README para setup da Meta
- Manter UI estável (mesmas rotas `/api/*`), mas com implementação própria

Dependências: token da Meta, WABA e phone_number_id funcionando em modo single-tenant.

## Fase 1 — Persistência + Inbox real (sem Kapso)

Objetivo: viabilizar “conversations” e “messages” sem Kapso (webhook-first).

- Banco de dados (Postgres) + ORM (ex: Prisma)
- Webhook `/api/webhooks/meta`:
  - verificação (GET) + assinatura (POST)
  - ingestão de `messages` e `statuses`
  - upsert de contatos, conversas e mensagens
- API interna:
  - GET `/api/conversations` (do DB)
  - GET `/api/messages/:conversationId` (do DB)

Resultado: inbox com histórico usando apenas Meta + DB.

## Fase 2 — Multi-tenant + Auth (produto)

Objetivo: oferecer para clientes com isolamento real.

- Auth (ex: Auth.js) + RBAC mínimo
- Modelagem multi-tenant no DB (tenant -> waba/phone numbers -> mensagens)
- UI de admin para configurar ativos e credenciais por tenant (inicialmente manual)

## Fase 3 — Onboarding “de verdade” (Embedded Signup)

Objetivo: clientes conectarem o WhatsApp sem intervenção manual.

- Implementar Embedded Signup (Meta) para capturar:
  - WABA ID, phone_number_id e code para exchange por business token
- Exchange server-to-server do code por business token
- Registrar número e assinar webhooks automaticamente

## Fase 4 — Produto/UX

Objetivo: elevar qualidade para uso comercial.

- UI/UX:
  - estados de erro/sucesso consistentes
  - performance (virtualização de lista)
  - busca/filtros
  - acessibilidade
- Operação:
  - jobs/filas para webhooks e media
  - rate limiting interno
  - auditoria e observabilidade

