# 01-03 Summary

## Outcome

- `GET /api/conversations` agora le do DB quando `DATABASE_URL` esta configurada.
- `GET /api/messages/:conversationId` agora le do DB quando `DATABASE_URL` esta configurada.
- Mantido fallback **send-only** quando `DATABASE_URL` nao existe (compatibilidade de dev).
- `GET /api/messages/:conversationId` aceita `conversationId` temporario (`temp:<phone>`) e tenta resolver pela `waId` do contato.

## Key Files

- `src/app/api/conversations/route.ts`
- `src/app/api/messages/[conversationId]/route.ts`

## Verification

- `npm run build` passa.
- Para ver dados na UI: precisa de DB com schema aplicado + webhook alimentando mensagens/status.

