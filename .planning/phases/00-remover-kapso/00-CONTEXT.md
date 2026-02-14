# Fase 0: Remover Kapso (Base Tecnica)

## Objetivo Da Fase

Parar de depender de `@kapso/whatsapp-cloud-api` e de qualquer endpoint `api.kapso.ai`, conectando diretamente na Meta (Graph API / WhatsApp Cloud API) para:

- Envio de mensagens (texto, midia, template, interativo)
- Listagem de templates
- Upload/download de midia (proxy server-side)
- Limpeza de branding/documentacao do Kapso

## Estado Atual (Acoplamentos)

- SDK: `@kapso/whatsapp-cloud-api` (`src/lib/whatsapp-client.ts`)
- Env vars e docs apontam para Kapso (`KAPSO_API_KEY`, `WHATSAPP_API_URL=https://api.kapso.ai/meta/whatsapp`)
- Rotas `src/app/api/*` usam o client Kapso:
  - `/api/messages/send`
  - `/api/messages/interactive`
  - `/api/templates` e `/api/templates/send`
  - `/api/media/:mediaId`
  - `/api/conversations` e `/api/messages/:conversationId` (inbox/historico via Kapso)

## Nao-Objetivos (Fase 0)

- Inbox real (lista de conversas e historico persistido): isso vira na **Fase 1** via webhooks + banco.
- Multi-tenant e auth: isso fica para **Fase 2+**.

