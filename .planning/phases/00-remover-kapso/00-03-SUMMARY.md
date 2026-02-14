# 00-03 Summary

## Outcome

- Rotas de inbox (conversations/messages) deixadas em modo **send-only** (stub), sem dependencia Kapso.
- UI agora permite iniciar chat digitando um numero ("Start chat with ...") mesmo sem historico.
- `MessageView` removeu tipos do Kapso e passou a inserir mensagens outbound de forma otimista em modo send-only.
- Adicionado override via `NEXT_PUBLIC_INBOX_DEV_ALLOW_FREEFORM=true` para liberar envio freeform em desenvolvimento (ate webhooks/DB existirem).

## Key Files

- `src/app/api/conversations/route.ts`
- `src/app/api/messages/[conversationId]/route.ts`
- `src/components/conversation-list.tsx`
- `src/components/message-view.tsx`

## Verification

- Nao foi possivel rodar `npm run build` aqui (sem `node_modules`).

