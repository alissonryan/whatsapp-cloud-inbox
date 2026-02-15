# 01-04 Summary

## Outcome

- Write-side ligado ao DB (quando `DATABASE_URL` existe):
  - `POST /api/messages/send` persiste outbound (text/media) e atualiza preview da conversa
  - `POST /api/messages/interactive` persiste outbound (interactive) e atualiza preview da conversa
  - `POST /api/templates/send` persiste outbound (template) e atualiza preview da conversa
- Regra de 24h aplicada server-side para mensagens freeform (text/media/interactive):
  - bloqueia com `422` quando nao ha inbound recente
  - `NEXT_PUBLIC_INBOX_DEV_ALLOW_FREEFORM=true` ignora a regra em dev
- Numero de telefone normalizado no server (digits-only) antes de chamar a Meta.
- UI: ConversationList permite “Start chat with …” mesmo em modo DB.

## Key Files

- `src/app/api/messages/send/route.ts`
- `src/app/api/messages/interactive/route.ts`
- `src/app/api/templates/send/route.ts`
- `src/components/conversation-list.tsx`

## Verification

- `npm run build` passa.
- Validacao real depende de:
  - DB com schema aplicado
  - envs Meta (`META_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WABA_ID`)
  - webhook ativo para atualizar statuses

