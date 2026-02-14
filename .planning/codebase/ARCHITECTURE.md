# Architecture

## High-Level

- Monorepo simples (single app) em Next.js App Router.
- UI (client components) consome rotas internas em `/api/*` (Next Route Handlers).
- Integração WhatsApp hoje é mediada por Kapso (`@kapso/whatsapp-cloud-api`) dentro das rotas `/api/*`.

## Data Flow (atual)

- `src/app/page.tsx` renderiza:
  - `ConversationList` (polling em `/api/conversations` a cada 10s)
  - `MessageView` (polling em `/api/messages/:conversationId` a cada 5s)
- Envio:
  - Texto/mídia: POST `/api/messages/send` (multipart/form-data)
  - Interativo: POST `/api/messages/interactive` (JSON)
  - Templates: GET `/api/templates` e POST `/api/templates/send`
- Mídia:
  - UI usa `/api/media/:mediaId` como proxy (para permitir acesso em browser sem headers auth).

## State / Persistence

- Não há banco de dados local.
- “Histórico” e “conversas” dependem do backend Kapso (o app apenas lista e transforma payloads).

