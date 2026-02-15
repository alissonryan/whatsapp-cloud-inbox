# 01-02 Summary

## Outcome

- Implementado webhook da Meta:
  - `GET /api/webhooks/meta` (verificacao `hub.challenge`)
  - `POST /api/webhooks/meta` (validacao `X-Hub-Signature-256` + ingestao)
- Validacao de assinatura HMAC-SHA256 (timing-safe) em `src/lib/webhooks/meta-signature.ts`.
- Ingestao idempotente (via unique constraints) em `src/lib/webhooks/meta-whatsapp.ts`:
  - upsert de `WhatsappPhoneNumber`, `Contact`, `Conversation`
  - create de `Message` (dedup por `metaMessageId`)
  - create de `MessageStatus` (dedup por `(messageId,status,timestamp)`)
  - update de `Message.status`/`statusUpdatedAt` quando chega status webhook

## Key Files

- `src/app/api/webhooks/meta/route.ts`
- `src/lib/webhooks/meta-signature.ts`
- `src/lib/webhooks/meta-whatsapp.ts`
- `src/lib/whatsapp/waid.ts`

## Verification

- `npm run build` passa.
- Ponta-a-ponta depende de:
  - `META_APP_SECRET`
  - `META_WEBHOOK_VERIFY_TOKEN`
  - webhook cadastrado no dashboard da Meta apontando para `/api/webhooks/meta`

