# Integrations

## WhatsApp (atual: Kapso)

- SDK: `@kapso/whatsapp-cloud-api`
- Config: `src/lib/whatsapp-client.ts`
  - `KAPSO_API_KEY` (obrigatório)
  - `WHATSAPP_API_URL` (opcional; default `https://api.kapso.ai/meta/whatsapp`)
  - `PHONE_NUMBER_ID`
  - `WABA_ID`
- Rotas server-side (Next API routes):
  - `src/app/api/conversations/route.ts` (lista conversas via Kapso)
  - `src/app/api/messages/[conversationId]/route.ts` (lista mensagens via Kapso)
  - `src/app/api/messages/send/route.ts` (envio texto/midia via Kapso)
  - `src/app/api/messages/interactive/route.ts` (botões interativos via Kapso)
  - `src/app/api/templates/route.ts` e `src/app/api/templates/send/route.ts` (templates via Kapso)
  - `src/app/api/media/[mediaId]/route.ts` (proxy de mídia via Kapso)

## Deploy

- README sugere deploy em Vercel (botão “Deploy with Vercel”).

